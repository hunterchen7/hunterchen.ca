import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { heroRgba } from "../hero/heroPalette";
import {
  BOARD_SIZE,
  FILES,
  STRAIGHT,
  clamp,
  easeOutCubic,
  squareIndices,
  type BoardGeometry,
} from "./isoGeometry";
import {
  BoardSurface,
  PieceDefinitions,
  PieceModel,
  type PieceColor,
  type PieceKind,
  type RenderPiece,
} from "./isoPieces";
import {
  CaptureBurst,
  CheckHighlight,
  LANDING_EFFECT_MS,
  LANDING_SETTLE_MS,
  LandingDust,
  MOVE_MS,
  SETTLE_MS,
  captureProgressAt,
  capturedPieceMotion,
  resetPieceMotion,
  resetWaves,
  setupPieceMotion,
  captureShakeAt,
  landingImpactAt,
  landingScaleAt,
  mateShakeAt,
  pieceMotionAt,
} from "./isoEffects";
import type { AnimatedMove, BoardHighlights } from "../../hooks/useChessGame";

const PIECE_PREFIX = "iso-chess-piece";

/** Half-extents of a piece's artwork, used for its click target. */
const pieceHitBox = (scale: number) => ({
  bottom: 1.1 * scale,
  halfWidth: 2.4 * scale,
  top: 5.4 * scale,
});

const PIECE_NAMES: Record<PieceKind, string> = {
  b: "bishop",
  k: "king",
  n: "knight",
  p: "pawn",
  q: "queen",
  r: "rook",
};

type BoardSquare = { color: PieceColor; kind: PieceKind; square: string };

/**
 * Board indices for a square, accounting for orientation. Flipping mirrors both
 * axes rather than rotating the SVG, so the pieces stay upright.
 */
function indicesFor(square: string, flipped: boolean) {
  const { column, row } = squareIndices(square);
  return flipped
    ? { column: BOARD_SIZE - 1 - column, row: BOARD_SIZE - 1 - row }
    : { column, row };
}

function centerFor(geometry: BoardGeometry, square: string, flipped: boolean) {
  const { column, row } = indicesFor(square, flipped);
  return geometry.center(row, column);
}

function pointsFor(geometry: BoardGeometry, square: string, flipped: boolean) {
  const { column, row } = indicesFor(square, flipped);
  return geometry.squarePoints(row, column);
}

/** Expand a FEN placement field into one entry per occupied square. */
function piecesFromFen(fen: string): BoardSquare[] {
  const placement = fen.split(" ")[0] ?? "";
  const pieces: BoardSquare[] = [];
  placement.split("/").forEach((rankText, rankIndex) => {
    let fileIndex = 0;
    for (const symbol of rankText) {
      const skip = Number(symbol);
      if (Number.isFinite(skip)) {
        fileIndex += skip;
        continue;
      }
      const file = FILES[fileIndex];
      if (file !== undefined) {
        pieces.push({
          color: symbol === symbol.toUpperCase() ? "w" : "b",
          kind: symbol.toLowerCase() as PieceKind,
          square: `${file}${BOARD_SIZE - rankIndex}`,
        });
      }
      fileIndex += 1;
    }
  });
  return pieces;
}

function describeSquare(square: string, piece: BoardSquare | undefined): string {
  if (!piece) return `${square}, empty`;
  const color = piece.color === "w" ? "white" : "black";
  return `${square}, ${color} ${PIECE_NAMES[piece.kind]}`;
}

/** A flat ellipse sits on the board plane; a circle would look upright. */
function MoveDot({
  flipped,
  geometry,
  square,
}: {
  flipped: boolean;
  geometry: BoardGeometry;
  square: string;
}) {
  const { x, y } = centerFor(geometry, square, flipped);
  return (
    <ellipse
      cx={x.toFixed(2)}
      cy={y.toFixed(2)}
      fill={heroRgba("light", 0.42)}
      rx="1.15"
      ry="0.58"
    />
  );
}

function CaptureRing({
  flipped,
  geometry,
  square,
}: {
  flipped: boolean;
  geometry: BoardGeometry;
  square: string;
}) {
  return (
    <polygon
      fill="none"
      points={pointsFor(geometry, square, flipped)}
      stroke={heroRgba("light", 0.6)}
      strokeWidth="0.7"
      vectorEffect="non-scaling-stroke"
    />
  );
}

/**
 * Slow sine used by the check cue. Deliberately low-rate: it re-renders the
 * board, and it only runs while a king is actually in check.
 */
function useCheckPulse(active: boolean): number {
  const [pulse, setPulse] = useState(0.5);

  useEffect(() => {
    if (!active) {
      setPulse(0.5);
      return;
    }
    const timer = window.setInterval(() => {
      setPulse(0.5 + Math.sin(performance.now() / 172) * 0.5);
    }, 70);
    return () => window.clearInterval(timer);
  }, [active]);

  return active ? pulse : 0.5;
}

/** Progress through a single move, all derived from one elapsed clock. */
type MoveClock = {
  capture: number;
  landing: number;
  move: number;
  settle: number;
};

const IDLE_CLOCK: MoveClock = { capture: 0, landing: 0, move: 1, settle: 1 };

/**
 * Drives one move's animation. Returns the clock plus the move being played, or
 * null once it has finished so the board renders at rest.
 */
function useMoveClock(move: AnimatedMove | null): {
  clock: MoveClock;
  playing: AnimatedMove | null;
} {
  const [elapsed, setElapsed] = useState<number | null>(null);
  const seq = move?.seq ?? 0;
  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (!seq || reducedMotion) {
      setElapsed(null);
      return;
    }

    const total = MOVE_MS + SETTLE_MS;
    let frame = 0;
    let start: number | null = null;

    const step = (now: number) => {
      if (start === null) start = now;
      const next = now - start;
      if (next >= total) {
        setElapsed(null);
        return;
      }
      setElapsed(next);
      frame = window.requestAnimationFrame(step);
    };

    frame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame);
  }, [reducedMotion, seq]);

  if (elapsed === null || !move) return { clock: IDLE_CLOCK, playing: null };

  const moveProgress = clamp(elapsed / MOVE_MS);
  return {
    clock: {
      capture: move.capturedSquare ? captureProgressAt(moveProgress) : 0,
      landing: clamp((elapsed - MOVE_MS) / LANDING_EFFECT_MS),
      move: moveProgress,
      settle: clamp((elapsed - MOVE_MS) / LANDING_SETTLE_MS),
    },
    playing: move,
  };
}

type IsoChessBoardProps = {
  /** The move to play back as motion, or null to render at rest. */
  animatedMove?: AnimatedMove | null;
  /** Softens the board while an overlay is up. */
  blurred?: boolean;
  detail?: boolean;
  fen: string;
  /**
   * Plays the recorded game's own board-setup or board-clearing animation over
   * the current position. `elapsed` is milliseconds into it; null leaves the
   * pieces at rest.
   */
  pieceStage?: { elapsed: number; mode: "scatter" | "setup" } | null;
  /** Projection to draw in; animated while the view swings round on play. */
  geometry?: BoardGeometry;
  flipped?: boolean;
  highlights: BoardHighlights;
  interactive?: boolean;
  onSelectSquare?: (square: string) => void;
};

function IsoChessBoard({
  animatedMove = null,
  blurred = false,
  detail = true,
  fen,
  flipped = false,
  geometry = STRAIGHT,
  highlights,
  interactive = false,
  onSelectSquare,
  pieceStage = null,
}: IsoChessBoardProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [focusSquare, setFocusSquare] = useState<string>("e2");

  const pieces = useMemo(() => piecesFromFen(fen), [fen]);
  const pieceBySquare = useMemo(() => {
    const lookup = new Map<string, BoardSquare>();
    for (const piece of pieces) lookup.set(piece.square, piece);
    return lookup;
  }, [pieces]);

  const hit = pieceHitBox(geometry.pieceScale);
  // Quantised so the piece <defs> only rebuild a handful of times while the
  // view swings round, instead of on every frame.
  const pieceRoundness = Math.round(geometry.pieceRoundness * 20) / 20;
  const { clock, playing } = useMoveClock(animatedMove);
  const checkPulse = useCheckPulse(highlights.checkSquare !== null);

  // Painter's algorithm: larger row+column is nearer the viewer, so it draws
  // last and overlaps what is behind it.
  // Scatter order depends only on where the pieces currently stand.
  const waves = useMemo(() => {
    if (pieceStage?.mode !== "scatter") return new Map<string, number>();
    return resetWaves(
      pieces.map((piece) => {
        const { column, row } = indicesFor(piece.square, flipped);
        return {
          at: geometry.center(row, column),
          id: `${piece.color}${piece.kind}-${piece.square}`,
        };
      }),
      geometry.boardCenter,
    );
  }, [flipped, geometry, pieceStage?.mode, pieces]);

  const rendered = useMemo<RenderPiece[]>(() => {
    const motion = pieceMotionAt(clock.move);

    const list = pieces.map((piece) => {
      const { column, row } = indicesFor(piece.square, flipped);
      const at = geometry.center(row, column);
      let x = at.x;
      let y = at.y;
      let impact = 0;
      let lift = 0;
      let verticalScale = 1;

      // The board already holds the finished position, so the mover is drawn
      // travelling backwards from where it came.
      const travellingFrom =
        playing && piece.square === playing.to
          ? playing.from
          : playing?.secondary && piece.square === playing.secondary.to
            ? playing.secondary.from
            : null;

      if (travellingFrom) {
        const start = centerFor(geometry, travellingFrom, flipped);
        x = start.x + (at.x - start.x) * motion.travel;
        y = start.y + (at.y - start.y) * motion.travel;
        impact = landingImpactAt(clock.settle);
        lift = motion.lift;
        verticalScale = landingScaleAt(clock.settle);
      }

      // Setting the board up, or clearing it, replaces the resting pose using
      // the recorded game's own entrance and scatter.
      const id = `${piece.color}${piece.kind}-${piece.square}`;
      let opacity = 1;
      let rotation = 0;
      let scale = 1;
      if (pieceStage) {
        const staged =
          pieceStage.mode === "setup"
            ? setupPieceMotion({
                at,
                boardCenter: geometry.boardCenter,
                elapsed: pieceStage.elapsed,
                kind: piece.kind,
                square: piece.square,
              })
            : resetPieceMotion({
                at,
                boardCenter: geometry.boardCenter,
                elapsed: pieceStage.elapsed,
                wave: waves.get(id) ?? 0,
              });
        x += staged.dx;
        y += staged.dy;
        lift += staged.lift;
        opacity = staged.opacity;
        rotation = staged.rotation;
        scale = staged.scale;
        verticalScale *= staged.verticalScale;
      }

      return {
        color: piece.color,
        depth: y,
        id,
        impact,
        kind: piece.kind,
        lift,
        opacity,
        rotation,
        scale,
        square: piece.square,
        verticalScale,
        x,
        y,
      } satisfies RenderPiece;
    });

    // The captured piece is already gone from the position, so it is put back
    // for as long as its knockback lasts.
    if (
      playing?.capturedSquare &&
      playing.capturedColor &&
      playing.capturedKind &&
      clock.capture > 0 &&
      clock.capture < 1
    ) {
      const { column, row } = indicesFor(playing.capturedSquare, flipped);
      const at = geometry.center(row, column);
      const knockback = capturedPieceMotion({
        captureProgress: clock.capture,
        fallSeed: playing.capturedSquare.charCodeAt(0),
        moverFrom: centerFor(geometry, playing.from, flipped),
        victimAt: at,
      });

      list.push({
        color: playing.capturedColor,
        depth: at.y,
        id: `captured-${playing.seq}`,
        impact: 0,
        kind: playing.capturedKind as PieceKind,
        lift: knockback.lift,
        opacity: knockback.opacity,
        rotation: knockback.rotation,
        scale: knockback.scale,
        square: playing.capturedSquare,
        verticalScale: knockback.verticalScale,
        x: at.x + knockback.dx,
        y: at.y + knockback.dy,
      } satisfies RenderPiece);
    }

    return list.sort((first, second) => first.depth - second.depth);
  }, [
    clock.capture,
    clock.move,
    clock.settle,
    flipped,
    geometry,
    pieceStage,
    pieces,
    playing,
    waves,
  ]);

  const shake = useMemo(() => {
    const mate = mateShakeAt(clock.landing, playing?.isMate ?? false);
    const capture = captureShakeAt(clock.move, !!playing?.capturedSquare);
    return { x: mate.x + capture.x, y: mate.y + capture.y };
  }, [clock.landing, clock.move, playing]);

  const handleSelect = useCallback(
    (square: string) => {
      setFocusSquare(square);
      onSelectSquare?.(square);
    },
    [onSelectSquare],
  );

  /** Arrows walk files and ranks, which is what a player thinks in. */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<SVGElement>, square: string) => {
      const deltas: Record<string, [number, number]> = {
        ArrowDown: [0, -1],
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, 1],
      };
      const delta = deltas[event.key];
      if (delta) {
        event.preventDefault();
        const file = FILES.indexOf(square[0] ?? "") + delta[0];
        const rank = Number(square[1]) + delta[1];
        if (file < 0 || file >= BOARD_SIZE || rank < 1 || rank > BOARD_SIZE) return;
        const next = `${FILES[file]}${rank}`;
        setFocusSquare(next);
        svgRef.current
          ?.querySelector<SVGPolygonElement>(`[data-hit-square="${next}"]`)
          ?.focus();
        return;
      }
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleSelect(square);
      }
    },
    [handleSelect],
  );

  const allSquares = useMemo(() => {
    const squares: string[] = [];
    for (const file of FILES) {
      for (let rank = 1; rank <= BOARD_SIZE; rank += 1) squares.push(`${file}${rank}`);
    }
    return squares;
  }, []);

  const hitProps = (square: string) => ({
    "aria-label": describeSquare(square, pieceBySquare.get(square)),
    "data-hit-square": square,
    onClick: () => handleSelect(square),
    onKeyDown: (event: React.KeyboardEvent<SVGElement>) => handleKeyDown(event, square),
    // Matches the canvas library's interactive selector, so pressing a square
    // never starts a canvas pan.
    role: "button",
    style: { cursor: "pointer", outline: "none" } as React.CSSProperties,
    tabIndex: square === focusSquare ? 0 : -1,
  });

  return (
    <svg
      className="h-full w-full overflow-visible"
      ref={svgRef}
      role={interactive ? "application" : "img"}
      aria-label="Chess board"
      fill="none"
      style={{
        filter: blurred ? "blur(3px)" : undefined,
        shapeRendering: "geometricPrecision",
        transition: "filter 320ms ease",
      }}
      viewBox={geometry.viewBox}
    >
      <PieceDefinitions
        detail={detail}
        prefix={PIECE_PREFIX}
        roundness={pieceRoundness}
      />
      <g transform={`translate(${shake.x.toFixed(3)} ${shake.y.toFixed(3)})`}>
      <BoardSurface geometry={geometry} />

      {highlights.lastMove ? (
        <g data-layer="last-move">
          <polygon
            fill={heroRgba("light", 0.16)}
            points={pointsFor(geometry, highlights.lastMove.from, flipped)}
          />
          <polygon
            fill={heroRgba("accent", 0.26)}
            points={pointsFor(geometry, highlights.lastMove.to, flipped)}
          />
        </g>
      ) : null}

      {highlights.selected ? (
        <g data-layer="selected">
          <polygon
            fill={heroRgba("accent", 0.34)}
            points={pointsFor(geometry, highlights.selected, flipped)}
          />
          <polygon
            fill="none"
            points={pointsFor(geometry, highlights.selected, flipped)}
            stroke={heroRgba("light", 0.82)}
            strokeWidth="0.9"
            vectorEffect="non-scaling-stroke"
          />
        </g>
      ) : null}

      {highlights.checkSquare ? (
        <CheckHighlight
          center={centerFor(geometry, highlights.checkSquare, flipped)}
          intensity={1}
          mate={playing?.isMate ?? false}
          points={pointsFor(geometry, highlights.checkSquare, flipped)}
          pulse={checkPulse}
        />
      ) : null}

      <g data-layer="legal-quiet">
        {highlights.legalQuiet.map((square) => (
          <MoveDot flipped={flipped} geometry={geometry} key={square} square={square} />
        ))}
      </g>

      {playing ? (
        <LandingDust
          center={centerFor(geometry, playing.to, flipped)}
          progress={clock.landing}
        />
      ) : null}

      <g data-layer="pieces" pointerEvents="none">
        {rendered.map((piece) => (
          <PieceModel
            key={piece.id}
            {...piece}
            pieceScale={geometry.pieceScale}
            roundness={pieceRoundness}
            prefix={PIECE_PREFIX}
          />
        ))}
      </g>

      {playing?.capturedSquare && playing.capturedColor ? (
        <CaptureBurst
          center={centerFor(geometry, playing.capturedSquare, flipped)}
          color={playing.capturedColor}
          progress={clock.capture}
        />
      ) : null}

      {/* Capture rings sit above the pieces so they read as a target. */}
      <g data-layer="legal-captures" pointerEvents="none">
        {highlights.legalCaptures.map((square) => (
          <CaptureRing flipped={flipped} geometry={geometry} key={square} square={square} />
        ))}
      </g>

      {interactive ? (
        <g data-layer="hit-targets">
          {/* Ground-plane targets first, so a click on bare board picks the
              square you see. */}
          {allSquares.map((square) => (
            <polygon
              {...hitProps(square)}
              fill="transparent"
              key={`square-${square}`}
              points={pointsFor(geometry, square, flipped)}
            />
          ))}
          {/* Piece silhouettes above them, in the same depth order as the art,
              so clicking a tall piece selects its own square rather than the
              square its head overlaps. */}
          {rendered.map((piece) => (
            <rect
              {...hitProps(piece.square)}
              fill="transparent"
              height={hit.top + hit.bottom}
              key={`piece-${piece.id}`}
              width={hit.halfWidth * 2}
              x={piece.x - hit.halfWidth}
              y={piece.y - hit.top}
            />
          ))}
        </g>
      ) : null}
      </g>
    </svg>
  );
}

export default memo(IsoChessBoard);
