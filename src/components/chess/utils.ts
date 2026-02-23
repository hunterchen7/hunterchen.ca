import type { PieceChar, BoardPosition } from "./types";

const FILES = "abcdefgh";

export function fenToPosition(fen: string): BoardPosition {
  const placement = fen.split(" ")[0]!;
  const position: BoardPosition = {};
  const ranks = placement.split("/");

  for (let rankIdx = 0; rankIdx < ranks.length; rankIdx++) {
    const rankStr = ranks[rankIdx]!;
    const rank = 8 - rankIdx;
    let file = 0;

    for (const ch of rankStr) {
      if (ch >= "1" && ch <= "8") {
        file += Number(ch);
      } else {
        const square = `${FILES[file]!}${rank}`;
        position[square] = ch as PieceChar;
        file++;
      }
    }
  }

  return position;
}

/** Grid row/col (0,0 = top-left of display) to algebraic square name. */
export function gridToSquare(row: number, col: number): string {
  return `${FILES[col]!}${8 - row}`;
}

/** Algebraic square to grid row/col. */
export function squareToGrid(square: string): { row: number; col: number } {
  const file = square.charCodeAt(0) - 97; // 'a' = 0
  const rank = Number(square[1]!);
  return { row: 8 - rank, col: file };
}

export function isLightSquare(square: string): boolean {
  const file = square.charCodeAt(0) - 97;
  const rank = Number(square[1]!) - 1;
  return (file + rank) % 2 === 1;
}

/** Convert viewport pointer coords to a square name using the board's bounding rect. */
export function resolveDropSquare(
  clientX: number,
  clientY: number,
  boardRect: DOMRect,
  flipped = false,
): string | null {
  const relX = (clientX - boardRect.left) / boardRect.width;
  const relY = (clientY - boardRect.top) / boardRect.height;

  if (relX < 0 || relX >= 1 || relY < 0 || relY >= 1) return null;

  const col = flipped ? 7 - Math.floor(relX * 8) : Math.floor(relX * 8);
  const row = flipped ? 7 - Math.floor(relY * 8) : Math.floor(relY * 8);
  return gridToSquare(row, col);
}
