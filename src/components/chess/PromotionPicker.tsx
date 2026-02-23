import { PIECE_MAP } from "./PieceSVGs";
import type { PieceChar } from "./types";

type PromotionPiece = "q" | "r" | "b" | "n";

interface PromotionPickerProps {
  color: "w" | "b";
  file: number; // 0-7 (a-h)
  orientation: "w" | "b";
  onSelect: (piece: PromotionPiece) => void;
  onCancel: () => void;
}

const PROMOTION_PIECES: PromotionPiece[] = ["q", "r", "b", "n"];

export default function PromotionPicker({
  color,
  file,
  orientation,
  onSelect,
  onCancel,
}: PromotionPickerProps) {
  // White promotes on rank 8 (visual top when orientation=w, bottom when orientation=b)
  // Black promotes on rank 1 (visual bottom when orientation=w, top when orientation=b)
  const fromTop = color === "w" ? orientation === "w" : orientation === "b";
  const visualFile = orientation === "b" ? 7 - file : file;

  return (
    <>
      {/* Backdrop to catch cancel clicks */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 10,
        }}
        onClick={onCancel}
      />
      {/* Piece buttons */}
      <div
        style={{
          position: "absolute",
          left: `${(visualFile / 8) * 100}%`,
          width: `${100 / 8}%`,
          ...(fromTop ? { top: 0 } : { bottom: 0 }),
          zIndex: 11,
          display: "flex",
          flexDirection: fromTop ? "column" : "column-reverse",
        }}
      >
        {PROMOTION_PIECES.map((p) => {
          const pieceChar: PieceChar = color === "w" ? (p.toUpperCase() as PieceChar) : p as PieceChar;
          const PieceComponent = PIECE_MAP[pieceChar];
          return (
            <button
              key={p}
              type="button"
              onClick={() => onSelect(p)}
              style={{
                aspectRatio: "1 / 1",
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(30, 20, 40, 0.92)",
                border: "1px solid rgba(192, 132, 252, 0.3)",
                padding: 0,
                margin: 0,
                cursor: "pointer",
              }}
            >
              <PieceComponent style={{ width: "80%", height: "80%" }} />
            </button>
          );
        })}
      </div>
    </>
  );
}
