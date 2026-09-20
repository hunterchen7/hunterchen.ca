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
import { RESET, SETUP_DURATION_MS } from "./chess/isoEffects";
import Confetti from "./chess/Confetti";
import { AnimatedLink } from "./AnimatedLink";
import { AccessibleCanvasSection } from "../contexts/SectionFocusContext";
import { useChessGame } from "../hooks/useChessGame";
import { totalDownloadBytes } from "../chess/config";

/**
 * The fixed navbar sits at the bottom of the viewport; this much of the band
 * is kept clear above it for the controls. Mobile adds the safe-area inset.
 */
const NAVBAR_RESERVE = { desktop: 84, mobile: 120 };

type Band = {
  height: number;
  left: number;
  paddingBottom: number;
  top: number;
  width: number;
};

/**
 * The part of the section that is on screen. The canvas shows the home
 * section at zoom 1 and centred, so the visible band is the viewport's size
 * in the middle of the section, less the strip the navbar covers.
 */
export function bandFor(
  viewport: { height: number; width: number },
  section: { height: number; width: number },
): Band {
  const width = Math.min(section.width, viewport.width);
  const height = Math.min(section.height, viewport.height);
  const reserve =
    viewport.width < 768 ? NAVBAR_RESERVE.mobile : NAVBAR_RESERVE.desktop;
  // How far the navbar's strip reaches up into the band: all of it when the
  // band fills the viewport, less when the section ends above the navbar.
  const overlap = Math.max(0, reserve - (viewport.height - height) / 2);
  return {
    height,
    left: (section.width - width) / 2,
    paddingBottom: overlap,
    top: (section.height - height) / 2,
    width,
  };
}

function useViewportBand(section: { height: number; width: number }): Band {
  const measure = () =>
    bandFor(
      typeof window === "undefined"
        ? { height: section.height, width: section.width }
        : { height: window.innerHeight, width: window.innerWidth },
      section,
    );
  const [band, setBand] = useState(measure);

  useEffect(() => {
    const update = () => setBand(measure());
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section.height, section.width]);

  return band;
}

/** Each promotion choice framed to its own height, base rim to top. */
const PROMOTION_VIEWBOX: Record<string, string> = Object.fromEntries(
  Object.entries({ b: 10.6, n: 9.5, q: 11.5, r: 7.9 }).map(([kind, top]) => [
    kind,
    `-3.4 ${-(top + 0.5)} 6.8 ${top + 0.5 + 2.3}`,
  ]),
);

/** One style for play, reset and new game, so the controls read as a set. */
const CONTROL_CLASS =
  "cursor-pointer px-4 py-1 font-mono text-2xl tracking-wide text-fuchsia-200/85 transition-colors hover:text-fuchsia-100";

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
 * Pressing play runs three stages, strictly in order:
 *
 *   1. the resting pieces are swept off, exactly as the recorded game clears
 *      the board between loops
 *   2. the empty board swings from the corner-on view round to head-on
 *   3. the opening position is laid out again, using the recorded game's own
 *      setup animation
 *
 * They do not overlap: the board turns with nothing standing on it.
 *
 * `rate` compresses the recorded timings without changing the motion, since the
 * original setup takes over five seconds on its own.
 */
const SCATTER_RATE = 1.5;
const SETUP_RATE = 2.3;
export const SWING_MS = 850;

export const SCATTER_MS = RESET.totalMs / SCATTER_RATE;
export const SETUP_MS = SETUP_DURATION_MS / SETUP_RATE;
export const SWING_AT = SCATTER_MS;
export const SETUP_AT = SWING_AT + SWING_MS;
export const SEQUENCE_MS = SETUP_AT + SETUP_MS;

type PieceStage = { elapsed: number; mode: "scatter" | "setup" } | null;

export type PlaySequence = {
  geometry: BoardGeometry;
  pieceStage: PieceStage;
  /** True while the resting board is still on screen being swept. */
  restingBoard: boolean;
  /** Milliseconds into the resting board's sweep. */
  scatter: number;
};

const RESTING_SEQUENCE: PlaySequence = {
  geometry: DIAMOND,
  pieceStage: null,
  restingBoard: true,
  scatter: 0,
};

/** Drives an elapsed clock for `duration`, restarting whenever `key` changes. */
export function useElapsed(key: number, duration: number): number {
  // The reading is stored with the key it belongs to. A new key reads 0 on
  // its very first render; without that, the previous run's final time
  // would stand for one render and anything gated on the clock (the side
  // swap after a reset's sweep) would fire at once.
  const [clock, setClock] = useState({ elapsed: 0, key });

  useEffect(() => {
    if (!key) {
      setClock({ elapsed: 0, key });
      return;
    }
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setClock({ elapsed: duration, key });
      return;
    }

    let frame = 0;
    let start: number | null = null;
    const step = (now: number) => {
      if (start === null) start = now;
      const next = now - start;
      setClock({ elapsed: Math.min(next, duration), key });
      if (next < duration) frame = window.requestAnimationFrame(step);
    };
    frame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame);
  }, [duration, key]);

  return clock.key === key ? clock.elapsed : 0;
}

/** The play sequence at `elapsed` milliseconds after the press. Pure. */
export function playSequenceAt(elapsed: number): PlaySequence {
  if (elapsed >= SEQUENCE_MS) {
    return {
      geometry: STRAIGHT,
      pieceStage: null,
      restingBoard: false,
      scatter: RESET.totalMs,
    };
  }

  if (elapsed < SWING_AT) {
    return {
      geometry: DIAMOND,
      pieceStage: null,
      restingBoard: true,
      scatter: elapsed * SCATTER_RATE,
    };
  }

  const swing = smoothstep((elapsed - SWING_AT) / SWING_MS);
  return {
    geometry:
      swing >= 1
        ? STRAIGHT
        : createBoardGeometry(
            blendProjections(DIAMOND_PROJECTION, STRAIGHT_PROJECTION, swing),
          ),
    // Before the setup begins this is elapsed 0, which draws every piece at
    // zero opacity — an empty board to turn.
    pieceStage: {
      elapsed: Math.max(0, elapsed - SETUP_AT) * SETUP_RATE,
      mode: "setup",
    },
    restingBoard: false,
    scatter: RESET.totalMs,
  };
}

function usePlaySequence(playing: boolean): PlaySequence {
  const elapsed = useElapsed(playing ? 1 : 0, SEQUENCE_MS);
  return useMemo(
    () => (playing ? playSequenceAt(elapsed) : RESTING_SEQUENCE),
    [elapsed, playing],
  );
}

/**
 * Restarting a live game sweeps the board and lays it out again, the same two
 * animations play uses, but without moving the camera. The position only
 * changes at the hand-over between them.
 */
function useRestartSequence(onSwap: () => void) {
  const [run, setRun] = useState(0);
  const swapped = useRef(0);
  const elapsed = useElapsed(run, SCATTER_MS + SETUP_MS);

  useEffect(() => {
    if (!run || swapped.current === run) return;
    if (elapsed < SCATTER_MS) return;
    swapped.current = run;
    onSwap();
  }, [elapsed, onSwap, run]);

  const stage: PieceStage = !run
    ? null
    : elapsed < SCATTER_MS
      ? { elapsed: elapsed * SCATTER_RATE, mode: "scatter" }
      : { elapsed: (elapsed - SCATTER_MS) * SETUP_RATE, mode: "setup" };

  return {
    restart: () => setRun((value) => value + 1),
    running: run > 0 && elapsed < SCATTER_MS + SETUP_MS,
    stage,
  };
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

export default function ChessLandingSection({
  offset,
}: ChessLandingSectionProps) {
  // True while the board is being swept, turned or laid out. Fed to the game
  // hook so the engine does not move over the animation, and used to keep the
  // board non-interactive for the same window.
  const [boardBusy, setBoardBusy] = useState(false);
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
  } = useChessGame({ holdEngine: boardBusy });

  const band = useViewportBand(offset);
  const [infoOpen, setInfoOpen] = useState(false);
  const infoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!infoOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return;
      if (infoRef.current?.contains(event.target)) return;
      if (
        (event.target as HTMLElement).closest(
          "[aria-label='About this chess engine']",
        )
      ) {
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
  const play = usePlaySequence(!overlayUp);
  const restart = useRestartSequence(startNewGame);
  const showAmbient = overlayUp || play.restingBoard;
  // A manual restart takes over the pieces; otherwise the play sequence does.
  const pieceStage = restart.running ? restart.stage : play.pieceStage;
  const busy = restart.running || (!overlayUp && play.pieceStage !== null);
  useEffect(() => {
    setBoardBusy(busy);
  }, [busy]);

  return (
    <CanvasComponent offset={offset}>
      <AccessibleCanvasSection
        sectionId="home"
        label="Play chess"
        className="relative h-full w-full"
      >
        <div
          className="absolute flex flex-col items-center justify-center gap-1 px-3 pt-2"
          style={{
            height: band.height,
            left: band.left,
            paddingBottom: band.paddingBottom,
            top: band.top,
            width: band.width,
          }}
        >
          {/* One container aspect across the whole swing: each view frames itself
            inside it, so the camera can move without reflowing the page. The
            ratio splits the difference between the wide resting view and the
            taller head-on one. */}
          {/* The board takes most of the band but not all of it, so it sits
              with a little air around it rather than filling the viewport. */}
          <div className="flex h-[85%] w-full min-h-0 items-center justify-center">
            <div
              className="relative h-full max-w-full"
              style={{ aspectRatio: "1.28" }}
            >
              {showAmbient ? (
                <div aria-hidden="true" className="h-full w-full">
                  <ChessboardWatermark
                    dismiss={play.scatter}
                    prefix="landing-chessboard-piece"
                    viewBox={DIAMOND.viewBox}
                  />
                </div>
              ) : (
                <IsoChessBoard
                  animatedMove={animatedMove}
                  fen={fen}
                  geometry={play.geometry}
                  pieceStage={pieceStage}
                  flipped={playerColor === "b"}
                  highlights={highlights}
                  interactive={boardIsInteractive && !busy}
                  onSelectSquare={selectSquare}
                />
              )}

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
                          onClick={() =>
                            completePromotion(kind as "q" | "r" | "b" | "n")
                          }
                          className="h-12 w-12 cursor-pointer rounded-lg ring-1 ring-inset ring-fuchsia-300/20 transition-colors hover:bg-fuchsia-300/10"
                        >
                          <svg
                            className="h-full w-full"
                            viewBox={PROMOTION_VIEWBOX[kind]}
                          >
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
          </div>

          <div className="-mt-1.5 flex min-h-[44px] flex-col items-center">
            {overlayUp && hasCachedModel !== null ? (
              <div className="flex flex-col items-center gap-2">
                {/* The info button is positioned off the play button rather than
                  sitting beside it in the flow, so play stays centred under the
                  board whether or not the button is there. */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={startGame}
                    className={CONTROL_CLASS}
                  >
                    play
                  </button>
                  <button
                    type="button"
                    aria-expanded={infoOpen}
                    aria-label="About this chess engine"
                    onClick={() => setInfoOpen((open) => !open)}
                    className="absolute left-full top-1/2 ml-3 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full font-mono text-xs text-purple-200/35 ring-1 ring-inset ring-purple-200/15 transition-colors hover:text-purple-200/80 hover:ring-purple-200/40"
                  >
                    i
                  </button>
                  {infoOpen ? (
                    <div
                      ref={infoRef}
                      role="dialog"
                      aria-label="About this chess engine"
                      className="absolute bottom-full left-1/2 z-20 mb-3 w-[300px] -translate-x-1/2 rounded-xl bg-[#1b1524]/95 px-4 py-3 text-left text-xs leading-5 text-purple-200/75 shadow-xl ring-1 ring-inset ring-fuchsia-300/20 backdrop-blur-sm"
                    >
                      You're playing{" "}
                      <AnimatedLink
                        href="https://www.maiachess.com/"
                        className="text-fuchsia-300/80"
                      >
                        Maia
                      </AnimatedLink>
                      , a neural net trained to play like a person rather than
                      an engine. I{" "}
                      <AnimatedLink
                        href="https://github.com/hunterchen7/hunter-chessbot/"
                        className="text-fuchsia-300/80"
                      >
                        fine-tuned it
                      </AnimatedLink>{" "}
                      on about 2,000 of my own games, so what's across the board
                      is a fair impression of me. Be gentle.
                    </div>
                  ) : null}
                </div>
                {hasCachedModel === false ? (
                  <p className="font-mono text-[10px] leading-4 text-purple-100/55">
                    one-time {downloadSizeLabel} download
                  </p>
                ) : null}
              </div>
            ) : null}

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
                  onClick={restart.restart}
                  className={CONTROL_CLASS}
                >
                  new game
                </button>
              </div>
            ) : null}

            {phase === "playing" &&
            engineState.isReady &&
            !engineState.isThinking ? (
              <button
                type="button"
                onClick={restart.restart}
                className={CONTROL_CLASS}
              >
                reset
              </button>
            ) : null}

            {engineState.error ? (
              <span className="font-mono text-sm text-red-400">
                {engineState.error}
              </span>
            ) : null}
          </div>
        </div>
      </AccessibleCanvasSection>
    </CanvasComponent>
  );
}
