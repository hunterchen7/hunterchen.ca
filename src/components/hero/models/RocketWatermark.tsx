import { memo, useEffect, useId, useMemo, useRef, useState } from "react";
import ModelSvg from "./ModelSvg";
import {
  modelAnimationStyle,
  readPinnedModelFrame,
  useModelTiming,
} from "./modelMotion";

type Vec3 = { x: number; y: number; z: number };
type Vec2 = { x: number; y: number };

type FinProfilePoint = {
  radius: number;
  y: number;
};

type RocketFinFace = {
  depth: number;
  fill: string;
  id: string;
  layer: "back" | "front";
  points: Vec2[];
};

const ROLL_DURATION_MS = 7_200;
const ROLL_START = Math.PI / 4;
const CAMERA_TILT = -0.11;
const CAMERA_DISTANCE = 7.8;
const PROJECTION_SCALE = 22;
const CENTER_X = 57;
const CENTER_Y = 56;
const FIN_ROOT_RADIUS = 0.7;
const FIN_HALF_THICKNESS = 0.025;
const CAMERA_POSITION: Vec3 = { x: 0, y: 0, z: CAMERA_DISTANCE };
const FIN_PROFILE: readonly FinProfilePoint[] = [
  { radius: FIN_ROOT_RADIUS, y: -0.18 },
  { radius: FIN_ROOT_RADIUS, y: -0.57 },
  { radius: 1.17, y: -0.69 },
  { radius: 1.08, y: -0.29 },
];
const FIN_ROOT_CENTER_Y = (FIN_PROFILE[0]!.y + FIN_PROFILE[1]!.y) / 2;
const LIGHT_DIRECTION = normalize({ x: -0.56, y: 0.7, z: 0.73 });
const HULL_PATH =
  "M57 12.5 C47.8 20.5 42.8 31.5 41.5 42 L41.5 66.5 Q41.7 71 46 72.8 Q57 76.5 68 72.8 Q72.3 71 72.5 66.5 L72.5 42 C71.2 31.5 66.2 20.5 57 12.5 Z";

function subtract(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function normalize(vector: Vec3): Vec3 {
  const length = Math.hypot(vector.x, vector.y, vector.z) || 1;
  return {
    x: vector.x / length,
    y: vector.y / length,
    z: vector.z / length,
  };
}

function faceNormal(points: Vec3[]): Vec3 {
  return normalize(
    cross(
      subtract(points[1]!, points[0]!),
      subtract(points[2]!, points[0]!),
    ),
  );
}

function averagePoint(points: Vec3[]): Vec3 {
  return points.reduce(
    (sum, point) => ({
      x: sum.x + point.x / points.length,
      y: sum.y + point.y / points.length,
      z: sum.z + point.z / points.length,
    }),
    { x: 0, y: 0, z: 0 },
  );
}

function orientPrismFace(points: Vec3[], prismCenter: Vec3): Vec3[] {
  const outward = subtract(averagePoint(points), prismCenter);
  return dot(faceNormal(points), outward) >= 0
    ? points
    : [...points].reverse();
}

function rotateForView(point: Vec3, roll: number): Vec3 {
  const cosRoll = Math.cos(roll);
  const sinRoll = Math.sin(roll);
  const rolled = {
    x: point.x * cosRoll + point.z * sinRoll,
    y: point.y,
    z: -point.x * sinRoll + point.z * cosRoll,
  };

  const cosTilt = Math.cos(CAMERA_TILT);
  const sinTilt = Math.sin(CAMERA_TILT);
  return {
    x: rolled.x,
    y: rolled.y * cosTilt - rolled.z * sinTilt,
    z: rolled.y * sinTilt + rolled.z * cosTilt,
  };
}

function rotateDirection(vector: Vec3, roll: number): Vec3 {
  return rotateForView(vector, roll);
}

function project(point: Vec3): Vec2 {
  const perspective = CAMERA_DISTANCE / (CAMERA_DISTANCE - point.z);
  return {
    x: CENTER_X + point.x * PROJECTION_SCALE * perspective,
    y: CENTER_Y - point.y * PROJECTION_SCALE * perspective,
  };
}

function formatPoints(points: Vec2[]): string {
  return points
    .map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`)
    .join(" ");
}

function radialPoint(angle: number, radius: number, y: number): Vec3 {
  return {
    x: Math.cos(angle) * radius,
    y,
    z: Math.sin(angle) * radius,
  };
}

function averageDepth(points: Vec3[]): number {
  return points.reduce((sum, point) => sum + point.z, 0) / points.length;
}

function finColor(normal: Vec3): string {
  const diffuse = Math.max(0, dot(normal, LIGHT_DIRECTION));
  const factor = Math.min(
    1,
    0.54 + diffuse * 0.4 + Math.max(0, normal.z) * 0.06,
  );
  return `rgb(${Math.round(105 * factor)}, ${Math.round(54 * factor)}, ${Math.round(126 * factor)})`;
}

function addFinFace(
  faces: RocketFinFace[],
  id: string,
  layer: RocketFinFace["layer"],
  points: Vec3[],
  prismCenter: Vec3,
  roll: number,
): void {
  const oriented = orientPrismFace(points, prismCenter);
  const transformed = oriented.map((point) => rotateForView(point, roll));
  const normal = faceNormal(transformed);
  const faceCenter = averagePoint(transformed);
  if (dot(normal, subtract(CAMERA_POSITION, faceCenter)) <= 0.000_001) {
    return;
  }

  faces.push({
    id,
    layer,
    depth: averageDepth(transformed),
    fill: finColor(normal),
    points: transformed.map(project),
  });
}

function buildRocketFinFaces(roll: number): RocketFinFace[] {
  const faces: RocketFinFace[] = [];

  for (let finIndex = 0; finIndex < 4; finIndex += 1) {
    const angle = (finIndex / 4) * Math.PI * 2;
    const radial = radialPoint(angle, 1, 0);
    const tangent = { x: -Math.sin(angle), y: 0, z: Math.cos(angle) };
    const rootCenter = rotateForView(
      radialPoint(angle, FIN_ROOT_RADIUS, FIN_ROOT_CENTER_Y),
      roll,
    );
    const viewRadial = rotateDirection(radial, roll);
    const layer =
      dot(viewRadial, normalize(subtract(CAMERA_POSITION, rootCenter))) >= 0
        ? "front"
        : "back";
    const profile = FIN_PROFILE.map(({ radius, y }) =>
      radialPoint(angle, radius, y),
    );
    const near = profile.map((point) => ({
      x: point.x + tangent.x * FIN_HALF_THICKNESS,
      y: point.y,
      z: point.z + tangent.z * FIN_HALF_THICKNESS,
    }));
    const far = profile.map((point) => ({
      x: point.x - tangent.x * FIN_HALF_THICKNESS,
      y: point.y,
      z: point.z - tangent.z * FIN_HALF_THICKNESS,
    }));
    const prismCenter = averagePoint([...near, ...far]);

    addFinFace(
      faces,
      `fin-${finIndex}-side-a`,
      layer,
      near,
      prismCenter,
      roll,
    );
    addFinFace(
      faces,
      `fin-${finIndex}-side-b`,
      layer,
      far,
      prismCenter,
      roll,
    );
    for (let edge = 0; edge < profile.length; edge += 1) {
      const next = (edge + 1) % profile.length;
      addFinFace(
        faces,
        `fin-${finIndex}-edge-${edge}`,
        layer,
        [near[edge]!, near[next]!, far[next]!, far[edge]!],
        prismCenter,
        roll,
      );
    }
  }

  return faces.sort((a, b) => {
    const depthDifference = a.depth - b.depth;
    return Math.abs(depthDifference) > 0.000_001
      ? depthDifference
      : a.id.localeCompare(b.id);
  });
}

function useRocketRoll(frame: number | null): { fps: number; roll: number } {
  const { fps, frameIntervalMs, prefersReducedMotion } =
    useModelTiming("rocket");
  const pinnedRoll = frame === null ? null : ROLL_START + frame * Math.PI * 2;
  const [roll, setRoll] = useState(pinnedRoll ?? ROLL_START);
  const startTime = useRef<number | null>(null);

  useEffect(() => {
    if (pinnedRoll !== null) {
      setRoll(pinnedRoll);
      return;
    }

    if (prefersReducedMotion) {
      setRoll(ROLL_START);
      return;
    }

    let animationFrame = 0;
    let lastFrame = 0;

    const update = (time: number) => {
      if (startTime.current === null) startTime.current = time;
      const frameDelta = time - lastFrame;
      if (frameDelta >= frameIntervalMs) {
        const progress =
          ((time - startTime.current) % ROLL_DURATION_MS) /
          ROLL_DURATION_MS;
        setRoll(ROLL_START + progress * Math.PI * 2);
        lastFrame = time - (frameDelta % frameIntervalMs);
      }
      animationFrame = window.requestAnimationFrame(update);
    };

    animationFrame = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [frameIntervalMs, pinnedRoll, prefersReducedMotion]);

  return { fps, roll };
}

function RocketWatermark() {
  const frame = readPinnedModelFrame();
  const { fps, roll } = useRocketRoll(frame);
  const { backFinFaces, frontFinFaces } = useMemo(() => {
    const faces = buildRocketFinFaces(roll);
    return {
      backFinFaces: faces.filter((face) => face.layer === "back"),
      frontFinFaces: faces.filter((face) => face.layer === "front"),
    };
  }, [roll]);
  const gradientSuffix = useId().replace(/:/g, "");
  const hullGradientId = `hackathons-rocket-hull-${gradientSuffix}`;
  const collarGradientId = `hackathons-rocket-collar-${gradientSuffix}`;
  const hoverStyle = modelAnimationStyle(frame, 4.4);
  const flameStyle = modelAnimationStyle(frame, 0.85);
  const emberOneStyle = modelAnimationStyle(frame, 2.2);
  const emberTwoStyle = modelAnimationStyle(frame, 2.7, 0.55);

  return (
    <ModelSvg
      fps={fps}
      frame={frame}
      name="hackathons-rocket"
      viewBox="0 0 120 112"
      withGlow={false}
    >
      <defs>
        <linearGradient id={hullGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#341a43" />
          <stop offset="18%" stopColor="#75458c" />
          <stop offset="42%" stopColor="#a46aba" />
          <stop offset="68%" stopColor="#6c3b82" />
          <stop offset="100%" stopColor="#24102f" />
        </linearGradient>
        <linearGradient id={collarGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1b0b24" />
          <stop offset="46%" stopColor="#563067" />
          <stop offset="100%" stopColor="#16081d" />
        </linearGradient>
      </defs>
      <g transform="rotate(8 57 56)">
        <g
          className="model-rocket-hover"
          style={hoverStyle}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {backFinFaces.map((face) => (
            <polygon
              key={face.id}
              data-part={face.id}
              fill={face.fill}
              points={formatPoints(face.points)}
              stroke={face.fill}
              strokeWidth="0.15"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          <path
            data-part="smooth-hull"
            d={HULL_PATH}
            fill={`url(#${hullGradientId})`}
            stroke="rgba(235, 206, 255, 0.76)"
            strokeWidth="0.95"
            vectorEffect="non-scaling-stroke"
          />
          <path
            data-part="hull-highlight"
            d="M49.2 23 C45.8 33 44.4 46 44.8 62.5 Q45 68 49 69.4 C47.8 55 48 37 52 18.4 Z"
            fill="rgba(245, 220, 255, 0.16)"
          />
          <path
            data-part="engine-collar"
            d="M44.8 68.5 Q57 73.5 69.2 68.5 L67.6 77 Q57 81 46.4 77 Z"
            fill={`url(#${collarGradientId})`}
            stroke="rgba(229, 190, 255, 0.58)"
            strokeWidth="0.75"
            vectorEffect="non-scaling-stroke"
          />
          <ellipse
            data-part="nozzle-opening"
            cx="57"
            cy="77.2"
            fill="rgb(14, 6, 19)"
            rx="10.6"
            ry="3.35"
            stroke="rgba(229, 190, 255, 0.42)"
            strokeWidth="0.65"
            vectorEffect="non-scaling-stroke"
          />
          {frontFinFaces.map((face) => (
            <polygon
              key={face.id}
              data-part={face.id}
              fill={face.fill}
              points={formatPoints(face.points)}
              stroke={face.fill}
              strokeWidth="0.15"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          <g className="model-rocket-flame" style={flameStyle}>
            <path
              d="M49.5 77.5 Q48.5 91 57 107 Q65.5 91 64.5 77.5 Q57 82 49.5 77.5 Z"
              fill="rgba(174, 92, 224, 0.38)"
              stroke="rgba(229, 190, 255, 0.54)"
              strokeWidth="0.72"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d="M52.5 78.5 Q52 89 57 100 Q62 89 61.5 78.5 Q57 81.5 52.5 78.5 Z"
              fill="rgba(247, 219, 255, 0.72)"
            />
          </g>

          <circle
            className="model-rocket-ember-one"
            cx="50"
            cy="100"
            fill="rgba(229, 190, 255, 0.72)"
            r="1.2"
            style={emberOneStyle}
          />
          <circle
            className="model-rocket-ember-two"
            cx="64"
            cy="98"
            fill="rgba(184, 116, 228, 0.68)"
            r="0.92"
            style={emberTwoStyle}
          />
        </g>
      </g>
    </ModelSvg>
  );
}

export default memo(RocketWatermark);
