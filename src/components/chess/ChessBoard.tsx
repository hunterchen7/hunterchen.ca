import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useCanvasContext } from "@hunterchen/canvas";
import { PIECE_MAP } from "./PieceSVGs";
import DragOverlay from "./DragOverlay";
import {
  fenToPosition,
  gridToSquare,
  squareToGrid,
  isLightSquare,
  resolveDropSquare,
} from "./utils";
import type { ChessBoardProps, PieceChar, BoardPosition } from "./types";

interface AnimatingPiece {
  piece: PieceChar;
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
}

interface DragState {
  piece: PieceChar;
  fromSquare: string;
  startPosition: { x: number; y: number };
}

interface PendingDrag {
  piece: PieceChar;
  fromSquare: string;
  startX: number;
  startY: number;
}

const DRAG_THRESHOLD = 5;

function PieceOnSquare({
  piece,
  square,
  anim,
  animationDuration,
  flipped,
}: {
  piece: PieceChar;
  square: string;
  anim: AnimatingPiece | null;
  animationDuration: number;
  flipped: boolean;
}) {
  const PieceComponent = PIECE_MAP[piece];
  const grid = squareToGrid(square);

  const isTarget =
    anim &&
    anim.toRow === grid.row &&
    anim.toCol === grid.col &&
    anim.piece === piece;

  const [offset, setOffset] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!isTarget || !anim) {
      setOffset(null);
      return;
    }

    // Start at the "from" position offset (negate when flipped since visual grid is reversed)
    const sign = flipped ? -1 : 1;
    const dx = (anim.fromCol - anim.toCol) * 100 * sign;
    const dy = (anim.fromRow - anim.toRow) * 100 * sign;
    setOffset({ x: dx, y: dy });

    // Next frame: animate to (0, 0)
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setOffset({ x: 0, y: 0 });
      });
    });

    // Clear after animation completes
    const timer = setTimeout(() => setOffset(null), animationDuration + 50);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [isTarget, anim, animationDuration, flipped]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: offset ? `translate(${offset.x}%, ${offset.y}%)` : undefined,
        transition:
          offset && (offset.x !== 0 || offset.y !== 0)
            ? undefined
            : offset
              ? `transform ${animationDuration}ms ease`
              : undefined,
      }}
    >
      <PieceComponent style={{ width: "85%", height: "85%" }} />
    </div>
  );
}

export default function ChessBoard({
  position: fen,
  onSquareClick,
  onPieceDrop,
  onDragStart,
  onDragEnd: onDragEndCallback,
  squareStyles,
  darkSquareColor = "#4a3562",
  lightSquareColor = "#d4c5e2",
  boardStyle,
  isDraggable = false,
  animationDuration = 200,
  orientation = "w",
}: ChessBoardProps) {
  const flipped = orientation === "b";
  const { scale } = useCanvasContext();
  const boardRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [anim, setAnim] = useState<AnimatingPiece | null>(null);
  const skipNextAnimRef = useRef(false);

  const currentPosition = useMemo(() => fenToPosition(fen), [fen]);
  const prevPositionRef = useRef<BoardPosition>(currentPosition);

  // Detect piece movement and trigger animation
  useEffect(() => {
    const prev = prevPositionRef.current;
    prevPositionRef.current = currentPosition;

    // Skip animation for drag-dropped pieces (user already moved it visually)
    if (skipNextAnimRef.current) {
      skipNextAnimRef.current = false;
      return;
    }

    // Find a square that lost a piece and a square that gained the same piece
    let fromSquare: string | null = null;
    let toSquare: string | null = null;
    let movedPiece: PieceChar | null = null;

    for (const sq in prev) {
      if (prev[sq] && !currentPosition[sq]) {
        fromSquare = sq;
        movedPiece = prev[sq]!;
      }
    }

    if (fromSquare && movedPiece) {
      for (const sq in currentPosition) {
        if (currentPosition[sq] === movedPiece && prev[sq] !== movedPiece) {
          toSquare = sq;
          break;
        }
      }
    }

    if (fromSquare && toSquare && movedPiece) {
      const from = squareToGrid(fromSquare);
      const to = squareToGrid(toSquare);
      setAnim({
        piece: movedPiece,
        fromRow: from.row,
        fromCol: from.col,
        toRow: to.row,
        toCol: to.col,
      });
      const timer = setTimeout(() => setAnim(null), animationDuration + 100);
      return () => clearTimeout(timer);
    }
  }, [currentPosition, animationDuration]);

  const pendingDragRef = useRef<PendingDrag | null>(null);

  const handlePointerDown = (
    e: React.PointerEvent,
    square: string,
    piece: PieceChar | undefined,
  ) => {
    if (!isDraggable || !piece) return;
    e.stopPropagation();
    // Don't preventDefault — let click events fire for click-to-move
    pendingDragRef.current = {
      piece,
      fromSquare: square,
      startX: e.clientX,
      startY: e.clientY,
    };
  };

  // Listen for pointer move/up globally to detect drag vs click
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const pending = pendingDragRef.current;
      if (!pending) return;

      const dx = e.clientX - pending.startX;
      const dy = e.clientY - pending.startY;
      if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
        // Promote to real drag
        pendingDragRef.current = null;
        onDragStart?.(pending.fromSquare);
        setDragState({
          piece: pending.piece,
          fromSquare: pending.fromSquare,
          startPosition: { x: e.clientX, y: e.clientY },
        });
      }
    };

    const onUp = () => {
      // Pointer released without enough movement — it's a click
      pendingDragRef.current = null;
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  const handleDragEnd = useCallback(
    (clientX: number, clientY: number) => {
      if (!dragState || !boardRef.current) {
        setDragState(null);
        return;
      }

      const boardRect = boardRef.current.getBoundingClientRect();
      const targetSquare = resolveDropSquare(clientX, clientY, boardRect, flipped);

      if (targetSquare && targetSquare !== dragState.fromSquare) {
        skipNextAnimRef.current = true;
        onPieceDrop?.(dragState.fromSquare, targetSquare);
      }

      setDragState(null);
      onDragEndCallback?.();
    },
    [dragState, onPieceDrop, onDragEndCallback],
  );

  const handleDragCancel = useCallback(() => {
    setDragState(null);
    onDragEndCallback?.();
  }, []);

  const squareSize = boardRef.current ? boardRef.current.offsetWidth / 8 : 50;

  return (
    <>
      <div
        ref={boardRef}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(8, 1fr)",
          gridTemplateRows: "repeat(8, 1fr)",
          aspectRatio: "1 / 1",
          width: "100%",
          overflow: "hidden",
          touchAction: "manipulation",
          ...boardStyle,
        }}
      >
        {Array.from({ length: 64 }, (_, i) => {
          const row = flipped ? 7 - Math.floor(i / 8) : Math.floor(i / 8);
          const col = flipped ? 7 - (i % 8) : i % 8;
          const square = gridToSquare(row, col);
          const piece = currentPosition[square];
          const light = isLightSquare(square);
          const customStyle = squareStyles?.[square];
          const isDragSource = dragState?.fromSquare === square;

          return (
            <button
              key={square}
              data-square={square}
              type="button"
              onClick={() => onSquareClick?.(square)}
              onPointerDown={(e) => handlePointerDown(e, square, piece)}
              style={{
                backgroundColor: light ? lightSquareColor : darkSquareColor,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "none",
                padding: 0,
                margin: 0,
                outline: "none",
                cursor: customStyle?.cursor ?? (piece && isDraggable ? "grab" : "default"),
              }}
            >
              {customStyle && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    zIndex: 0,
                    ...customStyle,
                    cursor: undefined,
                  }}
                />
              )}
              {piece && !isDragSource && (
                <div style={{ position: "relative", zIndex: 1, width: "100%", height: "100%" }}>
                  <PieceOnSquare
                    piece={piece}
                    square={square}
                    anim={anim}
                    animationDuration={animationDuration}
                    flipped={flipped}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {dragState && (
        <DragOverlay
          piece={dragState.piece}
          squareSize={squareSize}
          canvasScale={scale.get()}
          startPosition={dragState.startPosition}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        />
      )}
    </>
  );
}
