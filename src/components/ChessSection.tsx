import { useState, useEffect, useRef, useCallback } from "react";
import { CanvasComponent, type SectionCoordinates } from "@hunterchen/canvas";
import { Chess, type Square } from "chess.js";
import { Lc0Engine } from "../chess/engine/workerInterface";
import { MODEL_URL } from "../chess/config";
import { getLegalMovesUCI, uciToChessJsMove } from "../chess/utils";
import type { EngineState } from "../chess/types";
import ChessBoard from "./chess/ChessBoard";
import { AnimatedLink } from "./AnimatedLink";

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
  error: null,
};

function WdlBar({ wdl }: { wdl: [number, number, number] }) {
  const [w, d, l] = wdl;
  const wp = Math.round(w * 100);
  const dp = Math.round(d * 100);
  const lp = 100 - wp - dp;

  return (
    <div className="w-full h-3 rounded-full overflow-hidden flex bg-neutral-800 border border-fuchsia-300/20">
      <div
        className="bg-white transition-all duration-500"
        style={{ width: `${wp}%` }}
      />
      <div
        className="bg-neutral-500 transition-all duration-500"
        style={{ width: `${dp}%` }}
      />
      <div
        className="bg-neutral-900 transition-all duration-500"
        style={{ width: `${lp}%` }}
      />
    </div>
  );
}

export default function ChessSection({ offset }: ChessSectionProps) {
  const [game, setGame] = useState(new Chess());
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

    const legalMoves = getLegalMovesUCI(game.fen());
    if (legalMoves.length === 0) return;

    engine
      .getBestMove(game.fen(), fenHistory, legalMoves, 0)
      .then(({ move }) => {
        // Keep thinking state active during the delay
        setEngineState((prev) => ({ ...prev, isThinking: true }));
        return new Promise<string>((resolve) =>
          setTimeout(() => resolve(move), 1000),
        );
      })
      .then((move) => {
        const chessMove = uciToChessJsMove(move);
        const newGame = new Chess(game.fen());
        const result = newGame.move(chessMove);
        if (result) {
          setLastMoveSquares({ from: result.from, to: result.to });
          setGame(newGame);
          setFenHistory((prev) => [...prev, newGame.fen()]);
        }
        setEngineState((prev) => ({ ...prev, isThinking: false }));
      })
      .catch(() => {
        setEngineState((prev) => ({ ...prev, isThinking: false }));
      });
  }, [
    engineState.isReady,
    engineState.isThinking,
    game,
    fenHistory,
    engineColor,
  ]);

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

  const makeMove = (from: string, to: string) => {
    const newGame = new Chess(game.fen());
    // Try with queen promotion first, then without
    const move =
      newGame.move({ from, to, promotion: "q" }) ?? newGame.move({ from, to });
    if (!move) return false;

    clearSelection();
    setLastMoveSquares({ from: move.from, to: move.to });
    setGame(newGame);
    setFenHistory((prev) => [...prev, newGame.fen()]);
    return true;
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
    const newGame = new Chess();
    setGame(newGame);
    setFenHistory([newGame.fen()]);
    setLastMoveSquares(null);
    clearSelection();
    setPlayerColor((prev) => (prev === "w" ? "b" : "w"));
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
            on ~2000 of my own games for it to play like me.
          </p>

          {/* Chessboard */}
          <div className="w-[800px] aspect-square">
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
              darkSquareColor="#4a3562"
              lightSquareColor="#d4c5e2"
              boardStyle={{
                borderRadius: "8px",
                boxShadow: "0 0 20px rgba(192, 132, 252, 0.15)",
              }}
            />
          </div>

          {/* WDL bar */}
          <div className="w-[800px] -mt-2">
            <WdlBar wdl={engineState.wdl ?? [0.5, 0, 0.5]} />
            <div className="flex justify-between text-sm text-fuchsia-300/80 mt-1 font-mono">
              <span>
                white {Math.round((engineState.wdl?.[0] ?? 0.5) * 100)}%
              </span>
              <span>draw {Math.round((engineState.wdl?.[1] ?? 0) * 100)}%</span>
              <span>
                black {Math.round((engineState.wdl?.[2] ?? 0.5) * 100)}%
              </span>
            </div>
          </div>

          {/* Status area */}
          <div className="flex flex-col items-center gap-2 min-h-[60px]">
            {engineState.isLoading && (
              <div className="flex flex-col items-center gap-2">
                <div className="w-48 h-1.5 rounded-full bg-fuchsia-950/50 overflow-hidden">
                  <div
                    className="h-full bg-fuchsia-400/60 transition-all duration-300 rounded-full"
                    style={{
                      width: `${engineState.loadingProgress * 100}%`,
                    }}
                  />
                </div>
                <span className=" text-fuchsia-300/50 font-mono">
                  {engineState.loadingMessage}
                </span>
              </div>
            )}

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
      </div>
    </CanvasComponent>
  );
}
