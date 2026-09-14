import { memo, useEffect, useMemo, useRef, useState } from "react";
import { heroRgba } from "../heroPalette";
import ModelSvg from "./ModelSvg";
import {
  BOARD_SIZE,
  DIAMOND,
  FILES,
  clamp,
  easeOutCubic,
  smoothstep,
  squareIndices,
  type BoardGeometry,
} from "../../chess/isoGeometry";
import {
  BoardSurface,
  PieceDefinitions,
  PieceModel,
  type BoardPiece,
  type PieceColor,
  type PieceKind,
  type RenderPiece,
} from "../../chess/isoPieces";

import { readPinnedModelFrame, useModelTiming } from "./modelMotion";
import {
  CaptureBurst,
  CheckHighlight,
  LANDING_EFFECT_MS,
  LANDING_SETTLE_MS,
  LandingDust,
  MOVE_MS,
  SETTLE_MS,
  captureProgressAt,
  capturedPieceMotion,
  captureShakeAt,
  landingImpactAt,
  landingScaleAt,
  mateShakeAt,
  pieceMotionAt,
} from "../../chess/isoEffects";

/** Default <defs> namespace; a second instance must pass its own. */
const DEFAULT_PIECE_PREFIX = "projects-chessboard-piece";


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
const STEP_MS = MOVE_MS + SETTLE_MS;
const MATE_HOLD_MS = 3_000;
const RESET_WAVE_INTERVAL_MS = 110;
const RESET_PIECE_MS = 680;
const RESET_SCATTER_MS = 1_400;
const RESET_EMPTY_HOLD_MS = 900;
// Chess is staggered behind the other hero models: they all start on the same
// animation-ready gate (the laptop begins at t=0 of it), so this offset is how
// far chess trails the laptop — it holds the opening board this long before the
// game plays out.
const CHESS_LEAD_IN_MS = 1_000;
const PLAYBACK_RATE = 1.15;
const LOOP_DURATION_MS =
  SETUP_DURATION_MS +
  IMMORTAL_GAME.length * STEP_MS +
  MATE_HOLD_MS +
  RESET_SCATTER_MS +
  RESET_EMPTY_HOLD_MS;



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

// Precomputed outward-in ordering for the scatter. Measured on the diamond
// because it is only a running order, not a position.
const RESET_WAVE_BY_ID = new Map<string, number>(
  [...(GAME_STATES.at(-1) ?? [])]
    .filter((piece) => !piece.captured)
    .sort((a, b) => {
      const aPosition = DIAMOND.squareCenter(a.square);
      const bPosition = DIAMOND.squareCenter(b.square);
      const aDistance = Math.hypot(
        aPosition.x - DIAMOND.boardCenter.x,
        aPosition.y - DIAMOND.boardCenter.y,
      );
      const bDistance = Math.hypot(
        bPosition.x - DIAMOND.boardCenter.x,
        bPosition.y - DIAMOND.boardCenter.y,
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

function renderPiecesForTimeline(
  timeline: Timeline,
  geometry: BoardGeometry,
): RenderPiece[] {
  const { boardCenter: BOARD_CENTER, squareCenter } = geometry;
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
        const knockback = capturedPieceMotion({
          captureProgress,
          fallSeed: piece.id.charCodeAt(piece.id.length - 1),
          moverFrom: squareCenter(move?.from ?? piece.square),
          victimAt: start,
        });

        x += knockback.dx;
        y += knockback.dy;
        opacity = knockback.opacity;
        lift = knockback.lift;
        rotation = knockback.rotation;
        scale = knockback.scale;
        verticalScale = knockback.verticalScale;
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




function MoveHighlights({
  activeMove,
  geometry,
  moveProgress,
}: {
  activeMove: GameMove | undefined;
  geometry: BoardGeometry;
  moveProgress: number;
}) {
  if (!activeMove) return null;
  const { squarePoints } = geometry;
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

function ChessboardWatermark({
  geometry = DIAMOND,
  prefix = DEFAULT_PIECE_PREFIX,
}: {
  geometry?: BoardGeometry;
  prefix?: string;
} = {}) {
  const { squareCenter, squarePoints } = geometry;
  const frame = readPinnedModelFrame();
  const { elapsed, fps, simplified } = useTimeline(frame);
  const timeline = timelineAt(elapsed);
  const pieces = useMemo(
    () => renderPiecesForTimeline(timeline, geometry),
    [
      timeline.activeMove,
      timeline.moveProgress,
      timeline.phase,
      timeline.phaseElapsed,
      timeline.settleProgress,
      timeline.stateIndex,
      geometry,
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
  const mateShake = mateShakeAt(
    timeline.landingProgress,
    !!activeMove?.san.includes("#"),
  );
  const captureShake = captureShakeAt(
    timeline.moveProgress,
    !!moveContext?.captured,
  );
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
      <PieceDefinitions detail={!simplified} prefix={prefix} />
      <g
        data-board-shake={`${boardShake.x.toFixed(3)},${boardShake.y.toFixed(3)}`}
        data-chess-phase={timeline.phase}
        data-chess-phase-elapsed={timeline.phaseElapsed.toFixed(1)}
        transform={`translate(${boardShake.x.toFixed(3)} ${boardShake.y.toFixed(3)})`}
      >
        <BoardSurface geometry={geometry} />
        <MoveHighlights
          activeMove={activeMove}
          geometry={geometry}
          moveProgress={timeline.moveProgress}
        />
        {checkCue ? (
          <CheckHighlight
            center={squareCenter(checkCue.kingSquare)}
            intensity={checkIntensity}
            mate={checkCue.mate}
            points={squarePoints(
              squareIndices(checkCue.kingSquare).row,
              squareIndices(checkCue.kingSquare).column,
            )}
            pulse={checkPulse}
          />
        ) : null}
        {activeMove ? (
          <LandingDust
            center={squareCenter(activeMove.to)}
            progress={timeline.landingProgress}
          />
        ) : null}
        <g opacity={timeline.sceneOpacity.toFixed(3)}>
          {pieces.map((piece) => (
            <PieceModel
              key={piece.id}
              {...piece}
              pieceScale={geometry.pieceScale}
              prefix={prefix}
            />
          ))}
          <CaptureBurst
            center={
              moveContext?.captured
                ? squareCenter(moveContext.captured.square)
                : null
            }
            color={moveContext?.captured?.color ?? "w"}
            progress={captureProgress}
          />
        </g>
      </g>
    </ModelSvg>
  );
}

export default memo(ChessboardWatermark);
