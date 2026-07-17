import { memo, useEffect, useMemo, useRef, useState } from "react";
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

type PiecePalette = {
  deep: string;
  eye: string;
  eyeStroke: string;
  highlight: string;
  main: string;
  shade: string;
  stroke: string;
};

type Timeline = {
  activeMove: number;
  moveProgress: number;
  sceneOpacity: number;
  settleProgress: number;
  stateIndex: number;
};

type RenderPiece = BoardPiece & {
  depth: number;
  impact: number;
  lift: number;
  opacity: number;
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

// Keep the starting tableau still until the card/artwork entrance has settled.
const INTRO_HOLD_MS = 2_800;
const MOVE_MS = 880;
const SETTLE_MS = 520;
const LANDING_SETTLE_MS = 220;
const STEP_MS = MOVE_MS + SETTLE_MS;
const MATE_HOLD_MS = 3_000;
const RESET_FADE_MS = 800;
const LOOP_DURATION_MS =
  INTRO_HOLD_MS +
  IMMORTAL_GAME.length * STEP_MS +
  MATE_HOLD_MS +
  RESET_FADE_MS;

const LIGHT_PIECE: PiecePalette = {
  main: "rgb(220, 174, 237)",
  highlight: "rgb(249, 229, 255)",
  shade: "rgb(133, 76, 153)",
  deep: "rgb(77, 39, 92)",
  eye: "rgb(77, 39, 92)",
  eyeStroke: "none",
  stroke: "rgba(253, 239, 255, 0.82)",
};

const DARK_PIECE: PiecePalette = {
  main: "rgb(40, 19, 51)",
  highlight: "rgb(112, 65, 130)",
  shade: "rgb(18, 8, 25)",
  deep: "rgb(7, 3, 11)",
  eye: "rgb(149, 91, 172)",
  eyeStroke: "rgba(224, 176, 244, 0.78)",
  stroke: "rgba(221, 173, 242, 0.62)",
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

function timelineAt(elapsed: number): Timeline {
  const localTime = ((elapsed % LOOP_DURATION_MS) + LOOP_DURATION_MS) % LOOP_DURATION_MS;
  const sequenceEnd = INTRO_HOLD_MS + IMMORTAL_GAME.length * STEP_MS;

  if (localTime < INTRO_HOLD_MS) {
    return {
      activeMove: -1,
      moveProgress: 0,
      sceneOpacity: smoothstep(localTime / 520),
      settleProgress: 0,
      stateIndex: 0,
    };
  }

  if (localTime < sequenceEnd) {
    const sequenceTime = localTime - INTRO_HOLD_MS;
    const activeMove = Math.min(
      IMMORTAL_GAME.length - 1,
      Math.floor(sequenceTime / STEP_MS),
    );
    const withinStep = sequenceTime - activeMove * STEP_MS;
    return {
      activeMove,
      moveProgress: clamp(withinStep / MOVE_MS),
      sceneOpacity: 1,
      settleProgress: clamp(
        (withinStep - MOVE_MS) / LANDING_SETTLE_MS,
      ),
      stateIndex: activeMove,
    };
  }

  const finaleTime = localTime - sequenceEnd;
  return {
    activeMove: -1,
    moveProgress: 1,
    sceneOpacity:
      finaleTime <= MATE_HOLD_MS
        ? 1
        : 1 - smoothstep((finaleTime - MATE_HOLD_MS) / RESET_FADE_MS),
    settleProgress: 0,
    stateIndex: IMMORTAL_GAME.length,
  };
}

function useTimeline(frame: number | null): { elapsed: number; fps: number } {
  const { fps, frameIntervalMs, prefersReducedMotion } =
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

    if (prefersReducedMotion) {
      setElapsed(850);
      return;
    }

    lastVisualFrame.current = "";
    let animationFrame = 0;
    let lastFrame = 0;

    const update = (time: number) => {
      if (startTime.current === null) startTime.current = time;
      const frameDelta = time - lastFrame;
      if (frameDelta >= frameIntervalMs) {
        const nextElapsed = time - startTime.current;
        const nextTimeline = timelineAt(nextElapsed);
        const visualFrame = [
          nextTimeline.activeMove,
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
  }, [frameIntervalMs, pinnedElapsed, prefersReducedMotion]);

  return { elapsed, fps };
}

function renderPiecesForTimeline(timeline: Timeline): RenderPiece[] {
  const pieces = GAME_STATES[timeline.stateIndex] ?? [];
  const move =
    timeline.activeMove >= 0
      ? IMMORTAL_GAME[timeline.activeMove]
      : undefined;
  const mover = move
    ? pieces.find((piece) => !piece.captured && piece.square === move.from)
    : undefined;
  const captured = move
    ? pieces.find(
        (piece) =>
          !piece.captured &&
          piece.square === move.to &&
          piece.id !== mover?.id,
      )
    : undefined;
  const motion = pieceMotionAt(timeline.moveProgress);

  return pieces
    .map((piece): RenderPiece => {
      const start = squareCenter(piece.square);
      let x = start.x;
      let y = start.y;
      let impact = 0;
      let lift = 0;
      let opacity = piece.captured ? 0 : 1;
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
        const captureProgress = smoothstep(
          (motion.travel - 0.52) / 0.38,
        );
        opacity = 1 - captureProgress;
        scale = 1 - captureProgress * 0.28;
      }

      return {
        ...piece,
        depth: y + (piece.id === mover?.id ? 0.08 : 0),
        impact,
        lift,
        opacity,
        scale,
        verticalScale,
        x,
        y,
      };
    })
    .sort((a, b) => a.depth - b.depth || a.id.localeCompare(b.id));
}

function PieceBase({ palette, width = 2.35 }: { palette: PiecePalette; width?: number }) {
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
  );
}

function Pawn({ palette }: { palette: PiecePalette }) {
  return (
    <>
      <PieceBase palette={palette} width={2.12} />
      <path
        d="M-1.2,-2.55 C-1,-3.25 -0.72,-4.15 -0.7,-4.72 H0.7 C0.72,-4.15 1,-3.25 1.2,-2.55 Z"
        fill={palette.main}
        stroke={palette.stroke}
        strokeWidth="0.32"
        vectorEffect="non-scaling-stroke"
      />
      <path d="M0,-4.72 H0.7 C0.72,-4.15 1,-3.25 1.2,-2.55 H0 Z" fill={palette.shade} opacity="0.7" />
      <ellipse cy="-4.72" fill={palette.deep} rx="1.1" ry="0.38" />
      <circle cy="-5.82" fill={palette.main} r="1.22" stroke={palette.stroke} strokeWidth="0.32" vectorEffect="non-scaling-stroke" />
      <ellipse cx="-0.38" cy="-6.18" fill={palette.highlight} opacity="0.8" rx="0.4" ry="0.27" />
    </>
  );
}

function Rook({ palette }: { palette: PiecePalette }) {
  return (
    <>
      <PieceBase palette={palette} width={2.35} />
      <path d="M-1.45,-2.55 L-1.62,-6.15 H1.62 L1.45,-2.55 Z" fill={palette.main} stroke={palette.stroke} strokeWidth="0.34" vectorEffect="non-scaling-stroke" />
      <path d="M0,-6.15 H1.62 L1.45,-2.55 H0 Z" fill={palette.shade} opacity="0.76" />
      <ellipse cy="-6.08" fill={palette.highlight} opacity="0.76" rx="1.8" ry="0.48" />
      <path d="M-1.95,-7.92 V-6.2 H1.95 V-7.92 H1.12 V-7.18 H0.45 V-7.92 H-0.45 V-7.18 H-1.12 V-7.92 Z" fill={palette.main} stroke={palette.stroke} strokeLinejoin="round" strokeWidth="0.35" vectorEffect="non-scaling-stroke" />
      <path d="M0,-7.92 H0.45 V-7.18 H1.12 V-7.92 H1.95 V-6.2 Q1,-5.8 0,-5.92 Z" fill={palette.shade} opacity="0.72" />
    </>
  );
}

function Knight({ palette }: { palette: PiecePalette }) {
  return (
    <>
      <PieceBase palette={palette} width={2.42} />
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
  );
}

function Bishop({ palette }: { palette: PiecePalette }) {
  return (
    <>
      <PieceBase palette={palette} width={2.35} />
      <path d="M-1.55,-2.55 C-1.2,-3.75 -0.92,-5.2 -0.72,-6.48 H0.72 C0.92,-5.2 1.2,-3.75 1.55,-2.55 Z" fill={palette.main} stroke={palette.stroke} strokeWidth="0.34" vectorEffect="non-scaling-stroke" />
      <path d="M0,-6.48 H0.72 C0.92,-5.2 1.2,-3.75 1.55,-2.55 H0 Z" fill={palette.shade} opacity="0.72" />
      <ellipse cy="-6.45" fill={palette.deep} rx="1.72" ry="0.5" />
      <ellipse cy="-6.72" fill={palette.highlight} opacity="0.74" rx="1.92" ry="0.52" />
      <path d="M0,-10.45 C-1.65,-9.3 -2.02,-7.82 0,-6.62 C2.02,-7.82 1.65,-9.3 0,-10.45 Z" fill={palette.main} stroke={palette.stroke} strokeWidth="0.36" vectorEffect="non-scaling-stroke" />
      <path d="M0,-10.3 C1.48,-9.18 1.62,-7.82 0,-6.72 Z" fill={palette.shade} opacity="0.72" />
      <path d="M-0.72,-9.38 L0.78,-7.48" fill="none" stroke={palette.deep} strokeLinecap="round" strokeWidth="0.46" vectorEffect="non-scaling-stroke" />
    </>
  );
}

function Queen({ palette }: { palette: PiecePalette }) {
  return (
    <>
      <PieceBase palette={palette} width={2.55} />
      <path d="M-1.72,-2.55 C-1.38,-4.2 -1.02,-6.2 -0.82,-7.62 H0.82 C1.02,-6.2 1.38,-4.2 1.72,-2.55 Z" fill={palette.main} stroke={palette.stroke} strokeWidth="0.35" vectorEffect="non-scaling-stroke" />
      <path d="M0,-7.62 H0.82 C1.02,-6.2 1.38,-4.2 1.72,-2.55 H0 Z" fill={palette.shade} opacity="0.72" />
      <ellipse cy="-7.55" fill={palette.deep} rx="1.92" ry="0.52" />
      <ellipse cy="-7.9" fill={palette.highlight} opacity="0.75" rx="2.08" ry="0.58" />
      <path d="M-2.02,-10.82 L-1.35,-9.12 L0,-11.05 L1.35,-9.12 L2.02,-10.82 L1.72,-7.9 Q0,-7.2 -1.72,-7.9 Z" fill={palette.main} stroke={palette.stroke} strokeLinejoin="round" strokeWidth="0.36" vectorEffect="non-scaling-stroke" />
      <path d="M0,-10.92 L1.35,-9.12 L2,-10.72 L1.7,-7.98 Q0.86,-7.58 0,-7.68 Z" fill={palette.shade} opacity="0.7" />
      <circle cy="-11.18" fill={palette.highlight} r="0.46" stroke={palette.stroke} strokeWidth="0.25" vectorEffect="non-scaling-stroke" />
      <circle cx="-2.04" cy="-10.96" fill={palette.highlight} r="0.34" />
      <circle cx="2.04" cy="-10.96" fill={palette.shade} r="0.34" />
    </>
  );
}

function King({ palette }: { palette: PiecePalette }) {
  return (
    <>
      <PieceBase palette={palette} width={2.55} />
      <path d="M-1.75,-2.55 C-1.36,-4.35 -1.02,-6.35 -0.82,-7.82 H0.82 C1.02,-6.35 1.36,-4.35 1.75,-2.55 Z" fill={palette.main} stroke={palette.stroke} strokeWidth="0.35" vectorEffect="non-scaling-stroke" />
      <path d="M0,-7.82 H0.82 C1.02,-6.35 1.36,-4.35 1.75,-2.55 H0 Z" fill={palette.shade} opacity="0.72" />
      <ellipse cy="-7.76" fill={palette.deep} rx="1.98" ry="0.54" />
      <ellipse cy="-8.15" fill={palette.highlight} opacity="0.76" rx="2.15" ry="0.58" />
      <path d="M-1.55,-8.18 C-1.45,-9.65 -0.72,-10.58 0,-10.82 C0.72,-10.58 1.45,-9.65 1.55,-8.18 Z" fill={palette.main} stroke={palette.stroke} strokeWidth="0.34" vectorEffect="non-scaling-stroke" />
      <path d="M0,-10.72 C0.75,-10.42 1.38,-9.5 1.48,-8.25 H0 Z" fill={palette.shade} opacity="0.7" />
      <path d="M-0.42,-13.18 H0.42 V-12.18 H1.28 V-11.4 H0.42 V-10.5 H-0.42 V-11.4 H-1.28 V-12.18 H-0.42 Z" fill={palette.highlight} stroke={palette.stroke} strokeLinejoin="round" strokeWidth="0.28" vectorEffect="non-scaling-stroke" />
    </>
  );
}

function PieceShape({ color, kind }: { color: PieceColor; kind: PieceKind }) {
  const palette = color === "w" ? LIGHT_PIECE : DARK_PIECE;
  if (kind === "p") return <Pawn palette={palette} />;
  if (kind === "r") return <Rook palette={palette} />;
  if (kind === "n") return <Knight palette={palette} />;
  if (kind === "b") return <Bishop palette={palette} />;
  if (kind === "q") return <Queen palette={palette} />;
  return <King palette={palette} />;
}

const PIECE_DEFINITION_PREFIX = "projects-chessboard-piece";
const PIECE_COLORS: PieceColor[] = ["w", "b"];
const PIECE_KINDS: PieceKind[] = ["p", "r", "n", "b", "q", "k"];

const PieceDefinitions = memo(function PieceDefinitions() {
  return (
    <defs>
      {PIECE_COLORS.flatMap((color) =>
        PIECE_KINDS.map((kind) => (
          <g key={`${color}-${kind}`} id={`${PIECE_DEFINITION_PREFIX}-${color}-${kind}`}>
            <PieceShape color={color} kind={kind} />
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
        fill="rgba(5, 2, 9, 0.42)"
        opacity={shadowOpacity}
        rx={shadowRadiusX}
        ry={shadowRadiusY}
      />
      <g
        transform={`translate(0 ${(-lift).toFixed(2)}) scale(1 ${verticalScale.toFixed(3)})`}
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
        fill="rgb(100, 52, 122)"
        stroke="rgba(229, 190, 255, 0.58)"
        strokeWidth="0.76"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={`M${far.x},${far.y} L${front.x},${front.y} L${front.x},${front.y + BOARD_DEPTH} L${far.x},${far.y + BOARD_DEPTH} Z`}
        fill="rgb(70, 34, 88)"
        stroke="rgba(229, 190, 255, 0.48)"
        strokeWidth="0.76"
        vectorEffect="non-scaling-stroke"
      />

      <polygon
        data-board-squares="64"
        fill="rgb(36, 17, 47)"
        points={[point(0, 0), far, front, left]
          .map(({ x, y }) => `${x.toFixed(2)},${y.toFixed(2)}`)
          .join(" ")}
      />
      <path d={LIGHT_SQUARES_PATH} fill="rgb(174, 121, 194)" />
      <path
        d={BOARD_GRID_PATH}
        fill="none"
        stroke="rgba(240, 215, 255, 0.24)"
        strokeWidth="0.28"
        vectorEffect="non-scaling-stroke"
      />

      <polygon
        fill="none"
        points={[point(0, 0), far, front, left]
          .map(({ x, y }) => `${x.toFixed(2)},${y.toFixed(2)}`)
          .join(" ")}
        stroke="rgba(244, 220, 255, 0.78)"
        strokeWidth="0.94"
        vectorEffect="non-scaling-stroke"
      />
    </g>
  );
});

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
        fill="rgba(249, 218, 255, 0.16)"
        points={squarePoints(fromSquare.row, fromSquare.column)}
      />
      <polygon
        fill={`rgba(229, 159, 255, ${(0.12 + moveProgress * 0.18).toFixed(3)})`}
        points={squarePoints(toSquare.row, toSquare.column)}
      />
    </g>
  );
}

function ChessboardWatermark() {
  const frame = readPinnedModelFrame();
  const { elapsed, fps } = useTimeline(frame);
  const timeline = timelineAt(elapsed);
  const pieces = useMemo(
    () => renderPiecesForTimeline(timeline),
    [
      timeline.activeMove,
      timeline.moveProgress,
      timeline.settleProgress,
      timeline.stateIndex,
    ],
  );
  const activeMove =
    timeline.activeMove >= 0
      ? IMMORTAL_GAME[timeline.activeMove]
      : undefined;

  return (
    <ModelSvg
      fps={fps}
      frame={frame}
      name="projects-chessboard"
      viewBox="0 0 120 82"
      withGlow={false}
    >
      <PieceDefinitions />
      <BoardSurface />
      <MoveHighlights
        activeMove={activeMove}
        moveProgress={timeline.moveProgress}
      />
      <g opacity={timeline.sceneOpacity.toFixed(3)}>
        {pieces.map((piece) => (
          <PieceModel key={piece.id} {...piece} />
        ))}
      </g>
    </ModelSvg>
  );
}

export default memo(ChessboardWatermark);
