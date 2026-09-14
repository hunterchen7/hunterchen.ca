/**
 * Board geometry for the pseudo-3D chessboards.
 *
 * A projection is a plain affine map from board space (row, column) to SVG user
 * space, so it inverts exactly — pointer hit-testing is arithmetic rather than
 * polygon intersection. See `boardAtPoint`.
 *
 * Two projections exist:
 *
 * - `DIAMOND` views the board corner-on, with a1 at the bottom vertex and h8 at
 *   the top. It reads well as decoration and is what the projects-card
 *   watermark uses.
 * - `STRAIGHT` faces the board head-on: files run left to right, ranks recede
 *   upward with vertical foreshortening. Much easier to actually play on, so
 *   the playable board uses it.
 */

export const BOARD_SIZE = 8;
export const FILES = "abcdefgh";

export type Point = { x: number; y: number };

export type ProjectionConfig = {
  boardDepth: number;
  /** Screen delta for +1 column (a decreasing rank). */
  column: Point;
  origin: Point;
  /** Scales the piece artwork to suit the square size. */
  pieceScale: number;
  /** Screen delta for +1 row (a decreasing file). */
  row: Point;
};

export function clamp(value: number, minimum = 0, maximum = 1): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function smoothstep(value: number): number {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
}

export function easeOutCubic(value: number): number {
  const t = 1 - clamp(value);
  return 1 - t * t * t;
}

/**
 * Board indices for a square. Note both axes run backwards from the obvious:
 * column counts down from rank 8, row counts down from file h.
 */
export function squareIndices(square: string) {
  const file = FILES.indexOf(square[0] ?? "");
  const rankRow = 8 - Number(square[1]);
  return { column: rankRow, row: BOARD_SIZE - 1 - file };
}

/** Inverse of `squareIndices`. */
export function squareAtIndices(row: number, column: number): string | null {
  if (row < 0 || row >= BOARD_SIZE || column < 0 || column >= BOARD_SIZE) {
    return null;
  }
  const file = FILES[BOARD_SIZE - 1 - row];
  const rank = 8 - column;
  return file === undefined ? null : `${file}${rank}`;
}

export type BoardGeometry = ReturnType<typeof createBoardGeometry>;

export function createBoardGeometry(config: ProjectionConfig) {
  const { boardDepth, column: COLUMN, origin: ORIGIN, pieceScale, row: ROW } = config;

  const point = (row: number, column: number): Point => ({
    x: ORIGIN.x + column * COLUMN.x + row * ROW.x,
    y: ORIGIN.y + column * COLUMN.y + row * ROW.y,
  });

  const center = (row: number, column: number) => point(row + 0.5, column + 0.5);

  const squareCenter = (square: string) => {
    const { column, row } = squareIndices(square);
    return center(row, column);
  };

  const squarePoints = (row: number, column: number) =>
    [
      point(row, column),
      point(row, column + 1),
      point(row + 1, column + 1),
      point(row + 1, column),
    ]
      .map(({ x, y }) => `${x.toFixed(2)},${y.toFixed(2)}`)
      .join(" ");

  const squares = Array.from({ length: BOARD_SIZE }, (_, rankIndex) =>
    Array.from(FILES, (file, fileIndex) => {
      const rank = BOARD_SIZE - rankIndex;
      const square = `${file}${rank}`;
      const { column, row } = squareIndices(square);
      return {
        column,
        light: (fileIndex + rank) % 2 === 0,
        points: squarePoints(row, column),
        row,
        square,
      };
    }),
  ).flat();

  const lightSquaresPath = squares
    .filter(({ light }) => light)
    .map(({ points }) => `M${points} Z`)
    .join(" ");

  const gridPath = [
    ...Array.from({ length: BOARD_SIZE - 1 }, (_, index) => {
      const start = point(0, index + 1);
      const end = point(BOARD_SIZE, index + 1);
      return `M${start.x.toFixed(2)},${start.y.toFixed(2)} L${end.x.toFixed(2)},${end.y.toFixed(2)}`;
    }),
    ...Array.from({ length: BOARD_SIZE - 1 }, (_, index) => {
      const start = point(index + 1, 0);
      const end = point(index + 1, BOARD_SIZE);
      return `M${start.x.toFixed(2)},${start.y.toFixed(2)} L${end.x.toFixed(2)},${end.y.toFixed(2)}`;
    }),
  ].join(" ");

  /** Inverse of `point`, by inverting the 2x2 basis. */
  const boardAtPoint = (x: number, y: number) => {
    const dx = x - ORIGIN.x;
    const dy = y - ORIGIN.y;
    const determinant = COLUMN.x * ROW.y - ROW.x * COLUMN.y;
    return {
      column: (dx * ROW.y - ROW.x * dy) / determinant,
      row: (COLUMN.x * dy - dx * COLUMN.y) / determinant,
    };
  };

  const squareAtPoint = (x: number, y: number) => {
    const { column, row } = boardAtPoint(x, y);
    return squareAtIndices(Math.floor(row), Math.floor(column));
  };

  return {
    boardAtPoint,
    boardCenter: point(BOARD_SIZE / 2, BOARD_SIZE / 2),
    boardDepth,
    /** The four top-face corners, in draw order. */
    corners: {
      far: point(0, BOARD_SIZE),
      front: point(BOARD_SIZE, BOARD_SIZE),
      left: point(BOARD_SIZE, 0),
      near: point(0, 0),
    },
    center,
    gridPath,
    lightSquaresPath,
    pieceScale,
    point,
    squareAtPoint,
    squareCenter,
    squarePoints,
    squares,
  };
}

/** Corner-on view. Decorative; used by the projects-card watermark. */
export const DIAMOND = createBoardGeometry({
  boardDepth: 5.2,
  column: { x: 6.15, y: 3.075 },
  origin: { x: 60, y: 10.8 },
  pieceScale: 1.06,
  row: { x: -6.15, y: 3.075 },
});

/**
 * Head-on view. Files run left to right, ranks recede straight up the screen
 * with vertical foreshortening, so squares are plain rectangles and the board
 * reads like a normal chessboard tilted back.
 */
export const STRAIGHT = createBoardGeometry({
  boardDepth: 4.6,
  // Squares are 10 wide by 6.6 deep: enough foreshortening to read as tilted
  // without flattening the board into a strip.
  column: { x: 0, y: 6.6 },
  origin: { x: 100, y: 17 },
  // A diamond square spans 12.3 units across the screen and its pieces sit at
  // about 40% of that. Matching the ratio on a 10-wide rectangle keeps the
  // familiar proportions and stops pieces from swallowing the rank behind.
  pieceScale: 0.98,
  row: { x: -10, y: 0 },
});

// The watermark predates the factory and uses these directly.
export const BOARD_CENTER = DIAMOND.boardCenter;
export const BOARD_DEPTH = DIAMOND.boardDepth;
export const PIECE_SCALE = DIAMOND.pieceScale;
export const BOARD_GRID_PATH = DIAMOND.gridPath;
export const LIGHT_SQUARES_PATH = DIAMOND.lightSquaresPath;
export const point = DIAMOND.point;
export const center = DIAMOND.center;
export const squareCenter = DIAMOND.squareCenter;
export const squarePoints = DIAMOND.squarePoints;
