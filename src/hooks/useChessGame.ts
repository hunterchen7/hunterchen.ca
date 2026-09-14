import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Chess, type Square } from "chess.js";
import { Lc0Engine } from "../chess/engine/workerInterface";
import { hasModelCached } from "../chess/engine/modelCache";
import { MODEL_URL } from "../chess/config";
import { uciToChessJsMove } from "../chess/utils";
import type { EngineState } from "../chess/types";
import { playSoundForMove } from "../components/chess/sounds";

/** MCTS simulations per engine move. */
const SEARCH_NODES = 150;
/** Sharpens toward the top move while still picking second-best sometimes. */
const SEARCH_TEMPERATURE = 0.67;
/** Deliberate pause so an instant reply still reads as thinking. */
const THINKING_PAUSE_MS = 1_000;
/** How long the finished position stays up before the board resets. */
const GAME_OVER_HOLD_MS = 2_600;

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

export type ChessPhase = "idle" | "playing" | "over";

export type MoveSquares = { from: string; to: string };

/**
 * Everything the renderer needs to play a move back as motion. Derived from the
 * chess.js Move rather than by diffing positions, so castling, en passant and
 * promotion are exact instead of guessed at.
 */
export type AnimatedMove = {
  capturedColor: "b" | "w" | null;
  capturedKind: string | null;
  capturedSquare: string | null;
  from: string;
  isMate: boolean;
  /** The rook's leg of a castle, if this was one. */
  secondary: MoveSquares | null;
  /** Increments per move so an identical move still retriggers the animation. */
  seq: number;
  to: string;
};

const CASTLE_ROOK_MOVES: Record<string, MoveSquares> = {
  c1: { from: "a1", to: "d1" },
  c8: { from: "a8", to: "d8" },
  g1: { from: "h1", to: "f1" },
  g8: { from: "h8", to: "f8" },
};

/** The pawn taken en passant sits beside the destination, not on it. */
function enPassantSquare(to: string, moverColor: "b" | "w"): string {
  const rank = Number(to[1]) + (moverColor === "w" ? -1 : 1);
  return `${to[0]}${rank}`;
}

/**
 * Semantic highlight state. The renderer decides how to paint these — the flat
 * board used CSS backgrounds, the isometric board draws polygons.
 */
export type BoardHighlights = {
  checkSquare: string | null;
  lastMove: MoveSquares | null;
  legalCaptures: string[];
  legalQuiet: string[];
  selected: string | null;
};

function findCheckedKing(game: Chess): string | null {
  if (!game.inCheck()) return null;
  const turn = game.turn();
  for (const row of game.board()) {
    for (const piece of row) {
      if (piece && piece.type === "k" && piece.color === turn) return piece.square;
    }
  }
  return null;
}

/**
 * Owns a game against the local engine: chess.js state, the engine worker, the
 * selection/promotion flow and the phase machine. Renderer-agnostic — it deals
 * in square names, never pixels.
 */
export function useChessGame() {
  const gameRef = useRef(new Chess());
  const game = gameRef.current;
  const [, forceUpdate] = useReducer((tick: number) => tick + 1, 0);

  const [fenHistory, setFenHistory] = useState<string[]>([game.fen()]);
  const [engineState, setEngineState] = useState<EngineState>(INITIAL_ENGINE_STATE);
  const [phase, setPhase] = useState<ChessPhase>("idle");
  const [hasCachedModel, setHasCachedModel] = useState<boolean | null>(null);
  const [playerColor, setPlayerColor] = useState<"w" | "b">("w");
  const engineColor = playerColor === "w" ? "b" : "w";

  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoveSquares, setLegalMoveSquares] = useState<Square[]>([]);
  const [lastMoveSquares, setLastMoveSquares] = useState<MoveSquares | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<MoveSquares | null>(null);
  const [animatedMove, setAnimatedMove] = useState<AnimatedMove | null>(null);
  const moveSeqRef = useRef(0);
  /** Result text is held after the board resets, so it outlives the position. */
  const [finishedStatus, setFinishedStatus] = useState<string | null>(null);
  const [playerWon, setPlayerWon] = useState(false);

  const recordMove = useCallback(
    (move: ReturnType<Chess["move"]>, mated: boolean) => {
      const isEnPassant = move.flags.includes("e");
      const isCastle = move.flags.includes("k") || move.flags.includes("q");
      const capturedSquare = move.captured
        ? isEnPassant
          ? enPassantSquare(move.to, move.color)
          : move.to
        : null;

      moveSeqRef.current += 1;
      setAnimatedMove({
        capturedColor: move.captured ? (move.color === "w" ? "b" : "w") : null,
        capturedKind: move.captured ?? null,
        capturedSquare,
        from: move.from,
        isMate: mated,
        secondary: isCastle ? (CASTLE_ROOK_MOVES[move.to] ?? null) : null,
        seq: moveSeqRef.current,
        to: move.to,
      });
    },
    [],
  );

  const engineRef = useRef<Lc0Engine | null>(null);
  /** Bumped on every reset so a search in flight can't apply to a new game. */
  const generationRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    void hasModelCached(MODEL_URL).then((isCached) => {
      if (!cancelled) setHasCachedModel(isCached);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      engineRef.current?.terminate();
      engineRef.current = null;
    };
  }, []);

  const startGame = useCallback(() => {
    setPhase("playing");
    if (engineRef.current) return;

    const engine = new Lc0Engine();
    engineRef.current = engine;
    setEngineState(INITIAL_ENGINE_STATE);

    engine.subscribe((state) => {
      setEngineState((previous) => ({ ...previous, ...state }));
      if (state.error) {
        engine.terminate();
        if (engineRef.current === engine) engineRef.current = null;
        setPhase("idle");
      }
    });

    engine.init(MODEL_URL);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedSquare(null);
    setLegalMoveSquares([]);
  }, []);

  const startNewGame = useCallback(() => {
    generationRef.current += 1;
    game.reset();
    setFenHistory([game.fen()]);
    setLastMoveSquares(null);
    setPendingPromotion(null);
    setFinishedStatus(null);
    setPlayerWon(false);
    setAnimatedMove(null);
    clearSelection();
    setPlayerColor((previous) => (previous === "w" ? "b" : "w"));
    setPhase(engineRef.current ? "playing" : "idle");
    forceUpdate();
  }, [clearSelection, game]);

  // Engine's turn. Fires off the growing fenHistory.
  useEffect(() => {
    if (
      phase !== "playing" ||
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
    const generation = generationRef.current;

    engine
      .mctsSearch(searchFen, fenHistory, SEARCH_NODES, SEARCH_TEMPERATURE)
      .then((result) => {
        setEngineState((previous) => ({ ...previous, isThinking: true }));
        return new Promise<string>((resolve) =>
          setTimeout(() => resolve(result.move), THINKING_PAUSE_MS),
        );
      })
      .then((move) => {
        // A reset (or a move applied elsewhere) while the search ran makes this
        // reply meaningless; dropping it avoids corrupting the new game.
        if (generation !== generationRef.current || game.fen() !== searchFen) {
          setEngineState((previous) => ({ ...previous, isThinking: false }));
          return;
        }
        const applied = game.move(uciToChessJsMove(move));
        if (applied) {
          playSoundForMove(!!applied.captured, game.inCheck());
          recordMove(applied, game.isCheckmate());
          setLastMoveSquares({ from: applied.from, to: applied.to });
          setFenHistory((previous) => [...previous, game.fen()]);
          forceUpdate();
        }
        setEngineState((previous) => ({ ...previous, isThinking: false }));
      })
      .catch(() => {
        setEngineState((previous) => ({ ...previous, isThinking: false }));
      });
    // `game` is a stable ref; fenHistory growing is the intended trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engineState.isReady, engineState.isThinking, fenHistory, engineColor, phase]);

  const describeResult = useCallback((): string => {
    if (game.isCheckmate()) {
      return game.turn() === playerColor
        ? "checkmate — you lose"
        : "checkmate — you win";
    }
    if (game.isStalemate()) return "stalemate";
    if (game.isThreefoldRepetition()) return "draw by repetition";
    if (game.isInsufficientMaterial()) return "draw — insufficient material";
    if (game.isDraw()) return "draw by the 50-move rule";
    return "game over";
  }, [game, playerColor]);

  // Game over: hold the final position briefly, then reset to a static board.
  useEffect(() => {
    if (phase !== "playing" || !game.isGameOver()) return;

    setFinishedStatus(describeResult());
    setPlayerWon(game.isCheckmate() && game.turn() !== playerColor);
    setPhase("over");
    clearSelection();

    const generation = generationRef.current;
    const timer = setTimeout(() => {
      if (generation !== generationRef.current) return;
      game.reset();
      setFenHistory([game.fen()]);
      setLastMoveSquares(null);
      setAnimatedMove(null);
      forceUpdate();
    }, GAME_OVER_HOLD_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, fenHistory, describeResult, clearSelection, playerColor]);

  const isPromotionMove = useCallback(
    (from: string, to: string) => {
      const piece = game.get(from as Square);
      if (!piece || piece.type !== "p") return false;
      return (
        (piece.color === "w" && to[1] === "8") ||
        (piece.color === "b" && to[1] === "1")
      );
    },
    [game],
  );

  const applyMove = useCallback(
    (from: string, to: string, promotion?: "q" | "r" | "b" | "n") => {
      const move = game.move(promotion ? { from, to, promotion } : { from, to });
      if (!move) return false;
      playSoundForMove(!!move.captured, game.inCheck());
      recordMove(move, game.isCheckmate());
      clearSelection();
      setLastMoveSquares({ from: move.from, to: move.to });
      setFenHistory((previous) => [...previous, game.fen()]);
      forceUpdate();
      return true;
    },
    [clearSelection, game, recordMove],
  );

  const canPlayerMove =
    phase === "playing" &&
    engineState.isReady &&
    !engineState.isThinking &&
    !game.isGameOver() &&
    game.turn() === playerColor;
  const boardIsInteractive = canPlayerMove && pendingPromotion === null;

  const selectSquare = useCallback(
    (square: string) => {
      if (!boardIsInteractive) return;

      if (selectedSquare) {
        if (legalMoveSquares.includes(square as Square)) {
          if (isPromotionMove(selectedSquare, square)) {
            setPendingPromotion({ from: selectedSquare, to: square });
            clearSelection();
            return;
          }
          applyMove(selectedSquare, square);
          return;
        }
        if (square === selectedSquare) {
          clearSelection();
          return;
        }
      }

      const piece = game.get(square as Square);
      if (piece && piece.color === playerColor) {
        setSelectedSquare(square as Square);
        setLegalMoveSquares(
          game.moves({ square: square as Square, verbose: true }).map((move) => move.to),
        );
      } else {
        clearSelection();
      }
    },
    [
      applyMove,
      boardIsInteractive,
      clearSelection,
      game,
      isPromotionMove,
      legalMoveSquares,
      playerColor,
      selectedSquare,
    ],
  );

  const completePromotion = useCallback(
    (promotion: "q" | "r" | "b" | "n") => {
      if (!pendingPromotion) return;
      const { from, to } = pendingPromotion;
      setPendingPromotion(null);
      applyMove(from, to, promotion);
    },
    [applyMove, pendingPromotion],
  );

  const cancelPromotion = useCallback(() => {
    if (!pendingPromotion) return;
    const from = pendingPromotion.from as Square;
    setPendingPromotion(null);
    setSelectedSquare(from);
    setLegalMoveSquares(game.moves({ square: from, verbose: true }).map((move) => move.to));
  }, [game, pendingPromotion]);

  const fen = game.fen();

  const highlights = useMemo<BoardHighlights>(() => {
    const legalCaptures: string[] = [];
    const legalQuiet: string[] = [];
    for (const square of legalMoveSquares) {
      if (game.get(square)) legalCaptures.push(square);
      else legalQuiet.push(square);
    }
    return {
      checkSquare: findCheckedKing(game),
      lastMove: lastMoveSquares,
      legalCaptures,
      legalQuiet,
      selected: selectedSquare,
    };
    // `fen` stands in for the mutable game instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen, game, lastMoveSquares, legalMoveSquares, selectedSquare]);

  return {
    animatedMove,
    boardIsInteractive,
    canPlayerMove,
    cancelPromotion,
    completePromotion,
    engineState,
    fen,
    finishedStatus,
    game,
    hasCachedModel,
    highlights,
    pendingPromotion,
    phase,
    playerColor,
    playerWon,
    selectSquare,
    startGame,
    startNewGame,
  };
}
