import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
const HIGHLIGHT_TRANSITION = { duration: 0.1, ease: "easeOut" as const };

function SquareHighlight({ style }: { style?: React.CSSProperties }) {
  return (
    <AnimatePresence>
      {style && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={HIGHLIGHT_TRANSITION}
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 0,
            ...style,
            cursor: undefined,
          }}
        />
      )}
    </AnimatePresence>
  );
}

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

const RANKS = [8, 7, 6, 5, 4, 3, 2, 1];
const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const PIECE_LABELS: Record<PieceChar, string> = {
  K: "White king",
  Q: "White queen",
  R: "White rook",
  B: "White bishop",
  N: "White knight",
  P: "White pawn",
  k: "Black king",
  q: "Black queen",
  r: "Black rook",
  b: "Black bishop",
  n: "Black knight",
  p: "Black pawn",
};

export default function ChessBoard({
  position: fen,
  onSquareClick,
  onPieceDrop,
  onDragStart,
  onDragEnd: onDragEndCallback,
  squareStyles,
  darkSquareColor = "#453260",
  lightSquareColor = "#c9bdd8",
  boardStyle,
  isDraggable = false,
  animationDuration = 200,
  orientation = "w",
  playerColor,
  selectedSquare,
  legalMoveSquares = [],
  isInteractive = false,
}: ChessBoardProps) {
  const flipped = orientation === "b";
  const { scale } = useCanvasContext();
  const boardRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [hoveredSquare, setHoveredSquare] = useState<string | null>(null);
  const [keyboardSquare, setKeyboardSquare] = useState<string | null>(null);
  const [anim, setAnim] = useState<AnimatingPiece | null>(null);
  const pendingKeyboardRestoreRef = useRef<string | null>(null);
  const skipNextAnimRef = useRef(false);
  const onDragStartRef = useRef(onDragStart);
  onDragStartRef.current = onDragStart;

  const currentPosition = useMemo(() => fenToPosition(fen), [fen]);
  const prevPositionRef = useRef<BoardPosition>(currentPosition);

  const isPlayersPiece = useCallback(
    (piece: PieceChar | undefined) =>
      Boolean(
        piece &&
          playerColor &&
          ((playerColor === "w" && piece >= "A" && piece <= "Z") ||
            (playerColor === "b" && piece >= "a" && piece <= "z")),
      ),
    [playerColor],
  );

  const defaultKeyboardSquare = useMemo(
    () =>
      Object.keys(currentPosition).find((square) =>
        isPlayersPiece(currentPosition[square]),
      ) ?? "a1",
    [currentPosition, isPlayersPiece],
  );

  // Choose an initial entry point once. After that, preserve the roving square
  // even when it is empty so keyboard focus never jumps after a completed move.
  useEffect(() => {
    if (!isInteractive || keyboardSquare) return;
    setKeyboardSquare(defaultKeyboardSquare);
  }, [defaultKeyboardSquare, isInteractive, keyboardSquare]);

  // The board is temporarily disabled while the engine moves. Restore focus
  // to the destination the keyboard user activated when their turn resumes.
  useEffect(() => {
    if (!isInteractive) return;

    const square = pendingKeyboardRestoreRef.current;
    if (!square) return;

    pendingKeyboardRestoreRef.current = null;
    setKeyboardSquare(square);
    const frame = window.requestAnimationFrame(() => {
      boardRef.current
        ?.querySelector<HTMLButtonElement>(`[data-square="${square}"]`)
        ?.focus({ preventScroll: true });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isInteractive]);

  const moveKeyboardFocus = useCallback(
    (square: string, key: string) => {
      const grid = squareToGrid(square);
      let visualRow = flipped ? 7 - grid.row : grid.row;
      let visualCol = flipped ? 7 - grid.col : grid.col;

      if (key === "ArrowUp") visualRow -= 1;
      if (key === "ArrowDown") visualRow += 1;
      if (key === "ArrowLeft") visualCol -= 1;
      if (key === "ArrowRight") visualCol += 1;

      if (
        visualRow < 0 ||
        visualRow > 7 ||
        visualCol < 0 ||
        visualCol > 7
      ) {
        return;
      }

      const nextRow = flipped ? 7 - visualRow : visualRow;
      const nextCol = flipped ? 7 - visualCol : visualCol;
      const nextSquare = gridToSquare(nextRow, nextCol);
      setKeyboardSquare(nextSquare);

      window.requestAnimationFrame(() => {
        boardRef.current
          ?.querySelector<HTMLButtonElement>(`[data-square="${nextSquare}"]`)
          ?.focus();
      });
    },
    [flipped],
  );

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
        onDragStartRef.current?.(pending.fromSquare);
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

  // Clear hover when dragging starts
  const activeHover = dragState ? null : hoveredSquare;

  const ranks = flipped ? RANKS.slice().reverse() : RANKS;
  const files = flipped ? FILES.slice().reverse() : FILES;

  return (
    <>
      {/* Outer wrapper: rank labels + board + file labels */}
      <div style={{ display: "flex", width: "100%" }}>
        {/* Rank labels */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-around",
          paddingRight: 6,
          width: 18,
        }}>
          {ranks.map((r) => (
            <span key={r} style={{
              fontSize: "0.6rem",
              color: "rgba(201, 189, 216, 0.45)",
              fontFamily: "var(--font-mono)",
              textAlign: "center",
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              userSelect: "none",
            }}>{r}</span>
          ))}
        </div>

        <div style={{ flex: 1 }}>
          {/* Board */}
          <div
            ref={boardRef}
            role="group"
            aria-label={`Chess board, ${orientation === "w" ? "White" : "Black"} orientation`}
            style={{
              position: "relative",
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

              const isPlayerPiece = isDraggable && isPlayersPiece(piece);
              const isHovered = isPlayerPiece && activeHover === square;
              const isSelected = selectedSquare === square;
              const isLegalMove = legalMoveSquares.includes(square);
              const squareLabel = [
                piece ? `${PIECE_LABELS[piece]} on ${square}` : `${square}, empty`,
                isSelected ? "selected" : null,
                isLegalMove ? "legal move" : null,
              ]
                .filter(Boolean)
                .join(", ");
              const isEmphasized = isHovered || isSelected;

              return (
                <button
                  key={square}
                  data-square={square}
                  data-selected={isSelected ? "true" : undefined}
                  data-legal-move={isLegalMove ? "true" : undefined}
                  type="button"
                  className="chess-square"
                  aria-label={squareLabel}
                  aria-pressed={isSelected}
                  disabled={!isInteractive}
                  tabIndex={
                    isInteractive &&
                    square === (keyboardSquare ?? defaultKeyboardSquare)
                      ? 0
                      : -1
                  }
                  onClick={(event) => {
                    if (event.detail > 0) {
                      pendingKeyboardRestoreRef.current = null;
                    }
                    onSquareClick?.(square);
                  }}
                  onFocus={() => setKeyboardSquare(square)}
                  onKeyDown={(event) => {
                    if (event.key.startsWith("Arrow")) {
                      event.preventDefault();
                      event.stopPropagation();
                      moveKeyboardFocus(square, event.key);
                      return;
                    }

                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.preventDefault();
                    event.stopPropagation();
                    pendingKeyboardRestoreRef.current =
                      selectedSquare && legalMoveSquares.includes(square)
                        ? square
                        : null;
                    onSquareClick?.(square);
                  }}
                  onPointerDown={(e) => {
                    pendingKeyboardRestoreRef.current = null;
                    handlePointerDown(e, square, piece);
                  }}
                  onPointerEnter={() => {
                    if (isPlayerPiece) setHoveredSquare(square);
                  }}
                  onPointerLeave={() => {
                    setHoveredSquare((prev) => prev === square ? null : prev);
                  }}
                  style={{
                    backgroundColor: light ? lightSquareColor : darkSquareColor,
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "none",
                    padding: 0,
                    margin: 0,
                    cursor: customStyle?.cursor ?? (piece && isDraggable ? "grab" : "default"),
                  }}
                >
                  <SquareHighlight style={customStyle} />
                  {piece && !isDragSource && (
                    <div style={{
                      position: "relative",
                      zIndex: 1,
                      width: "100%",
                      height: "100%",
                      transform: isEmphasized ? "scale(1.08)" : undefined,
                      filter: isEmphasized ? "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.35))" : undefined,
                      transition: "transform 0.15s ease, filter 0.15s ease",
                    }}>
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

          {/* File labels */}
          <div style={{
            display: "flex",
            justifyContent: "space-around",
            paddingTop: 4,
          }}>
            {files.map((f) => (
              <span key={f} style={{
                fontSize: "0.6rem",
                color: "rgba(201, 189, 216, 0.45)",
                fontFamily: "var(--font-mono)",
                flex: 1,
                textAlign: "center",
                userSelect: "none",
              }}>{f}</span>
            ))}
          </div>
        </div>
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
