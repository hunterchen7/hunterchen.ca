import { heroRgba } from "../hero/heroPalette";
import { clamp, easeOutCubic, smoothstep } from "./isoGeometry";
import { dangerRgba, type PieceColor } from "./isoPieces";

/**
 * Move motion and impact effects for the isometric board, shared by the ambient
 * ChessboardWatermark and the playable IsoChessBoard.
 *
 * Effects take a resolved centre point rather than a square name, because the
 * playable board can be flipped and so maps squares to points differently.
 */

export type Point = { x: number; y: number };

/** How long a piece takes to travel between squares. */
export const MOVE_MS = 880;
/** Quiet tail after the move, before the next one may begin. */
export const SETTLE_MS = 650;
/** Squash-and-settle window once the piece lands. */
export const LANDING_SETTLE_MS = 220;
/** Dust and impact window once the piece lands. */
export const LANDING_EFFECT_MS = 420;

export function pieceMotionAt(progress: number) {
  const t = clamp(progress);
  const pickup = easeOutCubic(t / 0.18);
  const travel = smoothstep((t - 0.12) / 0.72);
  const landing = smoothstep((t - 0.72) / 0.23);

  return {
    lift: 1.22 * pickup * (1 - landing),
    travel,
  };
}

export function landingScaleAt(progress: number): number {
  const t = clamp(progress);
  if (t <= 0) return 1;
  if (t < 0.28) return 1 - 0.035 * easeOutCubic(t / 0.28);
  if (t < 0.62) return 0.965 + 0.047 * smoothstep((t - 0.28) / 0.34);
  return 1.012 - 0.012 * smoothstep((t - 0.62) / 0.38);
}

export function landingImpactAt(progress: number): number {
  return Math.sin(Math.PI * clamp(progress / 0.62));
}

export function captureProgressAt(moveProgress: number): number {
  return smoothstep((moveProgress - 0.52) / 0.44);
}

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

export function LandingDust({
  center,
  progress,
}: {
  center: Point;
  progress: number;
}) {
  const t = clamp(progress);
  if (t <= 0 || t >= 1) return null;

  const origin = center;
  const travel = easeOutCubic(t);
  const opacity = Math.sin(Math.PI * t);
  const lift = Math.sin(Math.PI * t) * 0.72;

  return (
    <g
      data-effect="landing-dust"
      data-progress={t.toFixed(3)}
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

export function CaptureBurst({
  center,
  color,
  progress,
}: {
  center: Point | null;
  color: PieceColor;
  progress: number;
}) {
  const t = clamp(progress);
  if (!center || t <= 0 || t >= 1) return null;

  const origin = center;
  const travel = easeOutCubic(t);
  const opacity = Math.max(
    Math.sin(Math.PI * t),
    1 - smoothstep(t / 0.22),
  );
  const particleFill =
    color === "w"
      ? heroRgba("light", 0.86)
      : heroRgba("accent", 0.78);

  return (
    <g
      data-effect="capture-burst"
      data-progress={t.toFixed(3)}
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

/** Sharp horizontal jolt as a mating move lands. */
export function mateShakeAt(landingProgress: number, isMate: boolean): Point {
  if (!isMate) return { x: 0, y: 0 };
  const t = clamp(landingProgress);
  if (t <= 0 || t >= 1) return { x: 0, y: 0 };

  const envelope = 1 - smoothstep(t);
  return {
    x: Math.sin(t * Math.PI * 4) * 0.34 * envelope,
    y: Math.sin(t * Math.PI * 6) * 0.11 * envelope,
  };
}

/** Smaller jolt as a capture connects. */
export function captureShakeAt(moveProgress: number, hasCapture: boolean): Point {
  if (!hasCapture) return { x: 0, y: 0 };

  const captureProgress = captureProgressAt(moveProgress);
  const t = clamp((captureProgress - 0.42) / 0.58);
  if (t <= 0 || t >= 1) return { x: 0, y: 0 };

  const envelope = Math.sin(Math.PI * t);
  return {
    x: Math.sin(t * Math.PI * 4) * 0.17 * envelope,
    y: Math.sin(t * Math.PI * 6) * 0.055 * envelope,
  };
}

/**
 * A captured piece is knocked back along the line of the capture, tips over,
 * drops and fades. `fallSeed` only decides which way it topples when the
 * capture comes straight down the screen.
 */
export function capturedPieceMotion({
  captureProgress,
  fallSeed,
  moverFrom,
  victimAt,
}: {
  captureProgress: number;
  fallSeed: number;
  moverFrom: Point;
  victimAt: Point;
}) {
  const vector = { x: victimAt.x - moverFrom.x, y: victimAt.y - moverFrom.y };
  const distance = Math.hypot(vector.x, vector.y) || 1;
  const directionX = vector.x / distance;
  const directionY = vector.y / distance;
  const tipProgress = smoothstep(captureProgress / 0.72);
  const dropProgress = smoothstep((captureProgress - 0.48) / 0.52);
  const fallDirection =
    Math.abs(directionX) > 0.08 ? Math.sign(directionX) : fallSeed % 2 === 0 ? -1 : 1;

  return {
    dx: directionX * (captureProgress * 1.55 + dropProgress * 0.35),
    dy:
      directionY * (captureProgress * 1.05 + dropProgress * 0.28) +
      dropProgress * 0.34,
    lift: Math.sin(Math.PI * captureProgress) * 0.68 - dropProgress * 0.38,
    opacity: 1 - smoothstep((captureProgress - 0.55) / 0.45),
    rotation: fallDirection * (tipProgress * 48 + dropProgress * 6),
    scale: 1 - dropProgress * 0.16,
    verticalScale: 1 - dropProgress * 0.08,
  };
}

/** Pulsing red cue on a king in check, louder for mate. */
export function CheckHighlight({
  center,
  intensity,
  mate,
  points,
  pulse,
}: {
  center: Point;
  intensity: number;
  mate: boolean;
  points: string;
  pulse: number;
}) {
  if (intensity <= 0) return null;

  const outlineScale = 1 + pulse * (mate ? 0.1 : 0.055);
  const outlineTransform = `translate(${center.x.toFixed(2)} ${center.y.toFixed(2)}) scale(${outlineScale.toFixed(3)}) translate(${(-center.x).toFixed(2)} ${(-center.y).toFixed(2)})`;

  return (
    <g data-effect={mate ? "checkmate" : "check"} opacity={intensity.toFixed(3)}>
      <polygon fill={dangerRgba(mate ? 0.25 : 0.15)} points={points} />
      <polygon
        fill="none"
        points={points}
        stroke={dangerRgba(mate ? 0.88 : 0.62)}
        strokeWidth={mate ? 1.05 : 0.72}
        transform={outlineTransform}
        vectorEffect="non-scaling-stroke"
      />
      {mate ? (
        <ellipse
          cx={center.x}
          cy={center.y}
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

