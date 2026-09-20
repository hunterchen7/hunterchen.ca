import { memo, type ReactNode } from "react";
import { HERO_COLORS, heroRgba, litHeroTone } from "../hero/heroPalette";
import { DIAMOND, clamp, type BoardGeometry } from "./isoGeometry";

/**
 * Piece artwork and board surface for the isometric chessboard, shared by the
 * ambient ChessboardWatermark and the playable IsoChessBoard.
 *
 * Every piece is drawn as one solid. Its turned body is a lathe profile
 * (radius by height) projected the same way the board is, so the base is a
 * true round puck in the board's perspective and the outline is the envelope
 * of every cross-section rather than a stack of separate shapes. Parts that
 * are not turned (the knight's head, the king's cross, the crenellations) join
 * the same silhouette: the rim is drawn once under everything and the fills go
 * over it, so no seam shows where one part meets another.
 *
 * SVG `id`s are namespaced by `prefix` because both boards can be mounted at
 * once (the playable landing board, and the watermark on the projects card),
 * and `<use href="#id">` resolves document-wide.
 */

export type PieceColor = "b" | "w";
export type PieceKind = "b" | "k" | "n" | "p" | "q" | "r";

export type BoardPiece = {
  captured?: boolean;
  color: PieceColor;
  id: string;
  kind: PieceKind;
  square: string;
};

export type PiecePalette = {
  /** Fill for the body; a left-to-right gradient when one is available. */
  body: string;
  deep: string;
  eye: string;
  eyeStroke: string;
  highlight: string;
  /** Interior edges: the lip of a collar, the rim of a flat, the knight's chest. */
  line: string;
  main: string;
  shade: string;
  /** The rim drawn around the whole silhouette. */
  stroke: string;
};

export type RenderPiece = BoardPiece & {
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

export const LIGHT_PIECE: PiecePalette = {
  body: HERO_COLORS.light,
  main: HERO_COLORS.light,
  highlight: litHeroTone("light", 16),
  shade: HERO_COLORS.accent,
  deep: HERO_COLORS.mid,
  eye: HERO_COLORS.deep,
  eyeStroke: "none",
  line: heroRgba("deep", 0.3),
  stroke: heroRgba("light", 0.96),
};

// The dark side sits below the board's own dark tone rather than on it. The
// board's dark squares are HERO_COLORS.deep; a piece body painted the same hex
// dissolves into them, and on a highlighted square its lit side lands within a
// few RGB points of the wash, which cut a hard line through the silhouette
// wherever the square's edge passed behind it. A pale rim holds the outline on
// any purple ground.
export const DARK_PIECE: PiecePalette = {
  body: "#2b1141",
  main: "#2b1141",
  highlight: "#3d2159",
  shade: HERO_COLORS.ink,
  deep: HERO_COLORS.ink,
  eye: HERO_COLORS.accent,
  eyeStroke: heroRgba("light", 0.78),
  line: heroRgba("light", 0.32),
  stroke: heroRgba("light", 0.4),
};

const f = (value: number) => value.toFixed(2);

/** Stroke widths are in root units (non-scaling), like the board's grid. */
const RIM_WIDTH = 0.56;
const LINE_WIDTH = 0.2;

// ---------------------------------------------------------------------------
// Lathe profiles
//
// A profile is a run of knots, bottom to top, each giving the piece's radius
// at a height above the board. Two knots at the same height make a step. A
// mark on the lower knot of a step says what the step is:
//   "face"  a flat, lit from above, that the narrower part above stands on
//   "ring"  an overhang: the wider part above throws a lip over the stem
//   "top"   the piece's own flat top (the last knot)
// The projection of a horizontal circle is an ellipse of ry = r × roundness,
// which is the board's own foreshortening, so pieces sit in the board's
// perspective at any camera angle.
// ---------------------------------------------------------------------------

type Knot = { h: number; mark?: "face" | "ring" | "top"; r: number };

const knot = (h: number, r: number, mark?: Knot["mark"]): Knot =>
  mark ? { h, mark, r } : { h, r };

const SWEEP_STEPS = 10;

/** Interior knots of a curved run from (h0, r0) to (h1, r1); the ends are the caller's. */
function sweep(
  h0: number,
  r0: number,
  h1: number,
  r1: number,
  shape: "cove" | "dome" | "flare" | "taper",
): Knot[] {
  const out: Knot[] = [];
  for (let i = 1; i < SWEEP_STEPS; i++) {
    const t = i / SWEEP_STEPS;
    const angle = (t * Math.PI) / 2;
    switch (shape) {
      // In fast, then up: the sweep out of a base.
      case "cove":
        out.push(
          knot(h0 + (h1 - h0) * (1 - Math.cos(angle)), r1 + (r0 - r1) * (1 - Math.sin(angle))),
        );
        break;
      // Up, then out: the mouth of a cup.
      case "flare":
        out.push(knot(h0 + (h1 - h0) * Math.sin(angle), r0 + (r1 - r0) * (1 - Math.cos(angle))));
        break;
      // Up, then in: a rounded top.
      case "dome":
        out.push(knot(h0 + (h1 - h0) * Math.sin(angle), r1 + (r0 - r1) * Math.cos(angle)));
        break;
      // A long concave body narrowing to a neck.
      case "taper":
        out.push(knot(h0 + (h1 - h0) * t, r1 + (r0 - r1) * (1 - t) ** 1.7));
        break;
    }
  }
  return out;
}

/**
 * A ball that projects as a circle of `radius` about `center`. Heights are not
 * foreshortened in this projection while depth is, so a true sphere would draw
 * as an egg; this is the squashed spheroid that draws round.
 */
function ball(center: number, radius: number, roundness: number): Knot[] {
  const half = radius * Math.sqrt(Math.max(0, 1 - roundness * roundness));
  const steps = 14;
  const out: Knot[] = [];
  for (let i = 0; i <= steps; i++) {
    const angle = -Math.PI / 2 + (i / steps) * Math.PI;
    out.push(knot(center + half * Math.sin(angle), radius * Math.cos(angle)));
  }
  return out;
}

/** Where a ball of `radius` about `center` begins: the stem below it ends here. */
const ballFoot = (center: number, radius: number, roundness: number) =>
  center - radius * Math.sqrt(Math.max(0, 1 - roundness * roundness));

/**
 * The puck every piece stands on: a short wall, a rounded-over edge, a lit
 * flat, and the cove sweeping up out of it.
 */
function base(radius: number, coveTop: { h: number; r: number }): Knot[] {
  const flat = radius * 0.86;
  const foot = radius * 0.66;
  return [
    knot(0, radius),
    knot(0.55, radius),
    ...sweep(0.55, radius, 0.75, flat, "dome"),
    knot(0.75, flat, "face"),
    knot(0.75, foot),
    ...sweep(0.75, foot, coveTop.h, coveTop.r, "cove"),
    knot(coveTop.h, coveTop.r),
  ];
}

/** A ring standing proud of the stem at `h`; the part above stands on its flat. */
function collar(h: number, stem: number, radius: number, thickness: number, neck: number): Knot[] {
  return [
    knot(h, stem, "ring"),
    knot(h, radius),
    knot(h + thickness, radius, "face"),
    knot(h + thickness, neck),
  ];
}

export const BASE_RADIUS: Record<PieceKind, number> = {
  b: 2.25,
  k: 2.55,
  n: 2.3,
  p: 1.85,
  q: 2.5,
  r: 2.3,
};

const PROFILES: Record<PieceKind, (roundness: number) => Knot[]> = {
  p: (roundness) => [
    ...base(BASE_RADIUS.p, { h: 2.0, r: 0.64 }),
    ...collar(4.25, 0.56, 1.06, 0.33, 0.6),
    knot(ballFoot(5.8, 1.14, roundness), 0.6),
    ...ball(5.8, 1.14, roundness),
  ],
  r: () => [
    ...base(BASE_RADIUS.r, { h: 1.95, r: 1.4 }),
    knot(5.45, 1.24),
    ...sweep(5.45, 1.24, 6.35, 1.88, "flare"),
    knot(6.35, 1.88, "ring"),
    knot(6.35, 1.98),
    knot(6.9, 1.98, "top"),
  ],
  // The neck flares straight out of the cove; the collar it stands on is
  // narrower than the base flat so it does not read as a second puck.
  n: () => [...base(BASE_RADIUS.n, { h: 1.75, r: 1.3 }), knot(2.55, 1.62, "top")],
  b: () => [
    ...base(BASE_RADIUS.b, { h: 2.2, r: 1.38 }),
    ...sweep(2.2, 1.38, 6.25, 0.72, "taper"),
    ...collar(6.25, 0.72, 1.48, 0.3, 1.3),
    // The mitre: a bulge, then a taper to the point.
    knot(6.75, 1.45),
    knot(7.0, 1.54),
    knot(7.3, 1.57),
    knot(7.7, 1.53),
    knot(8.1, 1.42),
    knot(8.5, 1.26),
    knot(8.9, 1.06),
    knot(9.3, 0.84),
    knot(9.7, 0.6),
    knot(10.05, 0.36),
    knot(10.35, 0.14),
    knot(10.5, 0),
  ],
  q: () => [
    ...base(BASE_RADIUS.q, { h: 2.3, r: 1.55 }),
    ...sweep(2.3, 1.55, 7.05, 0.82, "taper"),
    ...collar(7.05, 0.82, 1.62, 0.35, 1.22),
    // A closed coronet, so it does not read as the rook's hollow tower.
    ...sweep(7.4, 1.22, 9.4, 1.72, "flare"),
    knot(9.4, 1.72, "top"),
  ],
  k: () => [
    ...base(BASE_RADIUS.k, { h: 2.4, r: 1.6 }),
    ...sweep(2.4, 1.6, 7.35, 0.86, "taper"),
    ...collar(7.35, 0.86, 1.68, 0.37, 1.5),
    ...sweep(7.72, 1.5, 10.15, 0.55, "dome"),
    knot(10.15, 0.55, "face"),
    knot(10.15, 0.42),
  ],
};

// ---------------------------------------------------------------------------
// Projection
// ---------------------------------------------------------------------------

const H_STEP = 0.04;
const Y_STEP = 0.04;
const SIMPLIFY_TOLERANCE = 0.01;

type Point = { x: number; y: number };

/** The profile resampled into horizontal discs no more than H_STEP apart. */
function discs(knots: Knot[]): Knot[] {
  const out: Knot[] = [];
  for (let i = 0; i < knots.length; i++) {
    const a = knots[i]!;
    out.push({ h: a.h, r: a.r });
    const b = knots[i + 1];
    if (!b || b.h <= a.h) continue;
    const count = Math.ceil((b.h - a.h) / H_STEP);
    for (let j = 1; j < count; j++) {
      const t = j / count;
      out.push({ h: a.h + (b.h - a.h) * t, r: a.r + (b.r - a.r) * t });
    }
  }
  return out;
}

/**
 * The projected solid is the union of its discs, each an ellipse centred on
 * the axis; its half-width at a screen y is the widest of them there. Sampled
 * bottom to top and simplified, that is the piece's outline.
 */
function outline(knots: Knot[], roundness: number): Point[] {
  const list = discs(knots);
  let yMin = Infinity;
  let yMax = -Infinity;
  for (const { h, r } of list) {
    yMin = Math.min(yMin, -h - r * roundness);
    yMax = Math.max(yMax, -h + r * roundness);
  }
  const count = Math.max(2, Math.ceil((yMax - yMin) / Y_STEP) + 1);
  const step = (yMax - yMin) / (count - 1);
  const widths = new Array<number>(count).fill(0);
  for (const { h, r } of list) {
    const ry = r * roundness;
    if (ry <= 0) continue;
    const lo = Math.max(0, Math.ceil((-h - ry - yMin) / step));
    const hi = Math.min(count - 1, Math.floor((-h + ry - yMin) / step));
    for (let i = lo; i <= hi; i++) {
      const dy = (yMin + i * step + h) / ry;
      const w = r * Math.sqrt(Math.max(0, 1 - dy * dy));
      if (w > widths[i]!) widths[i] = w;
    }
  }
  const left: Point[] = [];
  for (let i = count - 1; i >= 0; i--) left.push({ x: -widths[i]!, y: yMin + i * step });
  return simplify(left, SIMPLIFY_TOLERANCE);
}

/** Douglas–Peucker, keeping the ends. */
function simplify(points: Point[], tolerance: number): Point[] {
  if (points.length < 3) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack: [number, number][] = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    const { x: ax, y: ay } = points[a]!;
    const dx = points[b]!.x - ax;
    const dy = points[b]!.y - ay;
    const length = Math.hypot(dx, dy) || 1;
    let far = -1;
    let farthest = tolerance;
    for (let i = a + 1; i < b; i++) {
      const distance = Math.abs((points[i]!.x - ax) * dy - (points[i]!.y - ay) * dx) / length;
      if (distance > farthest) {
        far = i;
        farthest = distance;
      }
    }
    if (far >= 0) {
      keep[far] = 1;
      stack.push([a, far], [far, b]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

/** One closed path for the whole profile: up the left side, down the right. */
export function silhouette(knots: Knot[], roundness: number): string {
  const left = outline(knots, roundness);
  const right = left
    .slice(1, -1)
    .reverse()
    .map(({ x, y }) => ({ x: -x, y }));
  return `M${[...left, ...right].map(({ x, y }) => `${f(x)},${f(y)}`).join(" ")}Z`;
}

type Face = { full: boolean; h: number; inner: number; r: number };
type Ring = { h: number; r: number; stem: number };
type Layer = { d: string; face?: Face; rings: Ring[] };

/**
 * The profile cut at each face into layers drawn bottom to top, so a layer's
 * fill covers whatever of the face below it the part standing there hides.
 */
function layers(knots: Knot[], roundness: number): Layer[] {
  const out: Layer[] = [];
  let run: Knot[] = [];
  let rings: Ring[] = [];
  for (let i = 0; i < knots.length; i++) {
    const current = knots[i]!;
    const next = knots[i + 1];
    run.push(current);
    if (current.mark === "ring" && next) {
      rings.push({ h: current.h, r: next.r, stem: current.r });
    }
    if (current.mark === "face" || current.mark === "top") {
      out.push({
        d: silhouette(run, roundness),
        face: {
          full: current.mark === "top",
          h: current.h,
          inner: current.mark === "top" ? 0 : (next?.r ?? 0),
          r: current.r,
        },
        rings,
      });
      run = [];
      rings = [];
    }
  }
  if (run.length) out.push({ d: silhouette(run, roundness), rings });
  return out;
}

// ---------------------------------------------------------------------------
// Parts that are not turned
// ---------------------------------------------------------------------------

type Part = {
  /** Closed outline, part of the piece's silhouette. */
  d: string;
  /** The edges that lie against the piece itself, stroked on top; open. */
  edge?: string;
  fill?: "body" | "shade";
};

const KNIGHT_HEAD =
  "M-1.62,-2.55 C-1.98,-4.1 -1.9,-6.28 -1.25,-7.68 C-0.93,-8.36 -0.48,-8.65 -0.08,-8.72 C0.1,-8.75 0.27,-8.72 0.43,-8.65 C0.84,-8.6 1.18,-8.37 1.4,-8 C1.59,-7.67 1.67,-7.18 1.78,-6.68 L2.08,-5.92 Q2.2,-5.62 2.1,-5.34 L2,-5.08 Q1.91,-4.86 1.62,-4.9 L1.37,-4.95 C0.99,-5.04 0.8,-5.58 0.6,-6.04 Q0.48,-6.29 0.3,-6.08 C0.48,-5.25 0.86,-3.93 1.42,-2.55";
/** The neck's footprint on the collar: an ellipse in the board's perspective. */
const KNIGHT_FOOT = 1.52;
const KNIGHT_BACK_EAR = "M-0.3,-8.62 L-0.58,-9.05 Q-0.65,-9.25 -0.43,-9.15 L0.02,-8.66";
const KNIGHT_FRONT_EAR = "M-0.04,-8.69 L-0.1,-9.2 Q-0.1,-9.4 0.1,-9.26 L0.48,-8.68";

const KING_CROSS_EDGE =
  "M-0.42,-10.15 V-11.07 H-1.28 V-11.85 H-0.42 V-12.85 H0.42 V-11.85 H1.28 V-11.07 H0.42 V-10.15";

function knightParts(roundness: number): Part[] {
  const foot = `A${f(KNIGHT_FOOT)},${f(KNIGHT_FOOT * roundness)} 0 0 1 -1.62,-2.55`;
  return [
    { d: `${KNIGHT_BACK_EAR} Z`, fill: "shade" },
    {
      d: `${KNIGHT_HEAD} ${foot} Z`,
      // The chest where it comes down to the collar.
      edge: "M0.8,-4.34 C0.98,-3.8 1.18,-3.2 1.42,-2.55",
    },
    { d: `${KNIGHT_FRONT_EAR} Z`, edge: KNIGHT_FRONT_EAR },
  ];
}

/** Blocks around the rook's rim, drawn back to front. */
function rookParts(roundness: number): Part[] {
  const rimY = -6.9;
  const ringRadius = 1.66;
  const width = 0.64;
  const height = 0.88;
  const corner = 0.1;
  return [0, 60, 120, 180, 240, 300]
    .map((degrees) => {
      const angle = (degrees * Math.PI) / 180;
      return {
        cx: ringRadius * Math.cos(angle),
        cy: rimY + ringRadius * roundness * Math.sin(angle),
        depth: Math.sin(angle),
      };
    })
    .sort((first, second) => first.depth - second.depth)
    .map(({ cx, cy }) => {
      const x0 = cx - width / 2;
      const x1 = cx + width / 2;
      const top = cy - height;
      const open = `M${f(x0)},${f(cy)} V${f(top + corner)} Q${f(x0)},${f(top)} ${f(x0 + corner)},${f(top)} H${f(x1 - corner)} Q${f(x1)},${f(top)} ${f(x1)},${f(top + corner)} V${f(cy)}`;
      return { d: `${open} Z`, edge: open };
    });
}

/** Points around the queen's crown, back to front, then the finial. */
function queenParts(roundness: number): Part[] {
  const rimY = -9.4;
  const rim = 1.72;
  const apexRadius = 1.55;
  const height = 0.7;
  const halfAngle = (11 * Math.PI) / 180;
  const at = (radius: number, angle: number) =>
    `${f(radius * Math.cos(angle))},${f(rimY + radius * roundness * Math.sin(angle))}`;
  const points = [30, 90, 150, 210, 270, 330]
    .map((degrees) => (degrees * Math.PI) / 180)
    .sort((first, second) => Math.sin(first) - Math.sin(second))
    .map((angle) => {
      const [ax, ay] = at(apexRadius, angle).split(",").map(Number) as [number, number];
      const open = `M${at(rim, angle - halfAngle)} L${f(ax)},${f(ay - height)} L${at(rim, angle + halfAngle)}`;
      return { d: `${open} Z`, edge: open };
    });
  const finial = silhouette(
    [knot(9.4, 0.38), knot(ballFoot(10.35, 0.62, roundness), 0.38), ...ball(10.35, 0.62, roundness)],
    roundness,
  );
  return [...points, { d: finial, edge: finial }];
}

// ---------------------------------------------------------------------------
// Piece specs
// ---------------------------------------------------------------------------

type PieceSpec = {
  /** The hole in a hollow top, as a radius. */
  bore?: number;
  details?: (palette: PiecePalette) => ReactNode;
  parts?: (roundness: number) => Part[];
};

const PIECES: Record<PieceKind, PieceSpec> = {
  p: {},
  r: { bore: 1.42, parts: rookParts },
  n: {
    parts: knightParts,
    details: (palette) => (
      <>
        {/* Mane down the back, kept soft because the body gradient already
            does most of the modelling. */}
        <path
          d="M-1.6,-2.68 C-1.94,-4.3 -1.82,-6.36 -1.12,-7.76 C-0.8,-8.38 -0.4,-8.65 -0.08,-8.72 L0.21,-8.47 C-0.36,-7.43 -0.79,-5.82 -0.75,-4.05 L-0.68,-2.55 Z"
          fill={palette.shade}
          opacity="0.3"
        />
        {/* Cheek and muzzle, the part turned towards the light. */}
        <path
          d="M0.56,-8.36 C1.1,-8.17 1.54,-7.31 1.78,-6.68 L2.08,-5.92 Q2.2,-5.62 2.1,-5.34 L2,-5.08 Q1.91,-4.86 1.62,-4.9 L1.37,-4.95 C1.02,-5.05 0.82,-5.55 0.61,-6.02 C0.79,-6.78 0.77,-7.66 0.56,-8.36 Z"
          fill={palette.highlight}
          opacity="0.22"
        />
        {/* Throat, where the neck turns away. */}
        <path
          d="M-0.48,-2.7 C-0.54,-4.1 -0.28,-5.36 0.28,-6.07 C0.48,-5.2 0.84,-3.86 1.35,-2.62 Z"
          fill={palette.highlight}
          opacity="0.3"
        />
        <path
          d="M-1.28,-7.24 L-0.9,-6.96 M-1.47,-6.7 L-0.96,-6.38 M-1.58,-6.08 L-1,-5.76"
          fill="none"
          opacity="0.5"
          stroke={palette.stroke}
          strokeLinecap="round"
          strokeWidth="0.15"
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
    ),
  },
  b: {
    details: (palette) => (
      <path
        d="M-0.74,-9.42 L0.8,-7.5"
        fill="none"
        stroke={palette.deep}
        strokeLinecap="round"
        strokeWidth="0.46"
        vectorEffect="non-scaling-stroke"
      />
    ),
  },
  q: { parts: queenParts },
  k: {
    parts: () => [{ d: `${KING_CROSS_EDGE} Z`, edge: KING_CROSS_EDGE }],
  },
};

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

const lineProps = {
  fill: "none",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  strokeWidth: LINE_WIDTH,
  vectorEffect: "non-scaling-stroke",
} as const;

/** The front arc of a horizontal circle: left to right, bulging toward the viewer. */
const frontArc = (radius: number, y: number, roundness: number) =>
  `M${f(-radius)},${f(y)} A${f(radius)},${f(radius * roundness)} 0 0 0 ${f(radius)},${f(y)}`;

/** A collar's lip, and the shadow it throws down the stem. */
function RingArt({
  palette,
  ring,
  roundness,
}: {
  palette: PiecePalette;
  ring: Ring;
  roundness: number;
}) {
  const { h, r, stem } = ring;
  const y = -h;
  const ry = r * roundness;
  const lip = y + roundness * Math.sqrt(Math.max(0, r * r - stem * stem));
  const band = (depth: number) =>
    `M${f(-stem)},${f(lip)} A${f(r)},${f(ry)} 0 0 0 ${f(stem)},${f(lip)} L${f(stem)},${f(lip + depth)} A${f(r)},${f(ry)} 0 0 1 ${f(-stem)},${f(lip + depth)} Z`;
  return (
    <>
      <path d={band(0.62)} fill={palette.shade} opacity="0.16" />
      <path d={band(0.3)} fill={palette.shade} opacity="0.2" />
      <path d={frontArc(r, y, roundness)} stroke={palette.line} {...lineProps} />
    </>
  );
}

/**
 * A flat lit from above. A full face is the piece's own top, with its bore if
 * it is hollow. Otherwise only the crescent left around the part standing on
 * it is drawn: the front between the two rims, and the two ears behind.
 */
function FaceArt({
  bore,
  face,
  palette,
  roundness,
}: {
  bore?: number;
  face: Face;
  palette: PiecePalette;
  roundness: number;
}) {
  const { full, h, inner, r } = face;
  const y = -h;
  const ry = r * roundness;
  if (full) {
    return (
      <>
        <ellipse cx="0" cy={f(y)} fill={palette.highlight} rx={f(r)} ry={f(ry)} />
        {bore ? (
          <>
            <ellipse
              cx="0"
              cy={f(y + ry * 0.08)}
              fill={palette.deep}
              opacity="0.9"
              rx={f(bore)}
              ry={f(bore * roundness)}
            />
            {/* Far inner wall, catching a little light so the bore reads as a hole. */}
            <ellipse
              cx="0"
              cy={f(y - bore * roundness * 0.3)}
              fill={palette.main}
              opacity="0.28"
              rx={f(bore * 0.75)}
              ry={f(bore * roundness * 0.32)}
            />
          </>
        ) : null}
        <path d={frontArc(r, y, roundness)} stroke={palette.line} {...lineProps} />
      </>
    );
  }
  const rise = roundness * Math.sqrt(Math.max(0, r * r - inner * inner));
  const crescent = [
    `M${f(-r)},${f(y)} A${f(r)},${f(ry)} 0 0 0 ${f(r)},${f(y)} L${f(inner)},${f(y)} A${f(inner)},${f(inner * roundness)} 0 0 1 ${f(-inner)},${f(y)} Z`,
    `M${f(-r)},${f(y)} A${f(r)},${f(ry)} 0 0 1 ${f(-inner)},${f(y - rise)} L${f(-inner)},${f(y)} Z`,
    `M${f(r)},${f(y)} A${f(r)},${f(ry)} 0 0 0 ${f(inner)},${f(y - rise)} L${f(inner)},${f(y)} Z`,
  ].join(" ");
  return (
    <>
      <path d={crescent} fill={palette.highlight} />
      <path
        d={`${frontArc(r, y, roundness)} ${frontArc(inner, y, roundness)}`}
        stroke={palette.line}
        {...lineProps}
      />
    </>
  );
}

export function PieceShape({
  bodyFill,
  color,
  detail,
  kind,
  roundness,
}: {
  /** Gradient to model the body with; falls back to the flat mid tone. */
  bodyFill?: string;
  color: PieceColor;
  detail: boolean;
  kind: PieceKind;
  roundness: number;
}) {
  const tones = color === "w" ? LIGHT_PIECE : DARK_PIECE;
  const palette = bodyFill ? { ...tones, body: bodyFill } : tones;
  const spec = PIECES[kind];
  const stack = layers(PROFILES[kind](roundness), roundness);
  const parts = spec.parts?.(roundness) ?? [];
  return (
    <>
      {/* The rim: everything once, stroked, in the rim colour. The fills go
          over it, so only the outside of the union shows. */}
      <g fill={palette.stroke} stroke={palette.stroke} strokeLinejoin="round" strokeWidth={RIM_WIDTH}>
        {stack.map((layer, index) => (
          <path d={layer.d} key={`rim-${index}`} vectorEffect="non-scaling-stroke" />
        ))}
        {parts.map((part, index) => (
          <path d={part.d} key={`rim-part-${index}`} vectorEffect="non-scaling-stroke" />
        ))}
      </g>
      {stack.map((layer, index) => (
        <g key={`layer-${index}`}>
          <path d={layer.d} fill={palette.body} />
          {detail
            ? layer.rings.map((ring) => (
                <RingArt key={ring.h} palette={palette} ring={ring} roundness={roundness} />
              ))
            : null}
          {detail && layer.face ? (
            <FaceArt bore={spec.bore} face={layer.face} palette={palette} roundness={roundness} />
          ) : null}
        </g>
      ))}
      {parts.map((part, index) => (
        <g key={`part-${index}`}>
          <path d={part.d} fill={part.fill === "shade" ? palette.shade : palette.body} />
          {detail && part.edge ? <path d={part.edge} stroke={palette.line} {...lineProps} /> : null}
        </g>
      ))}
      {detail && spec.details ? spec.details(palette) : null}
    </>
  );
}

export const PIECE_COLORS: PieceColor[] = ["w", "b"];
export const PIECE_KINDS: PieceKind[] = ["p", "r", "n", "b", "q", "k"];

// Pieces are defined once here and instanced with <use>, so the detail flag
// swaps every piece on the board between the full and simplified builds.
export const PieceDefinitions = memo(function PieceDefinitions({
  detail,
  prefix,
  roundness = DIAMOND.pieceRoundness,
}: {
  detail: boolean;
  prefix: string;
  roundness?: number;
}) {
  return (
    <defs>
      {PIECE_COLORS.map((color) => {
        const palette = color === "w" ? LIGHT_PIECE : DARK_PIECE;
        return (
          // Spans the whole piece in its own coordinates, so one ramp models
          // the entire form instead of each part getting its own.
          <linearGradient
            gradientUnits="userSpaceOnUse"
            id={`${prefix}-body-${color}`}
            key={`gradient-${color}`}
            x1="-2.7"
            x2="2.5"
            y1="0"
            y2="0"
          >
            <stop offset="0" stopColor={palette.highlight} />
            <stop offset="0.32" stopColor={palette.main} />
            <stop offset="1" stopColor={palette.shade} />
          </linearGradient>
        );
      })}
      {PIECE_COLORS.flatMap((color) =>
        PIECE_KINDS.map((kind) => (
          <g key={`${color}-${kind}`} id={`${prefix}-${color}-${kind}`}>
            <PieceShape
              bodyFill={`url(#${prefix}-body-${color})`}
              color={color}
              detail={detail}
              kind={kind}
              roundness={roundness}
            />
          </g>
        )),
      )}
    </defs>
  );
});

export const PieceModel = memo(function PieceModel({
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
  prefix,
  pieceScale = DIAMOND.pieceScale,
  roundness = DIAMOND.pieceRoundness,
}: RenderPiece & {
  pieceScale?: number;
  prefix: string;
  roundness?: number;
}) {
  // Contact shadow, concentric with the base. Two stacked ellipses fake a soft
  // edge, which is far cheaper than an SVG blur filter repeated across 32
  // pieces. It flattens and fades as the piece lifts off the board mid-move.
  const shadowOpacity = clamp(0.9 - lift * 0.3 + impact * 0.08, 0.35, 0.95);
  const shadowRadiusX = BASE_RADIUS[kind] * 1.1 + lift * 0.3 + impact * 0.22;
  const shadowRadiusY = shadowRadiusX * roundness;

  return (
    <g
      data-piece={id}
      data-square={square}
      opacity={opacity}
      transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${(
        scale * pieceScale
      ).toFixed(3)})`}
    >
      <g opacity={shadowOpacity.toFixed(3)}>
        <ellipse
          cx="0"
          cy="0"
          fill={heroRgba("ink", 0.16)}
          rx={shadowRadiusX * 1.18}
          ry={shadowRadiusY * 1.18}
        />
        <ellipse cx="0" cy="0" fill={heroRgba("ink", 0.4)} rx={shadowRadiusX} ry={shadowRadiusY} />
      </g>
      <g
        transform={`translate(0 ${(-lift).toFixed(2)}) rotate(${rotation.toFixed(2)}) scale(1 ${verticalScale.toFixed(3)})`}
      >
        <use href={`#${prefix}-${color}-${kind}`} />
      </g>
    </g>
  );
});

export const BoardSurface = memo(function BoardSurface({
  geometry = DIAMOND,
}: {
  geometry?: BoardGeometry;
}) {
  const { boardDepth, corners, gridPath, lightSquaresPath } = geometry;
  const { far, front, left, near } = corners;

  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <path
        d={`M${left.x},${left.y} L${front.x},${front.y} L${front.x},${front.y + boardDepth} L${left.x},${left.y + boardDepth} Z`}
        fill={HERO_COLORS.mid}
        stroke={heroRgba("light", 0.58)}
        strokeWidth="0.76"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={`M${far.x},${far.y} L${front.x},${front.y} L${front.x},${front.y + boardDepth} L${far.x},${far.y + boardDepth} Z`}
        fill={HERO_COLORS.deep}
        stroke={heroRgba("light", 0.48)}
        strokeWidth="0.76"
        vectorEffect="non-scaling-stroke"
      />

      <polygon
        data-board-squares="64"
        fill={HERO_COLORS.deep}
        points={[near, far, front, left]
          .map(({ x, y }) => `${x.toFixed(2)},${y.toFixed(2)}`)
          .join(" ")}
      />
      <path
        d={lightSquaresPath}
        data-board-light-squares="32"
        fill={heroRgba("light", 0.9)}
      />
      <path
        d={gridPath}
        fill="none"
        stroke={heroRgba("light", 0.24)}
        strokeWidth="0.28"
        vectorEffect="non-scaling-stroke"
      />

      <polygon
        fill="none"
        points={[near, far, front, left]
          .map(({ x, y }) => `${x.toFixed(2)},${y.toFixed(2)}`)
          .join(" ")}
        stroke={heroRgba("light", 0.78)}
        strokeWidth="0.94"
        vectorEffect="non-scaling-stroke"
      />
    </g>
  );
});

export function dangerRgba(alpha: number): string {
  return `rgba(255, 76, 108, ${clamp(alpha).toFixed(3)})`;
}
