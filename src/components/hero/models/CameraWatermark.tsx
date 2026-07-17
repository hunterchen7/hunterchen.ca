import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useModelTiming } from "./modelMotion";

type Vec3 = { x: number; y: number; z: number };
type Vec2 = { x: number; y: number };
type CubicSegment = {
  control1: Vec2;
  control2: Vec2;
  to: Vec2;
  steps?: number;
};

type Material =
  | "body"
  | "bodyDark"
  | "silver"
  | "grip"
  | "lens"
  | "lensBand"
  | "control";

type PolygonItem = {
  kind: "polygon";
  id: string;
  layer: number;
  points: Vec2[];
  depth: number;
  fill: string;
  opacity: number;
  stroke: string;
  strokeWidth: number;
};

type LineItem = {
  kind: "line";
  id: string;
  layer: number;
  points: Vec2[];
  depth: number;
  stroke: string;
  strokeWidth: number;
  opacity: number;
};

type CompoundItem = {
  kind: "compound";
  id: string;
  layer: number;
  paths: Vec2[][];
  depth: number;
  fill: string;
  opacity: number;
  stroke: string;
  strokeWidth: number;
};

type RenderItem = CompoundItem | PolygonItem | LineItem;

const CAMERA_PITCH = 0.24;
const CAMERA_DISTANCE = 7.8;
const PROJECTION_SCALE = 22.5;
// Reveal both sides while keeping the lens predominantly front-facing.
const SWAY_DURATION_MS = 10_800;
const SWAY_MIN_DEGREES = -40;
const SWAY_MAX_DEGREES = 30;
const SWAY_MIDPOINT_DEGREES =
  (SWAY_MIN_DEGREES + SWAY_MAX_DEGREES) / 2;
const SWAY_AMPLITUDE_DEGREES =
  (SWAY_MAX_DEGREES - SWAY_MIN_DEGREES) / 2;
const SWAY_SAMPLE_RADIANS = Array.from({ length: 9 }, (_, index) =>
  ((SWAY_MIN_DEGREES +
    ((SWAY_MAX_DEGREES - SWAY_MIN_DEGREES) * index) / 8) *
    Math.PI) /
  180,
);
const SWAY_FACING_CACHE = new Map<string, number>();
const START_ANGLE = SWAY_MIN_DEGREES;
const REDUCED_MOTION_ANGLE = SWAY_MIDPOINT_DEGREES;
const LIGHT_DIRECTION = normalize({ x: -0.44, y: 0.76, z: 0.68 });

const BODY_FRONT = 0.34;
const BODY_BACK = -0.4;
const LENS_CENTER = { x: 0.27, y: 0.1 };

function subtract(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function scale(vector: Vec3, amount: number): Vec3 {
  return {
    x: vector.x * amount,
    y: vector.y * amount,
    z: vector.z * amount,
  };
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
  return scale(vector, 1 / length);
}

function faceNormal(points: Vec3[]): Vec3 {
  return normalize(
    cross(
      subtract(points[1]!, points[0]!),
      subtract(points[2]!, points[0]!),
    ),
  );
}

function orientFace(points: Vec3[], desiredNormal: Vec3): Vec3[] {
  return dot(faceNormal(points), desiredNormal) >= 0
    ? points
    : [...points].reverse();
}

function rotateToCamera(point: Vec3, angle: number): Vec3 {
  const cosY = Math.cos(angle);
  const sinY = Math.sin(angle);
  const x = point.x * cosY + point.z * sinY;
  const z = -point.x * sinY + point.z * cosY;

  const cosX = Math.cos(CAMERA_PITCH);
  const sinX = Math.sin(CAMERA_PITCH);
  return {
    x,
    y: point.y * cosX - z * sinX,
    z: point.y * sinX + z * cosX,
  };
}

function maximumSwayFacing(normal: Vec3): number {
  const unitNormal = normalize(normal);
  const key = `${unitNormal.x.toFixed(4)},${unitNormal.y.toFixed(4)},${unitNormal.z.toFixed(4)}`;
  const cached = SWAY_FACING_CACHE.get(key);
  if (cached !== undefined) return cached;

  let maximum = -1;
  for (const sampleAngle of SWAY_SAMPLE_RADIANS) {
    maximum = Math.max(
      maximum,
      rotateToCamera(unitNormal, sampleAngle).z,
    );
  }
  SWAY_FACING_CACHE.set(key, maximum);
  return maximum;
}

function project(point: Vec3): Vec2 {
  const perspective = CAMERA_DISTANCE / (CAMERA_DISTANCE - point.z);
  return {
    x: 60 + point.x * PROJECTION_SCALE * perspective,
    y: 53 - (point.y - 0.06) * PROJECTION_SCALE * perspective,
  };
}

function averageDepth(points: Vec3[]): number {
  return points.reduce((sum, point) => sum + point.z, 0) / points.length;
}

function formatPoints(points: Vec2[]): string {
  return points
    .map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`)
    .join(" ");
}

function formatCompoundPath(paths: Vec2[][]): string {
  return paths.map((points) => `M${formatPoints(points)} Z`).join(" ");
}

function rgba(alpha: number): string {
  return `rgba(229, 190, 255, ${alpha.toFixed(3)})`;
}

function faceFill(material: Material, normal: Vec3): string {
  const diffuse = Math.max(0, dot(normal, LIGHT_DIRECTION));

  if (material === "bodyDark") {
    const lift = Math.round(diffuse * 10);
    return `rgb(${16 + lift}, ${8 + lift}, ${23 + lift})`;
  }
  if (material === "grip") {
    const lift = Math.round(diffuse * 7);
    return `rgb(${10 + lift}, ${5 + lift}, ${15 + lift})`;
  }
  if (material === "lens") {
    const lift = Math.round(diffuse * 11);
    return `rgb(${19 + lift}, ${10 + lift}, ${27 + lift})`;
  }
  if (material === "lensBand") {
    const lift = Math.round(diffuse * 8);
    return `rgb(${9 + lift}, ${5 + lift}, ${14 + lift})`;
  }
  if (material === "control") {
    const lift = Math.round(diffuse * 10);
    return `rgb(${13 + lift}, ${7 + lift}, ${19 + lift})`;
  }
  if (material === "silver") {
    const lift = Math.round(diffuse * 24);
    return `rgb(${86 + lift}, ${57 + lift}, ${98 + lift})`;
  }
  const lift = Math.round(diffuse * 22);
  return `rgb(${54 + lift}, ${31 + lift}, ${66 + lift})`;
}

function roundedRectOutline(
  halfWidth: number,
  bottom: number,
  top: number,
  radius: number,
  segments = 3,
): Vec2[] {
  const points: Vec2[] = [];
  const corners = [
    { x: halfWidth - radius, y: bottom + radius, start: -Math.PI / 2 },
    { x: halfWidth - radius, y: top - radius, start: 0 },
    { x: -halfWidth + radius, y: top - radius, start: Math.PI / 2 },
    { x: -halfWidth + radius, y: bottom + radius, start: Math.PI },
  ];

  for (const corner of corners) {
    for (let step = 0; step <= segments; step += 1) {
      const theta = corner.start + (Math.PI / 2) * (step / segments);
      points.push({
        x: corner.x + Math.cos(theta) * radius,
        y: corner.y + Math.sin(theta) * radius,
      });
    }
  }

  return points;
}

function cubicOutline(start: Vec2, segments: CubicSegment[]): Vec2[] {
  const points = [start];
  let from = start;

  for (const segment of segments) {
    const steps = segment.steps ?? 4;
    for (let step = 1; step <= steps; step += 1) {
      const t = step / steps;
      const inverse = 1 - t;
      points.push({
        x:
          inverse ** 3 * from.x +
          3 * inverse ** 2 * t * segment.control1.x +
          3 * inverse * t ** 2 * segment.control2.x +
          t ** 3 * segment.to.x,
        y:
          inverse ** 3 * from.y +
          3 * inverse ** 2 * t * segment.control1.y +
          3 * inverse * t ** 2 * segment.control2.y +
          t ** 3 * segment.to.y,
      });
    }
    from = segment.to;
  }

  return points;
}

function roundedRectXZ(
  centerX: number,
  centerZ: number,
  y: number,
  halfWidth: number,
  halfDepth: number,
  radius: number,
): Vec3[] {
  return orientFace(
    roundedRectOutline(halfWidth, -halfDepth, halfDepth, radius, 4).map(
      (point) => ({
        x: centerX + point.x,
        y,
        z: centerZ + point.y,
      }),
    ),
    { x: 0, y: 1, z: 0 },
  );
}

function circleXY(
  centerX: number,
  centerY: number,
  z: number,
  radius: number,
  segments = 18,
): Vec3[] {
  return Array.from({ length: segments }, (_, index) => {
    const theta = (index / segments) * Math.PI * 2;
    return {
      x: centerX + Math.cos(theta) * radius,
      y: centerY + Math.sin(theta) * radius,
      z,
    };
  });
}

function circleXZ(
  centerX: number,
  y: number,
  centerZ: number,
  radius: number,
  segments = 12,
): Vec3[] {
  return orientFace(
    Array.from({ length: segments }, (_, index) => {
      const theta = (index / segments) * Math.PI * 2;
      return {
        x: centerX + Math.cos(theta) * radius,
        y,
        z: centerZ + Math.sin(theta) * radius,
      };
    }),
    { x: 0, y: 1, z: 0 },
  );
}

function circleOnPlane(
  center: Vec3,
  normal: Vec3,
  radius: number,
  segments = 20,
): Vec3[] {
  const unitNormal = normalize(normal);
  const reference =
    Math.abs(unitNormal.x) < 0.9
      ? { x: 1, y: 0, z: 0 }
      : { x: 0, y: 1, z: 0 };
  const tangent = normalize(cross(reference, unitNormal));
  const bitangent = normalize(cross(unitNormal, tangent));

  return orientFace(
    Array.from({ length: segments }, (_, index) => {
      const theta = (index / segments) * Math.PI * 2;
      const tangentAmount = Math.cos(theta) * radius;
      const bitangentAmount = Math.sin(theta) * radius;
      return {
        x:
          center.x +
          tangent.x * tangentAmount +
          bitangent.x * bitangentAmount,
        y:
          center.y +
          tangent.y * tangentAmount +
          bitangent.y * bitangentAmount,
        z:
          center.z +
          tangent.z * tangentAmount +
          bitangent.z * bitangentAmount,
      };
    }),
    unitNormal,
  );
}

function readPinnedCameraAngle(): number | null {
  if (!import.meta.env.DEV || typeof window === "undefined") return null;
  const raw = new URLSearchParams(window.location.search).get("cameraAngle");
  if (raw === null) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function useCameraAngle(): { angle: number; fps: number } {
  const { fps, frameIntervalMs, prefersReducedMotion } =
    useModelTiming("camera");
  const [pinnedAngle] = useState<number | null>(readPinnedCameraAngle);
  const [angle, setAngle] = useState(pinnedAngle ?? START_ANGLE);
  const startTime = useRef<number | null>(null);

  useEffect(() => {
    if (pinnedAngle !== null) {
      setAngle(pinnedAngle);
      return;
    }

    if (prefersReducedMotion) {
      setAngle(REDUCED_MOTION_ANGLE);
      return;
    }

    let animationFrame = 0;
    let lastFrame = 0;

    const update = (time: number) => {
      if (startTime.current === null) startTime.current = time;
      const frameDelta = time - lastFrame;
      if (frameDelta >= frameIntervalMs) {
        const progress = (time - startTime.current) / SWAY_DURATION_MS;
        setAngle(
          SWAY_MIDPOINT_DEGREES -
            Math.cos(progress * Math.PI * 2) * SWAY_AMPLITUDE_DEGREES,
        );
        lastFrame = time - (frameDelta % frameIntervalMs);
      }
      animationFrame = window.requestAnimationFrame(update);
    };

    animationFrame = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [frameIntervalMs, pinnedAngle, prefersReducedMotion]);

  return { angle, fps };
}

function buildCamera(angleDegrees: number): RenderItem[] {
  const angle = (angleDegrees * Math.PI) / 180;
  const pinnedOutsideSway =
    angleDegrees < SWAY_MIN_DEGREES || angleDegrees > SWAY_MAX_DEGREES;
  const sortAngle = pinnedOutsideSway
    ? angle
    : (SWAY_MIDPOINT_DEGREES * Math.PI) / 180;
  const items: RenderItem[] = [];

  const maximumRelevantFacing = (normal: Vec3) =>
    pinnedOutsideSway
      ? rotateToCamera(normalize(normal), angle).z
      : maximumSwayFacing(normal);
  const stableDepth = (points: Vec3[]) =>
    averageDepth(points.map((point) => rotateToCamera(point, sortAngle)));

  const addFace = (
    id: string,
    points: Vec3[],
    material: Material,
    strokeWidth = 0.62,
    layer = 10,
  ) => {
    const worldNormal = faceNormal(points);
    if (maximumRelevantFacing(worldNormal) <= -0.08) return;
    const cameraNormal = rotateToCamera(worldNormal, angle);
    const cameraPoints = points.map((point) => rotateToCamera(point, angle));
    items.push({
      kind: "polygon",
      id,
      layer,
      points: cameraPoints.map(project),
      depth: stableDepth(points),
      fill: faceFill(material, normalize(cameraNormal)),
      opacity: 1,
      stroke: rgba(material === "lensBand" || material === "grip" ? 0.34 : 0.48),
      strokeWidth,
    });
  };

  const addDetailPolygon = (
    id: string,
    points: Vec3[],
    normal: Vec3,
    fill: string,
    stroke = "rgba(238, 211, 255, 0.42)",
    strokeWidth = 0.42,
    facingThreshold = 0.02,
    depthLift = 0.008,
    layer = 20,
  ) => {
    if (maximumRelevantFacing(normal) <= facingThreshold - 0.07) return;
    const cameraPoints = points.map((point) => rotateToCamera(point, angle));
    items.push({
      kind: "polygon",
      id,
      layer,
      points: cameraPoints.map(project),
      depth: stableDepth(points) + depthLift,
      fill,
      opacity: 1,
      stroke,
      strokeWidth,
    });
  };

  const addDetailLine = (
    id: string,
    points: Vec3[],
    normal: Vec3,
    stroke: string,
    strokeWidth: number,
    opacity = 1,
    facingThreshold = 0.02,
    depthLift = 0.01,
    layer = 20,
  ) => {
    if (maximumRelevantFacing(normal) <= facingThreshold - 0.07) return;
    const cameraPoints = points.map((point) => rotateToCamera(point, angle));
    items.push({
      kind: "line",
      id,
      layer,
      points: cameraPoints.map(project),
      depth: stableDepth(points) + depthLift,
      stroke,
      strokeWidth,
      opacity,
    });
  };

  const addRoundedPrism = (
    id: string,
    outline: Vec2[],
    backZ: number,
    frontZ: number,
    material: Material,
    faceStrokeWidth = 0.58,
    edgeStrokeWidth = 0.12,
    layer = 10,
  ) => {
    const front = outline.map((point) => ({ ...point, z: frontZ }));
    const back = outline.map((point) => ({ ...point, z: backZ }));
    addFace(`${id}-front`, front, material, faceStrokeWidth, layer);
    addFace(`${id}-back`, [...back].reverse(), material, faceStrokeWidth, layer);

    for (let index = 0; index < outline.length; index += 1) {
      const next = (index + 1) % outline.length;
      addFace(
        `${id}-edge-${index}`,
        [front[index]!, back[index]!, back[next]!, front[next]!],
        material,
        edgeStrokeWidth,
        layer,
      );
    }
  };

  const addTopDial = (
    id: string,
    centerX: number,
    centerZ: number,
    baseY: number,
    radius: number,
    options: {
      height?: number;
      innerRadius?: number;
      tickAngle?: number | null;
      layer?: number;
      sideFill?: string;
      topFill?: string;
      innerFill?: string;
    } = {},
  ) => {
    const height = options.height ?? 0.07;
    const innerRadius = options.innerRadius ?? radius * 0.68;
    const tickAngle = options.tickAngle ?? null;
    const layer = options.layer ?? 60;
    const sideFill = options.sideFill ?? "url(#camera-dial-side)";
    const topFill = options.topFill ?? "url(#camera-control-top)";
    const innerFill = options.innerFill ?? "url(#camera-control-center)";
    const sideSegments = 12;
    const visibleSideFaces: Vec3[][] = [];

    for (let index = 0; index < sideSegments; index += 1) {
      const next = (index + 1) % sideSegments;
      const theta = (index / sideSegments) * Math.PI * 2;
      const nextTheta = (next / sideSegments) * Math.PI * 2;
      const middleTheta = theta + Math.PI / sideSegments;
      const normal = normalize({
        x: Math.cos(middleTheta),
        y: 0,
        z: Math.sin(middleTheta),
      });
      if (maximumRelevantFacing(normal) <= -0.07) continue;
      visibleSideFaces.push(
        orientFace(
          [
            {
              x: centerX + Math.cos(theta) * radius,
              y: baseY,
              z: centerZ + Math.sin(theta) * radius,
            },
            {
              x: centerX + Math.cos(nextTheta) * radius,
              y: baseY,
              z: centerZ + Math.sin(nextTheta) * radius,
            },
            {
              x: centerX + Math.cos(nextTheta) * radius,
              y: baseY + height,
              z: centerZ + Math.sin(nextTheta) * radius,
            },
            {
              x: centerX + Math.cos(theta) * radius,
              y: baseY + height,
              z: centerZ + Math.sin(theta) * radius,
            },
          ],
          normal,
        ),
      );
    }

    if (visibleSideFaces.length > 0) {
      const allSidePoints = visibleSideFaces.flat();
      items.push({
        kind: "compound",
        id: `${id}-sides`,
        layer,
        paths: visibleSideFaces.map((face) =>
          face.map((point) => project(rotateToCamera(point, angle))),
        ),
        depth: stableDepth(allSidePoints),
        fill: sideFill,
        opacity: 1,
        stroke: "none",
        strokeWidth: 0,
      });
    }

    addDetailPolygon(
      `${id}-outer`,
      circleXZ(centerX, baseY + height, centerZ, radius, 18),
      { x: 0, y: 1, z: 0 },
      topFill,
      "rgba(249, 229, 255, 0.72)",
      0.42,
      0,
      0.004,
      layer,
    );
    if (innerRadius > 0) {
      addDetailPolygon(
        `${id}-inner`,
        circleXZ(
          centerX,
          baseY + height + 0.006,
          centerZ,
          innerRadius,
          18,
        ),
        { x: 0, y: 1, z: 0 },
        innerFill,
        "rgba(255, 241, 255, 0.58)",
        0.32,
        0,
        0.006,
        layer,
      );
    }
    if (tickAngle !== null) {
      addDetailLine(
        `${id}-index`,
        [0.6, 0.9].map((distance) => ({
          x: centerX + Math.cos(tickAngle) * radius * distance,
          y: baseY + height + 0.014,
          z: centerZ + Math.sin(tickAngle) * radius * distance,
        })),
        { x: 0, y: 1, z: 0 },
        "rgb(255, 237, 255)",
        0.62,
        1,
        0,
        0.012,
        layer,
      );
    }
  };

  const addLens = () => {
    const sections = [
      {
        backZ: 0.42,
        frontZ: 0.56,
        backRadius: 0.77,
        frontRadius: 0.78,
        fill: "url(#camera-lens-collar)",
      },
      {
        backZ: 0.56,
        frontZ: 0.96,
        backRadius: 0.78,
        frontRadius: 0.79,
        fill: "url(#camera-lens-barrel)",
      },
      {
        backZ: 0.96,
        frontZ: 1.27,
        backRadius: 0.79,
        frontRadius: 0.8,
        fill: "url(#camera-lens-focus-band)",
      },
      {
        backZ: 1.27,
        frontZ: 1.42,
        backRadius: 0.8,
        frontRadius: 0.79,
        fill: "url(#camera-lens-barrel)",
      },
    ];
    const barrelArcSegments = 20;
    const frontSegments = 32;
    const facingCenter = Math.atan2(
      Math.sin(CAMERA_PITCH),
      -Math.sin(sortAngle) * Math.cos(CAMERA_PITCH),
    );
    const barrelPoint = (
      z: number,
      radius: number,
      step: number,
    ): Vec3 => {
      const theta =
        facingCenter -
        Math.PI / 2 +
        Math.PI * (step / barrelArcSegments);
      return {
        x: LENS_CENTER.x + Math.cos(theta) * radius,
        y: LENS_CENTER.y + Math.sin(theta) * radius,
        z,
      };
    };

    addDetailPolygon(
      "mount-base",
      circleXY(LENS_CENTER.x, LENS_CENTER.y, BODY_FRONT + 0.018, 0.82, frontSegments),
      { x: 0, y: 0, z: 1 },
      "rgb(58, 39, 65)",
      "rgba(237, 211, 251, 0.48)",
      0.52,
      0,
      0,
      50,
    );
    addDetailPolygon(
      "mount-copper-outer",
      circleXY(LENS_CENTER.x, LENS_CENTER.y, 0.392, 0.79, frontSegments),
      { x: 0, y: 0, z: 1 },
      "rgb(176, 92, 54)",
      "rgba(255, 193, 142, 0.76)",
      0.58,
      0,
      0,
      51,
    );
    addDetailPolygon(
      "mount-copper-inner",
      circleXY(LENS_CENTER.x, LENS_CENTER.y, 0.398, 0.77, frontSegments),
      { x: 0, y: 0, z: 1 },
      "rgb(15, 8, 20)",
      "none",
      0,
      0,
      0,
      51,
    );

    for (const [sectionIndex, section] of sections.entries()) {
      const rearArc = Array.from(
        { length: barrelArcSegments + 1 },
        (_, step) => barrelPoint(section.backZ, section.backRadius, step),
      );
      const frontArc = Array.from(
        { length: barrelArcSegments + 1 },
        (_, step) =>
          barrelPoint(
            section.frontZ,
            section.frontRadius,
            barrelArcSegments - step,
          ),
      );
      const worldPoints = [...rearArc, ...frontArc];
      const cameraPoints = worldPoints.map((point) =>
        rotateToCamera(point, angle),
      );
      items.push({
        kind: "polygon",
        id: `lens-section-${sectionIndex}`,
        layer: 70,
        points: cameraPoints.map(project),
        depth: stableDepth(worldPoints),
        fill: section.fill,
        opacity: 1,
        stroke: "none",
        strokeWidth: 0,
      });
    }

    addDetailPolygon(
      "lens-front-rim",
      circleXY(LENS_CENTER.x, LENS_CENTER.y, 1.425, 0.79, frontSegments),
      { x: 0, y: 0, z: 1 },
      "rgb(9, 4, 14)",
      "rgba(226, 192, 246, 0.48)",
      0.55,
      0,
      0.004,
      70,
    );
    addDetailPolygon(
      "lens-glass",
      circleXY(LENS_CENTER.x, LENS_CENTER.y, 1.438, 0.59, frontSegments),
      { x: 0, y: 0, z: 1 },
      "url(#camera-lens-glass)",
      "rgba(239, 214, 255, 0.42)",
      0.48,
      0,
      0.008,
      70,
    );
    addDetailLine(
      "lens-glint",
      [
        { x: LENS_CENTER.x - 0.35, y: LENS_CENTER.y + 0.22, z: 1.449 },
        { x: LENS_CENTER.x - 0.14, y: LENS_CENTER.y + 0.39, z: 1.449 },
        { x: LENS_CENTER.x + 0.08, y: LENS_CENTER.y + 0.4, z: 1.449 },
      ],
      { x: 0, y: 0, z: 1 },
      "rgba(249, 234, 255, 0.74)",
      0.72,
      0.72,
      0,
      0.012,
      70,
    );
  };

  const bodyStart = { x: 1.32, y: -0.76 };
  const bodyOutline = cubicOutline(bodyStart, [
    {
      control1: { x: 1.42, y: -0.76 },
      control2: { x: 1.48, y: -0.7 },
      to: { x: 1.48, y: -0.59 },
    },
    {
      control1: { x: 1.48, y: -0.12 },
      control2: { x: 1.48, y: 0.56 },
      to: { x: 1.46, y: 0.77 },
    },
    {
      control1: { x: 1.45, y: 0.88 },
      control2: { x: 1.4, y: 0.94 },
      to: { x: 1.28, y: 0.95 },
    },
    {
      control1: { x: 0.54, y: 0.96 },
      control2: { x: -0.72, y: 0.95 },
      to: { x: -1.33, y: 0.94 },
      steps: 6,
    },
    {
      control1: { x: -1.44, y: 0.93 },
      control2: { x: -1.49, y: 0.86 },
      to: { x: -1.5, y: 0.75 },
    },
    {
      control1: { x: -1.52, y: 0.25 },
      control2: { x: -1.51, y: -0.39 },
      to: { x: -1.49, y: -0.58 },
    },
    {
      control1: { x: -1.48, y: -0.7 },
      control2: { x: -1.42, y: -0.76 },
      to: { x: -1.31, y: -0.76 },
    },
    {
      control1: { x: -0.58, y: -0.77 },
      control2: { x: 0.7, y: -0.76 },
      to: bodyStart,
      steps: 6,
    },
  ]).slice(0, -1);
  addRoundedPrism(
    "body",
    bodyOutline,
    BODY_BACK,
    BODY_FRONT,
    "body",
    0.62,
    0,
    10,
  );

  const frontPanelStart = { x: 1.31, y: -0.68 };
  const frontPanelOutline = cubicOutline(frontPanelStart, [
    {
      control1: { x: 1.38, y: -0.68 },
      control2: { x: 1.42, y: -0.63 },
      to: { x: 1.42, y: -0.54 },
    },
    {
      control1: { x: 1.42, y: -0.2 },
      control2: { x: 1.42, y: 0.27 },
      to: { x: 1.4, y: 0.5 },
    },
    {
      control1: { x: 1.39, y: 0.56 },
      control2: { x: 1.34, y: 0.59 },
      to: { x: 1.27, y: 0.59 },
    },
    {
      control1: { x: 0.45, y: 0.58 },
      control2: { x: -0.62, y: 0.58 },
      to: { x: -1.31, y: 0.57 },
      steps: 6,
    },
    {
      control1: { x: -1.38, y: 0.56 },
      control2: { x: -1.42, y: 0.5 },
      to: { x: -1.42, y: 0.43 },
    },
    {
      control1: { x: -1.43, y: 0.08 },
      control2: { x: -1.42, y: -0.35 },
      to: { x: -1.4, y: -0.56 },
    },
    {
      control1: { x: -1.39, y: -0.64 },
      control2: { x: -1.35, y: -0.68 },
      to: { x: -1.28, y: -0.68 },
    },
    {
      control1: { x: -0.49, y: -0.69 },
      control2: { x: 0.62, y: -0.68 },
      to: frontPanelStart,
      steps: 6,
    },
  ]).slice(0, -1);
  addDetailPolygon(
    "front-body-panel",
    frontPanelOutline.map((point) => ({ ...point, z: BODY_FRONT + 0.008 })),
    { x: 0, y: 0, z: 1 },
    "url(#camera-front-panel)",
    "rgba(229, 190, 255, 0.2)",
    0.32,
    0,
    0,
    20,
  );

  const topBandStart = { x: 1.32, y: 0.53 };
  const topBandOutline = cubicOutline(topBandStart, [
    {
      control1: { x: 1.38, y: 0.54 },
      control2: { x: 1.41, y: 0.6 },
      to: { x: 1.39, y: 0.68 },
    },
    {
      control1: { x: 1.38, y: 0.8 },
      control2: { x: 1.34, y: 0.88 },
      to: { x: 1.25, y: 0.9 },
    },
    {
      control1: { x: 0.52, y: 0.92 },
      control2: { x: -0.65, y: 0.91 },
      to: { x: -1.28, y: 0.89 },
      steps: 6,
    },
    {
      control1: { x: -1.36, y: 0.88 },
      control2: { x: -1.4, y: 0.81 },
      to: { x: -1.4, y: 0.72 },
    },
    {
      control1: { x: -1.4, y: 0.62 },
      control2: { x: -1.35, y: 0.55 },
      to: { x: -1.27, y: 0.54 },
    },
    {
      control1: { x: -0.47, y: 0.52 },
      control2: { x: 0.65, y: 0.52 },
      to: topBandStart,
      steps: 6,
    },
  ]).slice(0, -1);
  addDetailPolygon(
    "front-top-band",
    topBandOutline.map((point) => ({ ...point, z: BODY_FRONT + 0.014 })),
    { x: 0, y: 0, z: 1 },
    "url(#camera-top-band)",
    "rgba(250, 235, 255, 0.5)",
    0.4,
    0,
    0,
    31,
  );

  const gripStart = { x: -0.84, y: -0.69 };
  const gripOutline = cubicOutline(gripStart, [
    {
      control1: { x: -0.77, y: -0.61 },
      control2: { x: -0.75, y: -0.5 },
      to: { x: -0.75, y: -0.37 },
    },
    {
      control1: { x: -0.75, y: -0.05 },
      control2: { x: -0.74, y: 0.29 },
      to: { x: -0.79, y: 0.44 },
    },
    {
      control1: { x: -0.83, y: 0.55 },
      control2: { x: -0.92, y: 0.63 },
      to: { x: -1.06, y: 0.66 },
    },
    {
      control1: { x: -1.22, y: 0.69 },
      control2: { x: -1.39, y: 0.65 },
      to: { x: -1.48, y: 0.54 },
    },
    {
      control1: { x: -1.53, y: 0.37 },
      control2: { x: -1.54, y: -0.35 },
      to: { x: -1.49, y: -0.56 },
      steps: 5,
    },
    {
      control1: { x: -1.46, y: -0.67 },
      control2: { x: -1.39, y: -0.72 },
      to: { x: -1.28, y: -0.73 },
    },
    {
      control1: { x: -1.06, y: -0.74 },
      control2: { x: -0.91, y: -0.73 },
      to: gripStart,
    },
  ]).slice(0, -1);
  const gripAttachOutline = gripOutline.map((point) => {
    const innerBlend = Math.min(1, Math.max(0, (point.x + 1.12) / 0.37));
    const upperBlend = Math.min(1, Math.max(0, (point.y + 0.18) / 0.82));
    return {
      x: point.x + innerBlend * 0.19,
      y: point.y + innerBlend * upperBlend * 0.1,
    };
  });
  const gripMidOutline = gripOutline.map((point, index) => {
    const attachPoint = gripAttachOutline[index]!;
    return {
      x: point.x * 0.54 + attachPoint.x * 0.46,
      y: point.y * 0.54 + attachPoint.y * 0.46,
    };
  });
  const gripRings = [
    { outline: gripAttachOutline, z: BODY_FRONT + 0.012 },
    { outline: gripMidOutline, z: 0.52 },
    { outline: gripOutline, z: 0.7 },
  ];

  for (let ringIndex = 0; ringIndex < gripRings.length - 1; ringIndex += 1) {
    const rearRing = gripRings[ringIndex]!;
    const forwardRing = gripRings[ringIndex + 1]!;
    for (let index = 9; index < gripOutline.length; index += 1) {
      const next = (index + 1) % gripOutline.length;
      addFace(
        `grip-exterior-${ringIndex}-${index}`,
        [
          { ...forwardRing.outline[index]!, z: forwardRing.z },
          { ...rearRing.outline[index]!, z: rearRing.z },
          { ...rearRing.outline[next]!, z: rearRing.z },
          { ...forwardRing.outline[next]!, z: forwardRing.z },
        ],
        "grip",
        0,
        40,
      );
    }
  }
  addDetailPolygon(
    "grip-front",
    gripOutline.map((point) => ({ ...point, z: 0.7 })),
    { x: 0, y: 0, z: 1 },
    "url(#camera-grip-front)",
    "rgba(230, 198, 246, 0.42)",
    0.48,
    0,
    0,
    45,
  );

  const shoulderFrontOuter = { x: -1.45, y: 0.56, z: 0.7 };
  const shoulderFrontInner = { x: -0.82, y: 0.54, z: 0.7 };
  const shoulderMidInner = { x: -0.75, y: 0.74, z: 0.46 };
  const shoulderMidOuter = { x: -1.43, y: 0.77, z: 0.46 };
  const shoulderRearInner = { x: -0.72, y: 0.92, z: 0.1 };
  const shoulderRearOuter = { x: -1.39, y: 0.94, z: 0.08 };
  const gripShoulderFront = orientFace(
    [
      shoulderFrontOuter,
      shoulderFrontInner,
      shoulderMidInner,
      shoulderMidOuter,
    ],
    { x: 0, y: 1, z: 0.55 },
  );
  const gripShoulderRear = orientFace(
    [
      shoulderMidOuter,
      shoulderMidInner,
      shoulderRearInner,
      shoulderRearOuter,
    ],
    { x: 0, y: 1, z: 0.45 },
  );
  addDetailPolygon(
    "grip-shoulder-front",
    gripShoulderFront,
    faceNormal(gripShoulderFront),
    "url(#camera-grip-shoulder)",
    "none",
    0,
    0,
    0,
    42,
  );
  addDetailPolygon(
    "grip-shoulder-rear",
    gripShoulderRear,
    faceNormal(gripShoulderRear),
    "url(#camera-grip-shoulder)",
    "none",
    0,
    0,
    0,
    42,
  );

  const evfStart = { x: 1.32, y: 0.76 };
  const evfOutline = cubicOutline(evfStart, [
    {
      control1: { x: 1.39, y: 0.78 },
      control2: { x: 1.43, y: 0.82 },
      to: { x: 1.43, y: 0.89 },
    },
    {
      control1: { x: 1.43, y: 0.98 },
      control2: { x: 1.37, y: 1.03 },
      to: { x: 1.27, y: 1.03 },
    },
    {
      control1: { x: 1.12, y: 1.03 },
      control2: { x: 0.94, y: 1.03 },
      to: { x: 0.88, y: 0.99 },
    },
    {
      control1: { x: 0.84, y: 0.94 },
      control2: { x: 0.84, y: 0.84 },
      to: { x: 0.91, y: 0.79 },
    },
    {
      control1: { x: 1.02, y: 0.75 },
      control2: { x: 1.22, y: 0.76 },
      to: evfStart,
    },
  ]).slice(0, -1);
  addRoundedPrism(
    "corner-evf",
    evfOutline,
    BODY_BACK - 0.16,
    -0.12,
    "bodyDark",
    0.42,
    0,
    0,
  );

  addDetailPolygon(
    "top-plate",
    roundedRectXZ(0, -0.04, 0.958, 1.38, 0.33, 0.08),
    { x: 0, y: 1, z: 0 },
    "url(#camera-top-plate)",
    "rgba(242, 216, 255, 0.36)",
    0.38,
    0,
    0,
    30,
  );
  addTopDial("mode-selector", -0.42, 0.04, 0.972, 0.25, {
    height: 0.045,
    innerRadius: 0,
    tickAngle: -0.72,
    layer: 58,
    topFill: "url(#camera-mode-selector)",
  });
  addTopDial("mode-dial", -0.42, 0.04, 1.01, 0.21, {
    height: 0.075,
    innerRadius: 0.148,
    tickAngle: 0.72,
    layer: 60,
  });
  addTopDial("rear-dial-r", -1.02, -0.23, 0.972, 0.205, {
    height: 0.052,
    innerRadius: 0.15,
    tickAngle: 2.24,
    layer: 60,
  });

  addDetailPolygon(
    "movie-button-ring",
    circleXZ(-0.83, 0.992, 0.27, 0.07, 16),
    { x: 0, y: 1, z: 0 },
    "rgb(176, 64, 92)",
    "rgba(255, 184, 207, 0.72)",
    0.38,
    0,
    0,
    60,
  );
  addDetailPolygon(
    "movie-button",
    circleXZ(-0.83, 0.998, 0.27, 0.041, 14),
    { x: 0, y: 1, z: 0 },
    "url(#camera-movie-button)",
    "none",
    0,
    0,
    0.004,
    60,
  );

  const shutterPlaneNormal = faceNormal(gripShoulderRear);
  const shutterCenter = { x: -1.16, y: 0.79, z: 0.39 };
  addDetailPolygon(
    "shutter-power-ring",
    circleOnPlane(shutterCenter, shutterPlaneNormal, 0.148, 18),
    shutterPlaneNormal,
    "url(#camera-shutter-ring)",
    "rgba(242, 215, 250, 0.5)",
    0.48,
    0,
    0,
    60,
  );
  addDetailPolygon(
    "shutter-button",
    circleOnPlane(
      {
        x: shutterCenter.x,
        y: shutterCenter.y + shutterPlaneNormal.y * 0.012,
        z: shutterCenter.z + shutterPlaneNormal.z * 0.012,
      },
      shutterPlaneNormal,
      0.08,
      16,
    ),
    shutterPlaneNormal,
    "url(#camera-shutter-button)",
    "rgba(255, 240, 255, 0.68)",
    0.36,
    0,
    0.004,
    60,
  );
  const shutterReference = { x: 1, y: 0, z: 0 };
  const shutterTangent = normalize(cross(shutterReference, shutterPlaneNormal));
  const shutterBitangent = normalize(cross(shutterPlaneNormal, shutterTangent));
  const powerLeverPoint = (distance: number) => {
    const theta = 0.82;
    return {
      x:
        shutterCenter.x +
        shutterTangent.x * Math.cos(theta) * distance +
        shutterBitangent.x * Math.sin(theta) * distance,
      y:
        shutterCenter.y +
        shutterTangent.y * Math.cos(theta) * distance +
        shutterBitangent.y * Math.sin(theta) * distance,
      z:
        shutterCenter.z +
        shutterTangent.z * Math.cos(theta) * distance +
        shutterBitangent.z * Math.sin(theta) * distance,
    };
  };
  addDetailLine(
    "power-switch-lever",
    [powerLeverPoint(0.105), powerLeverPoint(0.164)],
    shutterPlaneNormal,
    "rgb(255, 231, 255)",
    0.82,
    1,
    0,
    0.012,
    60,
  );

  addDetailPolygon(
    "lens-release",
    circleXY(-0.59, -0.36, BODY_FRONT + 0.022, 0.09, 16),
    { x: 0, y: 0, z: 1 },
    "rgb(11, 6, 16)",
    "rgba(229, 190, 255, 0.52)",
    0.38,
    0,
    0,
    60,
  );

  addLens();

  return items.sort(
    (a, b) => a.layer - b.layer || a.depth - b.depth || a.id.localeCompare(b.id),
  );
}

function CameraWatermark() {
  const { angle, fps } = useCameraAngle();
  const items = useMemo(() => buildCamera(angle), [angle]);

  return (
    <svg
      aria-hidden="true"
      className="h-full w-full overflow-visible"
      data-model="hobbies-camera"
      data-model-angle={angle.toFixed(1)}
      data-model-fps={fps}
      fill="none"
      viewBox="0 0 120 100"
    >
      <defs>
        <radialGradient id="camera-lens-glass" cx="36%" cy="30%" r="72%">
          <stop offset="0%" stopColor="#8d5aa3" stopOpacity="0.86" />
          <stop offset="42%" stopColor="#32143f" stopOpacity="0.96" />
          <stop offset="100%" stopColor="#08040d" />
        </radialGradient>
        <linearGradient id="camera-lens-collar" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3a263f" />
          <stop offset="52%" stopColor="#211327" />
          <stop offset="100%" stopColor="#0d0711" />
        </linearGradient>
        <linearGradient id="camera-lens-barrel" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2a1931" />
          <stop offset="48%" stopColor="#160c1d" />
          <stop offset="100%" stopColor="#09050d" />
        </linearGradient>
        <linearGradient id="camera-lens-focus-band" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#211329" />
          <stop offset="52%" stopColor="#120a18" />
          <stop offset="100%" stopColor="#07040a" />
        </linearGradient>
        <linearGradient id="camera-front-panel" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#24122e" />
          <stop offset="58%" stopColor="#150a1d" />
          <stop offset="100%" stopColor="#0b060f" />
        </linearGradient>
        <linearGradient id="camera-top-band" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#6d487c" />
          <stop offset="48%" stopColor="#493052" />
          <stop offset="100%" stopColor="#2a1932" />
        </linearGradient>
        <linearGradient id="camera-top-plate" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60406e" />
          <stop offset="55%" stopColor="#3d2848" />
          <stop offset="100%" stopColor="#211328" />
        </linearGradient>
        <linearGradient id="camera-grip-front" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#211329" />
          <stop offset="58%" stopColor="#130a19" />
          <stop offset="100%" stopColor="#08040c" />
        </linearGradient>
        <linearGradient id="camera-grip-shoulder" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#493052" />
          <stop offset="100%" stopColor="#160c1d" />
        </linearGradient>
        <linearGradient id="camera-dial-side" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#7b5388" />
          <stop offset="100%" stopColor="#24142c" />
        </linearGradient>
        <radialGradient id="camera-mode-selector" cx="38%" cy="32%" r="70%">
          <stop offset="0%" stopColor="#684573" />
          <stop offset="100%" stopColor="#201127" />
        </radialGradient>
        <radialGradient id="camera-control-top" cx="36%" cy="30%" r="72%">
          <stop offset="0%" stopColor="#a97ebb" />
          <stop offset="54%" stopColor="#64436f" />
          <stop offset="100%" stopColor="#2b1934" />
        </radialGradient>
        <radialGradient id="camera-control-center" cx="35%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#d7afe4" />
          <stop offset="52%" stopColor="#684474" />
          <stop offset="100%" stopColor="#24132c" />
        </radialGradient>
        <radialGradient id="camera-shutter-ring" cx="34%" cy="28%" r="74%">
          <stop offset="0%" stopColor="#a17aad" />
          <stop offset="55%" stopColor="#5d3d69" />
          <stop offset="100%" stopColor="#211229" />
        </radialGradient>
        <radialGradient id="camera-shutter-button" cx="34%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#5f3c6c" />
          <stop offset="62%" stopColor="#24132c" />
          <stop offset="100%" stopColor="#09050d" />
        </radialGradient>
        <radialGradient id="camera-movie-button" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#4b2636" />
          <stop offset="100%" stopColor="#120811" />
        </radialGradient>
      </defs>
      <g>
        {items.map((item) =>
          item.kind === "compound" ? (
            <path
              key={item.id}
              data-part={item.id}
              d={formatCompoundPath(item.paths)}
              fill={item.fill}
              opacity={item.opacity}
              stroke={item.stroke}
              strokeLinejoin="round"
              strokeWidth={item.strokeWidth}
              vectorEffect="non-scaling-stroke"
            />
          ) : item.kind === "polygon" ? (
            <polygon
              key={item.id}
              data-part={item.id}
              fill={item.fill}
              opacity={item.opacity}
              points={formatPoints(item.points)}
              stroke={item.stroke}
              strokeLinejoin="round"
              strokeWidth={item.strokeWidth}
              vectorEffect="non-scaling-stroke"
            />
          ) : (
            <polyline
              key={item.id}
              data-part={item.id}
              fill="none"
              opacity={item.opacity}
              points={formatPoints(item.points)}
              stroke={item.stroke}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={item.strokeWidth}
              vectorEffect="non-scaling-stroke"
            />
          ),
        )}
      </g>
    </svg>
  );
}

export default memo(CameraWatermark);
