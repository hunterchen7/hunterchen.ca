import { motion } from "framer-motion";
import { DraggableImage } from "@hunterchen/canvas";
import { PIECE_SRCS } from "./PieceSVGs";
import type { PieceChar } from "./types";

interface CapturedPieceStickerProps {
  piece: PieceChar;
  targetPos: { x: number; y: number };
  size: number;
}

export default function CapturedPieceSticker({
  piece,
  targetPos,
  size,
}: CapturedPieceStickerProps) {
  return (
    <motion.div
      className="absolute top-0 left-0"
      style={{ filter: "drop-shadow(0 6px 10px rgba(0, 0, 0, 0.45))" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <DraggableImage
        src={PIECE_SRCS[piece]}
        initialPos={targetPos}
        width={size}
        height={size}
        hoverScale={1.05}
      />
    </motion.div>
  );
}
