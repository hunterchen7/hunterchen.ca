import { memo, useEffect, useMemo, useRef, useState } from "react";
import { heroRgba, litHeroTone } from "../heroPalette";
import {
  modelAnimationStyle,
  readPinnedModelFrame,
  useModelTiming,
} from "./modelMotion";

type Vec3 = { x: number; y: number; z: number };
type Vec2 = { x: number; y: number };

type Material = "chassis" | "bezel" | "hinge" | "lid";

type PolygonItem = {
  kind: "polygon";
  id: string;
  points: Vec2[];
  depth: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
};

type LineItem = {
  kind: "line";
  id: string;
  points: Vec2[];
  depth: number;
  stroke: string;
  strokeWidth: number;
  opacity: number;
};

type RenderItem = PolygonItem | LineItem;

type ScreenMutation = "backspace" | "clear" | "insert";

type RecordedKeystroke = readonly [
  code: string,
  downMs: number,
  upMs: number,
  commitMs?: number,
  mutation?: ScreenMutation,
];

type TypingState = {
  activeKeyIds: string[];
  cursorLine: number;
  isSelected: boolean;
  lineProgress: number[];
  phase: "waiting" | "typing" | "holding" | "selected" | "cleared";
};

type LidPhase = "closed" | "opening" | "open" | "closing";

type LidState = {
  angleDegrees: number;
  openProgress: number;
  phase: LidPhase;
};

const CAMERA_PITCH = 0.24;
const CAMERA_DISTANCE = 6.2;
const PROJECTION_SCALE = 27.5;
const MODEL_CENTER_Y = 0.82;
const FRONT_ANGLE_DEGREES = 0;
const RECORDED_DURATION_MS = 9_051;
const RECORDED_TYPING_END_MS = 7_377.5;
const RECORDED_SELECT_ALL_MS = 8_666.6;
const RECORDED_CLEAR_MS = 8_983.8;
const RECORDED_WPM = 82.2;
const CLOSED_HOLD_MS = 0;
const LID_OPEN_MS = 1_050;
const OPEN_SETTLE_MS = 420;
const POST_CLEAR_HOLD_MS = 1_800;
const LID_CLOSE_MS = 900;
const CLOSED_LOOP_HOLD_MS = 2_400;
const CLOSED_LID_ANGLE_DEGREES = -90;
const OPEN_LID_ANGLE_DEGREES = 12;
const MIN_KEY_VISUAL_HOLD_MS = 90;
const INTRO_LINES = [
  "hey, i'm hunter.",
  "i build polished,",
  "playful things",
  "for the web.",
] as const;
const COMMAND_KEY_ID = "key-4-3";
const DELETE_KEY_ID = "key-0-13";
const ENTER_KEY_ID = "key-2-12";
const SPACE_KEY_ID = "key-4-4";

// Hunter's recorded 82.2 WPM take. Each tuple preserves the physical key,
// keydown, keyup, input commit, and (where needed) editing behavior in ms.
const RECORDED_KEYSTROKES = [
  ["KeyH", 0, 66.3, 0.6],
  ["KeyE", 83.1, 151, 83.4],
  ["KeyY", 166.6, 236.1, 167],
  ["Comma", 353.3, 458.9, 354.3],
  ["Space", 441.7, 520.5, 442.2],
  ["KeyI", 553, 599.7, 553.7],
  ["Quote", 669.7, 796.4, 670.2],
  ["KeyM", 764.8, 824.6, 765.6],
  ["Space", 808.2, 886, 808.5],
  ["KeyH", 942.5, 1_008.1, 943],
  ["KeyU", 1_041.8, 1_138.9, 1_042.6],
  ["KeyN", 1_110.8, 1_187.3, 1_111.3],
  ["KeyT", 1_168.9, 1_216.3, 1_169.3],
  ["KeyE", 1_274.8, 1_341.6, 1_275.3],
  ["KeyR", 1_325.6, 1_391.4, 1_326.1],
  ["Period", 1_358.5, 1_443.2, 1_359.1],
  ["Enter", 1_558.3, 1_607.9, 1_558.8],
  ["KeyI", 1_787.6, 1_900.9, 1_788.1],
  ["Space", 1_884.4, 1_975.3, 1_884.7],
  ["KeyB", 2_177.4, 2_235.8, 2_177.9],
  ["KeyU", 2_252.7, 2_328.8, 2_253],
  ["KeyI", 2_311, 2_374.5, 2_312],
  ["KeyL", 2_416.4, 2_500.1, 2_416.7],
  ["KeyD", 2_525.3, 2_566.2, 2_525.9],
  ["Space", 2_550.9, 2_612.4, 2_551.6],
  ["KeyP", 2_630.8, 2_692.7, 2_631.2],
  ["KeyO", 2_783.7, 2_826.5, 2_784.2],
  ["KeyL", 2_918.2, 2_983.6, 2_918.6],
  ["KeyS", 3_054.1, 3_124.7, 3_054.4],
  ["KeyI", 3_109.7, 3_175.8, 3_110.1],
  ["KeyH", 3_213.7, 3_291.3, 3_214.1],
  ["KeyE", 3_416.4, 3_472.3, 3_416.9],
  ["KeyD", 3_579.9, 3_624.7, 3_580.7],
  ["Comma", 3_683.6, 3_759.9, 3_683.9],
  ["Enter", 3_908.2, 3_966.5, 3_908.7],
  ["KeyP", 4_112.3, 4_171, 4_113],
  ["KeyL", 4_259, 4_362.3, 4_260.1],
  ["KeyA", 4_379, 4_447, 4_379.4],
  ["KeyY", 4_467.8, 4_534.8, 4_468.4],
  ["KeyF", 4_568.9, 4_641.5, 4_569.4],
  ["KeyU", 4_654.2, 4_723.2, 4_655],
  ["KeyL", 4_798.1, 4_874.7, 4_798.6],
  ["Space", 4_861.7, 4_941.5, 4_862.3],
  ["KeyT", 4_933.4, 5_002.7, 4_933.9],
  ["KeyH", 4_994.1, 5_037.8, 4_994.6],
  ["KeyI", 5_060.4, 5_183, 5_061.1],
  ["KeyN", 5_142.9, 5_220.5, 5_143.5],
  ["KeyG", 5_167.1, 5_220.5, 5_167.7],
  ["KeyS", 5_297.7, 5_373.7, 5_298.3],
  ["Space", 5_729.6, 5_809.9, 5_730],
  ["Backspace", 6_047.2, 6_102.9, 6_048.1, "backspace"],
  ["Enter", 6_254.1, 6_314.4, 6_254.6],
  ["KeyF", 6_351.7, 6_413, 6_352.3],
  ["KeyO", 6_456.5, 6_504.9, 6_457],
  ["KeyR", 6_533.3, 6_571.8, 6_534],
  ["Space", 6_591.1, 6_662, 6_592],
  ["KeyT", 6_659.8, 6_717.8, 6_660.6],
  ["KeyH", 6_743.7, 6_788.3, 6_744.2],
  ["KeyE", 6_787.7, 6_849.6, 6_788.1],
  ["Space", 6_837.5, 6_919.4, 6_838.1],
  ["KeyW", 6_904.8, 6_983.2, 6_905.4],
  ["KeyE", 6_964, 7_012.1, 6_964.4],
  ["KeyB", 7_083, 7_152.2, 7_083.4],
  ["Period", 7_258.1, 7_332.8, 7_258.4],
  ["Space", 7_316.4, 7_377.5, 7_316.7],
  ["MetaLeft", 7_724.5, 7_841.2],
  ["KeyS", 7_766.4, 7_832.9],
  ["MetaLeft", 8_562.1, 8_784.4],
  ["KeyA", 8_666.6, 8_767.4],
  ["Backspace", 8_983.3, 9_051, 8_983.8, "clear"],
] as const satisfies readonly RecordedKeystroke[];

const LIGHT_DIRECTION = normalize({ x: -0.45, y: 0.7, z: 0.72 });

const MATERIAL_ALPHA: Record<Material, number> = {
  chassis: 0.42,
  bezel: 0.55,
  hinge: 0.46,
  lid: 0.68,
};

function add(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

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

function project(point: Vec3): Vec2 {
  const perspective = CAMERA_DISTANCE / (CAMERA_DISTANCE - point.z);
  return {
    x: 60 + point.x * PROJECTION_SCALE * perspective,
    y:
      55 -
      (point.y - MODEL_CENTER_Y) * PROJECTION_SCALE * perspective,
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

function polygonPath(points: Vec2[]): string {
  return `M${formatPoints(points)} Z`;
}

function rgba(alpha: number): string {
  return heroRgba("light", alpha);
}

function faceFill(material: Material, normal: Vec3): string {
  const diffuse = Math.max(0, dot(normal, LIGHT_DIRECTION));
  if (material === "bezel") {
    const lift = Math.round(diffuse * 5);
    return litHeroTone("ink", lift);
  }
  if (material === "hinge") {
    const lift = Math.round(diffuse * 7);
    return litHeroTone("deep", lift);
  }
  if (material === "lid") {
    const lift = Math.round(diffuse * 22);
    return litHeroTone("mid", lift);
  }
  const alpha = MATERIAL_ALPHA[material] * (0.82 + diffuse * 0.38);
  return rgba(Math.min(alpha, 0.64));
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

const LETTER_KEY_ROWS = [
  { letters: "qwertyuiop", row: 1, startColumn: 1 },
  { letters: "asdfghjkl", row: 2, startColumn: 1 },
  { letters: "zxcvbnm", row: 3, startColumn: 1 },
] as const;

const PUNCTUATION_KEYS: Record<string, string> = {
  "'": "key-2-10",
  ",": "key-3-8",
  ".": "key-3-9",
};

function keyIdForCharacter(character: string): string {
  if (character === " ") return SPACE_KEY_ID;
  if (PUNCTUATION_KEYS[character]) return PUNCTUATION_KEYS[character];

  for (const row of LETTER_KEY_ROWS) {
    const columnOffset = row.letters.indexOf(character.toLowerCase());
    if (columnOffset >= 0) {
      return `key-${row.row}-${row.startColumn + columnOffset}`;
    }
  }

  return SPACE_KEY_ID;
}

function keyIdForCode(code: string): string {
  if (code.startsWith("Key")) {
    return keyIdForCharacter(code.slice(3).toLowerCase());
  }

  switch (code) {
    case "Backspace":
      return DELETE_KEY_ID;
    case "Comma":
      return PUNCTUATION_KEYS[","]!;
    case "Enter":
      return ENTER_KEY_ID;
    case "MetaLeft":
      return COMMAND_KEY_ID;
    case "Period":
      return PUNCTUATION_KEYS["."]!;
    case "Quote":
      return PUNCTUATION_KEYS["'"]!;
    case "Space":
      return SPACE_KEY_ID;
    default:
      return SPACE_KEY_ID;
  }
}

function insertedCharacterForCode(code: string): string | null {
  if (code.startsWith("Key")) return code.slice(3).toLowerCase();

  switch (code) {
    case "Comma":
      return ",";
    case "Enter":
      return "\n";
    case "Period":
      return ".";
    case "Quote":
      return "'";
    case "Space":
      return " ";
    default:
      return null;
  }
}

const LID_OPEN_START_MS = CLOSED_HOLD_MS;
const LID_OPEN_END_MS = LID_OPEN_START_MS + LID_OPEN_MS;
const TYPING_START_MS = LID_OPEN_END_MS + OPEN_SETTLE_MS;
const LID_CLOSE_START_MS =
  TYPING_START_MS + RECORDED_DURATION_MS + POST_CLEAR_HOLD_MS;
const LID_CLOSE_END_MS = LID_CLOSE_START_MS + LID_CLOSE_MS;
const SCREEN_SEQUENCE_MS = LID_CLOSE_END_MS + CLOSED_LOOP_HOLD_MS;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function smoothstep(value: number): number {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

function lidStateAtProgress(progress: number): LidState {
  const timeMs = clamp01(progress) * SCREEN_SEQUENCE_MS;
  let openProgress = 0;
  let phase: LidPhase = "closed";

  if (timeMs < LID_OPEN_START_MS) {
    openProgress = 0;
  } else if (timeMs < LID_OPEN_END_MS) {
    openProgress = smoothstep(
      (timeMs - LID_OPEN_START_MS) / LID_OPEN_MS,
    );
    phase = "opening";
  } else if (timeMs < LID_CLOSE_START_MS) {
    openProgress = 1;
    phase = "open";
  } else if (timeMs < LID_CLOSE_END_MS) {
    openProgress =
      1 -
      smoothstep((timeMs - LID_CLOSE_START_MS) / LID_CLOSE_MS);
    phase = "closing";
  }

  return {
    angleDegrees:
      CLOSED_LID_ANGLE_DEGREES +
      (OPEN_LID_ANGLE_DEGREES - CLOSED_LID_ANGLE_DEGREES) * openProgress,
    openProgress,
    phase,
  };
}

function typingStateAtProgress(progress: number): TypingState {
  const timeMs = progress * SCREEN_SEQUENCE_MS - TYPING_START_MS;
  const lineLengths = INTRO_LINES.map(() => 0);
  const activeKeyIds = new Set<string>();
  let cursorLine = 0;

  for (const [code, downMs, upMs, commitMs, mutation] of RECORDED_KEYSTROKES) {
    if (
      timeMs >= downMs &&
      timeMs < Math.max(upMs, downMs + MIN_KEY_VISUAL_HOLD_MS)
    ) {
      activeKeyIds.add(keyIdForCode(code));
    }
    if (commitMs === undefined || timeMs < commitMs) continue;

    const resolvedMutation = mutation ?? "insert";
    if (resolvedMutation === "clear") {
      lineLengths.fill(0);
      cursorLine = 0;
      continue;
    }
    if (resolvedMutation === "backspace") {
      if (lineLengths[cursorLine]! > 0) {
        lineLengths[cursorLine] = lineLengths[cursorLine]! - 1;
      } else if (cursorLine > 0) {
        cursorLine -= 1;
      }
      continue;
    }

    const character = insertedCharacterForCode(code);
    if (character === "\n") {
      cursorLine = Math.min(cursorLine + 1, INTRO_LINES.length - 1);
    } else if (character !== null) {
      lineLengths[cursorLine] = lineLengths[cursorLine]! + 1;
    }
  }

  const isCleared = timeMs >= RECORDED_CLEAR_MS;
  const isSelected = timeMs >= RECORDED_SELECT_ALL_MS && !isCleared;
  const lineProgress = isCleared
    ? INTRO_LINES.map(() => 0)
    : lineLengths.map(
        (characters, index) =>
          Math.min(1, characters / INTRO_LINES[index]!.length),
      );
  if (isCleared) cursorLine = 0;

  const phase = isCleared
    ? "cleared"
    : isSelected
      ? "selected"
      : timeMs < 0
        ? "waiting"
        : timeMs >= RECORDED_TYPING_END_MS
          ? "holding"
          : "typing";

  return {
    activeKeyIds: [...activeKeyIds],
    cursorLine,
    isSelected,
    lineProgress,
    phase,
  };
}

function useLaptopMotion(frame: number | null): {
  fps: number;
  screenProgress: number;
} {
  const { animationReady, fps, frameIntervalMs, prefersReducedMotion } =
    useModelTiming("laptop");
  const [screenProgress, setScreenProgress] = useState(() => {
    if (frame !== null) return frame;

    if (!animationReady) return 0;

    if (prefersReducedMotion) {
      return (
        (TYPING_START_MS + RECORDED_TYPING_END_MS + 300) /
        SCREEN_SEQUENCE_MS
      );
    }

    return 0;
  });
  const startTime = useRef<number | null>(null);

  useEffect(() => {
    if (frame !== null) {
      setScreenProgress(frame);
      return;
    }

    if (!animationReady) {
      startTime.current = null;
      setScreenProgress(0);
      return;
    }

    if (prefersReducedMotion) {
      setScreenProgress(
        (TYPING_START_MS + RECORDED_TYPING_END_MS + 300) /
          SCREEN_SEQUENCE_MS,
      );
      return;
    }

    let animationFrame = 0;
    let lastFrame = 0;

    const update = (time: number) => {
      if (startTime.current === null) startTime.current = time;
      const frameDelta = time - lastFrame;
      if (frameDelta >= frameIntervalMs) {
        const elapsed = time - startTime.current;
        setScreenProgress((elapsed % SCREEN_SEQUENCE_MS) / SCREEN_SEQUENCE_MS);
        lastFrame = time - (frameDelta % frameIntervalMs);
      }
      animationFrame = window.requestAnimationFrame(update);
    };

    animationFrame = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [animationReady, frame, frameIntervalMs, prefersReducedMotion]);

  return {
    fps,
    screenProgress,
  };
}

function buildLaptop(
  angleDegrees: number,
  lidOpenProgress: number,
  typingState: TypingState,
): RenderItem[] {
  const angle = (angleDegrees * Math.PI) / 180;
  const items: RenderItem[] = [];

  const addFace = (
    id: string,
    points: Vec3[],
    material: Material,
    strokeWidth = 0.85,
  ) => {
    const normal = rotateToCamera(faceNormal(points), angle);
    if (normal.z < -0.015) return;
    const cameraPoints = points.map((point) => rotateToCamera(point, angle));
    items.push({
      kind: "polygon",
      id,
      points: cameraPoints.map(project),
      depth: averageDepth(cameraPoints),
      fill: faceFill(material, normalize(normal)),
      stroke: rgba(material === "bezel" || material === "lid" ? 0.72 : 0.58),
      strokeWidth,
    });
  };

  const addDetailPolygon = (
    id: string,
    points: Vec3[],
    normal: Vec3,
    fill: string,
    stroke: string,
    strokeWidth = 0.5,
    facingThreshold = 0.025,
    sortDepth?: number,
  ) => {
    const cameraNormal = rotateToCamera(normal, angle);
    if (cameraNormal.z < facingThreshold) return;
    const cameraPoints = points.map((point) => rotateToCamera(point, angle));
    items.push({
      kind: "polygon",
      id,
      points: cameraPoints.map(project),
      depth: sortDepth ?? averageDepth(cameraPoints) + 0.002,
      fill,
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
    facingThreshold = 0.025,
    sortDepth?: number,
  ) => {
    const cameraNormal = rotateToCamera(normal, angle);
    if (cameraNormal.z < facingThreshold) return;
    const cameraPoints = points.map((point) => rotateToCamera(point, angle));
    items.push({
      kind: "line",
      id,
      points: cameraPoints.map(project),
      depth: sortDepth ?? averageDepth(cameraPoints) + 0.003,
      stroke,
      strokeWidth,
      opacity,
    });
  };

  const baseTop = roundedRectOutline(1.5, -0.91, 1.21, 0.12, 4)
    .reverse()
    .map((point) => ({ x: point.x, y: 0.074, z: point.y }));
  const baseBottom = roundedRectOutline(1.455, -0.87, 1.17, 0.1, 4)
    .reverse()
    .map((point) => ({ x: point.x, y: 0.02, z: point.y }));
  const baseSurfaceDepth = averageDepth(
    baseTop.map((point) => rotateToCamera(point, angle)),
  );

  addFace("base-top", baseTop, "chassis");
  addFace("base-bottom", [...baseBottom].reverse(), "chassis");
  for (let index = 0; index < baseTop.length; index += 1) {
    const next = (index + 1) % baseTop.length;
    addFace(
      `base-edge-${index}`,
      [baseTop[index]!, baseBottom[index]!, baseBottom[next]!, baseTop[next]!],
      "chassis",
      0.65,
    );
  }

  const lidAngleDegrees =
    CLOSED_LID_ANGLE_DEGREES +
    (OPEN_LID_ANGLE_DEGREES - CLOSED_LID_ANGLE_DEGREES) *
      lidOpenProgress;
  const lean = (lidAngleDegrees * Math.PI) / 180;
  const hinge = { x: 0, y: 0.084, z: -0.82 };
  const screenUp = { x: 0, y: Math.cos(lean), z: -Math.sin(lean) };
  const screenFront = { x: 0, y: Math.sin(lean), z: Math.cos(lean) };
  // Keep the closed display visibly slimmer than the 0.044-unit base shell.
  const halfThickness = 0.0105;

  const screenPoint = (x: number, y: number, depth: number): Vec3 =>
    add(
      add(add(hinge, { x, y: 0, z: 0 }), scale(screenUp, y)),
      scale(screenFront, depth),
    );

  const screenOutline = roundedRectOutline(1.48, 0, 2.03, 0.12, 4);
  const screenFrontOutline = screenOutline.map((point) =>
    screenPoint(point.x, point.y, halfThickness),
  );
  const screenBackOutline = screenOutline.map((point) =>
    screenPoint(point.x, point.y, -halfThickness),
  );
  const screenBezelFill = faceFill(
    "bezel",
    normalize(rotateToCamera(faceNormal(screenFrontOutline), angle)),
  );
  const screenSurfaceDepth = averageDepth(
    screenFrontOutline.map((point) => rotateToCamera(point, angle)),
  );

  addFace("screen-front", screenFrontOutline, "bezel", 0.38);
  addFace("screen-back", [...screenBackOutline].reverse(), "lid", 0.38);
  for (let index = 0; index < screenOutline.length; index += 1) {
    const next = (index + 1) % screenOutline.length;
    addFace(
      `screen-edge-${index}`,
      [
        screenFrontOutline[index]!,
        screenBackOutline[index]!,
        screenBackOutline[next]!,
        screenFrontOutline[next]!,
      ],
      "chassis",
      0.22,
    );
  }

  const displayDepth = halfThickness + 0.006;
  addDetailPolygon(
    "display",
    roundedRectOutline(1.42, 0.05, 2.01, 0.075, 3).map((point) =>
      screenPoint(point.x, point.y, displayDepth),
    ),
    screenFront,
    heroRgba("ink", 0.82),
    heroRgba("light", 0.16),
    0.28,
    0.08,
    screenSurfaceDepth + 0.01,
  );

  addDetailPolygon(
    "camera-notch",
    [
      screenPoint(-0.13, 2.025, displayDepth + 0.006),
      screenPoint(0.13, 2.025, displayDepth + 0.006),
      screenPoint(0.13, 1.972, displayDepth + 0.006),
      screenPoint(0.08, 1.948, displayDepth + 0.006),
      screenPoint(-0.08, 1.948, displayDepth + 0.006),
      screenPoint(-0.13, 1.972, displayDepth + 0.006),
    ],
    screenFront,
    screenBezelFill,
    "none",
    0,
    0.08,
    screenSurfaceDepth + 0.03,
  );

  const lineStart = -1.08;
  const introLines = INTRO_LINES.map((line, index) => ({
    alpha: 0.88 - index * 0.1,
    to: lineStart + line.length * 0.075,
    width: index === 0 ? 1.18 : 0.88,
    y: [1.52, 1.18, 0.9, 0.62][index]!,
  }));

  for (const [index, line] of introLines.entries()) {
    const reveal = typingState.lineProgress[index] ?? 0;
    if (reveal <= 0) continue;
    addDetailLine(
      `screen-intro-${index}`,
      [
        screenPoint(lineStart, line.y, displayDepth + 0.006),
        screenPoint(
          lineStart + (line.to - lineStart) * reveal,
          line.y,
          displayDepth + 0.006,
        ),
      ],
      screenFront,
      typingState.isSelected
        ? heroRgba("light", 0.96)
        : heroRgba("light", line.alpha),
      line.width + (typingState.isSelected ? 0.18 : 0),
      1,
      0.08,
      screenSurfaceDepth + 0.025,
    );
  }

  const activeLine = introLines[typingState.cursorLine]!;
  const cursorX =
    lineStart +
    (activeLine.to - lineStart) *
      (typingState.lineProgress[typingState.cursorLine] ?? 0);
  if (!typingState.isSelected && typingState.phase !== "cleared") {
    addDetailLine(
      "screen-cursor",
      [
        screenPoint(cursorX + 0.025, activeLine.y - 0.075, displayDepth + 0.009),
        screenPoint(cursorX + 0.025, activeLine.y + 0.075, displayDepth + 0.009),
      ],
      screenFront,
      heroRgba("light", 0.96),
      0.82,
      1,
      0.08,
      screenSurfaceDepth + 0.03,
    );
  }

  const topNormal = { x: 0, y: 1, z: 0 };
  const deckY = 0.08;
  addDetailPolygon(
    "keyboard-deck",
    roundedRectOutline(1.42, -0.79, 0.39, 0.055, 2).map((point) => ({
      x: point.x,
      y: deckY,
      z: point.y,
    })),
    topNormal,
    heroRgba("mid", 0.14),
    heroRgba("light", 0.26),
    0.38,
    0.025,
    baseSurfaceDepth + 0.01,
  );

  type KeySpec = { id: string; units: number };

  const keyboardWidth = 2.74;
  const keyGap = 0.017;
  const keyRadius = 0.024;
  const keyFill = heroRgba("ink", 0.8);
  const keyStroke = heroRgba("light", 0.4);
  const keySortDepth = baseSurfaceDepth + 0.02;
  const keyUnitForRow = (keys: readonly KeySpec[]) => {
    const rowUnits = keys.reduce((sum, key) => sum + key.units, 0);
    return (keyboardWidth - keyGap * (rowUnits - 1)) / rowUnits;
  };
  const keyWidthForUnits = (units: number, keyUnit: number) =>
    units * keyUnit + (units - 1) * keyGap;

  const addKey = (
    id: string,
    centerX: number,
    width: number,
    back: number,
    front: number,
    radius = keyRadius,
  ) => {
    addDetailPolygon(
      id,
      roundedRectOutline(width / 2, back, front, radius, 1).map(
        (point) => ({
          x: centerX + point.x,
          y: deckY + 0.004,
          z: point.y,
        }),
      ),
      topNormal,
      keyFill,
      keyStroke,
      0.22,
      0.025,
      keySortDepth,
    );
  };

  const addKeyRow = (
    keys: readonly KeySpec[],
    back: number,
    front: number,
  ) => {
    const keyUnit = keyUnitForRow(keys);
    let left = -keyboardWidth / 2;
    const centers = new Map<string, { x: number; width: number }>();

    for (const key of keys) {
      const width = keyWidthForUnits(key.units, keyUnit);
      const centerX = left + width / 2;
      addKey(key.id, centerX, width, back, front);
      centers.set(key.id, { x: centerX, width });
      left += width + keyGap;
    }

    return centers;
  };

  const functionKeys: KeySpec[] = [
    { id: "key-function-escape", units: 1.28 },
    ...Array.from({ length: 12 }, (_, index) => ({
      id: `key-function-${index + 1}`,
      units: 0.92,
    })),
    { id: "key-function-touch-id", units: 0.92 },
  ];
  const functionKeyCenters = addKeyRow(functionKeys, -0.76, -0.628);

  const touchIdKey = functionKeyCenters.get("key-function-touch-id");
  if (touchIdKey) {
    const sensorRadius = 0.029;
    addDetailPolygon(
      "touch-id-sensor",
      roundedRectOutline(
        sensorRadius,
        -0.727,
        -0.661,
        sensorRadius,
        4,
      ).map((point) => ({
        x: touchIdKey.x + point.x,
        y: deckY + 0.006,
        z: point.y,
      })),
      topNormal,
      heroRgba("mid", 0.36),
      heroRgba("light", 0.46),
      0.2,
      0.025,
      keySortDepth + 0.002,
    );
  }

  addKeyRow(
    [
      ...Array.from({ length: 13 }, (_, column) => ({
        id: `key-0-${column}`,
        units: 1,
      })),
      { id: DELETE_KEY_ID, units: 1.75 },
    ],
    -0.612,
    -0.445,
  );

  addKeyRow(
    [
      { id: "key-1-0", units: 1.5 },
      ...Array.from({ length: 12 }, (_, index) => ({
        id: `key-1-${index + 1}`,
        units: 1,
      })),
      { id: "key-1-13", units: 1.25 },
    ],
    -0.429,
    -0.262,
  );

  addKeyRow(
    [
      { id: "key-2-0", units: 1.75 },
      ...Array.from({ length: 11 }, (_, index) => ({
        id: `key-2-${index + 1}`,
        units: 1,
      })),
      { id: ENTER_KEY_ID, units: 2 },
    ],
    -0.246,
    -0.079,
  );

  addKeyRow(
    [
      { id: "key-3-0", units: 2.25 },
      ...Array.from({ length: 10 }, (_, index) => ({
        id: `key-3-${index + 1}`,
        units: 1,
      })),
      { id: "key-3-11", units: 2.5 },
    ],
    -0.063,
    0.104,
  );

  const bottomKeys: KeySpec[] = [
    { id: "key-4-0", units: 1.1 },
    { id: "key-4-1", units: 1.1 },
    { id: "key-4-2", units: 1.1 },
    { id: COMMAND_KEY_ID, units: 1.35 },
    { id: SPACE_KEY_ID, units: 5.45 },
    { id: "key-4-5", units: 1.35 },
    { id: "key-4-6", units: 1.1 },
  ];
  const arrowKeys: KeySpec[] = [
    { id: "key-4-7", units: 1 },
    { id: "key-4-arrow-center", units: 1 },
    { id: "key-4-10", units: 1 },
  ];
  const bottomKeyUnit = keyUnitForRow([...bottomKeys, ...arrowKeys]);
  let bottomLeft = -keyboardWidth / 2;
  for (const key of bottomKeys) {
    const width = keyWidthForUnits(key.units, bottomKeyUnit);
    addKey(key.id, bottomLeft + width / 2, width, 0.12, 0.334);
    bottomLeft += width + keyGap;
  }

  const arrowWidth = keyWidthForUnits(1, bottomKeyUnit);
  const arrowCenterGap = 0.016;
  addKey("key-4-7", bottomLeft + arrowWidth / 2, arrowWidth, 0.12, 0.334);
  const centerArrowX = bottomLeft + arrowWidth + keyGap + arrowWidth / 2;
  const arrowCenter = 0.234;
  addKey(
    "key-4-8",
    centerArrowX,
    arrowWidth,
    0.12,
    arrowCenter - arrowCenterGap / 2,
    0.017,
  );
  addKey(
    "key-4-9",
    centerArrowX,
    arrowWidth,
    arrowCenter + arrowCenterGap / 2,
    0.334,
    0.017,
  );
  addKey(
    "key-4-10",
    bottomLeft + (arrowWidth + keyGap) * 2 + arrowWidth / 2,
    arrowWidth,
    0.12,
    0.334,
  );

  addDetailPolygon(
    "trackpad",
    roundedRectOutline(0.64, 0.5, 1.16, 0.075, 3).map((point) => ({
      x: point.x,
      y: deckY + 0.004,
      z: point.y,
    })),
    topNormal,
    heroRgba("accent", 0.08),
    heroRgba("light", 0.42),
    0.42,
    0.025,
    baseSurfaceDepth + 0.02,
  );

  for (const [side, x, normal, ports] of [
    ["left", -1.502, { x: -1, y: 0, z: 0 }, [-0.58, -0.32, -0.08]],
    ["right", 1.502, { x: 1, y: 0, z: 0 }, [-0.42]],
  ] as const) {
    for (const [index, z] of ports.entries()) {
      addDetailLine(
        `port-${side}-${index}`,
        [
          { x, y: 0.046, z },
          { x, y: 0.046, z: z + (side === "left" && index === 0 ? 0.17 : 0.12) },
        ],
        normal,
        heroRgba("ink", 0.76),
        0.5,
        0.88,
      );
    }
  }

  addDetailLine(
    "front-lip",
    [
      { x: -0.23, y: 0.05, z: 1.216 },
      { x: 0.23, y: 0.05, z: 1.216 },
    ],
    { x: 0, y: 0, z: 1 },
    heroRgba("light", 0.36),
    0.55,
    0.8,
  );

  addDetailLine(
    "closed-seam",
    [
      { x: -1.31, y: 0.076, z: 1.214 },
      { x: 1.31, y: 0.076, z: 1.214 },
    ],
    { x: 0, y: 0, z: 1 },
    heroRgba("ink", 0.82),
    0.38,
    (1 - lidOpenProgress) * 0.82,
    0.025,
    baseSurfaceDepth + 1,
  );

  return items.sort((a, b) => a.depth - b.depth);
}

function LaptopWatermark() {
  const frame = readPinnedModelFrame();
  const { fps, screenProgress } = useLaptopMotion(frame);
  const lidState = useMemo(
    () => lidStateAtProgress(screenProgress),
    [screenProgress],
  );
  const typingState = useMemo(
    () => typingStateAtProgress(screenProgress),
    [screenProgress],
  );
  const items = useMemo(
    () =>
      buildLaptop(
        FRONT_ANGLE_DEGREES,
        lidState.openProgress,
        typingState,
      ),
    [lidState.openProgress, typingState],
  );
  const keyboardKeys = useMemo(
    () =>
      items.filter(
        (item): item is PolygonItem =>
          item.kind === "polygon" && item.id.startsWith("key-"),
      ),
    [items],
  );
  const firstKeyId = keyboardKeys[0]?.id;
  const keyboardPath = useMemo(
    () => keyboardKeys.map((key) => polygonPath(key.points)).join(" "),
    [keyboardKeys],
  );
  const keyboardKeysById = useMemo(
    () => new Map(keyboardKeys.map((key) => [key.id, key])),
    [keyboardKeys],
  );
  const activeTypingKeys = typingState.activeKeyIds.flatMap((id) => {
    const key = keyboardKeysById.get(id);
    return key ? [key] : [];
  });

  return (
    <svg
      aria-hidden="true"
      className="hero-model-svg h-full w-full overflow-visible"
      data-model="work-laptop"
      data-model-angle={FRONT_ANGLE_DEGREES.toFixed(1)}
      data-model-fps={fps}
      data-model-lid-angle={lidState.angleDegrees.toFixed(1)}
      data-model-lid-open={lidState.openProgress.toFixed(3)}
      data-model-lid-phase={lidState.phase}
      data-model-typing-phase={typingState.phase}
      data-model-typing-wpm={RECORDED_WPM}
      fill="none"
      viewBox="0 0 120 100"
    >
      <g>
        {items.map((item) => {
          if (item.kind === "polygon" && item.id.startsWith("key-")) {
            if (item.id !== firstKeyId) return null;
            return (
              <path
                key="keyboard-keys"
                d={keyboardPath}
                fill={item.fill}
                stroke={item.stroke}
                strokeLinejoin="round"
                strokeWidth={item.strokeWidth}
                vectorEffect="non-scaling-stroke"
              />
            );
          }

          return item.kind === "polygon" ? (
            <polygon
              key={item.id}
              data-part={item.id}
              fill={item.fill}
              points={formatPoints(item.points)}
              stroke={item.stroke}
              strokeLinejoin="round"
              strokeWidth={item.strokeWidth}
              vectorEffect="non-scaling-stroke"
            />
          ) : (
            <polyline
              key={item.id}
              className={
                item.id === "screen-cursor"
                  ? "model-laptop-cursor"
                  : undefined
              }
              data-part={item.id}
              fill="none"
              opacity={item.opacity}
              points={formatPoints(item.points)}
              stroke={item.stroke}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={item.strokeWidth}
              style={
                item.id === "screen-cursor"
                  ? modelAnimationStyle(frame, 0.78)
                  : undefined
              }
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
        {activeTypingKeys.map((key) => (
          <polygon
            key={`${key.id}-press`}
            data-part={`${key.id}-press`}
            fill={heroRgba("accent", 0.92)}
            points={formatPoints(key.points)}
            stroke={heroRgba("light", 0.72)}
            strokeLinejoin="round"
            strokeWidth="0.3"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>
    </svg>
  );
}

export default memo(LaptopWatermark);
