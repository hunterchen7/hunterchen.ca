/**
 * Isometric chessboard geometry, shared by the ambient ChessboardWatermark and
 * the playable IsoChessBoard.
 *
 * The projection is a plain affine map from board space (row, column) to SVG
 * user space, which means it inverts exactly — pointer hit-testing is
 * arithmetic, not polygon intersection. See `boardAtPoint`.
 *
 * Board orientation: a diamond viewed corner-on. a1 sits at the bottom vertex,
 * h8 at the top, a8 at the left and h1 at the right.
 */

export const BOARD_SIZE = 8;
export const ORIGIN = { x: 60, y: 10.8 };
export const COLUMN = { x: 6.15, y: 3.075 };
export const ROW = { x: -6.15, y: 3.075 };
export const BOARD_DEPTH = 5.2;
export const PIECE_SCALE = 1.06;
export const FILES = "abcdefgh";

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


export function point(row: number, column: number) {
  return {
    x: ORIGIN.x + column * COLUMN.x + row * ROW.x,
    y: ORIGIN.y + column * COLUMN.y + row * ROW.y,
  };
}

export function center(row: number, column: number) {
  return point(row + 0.5, column + 0.5);
}

export function squareIndices(square: string) {
  const file = FILES.indexOf(square[0] ?? "");
  const rankRow = 8 - Number(square[1]);
  return { column: rankRow, row: BOARD_SIZE - 1 - file };
}

export function squareCenter(square: string) {
  const { column, row } = squareIndices(square);
  return center(row, column);
}


export const BOARD_CENTER = point(BOARD_SIZE / 2, BOARD_SIZE / 2);

export function squarePoints(row: number, column: number) {
  return [
    point(row, column),
    point(row, column + 1),
    point(row + 1, column + 1),
    point(row + 1, column),
  ]
    .map(({ x, y }) => `${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");
}


export const BOARD_SQUARES = Array.from({ length: BOARD_SIZE }, (_, rankIndex) =>
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


export const LIGHT_SQUARES_PATH = BOARD_SQUARES.filter(({ light }) => light)
  .map(({ points }) => `M${points} Z`)
  .join(" ");


export const BOARD_GRID_PATH = [
  ...Array.from({ length: BOARD_SIZE - 1 }, (_, index) => {
    const column = index + 1;
    const start = point(0, column);
    const end = point(BOARD_SIZE, column);
    return `M${start.x.toFixed(2)},${start.y.toFixed(2)} L${end.x.toFixed(2)},${end.y.toFixed(2)}`;
  }),
  ...Array.from({ length: BOARD_SIZE - 1 }, (_, index) => {
    const row = index + 1;
    const start = point(row, 0);
    const end = point(row, BOARD_SIZE);
    return `M${start.x.toFixed(2)},${start.y.toFixed(2)} L${end.x.toFixed(2)},${end.y.toFixed(2)}`;
  }),
].join(" ");


/** Inverse of `point`: SVG user-space coordinates back to fractional board space. */
export function boardAtPoint(x: number, y: number): { column: number; row: number } {
  // x - ORIGIN.x = COLUMN.x * (column - row)
  // y - ORIGIN.y = COLUMN.y * (column + row)
  const difference = (x - ORIGIN.x) / COLUMN.x;
  const sum = (y - ORIGIN.y) / COLUMN.y;
  return { column: (sum + difference) / 2, row: (sum - difference) / 2 };
}

/** Inverse of `squareIndices`: board indices back to algebraic notation. */
export function squareAtIndices(row: number, column: number): string | null {
  if (row < 0 || row >= BOARD_SIZE || column < 0 || column >= BOARD_SIZE) {
    return null;
  }
  const file = FILES[BOARD_SIZE - 1 - row];
  const rank = 8 - column;
  return file === undefined ? null : `${file}${rank}`;
}

/** The square under a point in SVG user space, or null when off the board. */
export function squareAtPoint(x: number, y: number): string | null {
  const { column, row } = boardAtPoint(x, y);
  return squareAtIndices(Math.floor(row), Math.floor(column));
}

/**
 * Convert client (viewport) coordinates into the SVG's own user space.
 * `getScreenCTM` already folds in the canvas pan/zoom transform, so this stays
 * correct at any zoom level.
 */
export function clientToSvgPoint(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number,
): { x: number; y: number } | null {
  const screenTransform = svg.getScreenCTM();
  if (!screenTransform) return null;
  const inverse = screenTransform.inverse();
  const svgPoint = svg.createSVGPoint();
  svgPoint.x = clientX;
  svgPoint.y = clientY;
  const mapped = svgPoint.matrixTransform(inverse);
  return { x: mapped.x, y: mapped.y };
}

/** The square under a client-space point, or null when off the board. */
export function squareAtClientPoint(
  svg: SVGSVGElement,
  clientX: number,
  clientY: number,
): string | null {
  const local = clientToSvgPoint(svg, clientX, clientY);
  return local === null ? null : squareAtPoint(local.x, local.y);
}

