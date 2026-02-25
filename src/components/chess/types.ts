export type PieceChar =
  | "P" | "N" | "B" | "R" | "Q" | "K"
  | "p" | "n" | "b" | "r" | "q" | "k";

export type BoardPosition = Record<string, PieceChar>;

export interface ChessBoardProps {
  position: string; // FEN string
  onSquareClick?: (square: string) => void;
  onPieceDrop?: (from: string, to: string) => boolean;
  onDragStart?: (square: string) => void;
  onDragEnd?: () => void;
  squareStyles?: Record<string, React.CSSProperties>;
  darkSquareColor?: string;
  lightSquareColor?: string;
  boardStyle?: React.CSSProperties;
  isDraggable?: boolean;
  animationDuration?: number;
  orientation?: "w" | "b";
  playerColor?: "w" | "b";
}

export interface CapturedPiece {
  id: string;
  piece: PieceChar;
  targetPos: { x: number; y: number };
  gridCol: number;
  gridRow: number;
}
