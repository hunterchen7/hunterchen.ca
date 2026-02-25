import { memo } from "react";
import type { PieceChar } from "./types";

interface PieceSVGProps {
  className?: string;
  style?: React.CSSProperties;
}

export const PIECE_SRCS: Record<PieceChar, string> = {
  K: "/chess/wK.svg",
  Q: "/chess/wQ.svg",
  R: "/chess/wR.svg",
  B: "/chess/wB.svg",
  N: "/chess/wN.svg",
  P: "/chess/wP.svg",
  k: "/chess/bK.svg",
  q: "/chess/bQ.svg",
  r: "/chess/bR.svg",
  b: "/chess/bB.svg",
  n: "/chess/bN.svg",
  p: "/chess/bP.svg",
};

function makePiece(piece: PieceChar) {
  return memo(({ className, style }: PieceSVGProps) => (
    <img
      src={PIECE_SRCS[piece]}
      alt=""
      draggable={false}
      className={className}
      style={style}
    />
  ));
}

export const PIECE_MAP: Record<PieceChar, React.ComponentType<PieceSVGProps>> = {
  K: makePiece("K"),
  Q: makePiece("Q"),
  R: makePiece("R"),
  B: makePiece("B"),
  N: makePiece("N"),
  P: makePiece("P"),
  k: makePiece("k"),
  q: makePiece("q"),
  r: makePiece("r"),
  b: makePiece("b"),
  n: makePiece("n"),
  p: makePiece("p"),
};
