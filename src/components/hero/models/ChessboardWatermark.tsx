import { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  HERO_COLORS,
  heroRgba,
  litHeroTone,
} from "../heroPalette";
import ModelSvg from "./ModelSvg";
import { readPinnedModelFrame, useModelTiming } from "./modelMotion";

type PieceColor = "b" | "w";
type PieceKind = "b" | "k" | "n" | "p" | "q" | "r";

type BoardPiece = {
  captured?: boolean;
  color: PieceColor;
  id: string;
  kind: PieceKind;
  square: string;
};

type GameMove = {
  from: string;
  san: string;
  to: string;
};

type MoveContext = {
  captured: BoardPiece | undefined;
  move: GameMove;
  mover: BoardPiece | undefined;
};

type PiecePalette = {
  deep: string;
  eye: string;
  eyeStroke: string;
  highlight: string;
  main: string;
  shade: string;
  stroke: string;
};

type CheckCue = {
  kingSquare: string;
  mate: boolean;
};

type TimelinePhase = "setup" | "game" | "mate" | "reset" | "empty";

type Timeline = {
  activeMove: number;
  landingProgress: number;
  moveProgress: number;
  phase: TimelinePhase;
  phaseElapsed: number;
  sceneOpacity: number;
  settleProgress: number;
  stateIndex: number;
};

type RenderPiece = BoardPiece & {
  depth: number;
  impact: number;
  lift: number;
  opacity: number;
  rotation: number;
  scale: number;
  verticalScale: number;
  x: number;
  y: number;
};

const BOARD_SIZE = 8;
const ORIGIN = { x: 60, y: 10.8 };
const COLUMN = { x: 6.15, y: 3.075 };
const ROW = { x: -6.15, y: 3.075 };
const BOARD_DEPTH = 5.2;
const PIECE_SCALE = 1.06;
const FILES = "abcdefgh";

// Anderssen–Kieseritzky, London 1851 — the full Immortal Game.
const START_FEN =
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const IMMORTAL_GAME: GameMove[] = [
  { from: "e2", to: "e4", san: "e4" },
  { from: "e7", to: "e5", san: "e5" },
  { from: "f2", to: "f4", san: "f4" },
  { from: "e5", to: "f4", san: "exf4" },
  { from: "f1", to: "c4", san: "Bc4" },
  { from: "d8", to: "h4", san: "Qh4+" },
  { from: "e1", to: "f1", san: "Kf1" },
  { from: "b7", to: "b5", san: "b5" },
  { from: "c4", to: "b5", san: "Bxb5" },
  { from: "g8", to: "f6", san: "Nf6" },
  { from: "g1", to: "f3", san: "Nf3" },
  { from: "h4", to: "h6", san: "Qh6" },
  { from: "d2", to: "d3", san: "d3" },
  { from: "f6", to: "h5", san: "Nh5" },
  { from: "f3", to: "h4", san: "Nh4" },
  { from: "h6", to: "g5", san: "Qg5" },
  { from: "h4", to: "f5", san: "Nf5" },
  { from: "c7", to: "c6", san: "c6" },
  { from: "g2", to: "g4", san: "g4" },
  { from: "h5", to: "f6", san: "Nf6" },
  { from: "h1", to: "g1", san: "Rg1" },
  { from: "c6", to: "b5", san: "cxb5" },
  { from: "h2", to: "h4", san: "h4" },
  { from: "g5", to: "g6", san: "Qg6" },
  { from: "h4", to: "h5", san: "h5" },
  { from: "g6", to: "g5", san: "Qg5" },
  { from: "d1", to: "f3", san: "Qf3" },
  { from: "f6", to: "g8", san: "Ng8" },
  { from: "c1", to: "f4", san: "Bxf4" },
  { from: "g5", to: "f6", san: "Qf6" },
  { from: "b1", to: "c3", san: "Nc3" },
  { from: "f8", to: "c5", san: "Bc5" },
  { from: "c3", to: "d5", san: "Nd5" },
  { from: "f6", to: "b2", san: "Qxb2" },
  { from: "f4", to: "d6", san: "Bd6" },
  { from: "c5", to: "g1", san: "Bxg1" },
  { from: "e4", to: "e5", san: "e5" },
  { from: "b2", to: "a1", san: "Qxa1+" },
  { from: "f1", to: "e2", san: "Ke2" },
  { from: "b8", to: "a6", san: "Na6" },
  { from: "f5", to: "g7", san: "Nxg7+" },
  { from: "e8", to: "d8", san: "Kd8" },
  { from: "f3", to: "f6", san: "Qf6+" },
  { from: "g8", to: "f6", san: "Nxf6" },
  { from: "d6", to: "e7", san: "Be7#" },
];

const SETUP_EMPTY_HOLD_MS = 140;
const SETUP_BACK_RANK_PAIR_COUNT = 8;
const SETUP_PAWN_PAIR_COUNT = 8;
const SETUP_PAIR_INTERVAL_MS = 225;
const SETUP_PIECE_MS = 720;
const SETUP_PAWN_GAP_MS = 260;
const SETUP_SETTLE_MS = 660;
const SETUP_BACK_RANK_END_MS =
  SETUP_EMPTY_HOLD_MS +
  (SETUP_BACK_RANK_PAIR_COUNT - 1) * SETUP_PAIR_INTERVAL_MS +
  SETUP_PIECE_MS;
const SETUP_PAWN_START_MS = SETUP_BACK_RANK_END_MS + SETUP_PAWN_GAP_MS;
const SETUP_DURATION_MS =
  SETUP_PAWN_START_MS +
  (SETUP_PAWN_PAIR_COUNT - 1) * SETUP_PAIR_INTERVAL_MS +
  SETUP_PIECE_MS +
  SETUP_SETTLE_MS;
const MOVE_MS = 880;
const SETTLE_MS = 650;
const LANDING_SETTLE_MS = 220;
const LANDING_EFFECT_MS = 420;
const STEP_MS = MOVE_MS + SETTLE_MS;
const MATE_HOLD_MS = 3_000;
const RESET_WAVE_INTERVAL_MS = 110;
const RESET_PIECE_MS = 680;
const RESET_SCATTER_MS = 1_400;
const RESET_EMPTY_HOLD_MS = 900;
// Chess enters a beat after the other hero models: once animation is ready it
// holds the opening board for this long before the game begins to play out.
const CHESS_LEAD_IN_MS = 650;
const PLAYBACK_RATE = 1.15;
const LOOP_DURATION_MS =
  SETUP_DURATION_MS +
  IMMORTAL_GAME.length * STEP_MS +
  MATE_HOLD_MS +
  RESET_SCATTER_MS +
  RESET_EMPTY_HOLD_MS;

const LIGHT_PIECE: PiecePalette = {
  main: HERO_COLORS.light,
  highlight: litHeroTone("light", 16),
  shade: HERO_COLORS.accent,
  deep: HERO_COLORS.mid,
  eye: HERO_COLORS.deep,
  eyeStroke: "none",
  stroke: heroRgba("light", 0.96),
};

const DARK_PIECE: PiecePalette = {
  main: HERO_COLORS.deep,
  highlight: HERO_COLORS.mid,
  shade: HERO_COLORS.ink,
  deep: HERO_COLORS.ink,
  eye: HERO_COLORS.accent,
  eyeStroke: heroRgba("light", 0.78),
  stroke: heroRgba("accent", 0.62),
};

function clamp(value: number, minimum = 0, maximum = 1): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function smoothstep(value: number): number {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
}

function easeOutCubic(value: number): number {
  const t = 1 - clamp(value);
  return 1 - t * t * t;
}

function pieceMotionAt(progress: number) {
  const t = clamp(progress);
  const pickup = easeOutCubic(t / 0.18);
  const travel = smoothstep((t - 0.12) / 0.72);
  const landing = smoothstep((t - 0.72) / 0.23);

  return {
    lift: 1.22 * pickup * (1 - landing),
    travel,
  };
}

function landingScaleAt(progress: number): number {
  const t = clamp(progress);
  if (t <= 0) return 1;
  if (t < 0.28) return 1 - 0.035 * easeOutCubic(t / 0.28);
  if (t < 0.62) return 0.965 + 0.047 * smoothstep((t - 0.28) / 0.34);
  return 1.012 - 0.012 * smoothstep((t - 0.62) / 0.38);
}

function landingImpactAt(progress: number): number {
  return Math.sin(Math.PI * clamp(progress / 0.62));
}

function captureProgressAt(moveProgress: number): number {
  return smoothstep((moveProgress - 0.52) / 0.44);
}

function point(row: number, column: number) {
  return {
    x: ORIGIN.x + column * COLUMN.x + row * ROW.x,
    y: ORIGIN.y + column * COLUMN.y + row * ROW.y,
  };
}

function center(row: number, column: number) {
  return point(row + 0.5, column + 0.5);
}

function squareIndices(square: string) {
  const file = FILES.indexOf(square[0] ?? "");
  const rankRow = 8 - Number(square[1]);
  return { column: rankRow, row: BOARD_SIZE - 1 - file };
}

function squareCenter(square: string) {
  const { column, row } = squareIndices(square);
  return center(row, column);
}

const BOARD_CENTER = point(BOARD_SIZE / 2, BOARD_SIZE / 2);

function startingSquareForPiece(piece: BoardPiece): string {
  return piece.id.slice(-2);
}

function setupPairForPiece(piece: BoardPiece): number {
  const startingSquare = startingSquareForPiece(piece);
  const file = FILES.indexOf(startingSquare[0] ?? "");
  const edgeDepth = Math.min(file, BOARD_SIZE - 1 - file);
  const colorOffset = piece.color === "b" ? 0 : 1;
  const rankOffset = piece.kind === "p" ? BOARD_SIZE : 0;

  return rankOffset + edgeDepth * 2 + colorOffset;
}

function setupStartForPiece(piece: BoardPiece): number {
  const pair = setupPairForPiece(piece);
  if (piece.kind === "p") {
    return (
      SETUP_PAWN_START_MS +
      (pair - SETUP_BACK_RANK_PAIR_COUNT) * SETUP_PAIR_INTERVAL_MS
    );
  }

  return SETUP_EMPTY_HOLD_MS + pair * SETUP_PAIR_INTERVAL_MS;
}

function timedProgress(
  elapsed: number,
  delay: number,
  duration: number,
): number {
  return smoothstep((elapsed - delay) / duration);
}

function squarePoints(row: number, column: number) {
  return [
    point(row, column),
    point(row, column + 1),
    point(row + 1, column + 1),
    point(row + 1, column),
  ]
    .map(({ x, y }) => `${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");
}

const BOARD_SQUARES = Array.from({ length: BOARD_SIZE }, (_, rankIndex) =>
  Array.from(FILES, (file, fileIndex) => {
    const rank = BOARD_SIZE - rankIndex;
    const square = `${file}${rank}`;
    const { column, row } = squareIndices(square);
    return {
      column,
      light: (fileIndex + rank) % 2 === 0,
      points: squarePoints(row, column),
      row,
      square,
    };
  }),
).flat();

const LIGHT_SQUARES_PATH = BOARD_SQUARES.filter(({ light }) => light)
  .map(({ points }) => `M${points} Z`)
  .join(" ");

const BOARD_GRID_PATH = [
  ...Array.from({ length: BOARD_SIZE - 1 }, (_, index) => {
    const column = index + 1;
    const start = point(0, column);
    const end = point(BOARD_SIZE, column);
    return `M${start.x.toFixed(2)},${start.y.toFixed(2)} L${end.x.toFixed(2)},${end.y.toFixed(2)}`;
  }),
  ...Array.from({ length: BOARD_SIZE - 1 }, (_, index) => {
    const row = index + 1;
    const start = point(row, 0);
    const end = point(row, BOARD_SIZE);
    return `M${start.x.toFixed(2)},${start.y.toFixed(2)} L${end.x.toFixed(2)},${end.y.toFixed(2)}`;
  }),
].join(" ");

function parseFen(fen: string): BoardPiece[] {
  const placement = fen.split(" ")[0] ?? "";
  const ranks = placement.split("/");
  const pieces: BoardPiece[] = [];

  ranks.forEach((rank, rankIndex) => {
    let fileIndex = 0;
    for (const token of rank) {
      if (/\d/.test(token)) {
        fileIndex += Number(token);
        continue;
      }

      const color: PieceColor = token === token.toUpperCase() ? "w" : "b";
      const kind = token.toLowerCase() as PieceKind;
      const square = `${FILES[fileIndex]}${8 - rankIndex}`;
      pieces.push({ color, id: `${color}-${kind}-${square}`, kind, square });
      fileIndex += 1;
    }
  });

  return pieces;
}

function applyMove(pieces: BoardPiece[], move: GameMove): BoardPiece[] {
  const mover = pieces.find(
    (piece) => !piece.captured && piece.square === move.from,
  );
  if (!mover) return pieces;

  return pieces.map((piece) => {
    if (piece.id === mover.id) return { ...piece, square: move.to };
    if (!piece.captured && piece.square === move.to) {
      return { ...piece, captured: true };
    }
    return piece;
  });
}

const GAME_STATES = IMMORTAL_GAME.reduce<BoardPiece[][]>(
  (states, move) => [...states, applyMove(states.at(-1) ?? [], move)],
  [parseFen(START_FEN)],
);

const RESET_WAVE_BY_ID = new Map<string, number>(
  [...(GAME_STATES.at(-1) ?? [])]
    .filter((piece) => !piece.captured)
    .sort((a, b) => {
      const aPosition = squareCenter(a.square);
      const bPosition = squareCenter(b.square);
      const aDistance = Math.hypot(
        aPosition.x - BOARD_CENTER.x,
        aPosition.y - BOARD_CENTER.y,
      );
      const bDistance = Math.hypot(
        bPosition.x - BOARD_CENTER.x,
        bPosition.y - BOARD_CENTER.y,
      );
      return bDistance - aDistance || a.id.localeCompare(b.id);
    })
    .map((piece, index) => [piece.id, Math.floor(index / 4)] as const),
);

const MOVE_CONTEXTS = IMMORTAL_GAME.map((move, moveIndex): MoveContext => {
  const pieces = GAME_STATES[moveIndex] ?? [];
  const mover = pieces.find(
    (piece) => !piece.captured && piece.square === move.from,
  );
  const captured = pieces.find(
    (piece) =>
      !piece.captured &&
      piece.square === move.to &&
      piece.id !== mover?.id,
  );
  return { captured, move, mover };
});

const CHECK_CUES = IMMORTAL_GAME.map((move, moveIndex): CheckCue | null => {
  if (!move.san.includes("+") && !move.san.includes("#")) return null;

  const mover = MOVE_CONTEXTS[moveIndex]?.mover;
  if (!mover) return null;

  const checkedColor: PieceColor = mover.color === "w" ? "b" : "w";
  const checkedKing = (GAME_STATES[moveIndex + 1] ?? []).find(
    (piece) =>
      !piece.captured && piece.color === checkedColor && piece.kind === "k",
  );
  return checkedKing
    ? { kingSquare: checkedKing.square, mate: move.san.includes("#") }
    : null;
});

const LANDING_DUST_PARTICLES = [
  { dx: -3.4, dy: 0.35, radius: 0.34 },
  { dx: -2.15, dy: -0.95, radius: 0.26 },
  { dx: -0.8, dy: 0.82, radius: 0.22 },
  { dx: 0.95, dy: 0.72, radius: 0.24 },
  { dx: 2.3, dy: -0.82, radius: 0.27 },
  { dx: 3.45, dy: 0.28, radius: 0.33 },
] as const;

const CAPTURE_PARTICLES = [
  { dx: -4.8, dy: -1.85, radius: 0.58 },
  { dx: -3.6, dy: 1.55, radius: 0.46 },
  { dx: -2.05, dy: -2.9, radius: 0.4 },
  { dx: -0.75, dy: 2.45, radius: 0.44 },
  { dx: 0.9, dy: -3.25, radius: 0.42 },
  { dx: 2.35, dy: 2.35, radius: 0.48 },
  { dx: 3.65, dy: -1.65, radius: 0.52 },
  { dx: 4.9, dy: 0.95, radius: 0.6 },
] as const;

function timelineAt(elapsed: number): Timeline {
  const localTime = ((elapsed % LOOP_DURATION_MS) + LOOP_DURATION_MS) % LOOP_DURATION_MS;
  const sequenceEnd = SETUP_DURATION_MS + IMMORTAL_GAME.length * STEP_MS;

  if (localTime < SETUP_DURATION_MS) {
    return {
      activeMove: -1,
      landingProgress: 0,
      moveProgress: 0,
      phase: "setup",
      phaseElapsed: localTime,
      sceneOpacity: 1,
      settleProgress: 0,
      stateIndex: 0,
    };
  }

  if (localTime < sequenceEnd) {
    const sequenceTime = localTime - SETUP_DURATION_MS;
    const activeMove = Math.min(
      IMMORTAL_GAME.length - 1,
      Math.floor(sequenceTime / STEP_MS),
    );
    const withinStep = sequenceTime - activeMove * STEP_MS;
    return {
      activeMove,
      landingProgress: clamp(
        (withinStep - MOVE_MS) / LANDING_EFFECT_MS,
      ),
      moveProgress: clamp(withinStep / MOVE_MS),
      phase: "game",
      phaseElapsed: sequenceTime,
      sceneOpacity: 1,
      settleProgress: clamp(
        (withinStep - MOVE_MS) / LANDING_SETTLE_MS,
      ),
      stateIndex: activeMove,
    };
  }

  const finaleTime = localTime - sequenceEnd;
  if (finaleTime <= MATE_HOLD_MS) {
    return {
      activeMove: -1,
      landingProgress: 0,
      moveProgress: 1,
      phase: "mate",
      phaseElapsed: finaleTime,
      sceneOpacity: 1,
      settleProgress: 0,
      stateIndex: IMMORTAL_GAME.length,
    };
  }

  const resetTime = finaleTime - MATE_HOLD_MS;
  if (resetTime <= RESET_SCATTER_MS) {
    return {
      activeMove: -1,
      landingProgress: 0,
      moveProgress: 1,
      phase: "reset",
      phaseElapsed: resetTime,
      sceneOpacity: 1,
      settleProgress: 0,
      stateIndex: IMMORTAL_GAME.length,
    };
  }

  return {
    activeMove: -1,
    landingProgress: 0,
    moveProgress: 1,
    phase: "empty",
    phaseElapsed: resetTime - RESET_SCATTER_MS,
    sceneOpacity: 1,
    settleProgress: 0,
    stateIndex: IMMORTAL_GAME.length,
  };
}

function useTimeline(frame: number | null): {
  elapsed: number;
  fps: number;
  simplified: boolean;
} {
  const { animationReady, fps, frameIntervalMs, prefersReducedMotion, simplified } =
    useModelTiming("chess");
  const pinnedElapsed = frame === null ? null : frame * LOOP_DURATION_MS;
  const [elapsed, setElapsed] = useState(pinnedElapsed ?? 0);
  const lastVisualFrame = useRef("");
  const startTime = useRef<number | null>(null);

  useEffect(() => {
    if (pinnedElapsed !== null) {
      setElapsed(pinnedElapsed);
      return;
    }

    if (!animationReady) {
      startTime.current = null;
      lastVisualFrame.current = "";
      setElapsed(0);
      return;
    }

    if (prefersReducedMotion) {
      setElapsed(SETUP_DURATION_MS);
      return;
    }

    lastVisualFrame.current = "";
    let animationFrame = 0;
    let lastFrame = 0;

    const update = (time: number) => {
      if (startTime.current === null) startTime.current = time + CHESS_LEAD_IN_MS;
      const frameDelta = time - lastFrame;
      if (frameDelta >= frameIntervalMs) {
        // Clamp to 0 during the lead-in so the opening board holds still before play.
        const nextElapsed = Math.max(0, time - startTime.current) * PLAYBACK_RATE;
        const nextTimeline = timelineAt(nextElapsed);
        const visualFrame = [
          nextTimeline.activeMove,
          nextTimeline.landingProgress.toFixed(3),
          nextTimeline.phase,
          nextTimeline.phaseElapsed.toFixed(1),
          nextTimeline.stateIndex,
          nextTimeline.moveProgress.toFixed(3),
          nextTimeline.sceneOpacity.toFixed(3),
          nextTimeline.settleProgress.toFixed(3),
        ].join(":");
        if (visualFrame !== lastVisualFrame.current) {
          lastVisualFrame.current = visualFrame;
          setElapsed(nextElapsed);
        }
        lastFrame = time - (frameDelta % frameIntervalMs);
      }
      animationFrame = window.requestAnimationFrame(update);
    };

    animationFrame = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [animationReady, frameIntervalMs, pinnedElapsed, prefersReducedMotion]);

  return { elapsed, fps, simplified };
}

function renderPiecesForTimeline(timeline: Timeline): RenderPiece[] {
  const pieces = GAME_STATES[timeline.stateIndex] ?? [];
  const moveContext =
    timeline.activeMove >= 0
      ? MOVE_CONTEXTS[timeline.activeMove]
      : undefined;
  const move = moveContext?.move;
  const mover = moveContext?.mover;
  const captured = moveContext?.captured;
  const motion = pieceMotionAt(timeline.moveProgress);

  return pieces
    .map((piece): RenderPiece => {
      const start = squareCenter(piece.square);
      let x = start.x;
      let y = start.y;
      let impact = 0;
      let lift = 0;
      let opacity = piece.captured ? 0 : 1;
      let rotation = 0;
      let scale = piece.captured ? 0.72 : 1;
      let verticalScale = 1;

      if (move && piece.id === mover?.id) {
        const destination = squareCenter(move.to);
        x += (destination.x - start.x) * motion.travel;
        y += (destination.y - start.y) * motion.travel;
        impact = landingImpactAt(timeline.settleProgress);
        lift = motion.lift;
        verticalScale = landingScaleAt(timeline.settleProgress);
      }

      if (piece.id === captured?.id) {
        const captureProgress = captureProgressAt(timeline.moveProgress);
        const moverStart = squareCenter(move?.from ?? piece.square);
        const captureVector = {
          x: start.x - moverStart.x,
          y: start.y - moverStart.y,
        };
        const captureDistance =
          Math.hypot(captureVector.x, captureVector.y) || 1;
        const directionX = captureVector.x / captureDistance;
        const directionY = captureVector.y / captureDistance;
        const tipProgress = smoothstep(captureProgress / 0.72);
        const dropProgress = smoothstep((captureProgress - 0.48) / 0.52);
        const fallDirection =
          Math.abs(directionX) > 0.08
            ? Math.sign(directionX)
            : piece.id.charCodeAt(piece.id.length - 1) % 2 === 0
              ? -1
              : 1;

        x += directionX * (captureProgress * 1.55 + dropProgress * 0.35);
        y +=
          directionY * (captureProgress * 1.05 + dropProgress * 0.28) +
          dropProgress * 0.34;
        opacity = 1 - smoothstep((captureProgress - 0.55) / 0.45);
        lift =
          Math.sin(Math.PI * captureProgress) * 0.68 -
          dropProgress * 0.38;
        rotation = fallDirection * (tipProgress * 48 + dropProgress * 6);
        scale = 1 - dropProgress * 0.16;
        verticalScale = 1 - dropProgress * 0.08;
      }

      if (timeline.phase === "setup") {
        const entranceProgress = timedProgress(
          timeline.phaseElapsed,
          setupStartForPiece(piece),
          SETUP_PIECE_MS,
        );
        if (piece.kind === "p") {
          const emergence = easeOutCubic(entranceProgress);
          const settle = smoothstep((entranceProgress - 0.72) / 0.28);

          opacity = smoothstep(entranceProgress / 0.3);
          lift = 0;
          rotation = 0;
          scale = 0.78 + emergence * 0.25 - settle * 0.03;
          verticalScale = 0.06 + emergence * 1.01 - settle * 0.07;
        } else {
          const entranceVector = {
            x: start.x - BOARD_CENTER.x,
            y: start.y - BOARD_CENTER.y,
          };
          const entranceDistance =
            Math.hypot(entranceVector.x, entranceVector.y) || 1;
          const directionX = entranceVector.x / entranceDistance;
          const directionY = entranceVector.y / entranceDistance;
          const remaining = 1 - entranceProgress;

          x += directionX * remaining * 19;
          y += directionY * remaining * 12;
          opacity = smoothstep(entranceProgress / 0.42);
          lift = Math.sin(Math.PI * entranceProgress) * 1.25;
          rotation =
            (directionX >= 0 ? 1 : -1) * remaining * 11;
          scale = 0.72 + entranceProgress * 0.28;
          verticalScale = 0.9 + entranceProgress * 0.1;
        }
      }

      if (timeline.phase === "reset" || timeline.phase === "empty") {
        const wave = RESET_WAVE_BY_ID.get(piece.id) ?? 0;
        const exitProgress =
          timeline.phase === "empty"
            ? 1
            : timedProgress(
                timeline.phaseElapsed,
                wave * RESET_WAVE_INTERVAL_MS,
                RESET_PIECE_MS,
              );
        const exitVector = {
          x: start.x - BOARD_CENTER.x,
          y: start.y - BOARD_CENTER.y,
        };
        const exitDistance = Math.hypot(exitVector.x, exitVector.y) || 1;
        const directionX = exitVector.x / exitDistance;
        const directionY = exitVector.y / exitDistance;

        x += directionX * exitProgress * 17;
        y += directionY * exitProgress * 10 + exitProgress * 2.4;
        opacity *=
          1 - smoothstep((exitProgress - 0.42) / 0.58);
        lift +=
          Math.sin(Math.PI * exitProgress) * 1.45 -
          exitProgress * 0.7;
        rotation +=
          (directionX >= 0 ? 1 : -1) * exitProgress * 58;
        scale *= 1 - exitProgress * 0.24;
        verticalScale *= 1 - exitProgress * 0.08;
      }

      return {
        ...piece,
        depth: y + (piece.id === mover?.id ? 0.08 : 0),
        impact,
        lift,
        opacity,
        rotation,
        scale,
        verticalScale,
        x,
        y,
      };
    })
    .sort((a, b) => a.depth - b.depth || a.id.localeCompare(b.id));
}

// Every piece takes a `detail` flag: when false (mobile / simplified mode) the
// purely decorative layers — self-shadow fills, specular highlights, engraved
// line work — are omitted so each piece is built from fewer SVG nodes. The
// stroked structural silhouette is shared between both variants.
type PieceProps = { detail: boolean; palette: PiecePalette };

function PieceBase({
  detail,
  palette,
  width = 2.35,
}: PieceProps & { width?: number }) {
  return (
    <>
      <ellipse
        cy="0"
        fill={palette.deep}
        rx={width}
        ry="0.72"
        stroke={palette.stroke}
        strokeWidth="0.3"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={`M${-width},-0.25 C${-width * 0.92},-1.25 ${-width * 0.63},-1.95 -1.05,-2.45 C-0.55,-2.78 0.55,-2.78 1.05,-2.45 C${width * 0.63},-1.95 ${width * 0.92},-1.25 ${width},-0.25 Q0,1.05 ${-width},-0.25 Z`}
        fill={palette.main}
        stroke={palette.stroke}
        strokeWidth="0.34"
        vectorEffect="non-scaling-stroke"
      />
      {detail && (
        <>
          <path
            d={`M0,-2.7 C0.7,-2.66 1.05,-2.45 1.05,-2.45 C${width * 0.63},-1.95 ${width * 0.92},-1.25 ${width},-0.25 Q${width * 0.48},0.72 0,0.7 Z`}
            fill={palette.shade}
            opacity="0.74"
          />
          <ellipse
            cy="-2.42"
            fill={palette.highlight}
            opacity="0.78"
            rx="1.16"
            ry="0.42"
          />
        </>
      )}
    </>
  );
}

function Pawn({ detail, palette }: PieceProps) {
  return (
    <>
      <PieceBase detail={detail} palette={palette} width={2.12} />
      <path
        d="M-1.2,-2.55 C-1,-3.25 -0.72,-4.15 -0.7,-4.72 H0.7 C0.72,-4.15 1,-3.25 1.2,-2.55 Z"
        fill={palette.main}
        stroke={palette.stroke}
        strokeWidth="0.32"
        vectorEffect="non-scaling-stroke"
      />
      {detail && (
        <path d="M0,-4.72 H0.7 C0.72,-4.15 1,-3.25 1.2,-2.55 H0 Z" fill={palette.shade} opacity="0.7" />
      )}
      <ellipse cy="-4.72" fill={palette.deep} rx="1.1" ry="0.38" />
      <circle cy="-5.82" fill={palette.main} r="1.22" stroke={palette.stroke} strokeWidth="0.32" vectorEffect="non-scaling-stroke" />
      {detail && (
        <ellipse cx="-0.38" cy="-6.18" fill={palette.highlight} opacity="0.8" rx="0.4" ry="0.27" />
      )}
    </>
  );
}

function Rook({ detail, palette }: PieceProps) {
  return (
    <>
      <PieceBase detail={detail} palette={palette} width={2.35} />
      <path d="M-1.45,-2.55 L-1.62,-6.15 H1.62 L1.45,-2.55 Z" fill={palette.main} stroke={palette.stroke} strokeWidth="0.34" vectorEffect="non-scaling-stroke" />
      {detail && (
        <>
          <path d="M0,-6.15 H1.62 L1.45,-2.55 H0 Z" fill={palette.shade} opacity="0.76" />
          <ellipse cy="-6.08" fill={palette.highlight} opacity="0.76" rx="1.8" ry="0.48" />
        </>
      )}
      <path d="M-1.95,-7.92 V-6.2 H1.95 V-7.92 H1.12 V-7.18 H0.45 V-7.92 H-0.45 V-7.18 H-1.12 V-7.92 Z" fill={palette.main} stroke={palette.stroke} strokeLinejoin="round" strokeWidth="0.35" vectorEffect="non-scaling-stroke" />
      {detail && (
        <path d="M0,-7.92 H0.45 V-7.18 H1.12 V-7.92 H1.95 V-6.2 Q1,-5.8 0,-5.92 Z" fill={palette.shade} opacity="0.72" />
      )}
    </>
  );
}

function Knight({ detail, palette }: PieceProps) {
  return (
    <>
      <PieceBase detail={detail} palette={palette} width={2.42} />
      <path
        d="M-0.3,-8.62 L-0.58,-9.05 Q-0.65,-9.25 -0.43,-9.15 L0.02,-8.66 Z"
        fill={palette.shade}
        stroke={palette.stroke}
        strokeLinejoin="round"
        strokeWidth="0.26"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M-1.98,-2.55 C-2.06,-4.22 -1.9,-6.28 -1.25,-7.68 C-0.93,-8.36 -0.48,-8.65 -0.08,-8.72 C0.1,-8.75 0.27,-8.72 0.43,-8.65 C0.84,-8.6 1.18,-8.37 1.4,-8 C1.59,-7.67 1.67,-7.18 1.78,-6.68 L2.08,-5.92 Q2.2,-5.62 2.1,-5.34 L2,-5.08 Q1.91,-4.86 1.62,-4.9 L1.37,-4.95 C0.99,-5.04 0.8,-5.58 0.6,-6.04 Q0.48,-6.29 0.3,-6.08 C0.48,-5.25 0.86,-3.93 1.55,-2.55 Z"
        fill={palette.main}
        stroke={palette.stroke}
        strokeLinejoin="round"
        strokeWidth="0.38"
        vectorEffect="non-scaling-stroke"
      />
      {detail && (
        <>
          <path
            d="M-1.93,-2.68 C-2.04,-4.46 -1.82,-6.36 -1.12,-7.76 C-0.8,-8.38 -0.4,-8.65 -0.08,-8.72 L0.21,-8.47 C-0.36,-7.43 -0.79,-5.82 -0.75,-4.05 L-0.68,-2.55 Z"
            fill={palette.deep}
            opacity="0.72"
          />
          <path
            d="M0.56,-8.36 C1.1,-8.17 1.54,-7.31 1.78,-6.68 L2.08,-5.92 Q2.2,-5.62 2.1,-5.34 L2,-5.08 Q1.91,-4.86 1.62,-4.9 L1.37,-4.95 C1.02,-5.05 0.82,-5.55 0.61,-6.02 C0.79,-6.78 0.77,-7.66 0.56,-8.36 Z"
            fill={palette.shade}
            opacity="0.54"
          />
          <path
            d="M-0.48,-2.7 C-0.54,-4.1 -0.28,-5.36 0.28,-6.07 C0.48,-5.2 0.84,-3.86 1.35,-2.62 Z"
            fill={palette.highlight}
            opacity="0.48"
          />
          <path
            d="M-1.28,-7.24 L-0.9,-6.96 M-1.47,-6.7 L-0.96,-6.38 M-1.58,-6.08 L-1,-5.76"
            fill="none"
            opacity="0.55"
            stroke={palette.stroke}
            strokeLinecap="round"
            strokeWidth="0.15"
            vectorEffect="non-scaling-stroke"
          />
        </>
      )}
      <path
        d="M-0.04,-8.69 L-0.1,-9.2 Q-0.1,-9.4 0.1,-9.26 L0.48,-8.68 Z"
        fill={palette.main}
        stroke={palette.stroke}
        strokeLinejoin="round"
        strokeWidth="0.26"
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx="1.16"
        cy="-7.42"
        fill={palette.eye}
        r="0.16"
        stroke={palette.eyeStroke}
        strokeWidth="0.07"
        vectorEffect="non-scaling-stroke"
      />
      {detail && (
        <>
          <circle cx="1.16" cy="-7.42" fill={palette.deep} r="0.065" />
          <circle cx="1.88" cy="-5.72" fill={palette.deep} r="0.09" />
          <path
            d="M1.76,-5.36 L1.74,-4.98"
            fill="none"
            stroke={palette.deep}
            strokeLinecap="round"
            strokeWidth="0.2"
            vectorEffect="non-scaling-stroke"
          />
        </>
      )}
    </>
  );
}

function Bishop({ detail, palette }: PieceProps) {
  return (
    <>
      <PieceBase detail={detail} palette={palette} width={2.35} />
      <path d="M-1.55,-2.55 C-1.2,-3.75 -0.92,-5.2 -0.72,-6.48 H0.72 C0.92,-5.2 1.2,-3.75 1.55,-2.55 Z" fill={palette.main} stroke={palette.stroke} strokeWidth="0.34" vectorEffect="non-scaling-stroke" />
      {detail && (
        <path d="M0,-6.48 H0.72 C0.92,-5.2 1.2,-3.75 1.55,-2.55 H0 Z" fill={palette.shade} opacity="0.72" />
      )}
      <ellipse cy="-6.45" fill={palette.deep} rx="1.72" ry="0.5" />
      {detail && (
        <ellipse cy="-6.72" fill={palette.highlight} opacity="0.74" rx="1.92" ry="0.52" />
      )}
      <path d="M0,-10.45 C-1.65,-9.3 -2.02,-7.82 0,-6.62 C2.02,-7.82 1.65,-9.3 0,-10.45 Z" fill={palette.main} stroke={palette.stroke} strokeWidth="0.36" vectorEffect="non-scaling-stroke" />
      {detail && (
        <path d="M0,-10.3 C1.48,-9.18 1.62,-7.82 0,-6.72 Z" fill={palette.shade} opacity="0.72" />
      )}
      <path d="M-0.72,-9.38 L0.78,-7.48" fill="none" stroke={palette.deep} strokeLinecap="round" strokeWidth="0.46" vectorEffect="non-scaling-stroke" />
    </>
  );
}

function Queen({ detail, palette }: PieceProps) {
  return (
    <>
      <PieceBase detail={detail} palette={palette} width={2.55} />
      <path d="M-1.72,-2.55 C-1.38,-4.2 -1.02,-6.2 -0.82,-7.62 H0.82 C1.02,-6.2 1.38,-4.2 1.72,-2.55 Z" fill={palette.main} stroke={palette.stroke} strokeWidth="0.35" vectorEffect="non-scaling-stroke" />
      {detail && (
        <path d="M0,-7.62 H0.82 C1.02,-6.2 1.38,-4.2 1.72,-2.55 H0 Z" fill={palette.shade} opacity="0.72" />
      )}
      <ellipse cy="-7.55" fill={palette.deep} rx="1.92" ry="0.52" />
      {detail && (
        <ellipse cy="-7.9" fill={palette.highlight} opacity="0.75" rx="2.08" ry="0.58" />
      )}
      <path d="M-2.02,-10.82 L-1.35,-9.12 L0,-11.05 L1.35,-9.12 L2.02,-10.82 L1.72,-7.9 Q0,-7.2 -1.72,-7.9 Z" fill={palette.main} stroke={palette.stroke} strokeLinejoin="round" strokeWidth="0.36" vectorEffect="non-scaling-stroke" />
      {detail && (
        <path d="M0,-10.92 L1.35,-9.12 L2,-10.72 L1.7,-7.98 Q0.86,-7.58 0,-7.68 Z" fill={palette.shade} opacity="0.7" />
      )}
      <circle cy="-11.18" fill={palette.highlight} r="0.46" stroke={palette.stroke} strokeWidth="0.25" vectorEffect="non-scaling-stroke" />
      {detail && (
        <>
          <circle cx="-2.04" cy="-10.96" fill={palette.highlight} r="0.34" />
          <circle cx="2.04" cy="-10.96" fill={palette.shade} r="0.34" />
        </>
      )}
    </>
  );
}

function King({ detail, palette }: PieceProps) {
  return (
    <>
      <PieceBase detail={detail} palette={palette} width={2.55} />
      <path d="M-1.75,-2.55 C-1.36,-4.35 -1.02,-6.35 -0.82,-7.82 H0.82 C1.02,-6.35 1.36,-4.35 1.75,-2.55 Z" fill={palette.main} stroke={palette.stroke} strokeWidth="0.35" vectorEffect="non-scaling-stroke" />
      {detail && (
        <path d="M0,-7.82 H0.82 C1.02,-6.35 1.36,-4.35 1.75,-2.55 H0 Z" fill={palette.shade} opacity="0.72" />
      )}
      <ellipse cy="-7.76" fill={palette.deep} rx="1.98" ry="0.54" />
      {detail && (
        <ellipse cy="-8.15" fill={palette.highlight} opacity="0.76" rx="2.15" ry="0.58" />
      )}
      <path d="M-1.55,-8.18 C-1.45,-9.65 -0.72,-10.58 0,-10.82 C0.72,-10.58 1.45,-9.65 1.55,-8.18 Z" fill={palette.main} stroke={palette.stroke} strokeWidth="0.34" vectorEffect="non-scaling-stroke" />
      {detail && (
        <path d="M0,-10.72 C0.75,-10.42 1.38,-9.5 1.48,-8.25 H0 Z" fill={palette.shade} opacity="0.7" />
      )}
      <path d="M-0.42,-13.18 H0.42 V-12.18 H1.28 V-11.4 H0.42 V-10.5 H-0.42 V-11.4 H-1.28 V-12.18 H-0.42 Z" fill={palette.highlight} stroke={palette.stroke} strokeLinejoin="round" strokeWidth="0.28" vectorEffect="non-scaling-stroke" />
    </>
  );
}

function PieceShape({
  color,
  detail,
  kind,
}: {
  color: PieceColor;
  detail: boolean;
  kind: PieceKind;
}) {
  const palette = color === "w" ? LIGHT_PIECE : DARK_PIECE;
  if (kind === "p") return <Pawn detail={detail} palette={palette} />;
  if (kind === "r") return <Rook detail={detail} palette={palette} />;
  if (kind === "n") return <Knight detail={detail} palette={palette} />;
  if (kind === "b") return <Bishop detail={detail} palette={palette} />;
  if (kind === "q") return <Queen detail={detail} palette={palette} />;
  return <King detail={detail} palette={palette} />;
}

const PIECE_DEFINITION_PREFIX = "projects-chessboard-piece";
const PIECE_COLORS: PieceColor[] = ["w", "b"];
const PIECE_KINDS: PieceKind[] = ["p", "r", "n", "b", "q", "k"];

// Pieces are defined once here and instanced with <use>, so the detail flag
// swaps every piece on the board between the full and simplified builds.
const PieceDefinitions = memo(function PieceDefinitions({
  detail,
}: {
  detail: boolean;
}) {
  return (
    <defs>
      {PIECE_COLORS.flatMap((color) =>
        PIECE_KINDS.map((kind) => (
          <g key={`${color}-${kind}`} id={`${PIECE_DEFINITION_PREFIX}-${color}-${kind}`}>
            <PieceShape color={color} detail={detail} kind={kind} />
          </g>
        )),
      )}
    </defs>
  );
});

const PieceModel = memo(function PieceModel({
  color,
  id,
  impact,
  kind,
  lift,
  opacity,
  rotation,
  scale,
  square,
  verticalScale,
  x,
  y,
}: RenderPiece) {
  const shadowOpacity = clamp(0.92 - lift * 0.25 + impact * 0.08, 0.5, 0.98);
  const shadowRadiusX = 2.6 - lift * 0.18 + impact * 0.22;
  const shadowRadiusY = 0.78 - lift * 0.08 + impact * 0.08;

  return (
    <g
      data-piece={id}
      data-square={square}
      opacity={opacity}
      transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${(
        scale * PIECE_SCALE
      ).toFixed(3)})`}
    >
      <ellipse
        cy="0.72"
        fill={heroRgba("ink", 0.42)}
        opacity={shadowOpacity}
        rx={shadowRadiusX}
        ry={shadowRadiusY}
      />
      <g
        transform={`translate(0 ${(-lift).toFixed(2)}) rotate(${rotation.toFixed(2)}) scale(1 ${verticalScale.toFixed(3)})`}
      >
        <use href={`#${PIECE_DEFINITION_PREFIX}-${color}-${kind}`} />
      </g>
    </g>
  );
});

const BoardSurface = memo(function BoardSurface() {
  const far = point(0, BOARD_SIZE);
  const left = point(BOARD_SIZE, 0);
  const front = point(BOARD_SIZE, BOARD_SIZE);

  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <path
        d={`M${left.x},${left.y} L${front.x},${front.y} L${front.x},${front.y + BOARD_DEPTH} L${left.x},${left.y + BOARD_DEPTH} Z`}
        fill={HERO_COLORS.mid}
        stroke={heroRgba("light", 0.58)}
        strokeWidth="0.76"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={`M${far.x},${far.y} L${front.x},${front.y} L${front.x},${front.y + BOARD_DEPTH} L${far.x},${far.y + BOARD_DEPTH} Z`}
        fill={HERO_COLORS.deep}
        stroke={heroRgba("light", 0.48)}
        strokeWidth="0.76"
        vectorEffect="non-scaling-stroke"
      />

      <polygon
        data-board-squares="64"
        fill={HERO_COLORS.deep}
        points={[point(0, 0), far, front, left]
          .map(({ x, y }) => `${x.toFixed(2)},${y.toFixed(2)}`)
          .join(" ")}
      />
      <path
        d={LIGHT_SQUARES_PATH}
        data-board-light-squares="32"
        fill={heroRgba("light", 0.9)}
      />
      <path
        d={BOARD_GRID_PATH}
        fill="none"
        stroke={heroRgba("light", 0.24)}
        strokeWidth="0.28"
        vectorEffect="non-scaling-stroke"
      />

      <polygon
        fill="none"
        points={[point(0, 0), far, front, left]
          .map(({ x, y }) => `${x.toFixed(2)},${y.toFixed(2)}`)
          .join(" ")}
        stroke={heroRgba("light", 0.78)}
        strokeWidth="0.94"
        vectorEffect="non-scaling-stroke"
      />
    </g>
  );
});

function dangerRgba(alpha: number): string {
  return `rgba(255, 76, 108, ${clamp(alpha).toFixed(3)})`;
}

function CheckHighlight({
  cue,
  intensity,
  pulse,
}: {
  cue: CheckCue | null;
  intensity: number;
  pulse: number;
}) {
  if (!cue || intensity <= 0) return null;

  const { column, row } = squareIndices(cue.kingSquare);
  const centerPoint = squareCenter(cue.kingSquare);
  const outlineScale = 1 + pulse * (cue.mate ? 0.1 : 0.055);
  const outlineTransform = `translate(${centerPoint.x.toFixed(2)} ${centerPoint.y.toFixed(2)}) scale(${outlineScale.toFixed(3)}) translate(${(-centerPoint.x).toFixed(2)} ${(-centerPoint.y).toFixed(2)})`;

  return (
    <g
      data-effect={cue.mate ? "checkmate" : "check"}
      data-square={cue.kingSquare}
      opacity={intensity.toFixed(3)}
    >
      <polygon
        fill={dangerRgba(cue.mate ? 0.25 : 0.15)}
        points={squarePoints(row, column)}
      />
      <polygon
        fill="none"
        points={squarePoints(row, column)}
        stroke={dangerRgba(cue.mate ? 0.88 : 0.62)}
        strokeWidth={cue.mate ? 1.05 : 0.72}
        transform={outlineTransform}
        vectorEffect="non-scaling-stroke"
      />
      {cue.mate ? (
        <ellipse
          cx={centerPoint.x}
          cy={centerPoint.y}
          fill="none"
          opacity={0.45 + pulse * 0.35}
          rx={2.2 + pulse * 1.45}
          ry={0.78 + pulse * 0.5}
          stroke={dangerRgba(0.72)}
          strokeWidth="0.58"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
    </g>
  );
}

function LandingDust({ progress, square }: { progress: number; square: string }) {
  const t = clamp(progress);
  if (t <= 0 || t >= 1) return null;

  const origin = squareCenter(square);
  const travel = easeOutCubic(t);
  const opacity = Math.sin(Math.PI * t);
  const lift = Math.sin(Math.PI * t) * 0.72;

  return (
    <g
      data-effect="landing-dust"
      data-progress={t.toFixed(3)}
      data-square={square}
      opacity={(opacity * 0.72).toFixed(3)}
    >
      <ellipse
        cx={origin.x}
        cy={origin.y + 0.42}
        fill={heroRgba("light", 0.18)}
        rx={0.8 + travel * 3.25}
        ry={0.24 + travel * 0.62}
      />
      {LANDING_DUST_PARTICLES.map((particle, index) => (
        <circle
          key={index}
          cx={origin.x + particle.dx * travel}
          cy={origin.y + particle.dy * travel - lift}
          fill={
            index % 2 === 0
              ? heroRgba("light", 0.76)
              : heroRgba("accent", 0.68)
          }
          r={particle.radius * (1 - t * 0.48)}
        />
      ))}
    </g>
  );
}

function CaptureBurst({
  capturedPiece,
  progress,
}: {
  capturedPiece: BoardPiece | undefined;
  progress: number;
}) {
  const t = clamp(progress);
  if (!capturedPiece || t <= 0 || t >= 1) return null;

  const origin = squareCenter(capturedPiece.square);
  const travel = easeOutCubic(t);
  const opacity = Math.max(
    Math.sin(Math.PI * t),
    1 - smoothstep(t / 0.22),
  );
  const particleFill =
    capturedPiece.color === "w"
      ? heroRgba("light", 0.86)
      : heroRgba("accent", 0.78);

  return (
    <g
      data-effect="capture-burst"
      data-progress={t.toFixed(3)}
      data-square={capturedPiece.square}
      opacity={(opacity * 0.96).toFixed(3)}
    >
      <ellipse
        cx={origin.x}
        cy={origin.y}
        fill={dangerRgba(
          (1 - smoothstep(t / 0.38)) * 0.34,
        )}
        rx={2.55 + travel * 1.25}
        ry={0.9 + travel * 0.52}
      />
      <ellipse
        cx={origin.x}
        cy={origin.y}
        fill="none"
        rx={0.85 + travel * 4.2}
        ry={0.32 + travel * 1.62}
        stroke={dangerRgba(0.82)}
        strokeWidth={(1.12 - t * 0.74).toFixed(3)}
        vectorEffect="non-scaling-stroke"
      />
      {CAPTURE_PARTICLES.map((particle, index) => {
        const x = origin.x + particle.dx * travel;
        const y =
            origin.y +
            particle.dy * travel -
            Math.sin(Math.PI * t) * (0.9 + (index % 3) * 0.34);
        const shardWidth = particle.radius * (1.9 - t * 0.52);
        const shardHeight = particle.radius * (0.92 - t * 0.24);

        return (
          <rect
            key={index}
            fill={particleFill}
            height={shardHeight}
            rx="0.12"
            transform={`rotate(${(
              index * 43 +
              travel * 105
            ).toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)})`}
            width={shardWidth}
            x={x - shardWidth / 2}
            y={y - shardHeight / 2}
          />
        );
      })}
    </g>
  );
}

function mateShakeAt(timeline: Timeline): { x: number; y: number } {
  const move =
    timeline.activeMove >= 0
      ? IMMORTAL_GAME[timeline.activeMove]
      : undefined;
  if (!move?.san.includes("#")) return { x: 0, y: 0 };

  const t = clamp(timeline.landingProgress);
  if (t <= 0 || t >= 1) return { x: 0, y: 0 };

  const envelope = 1 - smoothstep(t);
  return {
    x: Math.sin(t * Math.PI * 4) * 0.34 * envelope,
    y: Math.sin(t * Math.PI * 6) * 0.11 * envelope,
  };
}

function captureShakeAt(
  timeline: Timeline,
  capturedPiece: BoardPiece | undefined,
): { x: number; y: number } {
  if (!capturedPiece) return { x: 0, y: 0 };

  const captureProgress = captureProgressAt(timeline.moveProgress);
  const t = clamp((captureProgress - 0.42) / 0.58);
  if (t <= 0 || t >= 1) return { x: 0, y: 0 };

  const envelope = Math.sin(Math.PI * t);
  return {
    x: Math.sin(t * Math.PI * 4) * 0.17 * envelope,
    y: Math.sin(t * Math.PI * 6) * 0.055 * envelope,
  };
}

function MoveHighlights({
  activeMove,
  moveProgress,
}: {
  activeMove: GameMove | undefined;
  moveProgress: number;
}) {
  if (!activeMove) return null;
  const fromSquare = squareIndices(activeMove.from);
  const toSquare = squareIndices(activeMove.to);

  return (
    <g data-move={activeMove.san}>
      <polygon
        fill={heroRgba("light", 0.16)}
        points={squarePoints(fromSquare.row, fromSquare.column)}
      />
      <polygon
        fill={heroRgba("accent", 0.12 + moveProgress * 0.18)}
        points={squarePoints(toSquare.row, toSquare.column)}
      />
    </g>
  );
}

function ChessboardWatermark() {
  const frame = readPinnedModelFrame();
  const { elapsed, fps, simplified } = useTimeline(frame);
  const timeline = timelineAt(elapsed);
  const pieces = useMemo(
    () => renderPiecesForTimeline(timeline),
    [
      timeline.activeMove,
      timeline.moveProgress,
      timeline.phase,
      timeline.phaseElapsed,
      timeline.settleProgress,
      timeline.stateIndex,
    ],
  );
  const activeMove =
    timeline.activeMove >= 0
      ? IMMORTAL_GAME[timeline.activeMove]
      : undefined;
  const moveContext =
    timeline.activeMove >= 0
      ? MOVE_CONTEXTS[timeline.activeMove]
      : undefined;
  const checkCue =
    timeline.activeMove >= 0
      ? (CHECK_CUES[timeline.activeMove] ?? null)
      : timeline.phase === "mate"
        ? (CHECK_CUES.at(-1) ?? null)
        : null;
  const checkIntensity = activeMove
    ? smoothstep((timeline.moveProgress - 0.72) / 0.22)
    : checkCue
      ? timeline.sceneOpacity
      : 0;
  const checkPulse =
    0.5 +
    Math.sin(elapsed / (checkCue?.mate ? 118 : 172)) * 0.5;
  const captureProgress = moveContext?.captured
    ? captureProgressAt(timeline.moveProgress)
    : 0;
  const mateShake = mateShakeAt(timeline);
  const captureShake = captureShakeAt(timeline, moveContext?.captured);
  const boardShake = {
    x: mateShake.x + captureShake.x,
    y: mateShake.y + captureShake.y,
  };

  return (
    <ModelSvg
      fps={fps}
      frame={frame}
      name="projects-chessboard"
      viewBox="0 0 120 82"
      withGlow={false}
    >
      <PieceDefinitions detail={!simplified} />
      <g
        data-board-shake={`${boardShake.x.toFixed(3)},${boardShake.y.toFixed(3)}`}
        data-chess-phase={timeline.phase}
        data-chess-phase-elapsed={timeline.phaseElapsed.toFixed(1)}
        transform={`translate(${boardShake.x.toFixed(3)} ${boardShake.y.toFixed(3)})`}
      >
        <BoardSurface />
        <MoveHighlights
          activeMove={activeMove}
          moveProgress={timeline.moveProgress}
        />
        <CheckHighlight
          cue={checkCue}
          intensity={checkIntensity}
          pulse={checkPulse}
        />
        {activeMove ? (
          <LandingDust
            progress={timeline.landingProgress}
            square={activeMove.to}
          />
        ) : null}
        <g opacity={timeline.sceneOpacity.toFixed(3)}>
          {pieces.map((piece) => (
            <PieceModel key={piece.id} {...piece} />
          ))}
          <CaptureBurst
            capturedPiece={moveContext?.captured}
            progress={captureProgress}
          />
        </g>
      </g>
    </ModelSvg>
  );
}

export default memo(ChessboardWatermark);
