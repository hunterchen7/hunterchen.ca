import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { PIECE_MAP } from "./PieceSVGs";
import type { PieceChar } from "./types";

interface DragOverlayProps {
  piece: PieceChar;
  squareSize: number;
  canvasScale: number;
  startPosition: { x: number; y: number };
  onDragEnd: (clientX: number, clientY: number) => void;
  onDragCancel: () => void;
}

export default function DragOverlay({
  piece,
  squareSize,
  canvasScale,
  startPosition,
  onDragEnd,
  onDragCancel,
}: DragOverlayProps) {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const displaySize = squareSize * canvasScale;
    el.style.left = `${startPosition.x - displaySize / 2}px`;
    el.style.top = `${startPosition.y - displaySize / 2}px`;

    const onMove = (e: PointerEvent) => {
      el.style.left = `${e.clientX - displaySize / 2}px`;
      el.style.top = `${e.clientY - displaySize / 2}px`;
    };

    const onUp = (e: PointerEvent) => {
      onDragEnd(e.clientX, e.clientY);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDragCancel();
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("keydown", onKey);
    };
  }, [squareSize, canvasScale, startPosition, onDragEnd, onDragCancel]);

  const displaySize = squareSize * canvasScale;
  const PieceComponent = PIECE_MAP[piece];

  return createPortal(
    <div
      ref={elRef}
      style={{
        position: "fixed",
        width: displaySize,
        height: displaySize,
        pointerEvents: "none",
        zIndex: 10000,
        cursor: "grabbing",
      }}
    >
      <PieceComponent style={{ width: "100%", height: "100%" }} />
    </div>,
    document.body,
  );
}
