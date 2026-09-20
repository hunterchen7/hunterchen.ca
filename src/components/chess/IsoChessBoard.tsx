import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { heroRgba } from "../hero/heroPalette";
import {
  BOARD_SIZE,
  FILES,
  STRAIGHT,
  clamp,
  easeOutCubic,
  squareAtIndices,
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
  DROP_MS,
  dropMotionAt,
  GAME_MOVE_MS,
  gameMotionAt,
  LANDING_EFFECT_MS,
  LANDING_SETTLE_MS,
  LandingDust,
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
} from "./isoEffects";
import type { AnimatedMove, BoardHighlights } from "../../hooks/useChessGame";

const PIECE_PREFIX = "iso-chess-piece";

/**
 * Square highlights are a solid mid purple, not a translucent wash over the
 * square. A wash lands a highlighted dark square within a few RGB points of a
 * dark piece's lit side and a highlighted light square near a white piece's
 * shaded side, and the piece standing on it loses its silhouette. This tone sits
 * between the two piece palettes with margin either way, on either square.
 */
const HIGHLIGHT = {
  fill: "#7a4db5",
  ring: heroRgba("light", 0.85),
} as const;

/** Movement before a press on a piece becomes a drag rather than a click. */
const DRAG_THRESHOLD_PX = 4;
/** How high a dragged piece is held above the board, in board units. */
const DRAG_LIFT = 1.5;
/** How long a piece dropped somewhere illegal takes to slide home. */
const SNAP_BACK_MS = 220;

/** Where a dragged piece was let go, and how high it was held. */
export type DropOrigin = { lift: number; x: number; y: number };

/**
 * Client coordinates into the board's own units. Null where the DOM cannot
 * say (no layout, as in jsdom), in which case dragging quietly stays off.
 */
function clientToBoard(svg: SVGSVGElement, clientX: number, clientY: number) {
  const ctm = svg.getScreenCTM?.();
  if (!ctm) return null;
  const m = ctm.inverse();
  return { x: m.a * clientX + m.c * clientY + m.e, y: m.b * clientX + m.d * clientY + m.f };
}

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

export type BoardSquare = { color: PieceColor; kind: PieceKind; square: string };

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

/** The square under a board-space point, in the board's current orientation. */
export function squareUnderPoint(
  geometry: BoardGeometry,
  x: number,
  y: number,
  flipped: boolean,
): string | null {
  const square = geometry.squareAtPoint(x, y);
  if (!square || !flipped) return square;
  const { column, row } = squareIndices(square);
  return squareAtIndices(BOARD_SIZE - 1 - row, BOARD_SIZE - 1 - column);
}

/** Expand a FEN placement field into one entry per occupied square. */
export function piecesFromFen(fen: string): BoardSquare[] {
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

/** Light and dark squares need opposite cues, or one of them swallows the mark. */
export function isLightSquare(square: string): boolean {
  return (FILES.indexOf(square[0] ?? "") + Number(square[1])) % 2 === 0;
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
  const light = isLightSquare(square);
  return (
    <ellipse
      className="board-cue"
      cx={x.toFixed(2)}
      cy={y.toFixed(2)}
      fill={light ? heroRgba("deep", 0.5) : heroRgba("light", 0.55)}
      rx={(1.15 * geometry.pieceScale).toFixed(2)}
      ry={(1.15 * geometry.pieceScale * geometry.pieceRoundness).toFixed(2)}
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
      className="board-cue"
      fill="none"
      points={pointsFor(geometry, square, flipped)}
      stroke={
        isLightSquare(square) ? heroRgba("deep", 0.7) : heroRgba("light", 0.7)
      }
      strokeWidth="1.8"
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

export type PieceStage = { elapsed: number; mode: "scatter" | "setup" } | null;

/** Progress through a single move, all derived from one elapsed clock. */
export type MoveClock = {
  capture: number;
  landing: number;
  move: number;
  settle: number;
};

export const IDLE_CLOCK: MoveClock = { capture: 0, landing: 0, move: 1, settle: 1 };

/**
 * Drives one move's animation. Returns the clock plus the move being played, or
 * null once it has finished so the board renders at rest.
 */
export function useMoveClock(
  move: AnimatedMove | null,
  travelMs: number = GAME_MOVE_MS,
): {
  clock: MoveClock;
  playing: AnimatedMove | null;
} {
  const total = travelMs + SETTLE_MS;
  const seq = move?.seq ?? 0;
  // Keyed by move, and derived during render rather than set from the effect.
  // Waiting for the first animation frame let the board paint one frame with
  // the piece already on its destination square, which read as a hop before the
  // travel started.
  const [tick, setTick] = useState({ elapsed: 0, seq: 0 });
  const elapsed = tick.seq === seq ? tick.elapsed : 0;

  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (!seq || reducedMotion) return;

    let frame = 0;
    let start: number | null = null;
    const step = (now: number) => {
      if (start === null) start = now;
      const next = now - start;
      setTick({ elapsed: Math.min(next, total), seq });
      if (next < total) frame = window.requestAnimationFrame(step);
    };
    frame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame);
  }, [reducedMotion, seq, total]);

  if (!move || reducedMotion || elapsed >= total) {
    return { clock: IDLE_CLOCK, playing: null };
  }

  const moveProgress = clamp(elapsed / travelMs);
  return {
    clock: {
      capture: move.capturedSquare ? captureProgressAt(moveProgress) : 0,
      landing: clamp((elapsed - travelMs) / LANDING_EFFECT_MS),
      move: moveProgress,
      settle: clamp((elapsed - travelMs) / LANDING_SETTLE_MS),
    },
    playing: move,
  };
}

/** Milliseconds since `key` last changed, capped at `duration`; 0 for key 0. */
function useKeyedClock(key: number, duration: number): number {
  const [tick, setTick] = useState({ elapsed: 0, key: 0 });
  useEffect(() => {
    if (!key) return;
    let frame = 0;
    let start: number | null = null;
    const step = (now: number) => {
      if (start === null) start = now;
      const next = now - start;
      setTick({ elapsed: Math.min(next, duration), key });
      if (next < duration) frame = window.requestAnimationFrame(step);
    };
    frame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame);
  }, [duration, key]);
  return tick.key === key ? tick.elapsed : 0;
}

/** Everything `renderPieces` needs to lay a position out. */
export type RenderInput = {
  clock: MoveClock;
  /** Set when the move being played was a drag: the mover starts here, held aloft. */
  drop?: DropOrigin | null;
  flipped: boolean;
  geometry: BoardGeometry;
  pieceStage: PieceStage;
  pieces: BoardSquare[];
  playing: AnimatedMove | null;
  waves: Map<string, number>;
};

/**
 * Lays the position out as drawable pieces: resting, mid-move, mid-capture, or
 * mid setup/scatter. Pure, so the invariants that have bitten before — the
 * victim standing on its square until the mover arrives, the mover drawn at its
 * origin on the first frame, an empty board at setup elapsed 0 — can be unit
 * tested without a browser.
 */
export function renderPieces({
  clock,
  drop = null,
  flipped,
  geometry,
  pieceStage,
  pieces,
  playing,
  waves,
}: RenderInput): RenderPiece[] {
  const motion = gameMotionAt(clock.move);
  const dropMotion = drop ? dropMotionAt(clock.move, drop.lift) : null;

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
      // A dropped piece slides in from wherever it was let go; anything else
      // (the rook's leg of a castle included) travels square to square.
      const dropped = dropMotion && piece.square === playing?.to;
      const start = dropped ? drop! : centerFor(geometry, travellingFrom, flipped);
      const { lift: height, travel } = dropped ? dropMotion : motion;
      x = start.x + (at.x - start.x) * travel;
      y = start.y + (at.y - start.y) * travel;
      impact = landingImpactAt(clock.settle);
      lift = height;
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
  // for the whole move: standing on its square until the mover arrives, then
  // knocked back. Gating this on the knockback having started made the victim
  // vanish on the click and reappear mid-travel.
  if (
    playing?.capturedSquare &&
    playing.capturedColor &&
    playing.capturedKind &&
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
}

type IsoChessBoardProps = {
  /** The move to play back as motion, or null to render at rest. */
  animatedMove?: AnimatedMove | null;
  /** Softens the board while an overlay is up. */
  blurred?: boolean;
  detail?: boolean;
  /** Pieces of this colour can be picked up and dragged; others are click-only. */
  dragColor?: PieceColor | null;
  fen: string;
  /**
   * Plays the recorded game's own board-setup or board-clearing animation over
   * the current position. `elapsed` is milliseconds into it; null leaves the
   * pieces at rest.
   */
  pieceStage?: PieceStage;
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
  dragColor = null,
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
  // Dragging. The ref tracks the pointer; `drag` is only set once the press
  // has moved far enough to be a drag, so a plain click never lifts a piece.
  const dragRef = useRef<{
    active: boolean;
    pointerId: number;
    square: string;
    startX: number;
    startY: number;
    wasSelected: boolean;
  } | null>(null);
  const [drag, setDrag] = useState<{ square: string; x: number; y: number } | null>(null);
  // Bumped on every press so the window listeners below are (re)attached.
  const [press, setPress] = useState(0);
  // A piece let go somewhere it cannot go slides back to its square.
  const [snap, setSnap] = useState<{ from: DropOrigin; seq: number; square: string } | null>(
    null,
  );
  const snapElapsed = useKeyedClock(snap?.seq ?? 0, SNAP_BACK_MS);
  // A legal drop is remembered until the move it caused arrives, so that
  // move plays from the drop point instead of the origin square.
  const dropRef = useRef<{ from: string; origin: DropOrigin; seq?: number; to: string } | null>(
    null,
  );
  const drop = useMemo(() => {
    const pending = dropRef.current;
    if (!animatedMove || !pending) return null;
    const matches =
      pending.from === animatedMove.from &&
      pending.to === animatedMove.to &&
      (pending.seq ?? animatedMove.seq) === animatedMove.seq;
    if (!matches) {
      dropRef.current = null;
      return null;
    }
    pending.seq = animatedMove.seq;
    return pending.origin;
  }, [animatedMove]);

  const { clock, playing } = useMoveClock(animatedMove, drop ? DROP_MS : GAME_MOVE_MS);
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

  const rendered = useMemo(
    () => renderPieces({ clock, drop, flipped, geometry, pieceStage, pieces, playing, waves }),
    [
      clock.capture,
      clock.move,
      clock.settle,
      drop,
      flipped,
      geometry,
      pieceStage,
      pieces,
      playing,
      waves,
    ],
  );

  // The held piece follows the pointer, drawn last so it passes over the rest;
  // a snapping piece slides home the same way.
  const snapping = snap && snapElapsed < SNAP_BACK_MS ? snap : null;
  const drawn = useMemo(() => {
    if (!drag && !snapping) return rendered;
    return rendered
      .map((piece) => {
        if (drag && piece.square === drag.square) {
          return { ...piece, depth: Infinity, lift: DRAG_LIFT, x: drag.x, y: drag.y };
        }
        if (snapping && piece.square === snapping.square) {
          const t = easeOutCubic(snapElapsed / SNAP_BACK_MS);
          const home = centerFor(geometry, snapping.square, flipped);
          return {
            ...piece,
            depth: Infinity,
            lift: snapping.from.lift * (1 - t),
            x: snapping.from.x + (home.x - snapping.from.x) * t,
            y: snapping.from.y + (home.y - snapping.from.y) * t,
          };
        }
        return piece;
      })
      .sort((first, second) => first.depth - second.depth);
  }, [drag, flipped, geometry, rendered, snapElapsed, snapping]);

  const dragTarget = drag ? squareUnderPoint(geometry, drag.x, drag.y, flipped) : null;
  const isLegalTarget = (square: string | null): square is string =>
    square !== null &&
    (highlights.legalQuiet.includes(square) || highlights.legalCaptures.includes(square));

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

  const snapBack = useCallback((square: string, from: DropOrigin) => {
    setSnap((previous) => ({ from, seq: (previous?.seq ?? 0) + 1, square }));
  }, []);

  const endDrag = useCallback(
    (clientX: number, clientY: number, cancelled: boolean) => {
      const pending = dragRef.current;
      dragRef.current = null;
      if (!pending) return;
      if (!pending.active) {
        // A press that never moved is a click: a second click on the selected
        // piece puts it down again.
        if (pending.wasSelected) handleSelect(pending.square);
        return;
      }
      const svg = svgRef.current;
      const point = svg ? clientToBoard(svg, clientX, clientY) : null;
      const origin = { lift: DRAG_LIFT, x: point?.x ?? 0, y: point?.y ?? 0 };
      const target = point && !cancelled ? squareUnderPoint(geometry, point.x, point.y, flipped) : null;
      setDrag(null);
      if (isLegalTarget(target)) {
        dropRef.current = { from: pending.square, origin, to: target };
        handleSelect(target);
      } else if (point) {
        snapBack(pending.square, origin);
      }
    },
    [flipped, geometry, handleSelect, isLegalTarget, snapBack],
  );

  const moveDrag = useCallback((event: PointerEvent) => {
    const pending = dragRef.current;
    if (!pending || pending.pointerId !== event.pointerId) return;
    if (
      !pending.active &&
      Math.hypot(event.clientX - pending.startX, event.clientY - pending.startY) <
        DRAG_THRESHOLD_PX
    ) {
      return;
    }
    const svg = svgRef.current;
    const point = svg ? clientToBoard(svg, event.clientX, event.clientY) : null;
    if (!point) return;
    pending.active = true;
    setDrag({ square: pending.square, x: point.x, y: point.y });
  }, []);

  // The gesture is followed on the window rather than through pointer capture:
  // the canvas underneath takes and releases capture on every press of an
  // interactive target, which would strand the pointer on whatever square it
  // crossed next. The handlers are read through refs so the listeners can stay
  // attached for the whole press.
  const moveDragRef = useRef(moveDrag);
  const endDragRef = useRef(endDrag);
  moveDragRef.current = moveDrag;
  endDragRef.current = endDrag;
  useEffect(() => {
    if (!press) return;
    const move = (event: PointerEvent) => moveDragRef.current(event);
    const up = (event: PointerEvent) => {
      if (dragRef.current?.pointerId !== event.pointerId) return;
      endDragRef.current(event.clientX, event.clientY, false);
    };
    const cancel = (event: PointerEvent) => {
      if (dragRef.current?.pointerId !== event.pointerId) return;
      endDragRef.current(event.clientX, event.clientY, true);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
    };
  }, [press]);

  /** Pointer handling for the player's own pieces: click to select, or pick up and drag. */
  const dragProps = (square: string) => ({
    onPointerDown: (event: React.PointerEvent<SVGElement>) => {
      if (event.button !== 0) return;
      const wasSelected = highlights.selected === square;
      dragRef.current = {
        active: false,
        pointerId: event.pointerId,
        square,
        startX: event.clientX,
        startY: event.clientY,
        wasSelected,
      };
      setPress((count) => count + 1);
      if (!wasSelected) handleSelect(square);
    },
    style: {
      cursor: drag ? "grabbing" : "grab",
      outline: "none",
      touchAction: "none",
    } as React.CSSProperties,
  });

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

  const hitProps = (square: string, focusable = true) => ({
    "aria-label": describeSquare(square, pieceBySquare.get(square)),
    "data-hit-square": square,
    onClick: () => handleSelect(square),
    onKeyDown: (event: React.KeyboardEvent<SVGElement>) => handleKeyDown(event, square),
    // Matches the canvas library's interactive selector, so pressing a square
    // never starts a canvas pan.
    role: "button",
    style: { cursor: "pointer", outline: "none" } as React.CSSProperties,
    tabIndex: focusable && square === focusSquare ? 0 : -1,
  });

  return (
    <svg
      className="h-full w-full overflow-visible"
      preserveAspectRatio="xMidYMax meet"
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

      {/* Cues are keyed by square so a change remounts them and they fade in. */}
      {highlights.lastMove ? (
        <g data-layer="last-move" key={`${highlights.lastMove.from}-${highlights.lastMove.to}`}>
          <polygon
            className="board-cue"
            fill={HIGHLIGHT.fill}
            opacity="0.45"
            points={pointsFor(geometry, highlights.lastMove.from, flipped)}
          />
          <polygon
            className="board-cue"
            fill={HIGHLIGHT.fill}
            opacity="0.82"
            points={pointsFor(geometry, highlights.lastMove.to, flipped)}
          />
        </g>
      ) : null}

      {highlights.selected ? (
        <g data-layer="selected" key={highlights.selected}>
          <polygon
            className="board-cue"
            fill={HIGHLIGHT.fill}
            opacity="0.92"
            points={pointsFor(geometry, highlights.selected, flipped)}
          />
          <polygon
            className="board-cue"
            fill="none"
            points={pointsFor(geometry, highlights.selected, flipped)}
            stroke={HIGHLIGHT.ring}
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

      {/* Capture rings sit on the board like every other cue, so the piece on
          the square hides the ring's far edge instead of being cut by it. */}
      <g data-layer="legal-captures">
        {highlights.legalCaptures.map((square) => (
          <CaptureRing flipped={flipped} geometry={geometry} key={square} square={square} />
        ))}
      </g>
      <g data-layer="legal-quiet">
        {highlights.legalQuiet.map((square) => (
          <MoveDot flipped={flipped} geometry={geometry} key={square} square={square} />
        ))}
      </g>

      {/* The square a dragged piece would land on. */}
      {isLegalTarget(dragTarget) ? (
        <g data-layer="drag-target" key={dragTarget}>
          <polygon
            className="board-cue"
            fill="none"
            points={pointsFor(geometry, dragTarget, flipped)}
            stroke={HIGHLIGHT.ring}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </g>
      ) : null}

      {playing ? (
        <LandingDust
          center={centerFor(geometry, playing.to, flipped)}
          progress={clock.landing}
        />
      ) : null}

      <g data-layer="pieces" pointerEvents="none">
        {drawn.map((piece) => (
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
              {...hitProps(piece.square, false)}
              {...(piece.color === dragColor ? { onClick: undefined, ...dragProps(piece.square) } : {})}
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
