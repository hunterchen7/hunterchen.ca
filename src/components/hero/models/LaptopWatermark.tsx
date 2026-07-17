import { memo, useEffect, useMemo, useRef, useState } from "react";
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

type KeystrokeEvent = {
  action: "character" | "enter" | "select-all" | "delete";
  commitMs: number;
  endMs: number;
  keyIds: string[];
  lineIndex?: number;
  revealedCharacters?: number;
  startMs: number;
};

type TypingState = {
  activeKeyIds: string[];
  cursorLine: number;
  isSelected: boolean;
  lineProgress: number[];
  phase: "typing" | "holding" | "selected" | "cleared";
};

const CAMERA_PITCH = 0.24;
const CAMERA_DISTANCE = 6.2;
const PROJECTION_SCALE = 27.5;
const MODEL_CENTER_Y = 0.82;
const SWAY_DURATION_MS = 28_000;
const SWAY_CENTER_DEGREES = 5;
const SWAY_AMPLITUDE_DEGREES = 4;
const INTRO_LINES = [
  "hey, i'm hunter.",
  "i build polished,",
  "playful things",
  "for the web.",
] as const;
const COMMAND_KEY_ID = "key-4-3";
const DELETE_KEY_ID = "key-0-11";
const ENTER_KEY_ID = "key-2-11";
const SPACE_KEY_ID = "key-4-4";

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
  return `rgba(229, 190, 255, ${alpha.toFixed(3)})`;
}

function faceFill(material: Material, normal: Vec3): string {
  const diffuse = Math.max(0, dot(normal, LIGHT_DIRECTION));
  if (material === "bezel") {
    const lift = Math.round(diffuse * 5);
    return `rgb(${6 + lift}, ${3 + lift}, ${9 + lift})`;
  }
  if (material === "hinge") {
    const lift = Math.round(diffuse * 7);
    return `rgb(${14 + lift}, ${8 + lift}, ${19 + lift})`;
  }
  if (material === "lid") {
    const lift = Math.round(diffuse * 22);
    return `rgb(${120 + lift}, ${70 + lift}, ${145 + lift})`;
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

function readPinnedAngle(): number | null {
  if (!import.meta.env.DEV || typeof window === "undefined") return null;
  const rawAngle = new URLSearchParams(window.location.search).get(
    "laptopAngle",
  );
  if (rawAngle === null) return null;
  const parsed = Number(rawAngle);
  return Number.isFinite(parsed) ? ((parsed % 360) + 360) % 360 : null;
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

function characterCadenceMs(character: string): number {
  if (character === " ") return 150;
  if (PUNCTUATION_KEYS[character]) return 190;
  return 112;
}

function buildTypingTimeline() {
  const events: KeystrokeEvent[] = [];
  let timeMs = 180;

  for (const [lineIndex, line] of INTRO_LINES.entries()) {
    for (const [characterIndex, character] of [...line].entries()) {
      const cadenceMs = characterCadenceMs(character);
      const pressDurationMs = Math.min(90, cadenceMs * 0.78);
      events.push({
        action: "character",
        commitMs: timeMs + pressDurationMs * 0.58,
        endMs: timeMs + pressDurationMs,
        keyIds: [keyIdForCharacter(character)],
        lineIndex,
        revealedCharacters: characterIndex + 1,
        startMs: timeMs,
      });
      timeMs += cadenceMs;
    }

    if (lineIndex < INTRO_LINES.length - 1) {
      timeMs += 58;
      events.push({
        action: "enter",
        commitMs: timeMs + 72,
        endMs: timeMs + 118,
        keyIds: [ENTER_KEY_ID],
        lineIndex: lineIndex + 1,
        startMs: timeMs,
      });
      timeMs += 278;
    }
  }

  const typingEndMs = timeMs;
  const selectStartMs = typingEndMs + 880;
  const selectCommitMs = selectStartMs + 105;
  const selectEndMs = selectStartMs + 340;
  events.push({
    action: "select-all",
    commitMs: selectCommitMs,
    endMs: selectEndMs,
    keyIds: [COMMAND_KEY_ID, "key-2-1"],
    startMs: selectStartMs,
  });

  const deleteStartMs = selectEndMs + 155;
  const deleteCommitMs = deleteStartMs + 92;
  const deleteEndMs = deleteStartMs + 248;
  events.push({
    action: "delete",
    commitMs: deleteCommitMs,
    endMs: deleteEndMs,
    keyIds: [DELETE_KEY_ID],
    startMs: deleteStartMs,
  });

  return {
    deleteCommitMs,
    durationMs: deleteEndMs + 680,
    events,
    selectCommitMs,
    typingEndMs,
  };
}

const TYPING_TIMELINE = buildTypingTimeline();
const SCREEN_SEQUENCE_MS = TYPING_TIMELINE.durationMs;

function typingStateAtProgress(progress: number): TypingState {
  const timeMs = progress * SCREEN_SEQUENCE_MS;
  const revealedCharacters = INTRO_LINES.map(() => 0);
  let activeKeyIds: string[] = [];
  let cursorLine = 0;

  for (const event of TYPING_TIMELINE.events) {
    if (timeMs >= event.startMs && timeMs < event.endMs) {
      activeKeyIds = event.keyIds;
    }
    if (timeMs < event.commitMs) continue;

    if (
      event.action === "character" &&
      event.lineIndex !== undefined &&
      event.revealedCharacters !== undefined
    ) {
      revealedCharacters[event.lineIndex] = event.revealedCharacters;
      cursorLine = event.lineIndex;
    } else if (event.action === "enter" && event.lineIndex !== undefined) {
      cursorLine = event.lineIndex;
    }
  }

  const isCleared = timeMs >= TYPING_TIMELINE.deleteCommitMs;
  const isSelected =
    timeMs >= TYPING_TIMELINE.selectCommitMs && !isCleared;
  const lineProgress = isCleared
    ? INTRO_LINES.map(() => 0)
    : revealedCharacters.map(
        (characters, index) => characters / INTRO_LINES[index]!.length,
      );
  if (isCleared) cursorLine = 0;

  const phase = isCleared
    ? "cleared"
    : isSelected
      ? "selected"
      : timeMs >= TYPING_TIMELINE.typingEndMs
        ? "holding"
        : "typing";

  return { activeKeyIds, cursorLine, isSelected, lineProgress, phase };
}

function useLaptopMotion(frame: number | null): {
  angle: number;
  fps: number;
  screenProgress: number;
} {
  const { fps, frameIntervalMs, prefersReducedMotion } =
    useModelTiming("laptop");
  const [pinnedAngle] = useState<number | null>(readPinnedAngle);
  const [motion, setMotion] = useState(() => ({
    screenProgress: frame ?? 0,
    swayProgress: frame ?? 0,
  }));
  const startTime = useRef<number | null>(null);

  useEffect(() => {
    if (frame !== null) {
      setMotion({ screenProgress: frame, swayProgress: frame });
      return;
    }

    if (prefersReducedMotion) {
      setMotion({
        screenProgress:
          (TYPING_TIMELINE.typingEndMs + 300) / SCREEN_SEQUENCE_MS,
        swayProgress: 0,
      });
      return;
    }

    let animationFrame = 0;
    let lastFrame = 0;

    const update = (time: number) => {
      if (startTime.current === null) startTime.current = time;
      const frameDelta = time - lastFrame;
      if (frameDelta >= frameIntervalMs) {
        const elapsed = time - startTime.current;
        setMotion({
          screenProgress: (elapsed % SCREEN_SEQUENCE_MS) / SCREEN_SEQUENCE_MS,
          swayProgress: (elapsed % SWAY_DURATION_MS) / SWAY_DURATION_MS,
        });
        lastFrame = time - (frameDelta % frameIntervalMs);
      }
      animationFrame = window.requestAnimationFrame(update);
    };

    animationFrame = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [frame, frameIntervalMs, prefersReducedMotion]);

  return {
    angle:
      pinnedAngle ??
      SWAY_CENTER_DEGREES +
        Math.sin(motion.swayProgress * Math.PI * 2) * SWAY_AMPLITUDE_DEGREES,
    fps,
    screenProgress: motion.screenProgress,
  };
}

function buildLaptop(
  angleDegrees: number,
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

  const lean = (12 * Math.PI) / 180;
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

  const screenOutline = roundedRectOutline(1.48, 0, 2.06, 0.12, 4);
  const screenFrontOutline = screenOutline.map((point) =>
    screenPoint(point.x, point.y, halfThickness),
  );
  const screenBackOutline = screenOutline.map((point) =>
    screenPoint(point.x, point.y, -halfThickness),
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
    "rgba(18, 8, 28, 0.82)",
    "rgba(242, 220, 255, 0.16)",
    0.28,
    0.08,
    screenSurfaceDepth + 0.01,
  );

  addDetailPolygon(
    "camera-notch",
    [
      screenPoint(-0.14, 2.01, displayDepth + 0.006),
      screenPoint(0.14, 2.01, displayDepth + 0.006),
      screenPoint(0.14, 1.92, displayDepth + 0.006),
      screenPoint(0.085, 1.885, displayDepth + 0.006),
      screenPoint(-0.085, 1.885, displayDepth + 0.006),
      screenPoint(-0.14, 1.92, displayDepth + 0.006),
    ],
    screenFront,
    "rgba(7, 3, 12, 0.96)",
    "rgba(240, 217, 255, 0.12)",
    0.24,
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
        ? "rgba(249, 222, 255, 0.96)"
        : `rgba(234, 198, 255, ${line.alpha})`,
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
  if (!typingState.isSelected) {
    addDetailLine(
      "screen-cursor",
      [
        screenPoint(cursorX + 0.025, activeLine.y - 0.075, displayDepth + 0.009),
        screenPoint(cursorX + 0.025, activeLine.y + 0.075, displayDepth + 0.009),
      ],
      screenFront,
      "rgba(251, 233, 255, 0.96)",
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
    roundedRectOutline(1.34, -0.79, 0.24, 0.055, 2).map((point) => ({
      x: point.x,
      y: deckY,
      z: point.y,
    })),
    topNormal,
    "rgba(86, 42, 104, 0.14)",
    "rgba(239, 208, 255, 0.26)",
    0.38,
    0.025,
    baseSurfaceDepth + 0.01,
  );

  const keyDepth = 0.15;
  const keyRadius = 0.028;
  const standardKeyWidth = 0.18;
  const standardKeyGap = 0.037;
  const standardColumns = 12;
  const standardRowWidth =
    standardKeyWidth * standardColumns + standardKeyGap * (standardColumns - 1);

  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < standardColumns; column += 1) {
      const centerX =
        -standardRowWidth / 2 +
        standardKeyWidth / 2 +
        column * (standardKeyWidth + standardKeyGap);
      const back = -0.74 + row * 0.19;
      addDetailPolygon(
        `key-${row}-${column}`,
        roundedRectOutline(
          standardKeyWidth / 2,
          back,
          back + keyDepth,
          keyRadius,
          1,
        ).map((point) => ({
          x: centerX + point.x,
          y: deckY + 0.004,
          z: point.y,
        })),
        topNormal,
        "rgba(10, 4, 15, 0.8)",
        "rgba(242, 220, 255, 0.4)",
        0.22,
        0.025,
        baseSurfaceDepth + 0.02,
      );
    }
  }

  const bottomKeyWidths = [0.18, 0.18, 0.18, 0.18, 0.86, 0.18, 0.18, 0.18, 0.18];
  const bottomGap = standardKeyGap;
  const bottomRowWidth =
    bottomKeyWidths.reduce((sum, width) => sum + width, 0) +
    bottomGap * (bottomKeyWidths.length - 1);
  let bottomKeyLeft = -bottomRowWidth / 2;
  for (const [column, width] of bottomKeyWidths.entries()) {
    const centerX = bottomKeyLeft + width / 2;
    addDetailPolygon(
      `key-4-${column}`,
      roundedRectOutline(width / 2, 0.04, 0.19, keyRadius, 1).map(
        (point) => ({
          x: centerX + point.x,
          y: deckY + 0.004,
          z: point.y,
        }),
      ),
      topNormal,
      "rgba(10, 4, 15, 0.8)",
      "rgba(242, 220, 255, 0.4)",
      0.22,
      0.025,
      baseSurfaceDepth + 0.02,
    );
    bottomKeyLeft += width + bottomGap;
  }

  addDetailPolygon(
    "trackpad",
    roundedRectOutline(0.64, 0.32, 1.1, 0.075, 3).map((point) => ({
      x: point.x,
      y: deckY + 0.004,
      z: point.y,
    })),
    topNormal,
    "rgba(229, 190, 255, 0.08)",
    "rgba(241, 216, 255, 0.42)",
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
        "rgba(14, 6, 20, 0.76)",
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
    "rgba(246, 225, 255, 0.36)",
    0.55,
    0.8,
  );

  return items.sort((a, b) => a.depth - b.depth);
}

function LaptopWatermark() {
  const frame = readPinnedModelFrame();
  const { angle, fps, screenProgress } = useLaptopMotion(frame);
  const typingState = useMemo(
    () => typingStateAtProgress(screenProgress),
    [screenProgress],
  );
  const items = useMemo(
    () => buildLaptop(angle, typingState),
    [angle, typingState],
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
      className="h-full w-full overflow-visible"
      data-model="work-laptop"
      data-model-angle={angle.toFixed(1)}
      data-model-fps={fps}
      data-model-typing-phase={typingState.phase}
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
            fill="rgba(221, 158, 255, 0.92)"
            points={formatPoints(key.points)}
            stroke="rgba(250, 232, 255, 0.72)"
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
