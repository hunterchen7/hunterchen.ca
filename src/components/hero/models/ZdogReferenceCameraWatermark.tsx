import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { HERO_COLORS, litHeroTone } from "../heroPalette";
import ModelSvg from "./ModelSvg";
import { readPinnedModelFrame, useModelTiming } from "./modelMotion";

type Vec3 = { x: number; y: number; z: number };

type FaceItem = {
  color: string;
  depth: number;
  id: string;
  kind: "face";
  points: Vec3[];
  sortLayer: number;
  sortPoint: Vec3;
  strokeColor?: string;
  strokeWidth?: number;
};

type LineItem = {
  closed: boolean;
  color: string;
  depth: number;
  id: string;
  kind: "line";
  lineCap: "butt" | "round";
  points: Vec3[];
  sortLayer: number;
  sortPoint: Vec3;
  strokeWidth: number;
};

type GroupItem = {
  children: SceneItem[];
  depth: number;
  id: string;
  kind: "group";
  renderOrder: "cylinder" | "source";
  sortLayer: number;
  sortPoint: Vec3;
};

type SceneItem = FaceItem | GroupItem | LineItem;

type BoxOptions = {
  bottomFace?: string;
  color: string;
  depth: number;
  frontFace?: string;
  height: number;
  id: string;
  leftFace?: string;
  rearFace?: string;
  rightFace?: string;
  sortLayer?: number;
  topFace?: string;
  translate: Vec3;
  width: number;
};

type CylinderOptions = {
  capOutline?: boolean;
  color?: string;
  diameter: number;
  edgeColor?: string;
  frontCap?: boolean;
  frontFace?: string;
  highlight?: boolean;
  highlightColor?: string;
  id: string;
  length: number;
  rearCap?: boolean;
  rotate?: Partial<Vec3>;
  sortLayer?: number;
  stroke?: number;
  translate: Vec3;
};

const SOURCE_URL =
  "https://github.com/LordExodius/LordExodius.github.io/blob/main/scripts/zdog/zdog-camera.js";
const LOOP_DURATION_MS = 10_800;
const ROOT_PITCH = -0.2;
const CAMERA_SCALE = 4;
const CENTER_X = 58;
const CENTER_Y = 50;
const CYLINDER_SEGMENTS = 32;
const YAW_MIN = -0.18;
const YAW_MAX = 0.3;
const YAW_MIDPOINT = (YAW_MIN + YAW_MAX) / 2;
const YAW_AMPLITUDE = (YAW_MAX - YAW_MIN) / 2;
const CAMERA_EDGE = litHeroTone("mid", 8);
const CAMERA_DIAL_FACE = litHeroTone("mid", 18);
const CAMERA_LENS_GRADIENT_ID = "hobbies-camera-lens-barrel";
const CAMERA_GLASS_GRADIENT_ID = "hobbies-camera-lens-glass";

function add(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function rotate(point: Vec3, rotation: Partial<Vec3>): Vec3 {
  let { x, y, z } = point;

  if (rotation.z) {
    const cosine = Math.cos(rotation.z);
    const sine = Math.sin(rotation.z);
    [x, y] = [x * cosine - y * sine, y * cosine + x * sine];
  }
  if (rotation.y) {
    const cosine = Math.cos(rotation.y);
    const sine = Math.sin(rotation.y);
    [x, z] = [x * cosine - z * sine, z * cosine + x * sine];
  }
  if (rotation.x) {
    const cosine = Math.cos(rotation.x);
    const sine = Math.sin(rotation.x);
    [y, z] = [y * cosine - z * sine, z * cosine + y * sine];
  }

  return { x, y, z };
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

function addFace(
  items: SceneItem[],
  id: string,
  color: string,
  points: Vec3[],
  sortPoint = averagePoint(points),
  sortLayer = 0,
): void {
  items.push({
    color,
    depth: sortPoint.z,
    id,
    kind: "face",
    points,
    sortLayer,
    sortPoint,
    strokeColor: CAMERA_EDGE,
    strokeWidth: 0.12,
  });
}

function makeGroup(
  id: string,
  children: SceneItem[],
  renderOrder: GroupItem["renderOrder"],
  sortPoint = averagePoint(children.map((child) => child.sortPoint)),
  sortLayer = 0,
): GroupItem {
  return {
    children,
    depth: sortPoint.z,
    id,
    kind: "group",
    renderOrder,
    sortLayer,
    sortPoint,
  };
}

function addBox(items: SceneItem[], options: BoxOptions): void {
  const halfWidth = options.width / 2;
  const halfHeight = options.height / 2;
  const halfDepth = options.depth / 2;
  const vertex = (x: number, y: number, z: number) =>
    add({ x, y, z }, options.translate);
  const sortLayer = options.sortLayer ?? 0;

  const leftTopBack = vertex(-halfWidth, -halfHeight, -halfDepth);
  const rightTopBack = vertex(halfWidth, -halfHeight, -halfDepth);
  const rightBottomBack = vertex(halfWidth, halfHeight, -halfDepth);
  const leftBottomBack = vertex(-halfWidth, halfHeight, -halfDepth);
  const leftTopFront = vertex(-halfWidth, -halfHeight, halfDepth);
  const rightTopFront = vertex(halfWidth, -halfHeight, halfDepth);
  const rightBottomFront = vertex(halfWidth, halfHeight, halfDepth);
  const leftBottomFront = vertex(-halfWidth, halfHeight, halfDepth);

  // Match Zdog.Box's source face order. Top-level box faces are depth-sorted,
  // while boxes inside a Zdog.Group retain this order as a single unit.
  addFace(items, `${options.id}-front`, options.frontFace ?? options.color, [
    leftTopFront,
    rightTopFront,
    rightBottomFront,
    leftBottomFront,
  ], undefined, sortLayer);
  addFace(items, `${options.id}-rear`, options.rearFace ?? options.color, [
    rightTopBack,
    leftTopBack,
    leftBottomBack,
    rightBottomBack,
  ], undefined, sortLayer);
  addFace(items, `${options.id}-left`, options.leftFace ?? options.color, [
    leftTopBack,
    leftTopFront,
    leftBottomFront,
    leftBottomBack,
  ], undefined, sortLayer);
  addFace(items, `${options.id}-right`, options.rightFace ?? options.color, [
    rightTopFront,
    rightTopBack,
    rightBottomBack,
    rightBottomFront,
  ], undefined, sortLayer);
  addFace(items, `${options.id}-top`, options.topFace ?? options.color, [
    leftTopBack,
    rightTopBack,
    rightTopFront,
    leftTopFront,
  ], undefined, sortLayer);
  addFace(items, `${options.id}-bottom`, options.bottomFace ?? options.color, [
    leftBottomFront,
    rightBottomFront,
    rightBottomBack,
    leftBottomBack,
  ], undefined, sortLayer);
}

function addCylinder(items: SceneItem[], options: CylinderOptions): void {
  const radius = options.diameter / 2;
  const halfLength = options.length / 2;
  const rotation = options.rotate ?? {};
  const color = options.color ?? HERO_COLORS.deep;
  const transformPoint = (point: Vec3) =>
    add(rotate(point, rotation), options.translate);
  const rear: Vec3[] = [];
  const front: Vec3[] = [];
  const capStroke = options.stroke ?? 0;
  const sortLayer = options.sortLayer ?? 0;
  const rearCenter = transformPoint({ x: 0, y: 0, z: -halfLength });
  const frontCenter = transformPoint({ x: 0, y: 0, z: halfLength });
  const highlightRear = transformPoint({
    x: -radius * 0.3,
    y: -radius * 0.42,
    z: -halfLength + 0.02,
  });
  const highlightFront = transformPoint({
    x: -radius * 0.3,
    y: -radius * 0.42,
    z: halfLength - 0.02,
  });

  for (let index = 0; index < CYLINDER_SEGMENTS; index += 1) {
    const angle = (index / CYLINDER_SEGMENTS) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    rear.push(transformPoint({ x, y, z: -halfLength }));
    front.push(transformPoint({ x, y, z: halfLength }));
  }

  // A Zdog cylinder is one atomic group. Its broad surface stroke is always
  // drawn first, followed by the two depth-sorted caps. Keeping the group
  // atomic prevents unrelated camera parts from appearing between its layers.
  const cylinderItems: SceneItem[] = [
    {
      closed: false,
      color,
      depth: options.translate.z,
      id: `${options.id}-surface`,
      kind: "line",
      lineCap: "butt",
      points: [rearCenter, frontCenter],
      sortLayer,
      sortPoint: options.translate,
      strokeWidth: options.diameter + capStroke,
    },
  ];
  if (options.highlight !== false) {
    cylinderItems.push({
      closed: false,
      color: options.highlightColor ?? litHeroTone("deep", 18),
      depth: options.translate.z + 0.01,
      id: `${options.id}-highlight`,
      kind: "line",
      lineCap: "round",
      points: [highlightRear, highlightFront],
      sortLayer,
      sortPoint: { ...options.translate, z: options.translate.z + 0.01 },
      strokeWidth: Math.max(0.18, options.diameter * 0.045),
    });
  }
  if (options.rearCap !== false) {
    addFace(
      cylinderItems,
      `${options.id}-rear`,
      color,
      [...rear].reverse(),
      rearCenter,
      sortLayer,
    );
  }
  if (options.frontCap !== false) {
    addFace(
      cylinderItems,
      `${options.id}-front`,
      options.frontFace ?? color,
      front,
      frontCenter,
      sortLayer,
    );
  }

  if (options.capOutline === false) {
    for (const item of cylinderItems) {
      if (item.kind !== "face") continue;
      item.strokeColor = undefined;
      item.strokeWidth = undefined;
    }
  } else if (capStroke > 0) {
    for (const item of cylinderItems) {
      if (item.kind !== "face") continue;
      item.strokeColor = options.edgeColor ?? item.color;
      item.strokeWidth = capStroke;
    }
  }

  items.push(
    makeGroup(
      `${options.id}-cylinder`,
      cylinderItems,
      "cylinder",
      options.translate,
      sortLayer,
    ),
  );
}

function addDisc(
  items: SceneItem[],
  id: string,
  diameter: number,
  translate: Vec3,
  color: string,
  sortLayer = 0,
): void {
  const points = Array.from({ length: CYLINDER_SEGMENTS }, (_, index) => {
    const angle = (index / CYLINDER_SEGMENTS) * Math.PI * 2;
    return {
      x: translate.x + Math.cos(angle) * (diameter / 2),
      y: translate.y + Math.sin(angle) * (diameter / 2),
      z: translate.z,
    };
  });
  addFace(items, id, color, points, translate, sortLayer);
}

function transformSceneItem(
  item: SceneItem,
  rotation: Partial<Vec3>,
): SceneItem {
  const sortPoint = rotate(item.sortPoint, rotation);

  if (item.kind === "group") {
    const children = item.children.map((child) =>
      transformSceneItem(child, rotation),
    );

    if (item.renderOrder === "cylinder") {
      const underlays = children.filter(
        (child) =>
          child.id.endsWith("-surface") || child.id.endsWith("-highlight"),
      );
      const caps = children
        .filter((child) => !underlays.includes(child))
        .sort((a, b) => a.depth - b.depth);
      return {
        ...item,
        children: [...underlays, ...caps],
        depth: sortPoint.z,
        sortPoint,
      };
    }

    return { ...item, children, depth: sortPoint.z, sortPoint };
  }

  return {
    ...item,
    depth: sortPoint.z,
    points: item.points.map((point) => rotate(point, rotation)),
    sortPoint,
  };
}

function sourceYawAt(progress: number): number {
  const t = ((progress % 1) + 1) % 1;
  return YAW_MIDPOINT - Math.cos(t * Math.PI * 2) * YAW_AMPLITUDE;
}

function buildSourceCamera(yaw: number): SceneItem[] {
  const items: SceneItem[] = [];

  addBox(items, {
    bottomFace: HERO_COLORS.ink,
    color: HERO_COLORS.deep,
    depth: 6,
    frontFace: HERO_COLORS.mid,
    height: 10,
    id: "body",
    leftFace: litHeroTone("deep", 5),
    rearFace: HERO_COLORS.ink,
    rightFace: HERO_COLORS.deep,
    sortLayer: 0,
    topFace: litHeroTone("deep", 10),
    translate: { x: 0, y: 0, z: 0 },
    width: 20,
  });
  addBox(items, {
    bottomFace: HERO_COLORS.deep,
    color: HERO_COLORS.mid,
    depth: 6,
    frontFace: litHeroTone("mid", 12),
    height: 2,
    id: "top-box",
    leftFace: litHeroTone("mid", 8),
    rearFace: HERO_COLORS.deep,
    rightFace: HERO_COLORS.mid,
    sortLayer: 5,
    topFace: litHeroTone("mid", 22),
    translate: { x: 0, y: -6, z: 0 },
    width: 20,
  });

  addCylinder(items, {
    capOutline: false,
    color: litHeroTone("ink", 8),
    diameter: 5,
    frontCap: false,
    highlight: false,
    id: "grip",
    length: 10.3,
    rotate: { x: Math.PI / 2 },
    sortLayer: 6,
    translate: { x: -7.5, y: -0.15, z: 3 },
  });
  addCylinder(items, {
    capOutline: false,
    color: HERO_COLORS.mid,
    diameter: 5,
    frontFace: litHeroTone("mid", 22),
    highlight: false,
    id: "grip-crown",
    length: 1.4,
    rotate: { x: Math.PI / 2 },
    sortLayer: 7,
    // Both grip sections meet at y=-5.3. The crown's lower elliptical cap
    // supplies the rounded transition while the black grip remains uncapped,
    // so there is only one face at the shared plane.
    translate: { x: -7.5, y: -6, z: 3 },
  });
  addCylinder(items, {
    color: HERO_COLORS.mid,
    diameter: 3.2,
    frontFace: CAMERA_DIAL_FACE,
    highlight: false,
    id: "pasm-dial",
    length: 0.9,
    rotate: { x: Math.PI / 2 },
    sortLayer: 10,
    translate: { x: -3, y: -7.45, z: 0 },
  });
  addCylinder(items, {
    color: HERO_COLORS.mid,
    diameter: 2.65,
    frontFace: CAMERA_DIAL_FACE,
    highlight: false,
    id: "exposure-dial",
    length: 0.72,
    rotate: { x: Math.PI / 2 },
    sortLayer: 11,
    translate: { x: -7.35, y: -7.36, z: -1.9 },
  });
  addCylinder(items, {
    color: HERO_COLORS.mid,
    diameter: 2.7,
    frontFace: HERO_COLORS.light,
    highlight: false,
    id: "shutter",
    length: 0.24,
    rotate: { x: Math.PI / 2 },
    sortLayer: 12,
    translate: { x: -7.5, y: -6.82, z: 3.82 },
  });

  const lensOffset = { x: 1.5, y: -1, z: 0 };
  const lensItems: SceneItem[] = [];
  addCylinder(lensItems, {
    capOutline: false,
    color: HERO_COLORS.ink,
    diameter: 10,
    id: "lens-mount",
    length: 1,
    translate: add(lensOffset, { x: 0, y: 0, z: 3.5 }),
  });
  addCylinder(lensItems, {
    capOutline: false,
    color: `url(#${CAMERA_LENS_GRADIENT_ID})`,
    diameter: 9.2,
    frontFace: litHeroTone("ink", 18),
    id: "lens-barrel",
    length: 8,
    translate: add(lensOffset, { x: 0, y: 0, z: 8 }),
  });
  // Keep the mount and compact barrel atomic so body faces cannot slip
  // between them.
  items.push(makeGroup("lens-group", lensItems, "source", undefined, 20));
  // At this size the source's 0.1-deep final cylinder collapses into two
  // near-coplanar caps and a sub-pixel side. One disc is visually identical
  // without the antialiasing sliver that flashed at the barrel edge.
  addDisc(
    items,
    "lens-glass",
    7.6,
    { x: 1.5, y: -1, z: 12.08 },
    `url(#${CAMERA_GLASS_GRADIENT_ID})`,
    25,
  );

  const backItems: SceneItem[] = [];
  addBox(backItems, {
    color: HERO_COLORS.ink,
    depth: 0.5,
    height: 7,
    id: "rear-screen",
    translate: { x: 3, y: 0, z: -3.5 },
    width: 11,
  });
  addBox(backItems, {
    color: HERO_COLORS.ink,
    depth: 0.5,
    height: 2,
    id: "viewfinder",
    translate: { x: 7, y: -5.5, z: -3.5 },
    width: 3,
  });
  addCylinder(backItems, {
    color: HERO_COLORS.ink,
    diameter: 4,
    highlight: false,
    id: "rear-dial",
    length: 0.5,
    translate: { x: -6, y: 1, z: -3.5 },
  });
  // Rear details are also one non-sorting source group. Keeping them atomic
  // stops individual faces from leaking around the body's front silhouette.
  items.push(makeGroup("back-group", backItems, "source", undefined, -20));

  const rootRotation = { x: ROOT_PITCH, y: yaw };
  return items
    .map((item) => transformSceneItem(item, rootRotation))
    .sort((a, b) => a.sortLayer - b.sortLayer || a.depth - b.depth);
}

function project(point: Vec3): { x: number; y: number } {
  return {
    x: CENTER_X + point.x * CAMERA_SCALE,
    y: CENTER_Y + point.y * CAMERA_SCALE,
  };
}

function pointsAttribute(points: Vec3[]): string {
  return points
    .map((point) => {
      const projected = project(point);
      return `${projected.x.toFixed(2)},${projected.y.toFixed(2)}`;
    })
    .join(" ");
}

function linePath(points: Vec3[], closed: boolean): string {
  const path = points
    .map((point, index) => {
      const projected = project(point);
      return `${index === 0 ? "M" : "L"}${projected.x.toFixed(2)} ${projected.y.toFixed(2)}`;
    })
    .join(" ");
  return closed ? `${path} Z` : path;
}

function renderSceneItem(item: SceneItem): ReactNode {
  if (item.kind === "group") {
    return (
      <g key={item.id} data-camera-group={item.id}>
        {item.children.map(renderSceneItem)}
      </g>
    );
  }

  if (item.kind === "face") {
    return (
      <polygon
        key={item.id}
        data-camera-part={item.id}
        fill={item.color}
        points={pointsAttribute(item.points)}
        stroke={item.strokeColor}
        strokeLinejoin="round"
        strokeWidth={
          item.strokeWidth === undefined
            ? undefined
            : (item.strokeWidth * CAMERA_SCALE).toFixed(2)
        }
      />
    );
  }

  return (
    <path
      key={item.id}
      d={linePath(item.points, item.closed)}
      data-camera-part={item.id}
      fill="none"
      stroke={item.color}
      strokeLinecap={item.lineCap}
      strokeLinejoin="round"
      strokeWidth={(item.strokeWidth * CAMERA_SCALE).toFixed(2)}
    />
  );
}

function useSourceProgress(frame: number | null) {
  const { animationReady, fps, frameIntervalMs, prefersReducedMotion } =
    useModelTiming("camera");
  const pinnedProgress = frame === null ? null : frame;
  const [progress, setProgress] = useState(pinnedProgress ?? 0);
  const startTime = useRef<number | null>(null);

  useEffect(() => {
    if (pinnedProgress !== null) {
      setProgress(pinnedProgress);
      return;
    }
    if (!animationReady || prefersReducedMotion) {
      startTime.current = null;
      setProgress(0);
      return;
    }

    let animationFrame = 0;
    let lastFrame = 0;
    const update = (time: number) => {
      if (startTime.current === null) startTime.current = time;
      const frameDelta = time - lastFrame;
      if (frameDelta >= frameIntervalMs) {
        setProgress(
          ((time - startTime.current) % LOOP_DURATION_MS) / LOOP_DURATION_MS,
        );
        lastFrame = time - (frameDelta % frameIntervalMs);
      }
      animationFrame = window.requestAnimationFrame(update);
    };

    animationFrame = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [animationReady, frameIntervalMs, pinnedProgress, prefersReducedMotion]);

  return { fps, progress };
}

function ZdogReferenceCameraWatermark() {
  const frame = readPinnedModelFrame();
  const { fps, progress } = useSourceProgress(frame);
  const yaw = sourceYawAt(progress);
  const items = useMemo(() => buildSourceCamera(yaw), [yaw]);
  const yawPhase = (yaw - YAW_MIDPOINT) / YAW_AMPLITUDE;
  const lensFlareX = 30 - yawPhase * 4.5;
  const lensFlareY = 26 + yawPhase * 1.2;

  return (
    <ModelSvg
      fps={fps}
      frame={frame}
      name="hobbies-zdog-reference-camera"
      viewBox="0 0 120 100"
      withGlow={false}
    >
      <defs>
        <linearGradient
          id={CAMERA_LENS_GRADIENT_ID}
          gradientUnits="userSpaceOnUse"
          x1="34"
          x2="96"
          y1="24"
          y2="76"
        >
          <stop offset="0%" stopColor={HERO_COLORS.ink} />
          <stop offset="46%" stopColor={HERO_COLORS.mid} />
          <stop offset="100%" stopColor={HERO_COLORS.ink} />
        </linearGradient>
        <radialGradient
          id={CAMERA_GLASS_GRADIENT_ID}
          cx={`${lensFlareX.toFixed(2)}%`}
          cy={`${lensFlareY.toFixed(2)}%`}
          r="76%"
        >
          <stop offset="0%" stopColor={litHeroTone("accent", 18)} />
          <stop offset="18%" stopColor={HERO_COLORS.accent} />
          <stop offset="58%" stopColor={HERO_COLORS.deep} />
          <stop offset="100%" stopColor={HERO_COLORS.ink} />
        </radialGradient>
      </defs>
      <g
        data-source={SOURCE_URL}
        data-lens-flare-x={lensFlareX.toFixed(2)}
        data-lens-flare-y={lensFlareY.toFixed(2)}
        data-source-progress={progress.toFixed(3)}
        data-source-yaw={yaw.toFixed(4)}
      >
        {items.map(renderSceneItem)}
      </g>
    </ModelSvg>
  );
}

export default memo(ZdogReferenceCameraWatermark);
