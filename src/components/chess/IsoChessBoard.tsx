import { memo, useCallback, useMemo, useRef, useState } from "react";
import { heroRgba } from "../hero/heroPalette";
import {
  BOARD_SIZE,
  FILES,
  center,
  squareIndices,
  squarePoints,
} from "./isoGeometry";
import {
  BoardSurface,
  PieceDefinitions,
  PieceModel,
  dangerRgba,
  type PieceColor,
  type PieceKind,
  type RenderPiece,
} from "./isoPieces";
import type { BoardHighlights } from "../../hooks/useChessGame";

const PIECE_PREFIX = "iso-chess-piece";

/** Half-extents of a piece's artwork, used for its click target. */
const PIECE_HIT = { bottom: 1.1, halfWidth: 2.4, top: 5.4 };

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

function centerFor(square: string, flipped: boolean) {
  const { column, row } = indicesFor(square, flipped);
  return center(row, column);
}

function pointsFor(square: string, flipped: boolean) {
  const { column, row } = indicesFor(square, flipped);
  return squarePoints(row, column);
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
function MoveDot({ square, flipped }: { flipped: boolean; square: string }) {
  const { x, y } = centerFor(square, flipped);
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

function CaptureRing({ square, flipped }: { flipped: boolean; square: string }) {
  return (
    <polygon
      fill="none"
      points={pointsFor(square, flipped)}
      stroke={heroRgba("light", 0.6)}
      strokeWidth="0.7"
      vectorEffect="non-scaling-stroke"
    />
  );
}

type IsoChessBoardProps = {
  /** Softens the board while an overlay is up. */
  blurred?: boolean;
  detail?: boolean;
  fen: string;
  flipped?: boolean;
  highlights: BoardHighlights;
  interactive?: boolean;
  onSelectSquare?: (square: string) => void;
};

function IsoChessBoard({
  blurred = false,
  detail = true,
  fen,
  flipped = false,
  highlights,
  interactive = false,
  onSelectSquare,
}: IsoChessBoardProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [focusSquare, setFocusSquare] = useState<string>("e2");

  const pieces = useMemo(() => piecesFromFen(fen), [fen]);
  const pieceBySquare = useMemo(() => {
    const lookup = new Map<string, BoardSquare>();
    for (const piece of pieces) lookup.set(piece.square, piece);
    return lookup;
  }, [pieces]);

  // Painter's algorithm: larger row+column is nearer the viewer, so it draws
  // last and overlaps what is behind it.
  const rendered = useMemo<RenderPiece[]>(() => {
    return pieces
      .map((piece) => {
        const { column, row } = indicesFor(piece.square, flipped);
        const { x, y } = center(row, column);
        return {
          color: piece.color,
          depth: row + column,
          id: `${piece.color}${piece.kind}-${piece.square}`,
          impact: 0,
          kind: piece.kind,
          lift: 0,
          opacity: 1,
          rotation: 0,
          scale: 1,
          square: piece.square,
          verticalScale: 1,
          x,
          y,
        } satisfies RenderPiece;
      })
      .sort((first, second) => first.depth - second.depth);
  }, [flipped, pieces]);

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
      viewBox="0 0 120 82"
    >
      <PieceDefinitions detail={detail} prefix={PIECE_PREFIX} />
      <BoardSurface />

      {highlights.lastMove ? (
        <g data-layer="last-move">
          <polygon
            fill={heroRgba("light", 0.16)}
            points={pointsFor(highlights.lastMove.from, flipped)}
          />
          <polygon
            fill={heroRgba("accent", 0.26)}
            points={pointsFor(highlights.lastMove.to, flipped)}
          />
        </g>
      ) : null}

      {highlights.selected ? (
        <g data-layer="selected">
          <polygon
            fill={heroRgba("accent", 0.34)}
            points={pointsFor(highlights.selected, flipped)}
          />
          <polygon
            fill="none"
            points={pointsFor(highlights.selected, flipped)}
            stroke={heroRgba("light", 0.82)}
            strokeWidth="0.9"
            vectorEffect="non-scaling-stroke"
          />
        </g>
      ) : null}

      {highlights.checkSquare ? (
        <g data-layer="check">
          <polygon
            fill={dangerRgba(0.32)}
            points={pointsFor(highlights.checkSquare, flipped)}
          />
          <polygon
            fill="none"
            points={pointsFor(highlights.checkSquare, flipped)}
            stroke={dangerRgba(0.8)}
            strokeWidth="0.85"
            vectorEffect="non-scaling-stroke"
          />
        </g>
      ) : null}

      <g data-layer="legal-quiet">
        {highlights.legalQuiet.map((square) => (
          <MoveDot flipped={flipped} key={square} square={square} />
        ))}
      </g>

      <g data-layer="pieces" pointerEvents="none">
        {rendered.map((piece) => (
          <PieceModel key={piece.id} {...piece} prefix={PIECE_PREFIX} />
        ))}
      </g>

      {/* Capture rings sit above the pieces so they read as a target. */}
      <g data-layer="legal-captures" pointerEvents="none">
        {highlights.legalCaptures.map((square) => (
          <CaptureRing flipped={flipped} key={square} square={square} />
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
              points={pointsFor(square, flipped)}
            />
          ))}
          {/* Piece silhouettes above them, in the same depth order as the art,
              so clicking a tall piece selects its own square rather than the
              square its head overlaps. */}
          {rendered.map((piece) => (
            <rect
              {...hitProps(piece.square)}
              fill="transparent"
              height={PIECE_HIT.top + PIECE_HIT.bottom}
              key={`piece-${piece.id}`}
              width={PIECE_HIT.halfWidth * 2}
              x={piece.x - PIECE_HIT.halfWidth}
              y={piece.y - PIECE_HIT.top}
            />
          ))}
        </g>
      ) : null}
    </svg>
  );
}

export default memo(IsoChessBoard);
