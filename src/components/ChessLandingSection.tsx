import { useEffect, useMemo, useRef, useState } from "react";
import { CanvasComponent, type SectionCoordinates } from "@hunterchen/canvas";
// Imported directly rather than through deferredHeroModels: this board is the
// landing's main content, so it belongs in the initial bundle instead of
// popping in after first paint. The projects-card copy stays lazy.
import ChessboardWatermark from "./hero/models/ChessboardWatermark";
import IsoChessBoard from "./chess/IsoChessBoard";
import { PieceShape, type PieceKind } from "./chess/isoPieces";
import {
  DIAMOND,
  DIAMOND_PROJECTION,
  STRAIGHT,
  STRAIGHT_PROJECTION,
  blendProjections,
  createBoardGeometry,
  smoothstep,
  type BoardGeometry,
} from "./chess/isoGeometry";
import Confetti from "./chess/Confetti";
import { AnimatedLink } from "./AnimatedLink";
import { AccessibleCanvasSection } from "../contexts/SectionFocusContext";
import { useChessGame } from "../hooks/useChessGame";
import { totalDownloadBytes } from "../chess/config";

/** Depends on whether this browser takes the WebGPU runtime build. */
const downloadSizeLabel = `${Math.round(totalDownloadBytes() / 1_000_000)} MB`;

const PROMOTION_CHOICES: { kind: PieceKind; label: string }[] = [
  { kind: "q", label: "queen" },
  { kind: "r", label: "rook" },
  { kind: "b", label: "bishop" },
  { kind: "n", label: "knight" },
];

interface ChessLandingSectionProps {
  offset: SectionCoordinates;
}

/**
 * Pressing play runs one sequence: the resting pieces tumble off, the empty
 * board swings from the corner-on view round to head-on, and the opening
 * position drops in. Each stage is `at` milliseconds after the press.
 *
 * The drop-in deliberately starts before the swing finishes. Piece positions
 * are read from the live geometry every frame, so the falling pieces track
 * their squares while the board is still turning, and the two beats read as one
 * movement instead of a stop and a restart.
 */
const SEQUENCE = {
  entry: { at: 1_350, ms: 1_400 },
  scatter: { at: 0, ms: 800 },
  swing: { at: 800, ms: 1_000 },
} as const;
const SEQUENCE_MS = Math.max(
  ...Object.values(SEQUENCE).map((stage) => stage.at + stage.ms),
);

/** Progress through one stage of the sequence, 0 to 1. */
function stageProgress(elapsed: number, stage: { at: number; ms: number }) {
  return Math.min(1, Math.max(0, (elapsed - stage.at) / stage.ms));
}

type PlaySequence = {
  /** 0 to 1 as the opening position drops in. */
  entry: number;
  geometry: BoardGeometry;
  /** True while the resting board is still on screen, tumbling its pieces. */
  restingBoard: boolean;
  /** 0 to 1 as the resting pieces leave. */
  scatter: number;
};

const RESTING_SEQUENCE: PlaySequence = {
  entry: 0,
  geometry: DIAMOND,
  restingBoard: true,
  scatter: 0,
};

function usePlaySequence(playing: boolean): PlaySequence {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!playing) {
      setElapsed(0);
      return;
    }
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setElapsed(SEQUENCE_MS);
      return;
    }

    let frame = 0;
    let start: number | null = null;
    const step = (now: number) => {
      if (start === null) start = now;
      const next = now - start;
      setElapsed(Math.min(next, SEQUENCE_MS));
      if (next < SEQUENCE_MS) frame = window.requestAnimationFrame(step);
    };
    frame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame);
  }, [playing]);

  return useMemo(() => {
    if (!playing) return RESTING_SEQUENCE;
    if (elapsed >= SEQUENCE_MS) {
      return { entry: 1, geometry: STRAIGHT, restingBoard: false, scatter: 1 };
    }

    const swing = smoothstep(stageProgress(elapsed, SEQUENCE.swing));
    return {
      entry: stageProgress(elapsed, SEQUENCE.entry),
      geometry:
        swing >= 1
          ? STRAIGHT
          : createBoardGeometry(
              blendProjections(DIAMOND_PROJECTION, STRAIGHT_PROJECTION, swing),
            ),
      restingBoard: elapsed < SEQUENCE.scatter.ms,
      scatter: stageProgress(elapsed, SEQUENCE.scatter),
    };
  }, [elapsed, playing]);
}

function DownloadProgress({
  message,
  progress,
}: {
  message: string;
  progress: number;
}) {
  const percentage = Math.round(progress * 100);
  return (
    <div className="w-full max-w-xs space-y-1.5">
      <div className="flex items-center justify-between font-mono text-xs text-purple-200/65">
        <span>{message}</span>
        <span>{percentage}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-fuchsia-950/50">
        <div
          className="h-full rounded-full bg-fuchsia-400/60 transition-[width] duration-200"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function ChessLandingSection({ offset }: ChessLandingSectionProps) {
  const {
    animatedMove,
    boardIsInteractive,
    cancelPromotion,
    completePromotion,
    engineState,
    fen,
    finishedStatus,
    hasCachedModel,
    highlights,
    pendingPromotion,
    phase,
    playerColor,
    playerWon,
    selectSquare,
    startGame,
    startNewGame,
  } = useChessGame();

  const [infoOpen, setInfoOpen] = useState(false);
  const infoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!infoOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return;
      if (infoRef.current?.contains(event.target)) return;
      if ((event.target as HTMLElement).closest("[aria-label='About this chess engine']")) {
        return;
      }
      setInfoOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setInfoOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [infoOpen]);

  const [confettiKey, setConfettiKey] = useState(0);
  useEffect(() => {
    if (playerWon) setConfettiKey((key) => key + 1);
  }, [playerWon]);

  // Before the first game the recorded Immortal Game loops behind the overlay in
  // the resting corner-on view. Pressing play hands over to the live board at
  // once — the position resets immediately rather than waiting for the engine —
  // and the view swings round to head-on while the engine loads.
  const overlayUp = phase === "idle";
  const { entry, geometry, restingBoard, scatter } = usePlaySequence(!overlayUp);
  const showAmbient = overlayUp || restingBoard;

  return (
    <CanvasComponent offset={offset}>
      <AccessibleCanvasSection
        sectionId="home"
        label="Play chess"
        className="relative flex h-full w-full flex-col items-center justify-center gap-3 p-4"
      >
        <div className="relative aspect-[120/82] w-full max-w-[1080px]">
          {showAmbient ? (
            <div
              aria-hidden="true"
              className="h-full w-full"
              style={{
                filter: overlayUp ? "blur(1.2px)" : "none",
                opacity: 0.9,
              }}
            >
              <ChessboardWatermark
                dismiss={scatter}
                prefix="landing-chessboard-piece"
              />
            </div>
          ) : (
            <IsoChessBoard
              animatedMove={animatedMove}
              entry={entry}
              fen={fen}
              geometry={geometry}
              flipped={playerColor === "b"}
              highlights={highlights}
              interactive={boardIsInteractive}
              onSelectSquare={selectSquare}
            />
          )}

          {overlayUp && hasCachedModel !== null ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center p-6">
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={startGame}
                    className="cursor-pointer rounded-lg bg-[#1b1524] px-5 py-2.5 font-mono text-sm text-fuchsia-200 shadow-lg ring-1 ring-inset ring-fuchsia-300/30 transition-colors hover:bg-[#2a2036]"
                  >
                    play
                  </button>
                  <div className="relative">
                    <button
                      type="button"
                      aria-expanded={infoOpen}
                      aria-label="About this chess engine"
                      onClick={() => setInfoOpen((open) => !open)}
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#1b1524] font-mono text-sm text-fuchsia-200/80 shadow-lg ring-1 ring-inset ring-fuchsia-300/25 transition-colors hover:bg-[#2a2036] hover:text-fuchsia-200"
                    >
                      i
                    </button>
                    {infoOpen ? (
                      <div
                        ref={infoRef}
                        role="dialog"
                        aria-label="About this chess engine"
                        className="absolute left-1/2 top-10 z-20 w-[290px] -translate-x-1/2 rounded-xl bg-[#1b1524]/95 px-4 py-3 text-left text-xs leading-5 text-purple-200/75 shadow-xl ring-1 ring-inset ring-fuchsia-300/20 backdrop-blur-sm"
                      >
                        <AnimatedLink
                          href="https://www.maiachess.com/"
                          className="text-fuchsia-300/80"
                        >
                          Maia
                        </AnimatedLink>{" "}
                        is a series of neural networks trained to play like
                        humans. I{" "}
                        <AnimatedLink
                          href="https://github.com/hunterchen7/hunter-chessbot/"
                          className="text-fuchsia-300/80"
                        >
                          fine-tuned one
                        </AnimatedLink>{" "}
                        on ~2000 of my own games so it plays like me.
                      </div>
                    ) : null}
                  </div>
                </div>
                {hasCachedModel === false ? (
                  <p className="rounded-sm bg-[#1b1524]/40 px-2 py-0.5 font-mono text-[10px] leading-4 text-purple-100/65 backdrop-blur-[1px]">
                    this will incur a one-time {downloadSizeLabel} download
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          {engineState.isLoading ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center p-6">
              <div className="rounded-md bg-[#1b1524]/70 px-4 py-3 backdrop-blur-sm">
                <DownloadProgress
                  message={engineState.loadingMessage}
                  progress={engineState.loadingProgress}
                />
              </div>
            </div>
          ) : null}

          {pendingPromotion ? (
            <div className="absolute inset-0 z-30 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 rounded-xl bg-[#1b1524]/90 px-4 py-3 ring-1 ring-inset ring-fuchsia-300/25 backdrop-blur-sm">
                <span className="font-mono text-[11px] text-purple-200/70">
                  promote to
                </span>
                <div className="flex gap-1">
                  {PROMOTION_CHOICES.map(({ kind, label }) => (
                    <button
                      key={kind}
                      type="button"
                      aria-label={label}
                      onClick={() => completePromotion(kind as "q" | "r" | "b" | "n")}
                      className="h-12 w-12 cursor-pointer rounded-lg ring-1 ring-inset ring-fuchsia-300/20 transition-colors hover:bg-fuchsia-300/10"
                    >
                      <svg className="h-full w-full" viewBox="-3.2 -6.2 6.4 7.8">
                        <PieceShape
                          color={playerColor}
                          detail
                          kind={kind}
                          roundness={STRAIGHT.pieceRoundness}
                        />
                      </svg>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={cancelPromotion}
                  className="cursor-pointer font-mono text-[10px] text-purple-200/50 transition-colors hover:text-purple-200/80"
                >
                  cancel
                </button>
              </div>
            </div>
          ) : null}

          {confettiKey > 0 ? <Confetti key={confettiKey} /> : null}
        </div>

        <div className="flex min-h-[52px] flex-col items-center gap-2">
          {engineState.isThinking ? (
            <span className="animate-pulse font-mono text-sm text-fuchsia-300/50">
              thinking...
            </span>
          ) : null}

          {finishedStatus ? (
            <div className="flex flex-col items-center gap-2">
              <span className="font-mono text-sm text-fuchsia-200">
                {finishedStatus}
              </span>
              <button
                type="button"
                onClick={startNewGame}
                className="cursor-pointer rounded-lg border border-fuchsia-300/30 bg-fuchsia-900/30 px-4 py-1.5 font-mono text-xs text-fuchsia-200 transition-colors hover:bg-fuchsia-900/50"
              >
                new game
              </button>
            </div>
          ) : null}

          {phase === "playing" && engineState.isReady && !engineState.isThinking ? (
            <button
              type="button"
              onClick={startNewGame}
              className="cursor-pointer font-mono text-xs text-fuchsia-300/40 transition-colors hover:text-fuchsia-300/70"
            >
              reset
            </button>
          ) : null}

          {engineState.error ? (
            <span className="font-mono text-sm text-red-400">{engineState.error}</span>
          ) : null}
        </div>
      </AccessibleCanvasSection>
    </CanvasComponent>
  );
}
