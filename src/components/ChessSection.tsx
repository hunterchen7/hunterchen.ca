import { useState, useEffect, useRef, useCallback, useReducer } from "react";
import { AnimatePresence } from "framer-motion";
import { CanvasComponent, type SectionCoordinates } from "@hunterchen/canvas";
import { Chess, type Square } from "chess.js";
import { Lc0Engine } from "../chess/engine/workerInterface";
import { MODEL_URL } from "../chess/config";
import { uciToChessJsMove } from "../chess/utils";
import type { EngineState } from "../chess/types";
import type { CapturedPiece, PieceChar } from "./chess/types";
import ChessBoard from "./chess/ChessBoard";
import PromotionPicker from "./chess/PromotionPicker";
import Confetti from "./chess/Confetti";
import CapturedPieceSticker from "./chess/CapturedPieceSticker";
import { AnimatedLink } from "./AnimatedLink";
import { playSoundForMove } from "./chess/sounds";

interface ChessSectionProps {
  offset: SectionCoordinates;
}

const INITIAL_ENGINE_STATE: EngineState = {
  isReady: false,
  isThinking: false,
  isLoading: false,
  loadingProgress: 0,
  loadingMessage: "",
  lastMove: null,
  lastConfidence: null,
  wdl: null,
  topMoves: null,
  error: null,
};




export default function ChessSection({ offset }: ChessSectionProps) {
  const gameRef = useRef(new Chess());
  const game = gameRef.current;
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);
  const [fenHistory, setFenHistory] = useState<string[]>([game.fen()]);
  const [engineState, setEngineState] =
    useState<EngineState>(INITIAL_ENGINE_STATE);
  const [gameStarted, setGameStarted] = useState(false);
  const [playerColor, setPlayerColor] = useState<"w" | "b">("w");
  const engineColor = playerColor === "w" ? "b" : "w";
  const [lastMoveSquares, setLastMoveSquares] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [draggedSquare, setDraggedSquare] = useState<Square | null>(null);
  const [legalMoveSquares, setLegalMoveSquares] = useState<Square[]>([]);

  const [pendingPromotion, setPendingPromotion] = useState<{
    from: string;
    to: string;
  } | null>(null);

  const [capturedPieces, setCapturedPieces] = useState<CapturedPiece[]>([]);
  const captureIdRef = useRef(0);

  const recordCapture = useCallback(
    (move: { captured?: string; color: string; to: string }) => {
      if (!move.captured) return;
      const capturedColor = move.color === "w" ? "b" : "w";
      const pieceChar = (
        capturedColor === "w"
          ? move.captured.toUpperCase()
          : move.captured.toLowerCase()
      ) as PieceChar;

      const id = `cap-${captureIdRef.current++}`;
      const isWhitePiece = capturedColor === "w";

      setCapturedPieces((prev) => {
        const sameSideCount = prev.filter((p) =>
          isWhitePiece
            ? p.piece === p.piece.toUpperCase()
            : p.piece === p.piece.toLowerCase(),
        ).length;

        // Fill columns sequentially: 4, 5, 3, 4
        // Within each column, pick a random open row
        const colSizes = [4, 5, 3, 4];
        const colSpacing = 120;
        const rowSpacing = 120;

        // Figure out which column we're filling
        let colIdx = 0;
        let filled = sameSideCount;
        while (colIdx < colSizes.length && filled >= colSizes[colIdx]!) {
          filled -= colSizes[colIdx]!;
          colIdx++;
        }
        if (colIdx >= colSizes.length) colIdx = colSizes.length - 1;
        const colSize = colSizes[colIdx]!;

        // Find which rows in this column are already taken
        const sameSide = prev.filter((p) =>
          isWhitePiece
            ? p.piece === p.piece.toUpperCase()
            : p.piece === p.piece.toLowerCase(),
        );
        const takenRows = new Set(
          sameSide.filter((p) => p.gridCol === colIdx).map((p) => p.gridRow),
        );
        const openRows = Array.from({ length: colSize }, (_, i) => i).filter(
          (r) => !takenRows.has(r),
        );
        const row = openRows.length > 0
          ? openRows[Math.floor(Math.random() * openRows.length)]!
          : Math.floor(Math.random() * colSize);

        const colTop = 500 - (rowSpacing * (colSize - 1)) / 2;
        const baseX = isWhitePiece
          ? 1070 + colIdx * colSpacing
          : 80 - colIdx * colSpacing;
        const tx = baseX + (Math.random() - 0.5) * 40;
        const ty = colTop + row * rowSpacing + (Math.random() - 0.5) * 30;

        return [
          ...prev,
          { id, piece: pieceChar, targetPos: { x: tx, y: ty }, gridCol: colIdx, gridRow: row },
        ];
      });
    },
    [],
  );

  const engineRef = useRef<Lc0Engine | null>(null);

  // Initialize engine on first play
  const startGame = useCallback(() => {
    if (engineRef.current) return;

    const engine = new Lc0Engine();
    engineRef.current = engine;

    engine.subscribe((state) => {
      setEngineState((prev) => ({ ...prev, ...state }));
    });

    engine.init(MODEL_URL);
    setGameStarted(true);
  }, []);

  // Initialize engine on mount, cleanup on unmount
  useEffect(() => {
    startGame();
    return () => {
      engineRef.current?.terminate();
      engineRef.current = null;
    };
  }, [startGame]);

  // Request engine move when it's the engine's turn
  useEffect(() => {
    if (
      !engineState.isReady ||
      engineState.isThinking ||
      game.isGameOver() ||
      game.turn() !== engineColor
    ) {
      return;
    }

    const engine = engineRef.current;
    if (!engine) return;

    const searchFen = game.fen();
    engine
      .mctsSearch(searchFen, fenHistory, 50, 0.5)
      .then(({ move }) => {
        setEngineState((prev) => ({ ...prev, isThinking: true }));
        return new Promise<string>((resolve) =>
          setTimeout(() => resolve(move), 1000),
        );
      })
      .then((move) => {
        const chessMove = uciToChessJsMove(move);
        const result = game.move(chessMove);
        if (result) {
          playSoundForMove(!!result.captured, game.inCheck());
          recordCapture(result);
          setLastMoveSquares({ from: result.from, to: result.to });
          setFenHistory((prev) => [...prev, game.fen()]);
          forceUpdate();
        }
        setEngineState((prev) => ({ ...prev, isThinking: false }));
      })
      .catch(() => {
        setEngineState((prev) => ({ ...prev, isThinking: false }));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engineState.isReady, engineState.isThinking, fenHistory, engineColor]);

  const clearSelection = () => {
    setSelectedSquare(null);
    setDraggedSquare(null);
    setLegalMoveSquares([]);
  };

  const onDragStart = (square: string) => {
    const sq = square as Square;
    const piece = game.get(sq);
    if (!piece || piece.color !== playerColor) return;
    const moves = game.moves({ square: sq, verbose: true });
    setDraggedSquare(sq);
    setLegalMoveSquares(moves.map((m) => m.to));
  };

  const onDragEnd = () => {
    setDraggedSquare(null);
    setLegalMoveSquares([]);
  };

  const isPromotionMove = (from: string, to: string) => {
    const piece = game.get(from as Square);
    if (!piece || piece.type !== "p") return false;
    const targetRank = to[1];
    return (
      (piece.color === "w" && targetRank === "8") ||
      (piece.color === "b" && targetRank === "1")
    );
  };

  const makeMove = (from: string, to: string) => {
    if (isPromotionMove(from, to)) {
      setPendingPromotion({ from, to });
      clearSelection();
      return true;
    }

    const move = game.move({ from, to });
    if (!move) return false;

    playSoundForMove(!!move.captured, game.inCheck());
    recordCapture(move);
    clearSelection();
    setLastMoveSquares({ from: move.from, to: move.to });
    setFenHistory((prev) => [...prev, game.fen()]);
    forceUpdate();
    return true;
  };

  const completePromotion = (promotion: "q" | "r" | "b" | "n") => {
    if (!pendingPromotion) return;
    const { from, to } = pendingPromotion;
    const move = game.move({ from, to, promotion });
    setPendingPromotion(null);
    if (!move) return;
    playSoundForMove(!!move.captured, game.inCheck());
    recordCapture(move);
    setLastMoveSquares({ from: move.from, to: move.to });
    setFenHistory((prev) => [...prev, game.fen()]);
    forceUpdate();
  };

  const cancelPromotion = () => {
    setPendingPromotion(null);
  };

  const onSquareClick = (square: string) => {
    if (
      game.turn() !== playerColor ||
      engineState.isThinking ||
      game.isGameOver()
    ) {
      return;
    }

    // If a piece is already selected, try to move there
    if (selectedSquare) {
      if (legalMoveSquares.includes(square as Square)) {
        makeMove(selectedSquare, square);
        return;
      }
      // Clicked same square — deselect
      if (square === selectedSquare) {
        clearSelection();
        return;
      }
    }

    // Select a new piece if it's ours
    const piece = game.get(square as Square);
    if (piece && piece.color === playerColor) {
      const moves = game.moves({ square: square as Square, verbose: true });
      setSelectedSquare(square as Square);
      setLegalMoveSquares(moves.map((m) => m.to));
    } else {
      clearSelection();
    }
  };

  const resetGame = () => {
    game.reset();
    setFenHistory([game.fen()]);
    setLastMoveSquares(null);
    clearSelection();
    setCapturedPieces([]);
    setPlayerColor((prev) => (prev === "w" ? "b" : "w"));
    forceUpdate();
  };

  const getGameStatus = () => {
    if (game.isCheckmate()) {
      return game.turn() === playerColor
        ? "Checkmate - You lose!"
        : "Checkmate - You win!";
    }
    if (game.isStalemate()) return "Stalemate!";
    if (game.isThreefoldRepetition()) return "Draw by repetition!";
    if (game.isInsufficientMaterial()) return "Draw - insufficient material!";
    // chess.js tracks the halfmove clock in the FEN; isDraw() catches the 50-move rule
    if (game.isDraw()) return "Draw by 50-move rule!";
    return null;
  };

  const gameStatus = getGameStatus();
  const playerWon = game.isCheckmate() && game.turn() !== playerColor;
  const [confettiKey, setConfettiKey] = useState(0);
  const showConfetti = confettiKey > 0;

  // Trigger confetti when player wins
  useEffect(() => {
    if (playerWon) setConfettiKey((k) => k + 1);
  }, [playerWon]);

  // Highlight last move, selected square, and legal moves
  const customSquareStyles: Record<string, React.CSSProperties> = {};
  if (lastMoveSquares) {
    customSquareStyles[lastMoveSquares.from] = {
      backgroundColor: "rgba(192, 132, 252, 0.25)",
    };
    customSquareStyles[lastMoveSquares.to] = {
      backgroundColor: "rgba(192, 132, 252, 0.35)",
    };
  }
  if (selectedSquare) {
    customSquareStyles[selectedSquare] = {
      backgroundColor: "rgba(192, 132, 252, 0.5)",
    };
  }
  if (draggedSquare) {
    customSquareStyles[draggedSquare] = {
      backgroundColor: "rgba(168, 85, 247, 0.45)",
    };
  }
  for (const sq of legalMoveSquares) {
    const hasPiece = game.get(sq);
    customSquareStyles[sq] = {
      background: hasPiece
        ? "radial-gradient(circle, transparent 55%, rgba(192, 132, 252, 0.4) 55%)"
        : "radial-gradient(circle, rgba(192, 132, 252, 0.35) 25%, transparent 25%)",
      cursor: "pointer",
    };
  }
  if (game.inCheck()) {
    const turn = game.turn();
    const board = game.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r]![c];
        if (piece && piece.type === "k" && piece.color === turn) {
          const file = String.fromCharCode(97 + c);
          const rank = String(8 - r);
          customSquareStyles[file + rank] = {
            background:
              "radial-gradient(circle, rgba(239, 68, 68, 0.7) 0%, rgba(239, 68, 68, 0.3) 50%, transparent 70%)",
          };
        }
      }
    }
  }

  return (
    <CanvasComponent offset={offset}>
      <div className="relative h-full w-full flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 w-full">
          <h2 className="text-xl font-thin text-fuchsia-200">
            play against my chess AI
          </h2>
          <p className="text-sm max-w-[600px] text-purple-200/70 text-center -mt-2">
            <AnimatedLink
              href="https://www.maiachess.com/"
              className="text-fuchsia-300/80"
            >
              Maia
            </AnimatedLink>{" "}
            is a series of neural network chess models trained on human games to
            play like humans at various levels; I{" "}
            <AnimatedLink
              href="https://github.com/hunterchen7/hunter-chessbot/"
              className="text-fuchsia-300/80"
            >
              fine-tuned a Maia model
            </AnimatedLink>{" "}
            on ~2000 of my own games for it to play like me. Play against it
            here!
          </p>

          {/* Chessboard */}
          <div className="w-[800px] aspect-square relative">
            <ChessBoard
              position={game.fen()}
              onSquareClick={onSquareClick}
              onPieceDrop={(from, to) => makeMove(from, to)}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              isDraggable={
                gameStarted &&
                engineState.isReady &&
                !engineState.isThinking &&
                !game.isGameOver() &&
                game.turn() === playerColor
              }
              animationDuration={200}
              squareStyles={customSquareStyles}
              orientation={playerColor}
              playerColor={playerColor}
              darkSquareColor="#453260"
              lightSquareColor="#c9bdd8"
              boardStyle={{
                borderRadius: "8px",
                border: "2px solid rgba(69, 50, 96, 0.6)",
                boxShadow: "0 0 20px rgba(192, 132, 252, 0.12)",
              }}
            />
            {engineState.isLoading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-lg backdrop-blur-sm bg-black/30">
                <div className="w-48 h-1.5 rounded-full bg-fuchsia-950/50 overflow-hidden">
                  <div
                    className="h-full bg-fuchsia-400/60 transition-all duration-300 rounded-full"
                    style={{
                      width: `${engineState.loadingProgress * 100}%`,
                    }}
                  />
                </div>
                <span className="text-fuchsia-300/50 font-mono">
                  {engineState.loadingMessage}
                </span>
              </div>
            )}
            {showConfetti && <Confetti key={confettiKey} />}
            {pendingPromotion && (
              <PromotionPicker
                color={playerColor}
                file={pendingPromotion.to.charCodeAt(0) - 97}
                orientation={playerColor}
                onSelect={completePromotion}
                onCancel={cancelPromotion}
              />
            )}
          </div>


          {/* Status area */}
          <div className="flex flex-col items-center gap-2 min-h-[60px]">
            {engineState.isThinking && (
              <span className=" text-fuchsia-300/50 font-mono animate-pulse">
                thinking...
              </span>
            )}

            {gameStatus && (
              <div className="flex flex-col items-center gap-2">
                <span className=" text-fuchsia-200">{gameStatus}</span>
                <button
                  onClick={resetGame}
                  className="px-4 py-1.5 rounded-lg border border-fuchsia-300/30 bg-fuchsia-900/30 text-fuchsia-200 text-xs hover:bg-fuchsia-900/50 transition-colors cursor-pointer"
                >
                  new game
                </button>
              </div>
            )}

            {gameStarted &&
              engineState.isReady &&
              !engineState.isThinking &&
              !gameStatus &&
              game.turn() === playerColor && (
                <button
                  onClick={resetGame}
                  className="text-fuchsia-300/40 hover:text-fuchsia-300/70 transition-colors cursor-pointer"
                >
                  reset
                </button>
              )}

            {engineState.error && (
              <span className="text-red-400">{engineState.error}</span>
            )}
          </div>
        </div>

        {/* Captured pieces */}
        <AnimatePresence>
          {capturedPieces.map((cp) => (
            <CapturedPieceSticker
              key={cp.id}
              piece={cp.piece}
              targetPos={cp.targetPos}
              size={85}
            />
          ))}
        </AnimatePresence>
      </div>
    </CanvasComponent>
  );
}
