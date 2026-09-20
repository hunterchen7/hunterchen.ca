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
// mark on the lower knot says what starts there:
//   "wall"  a vertical run drawn as a dark band: the lip of a base, the side
//           of a collar; what the turned rings read by
//   "face"  a flat lit from above, that the narrower part above stands on
//   "top"   the piece's own flat top (the last knot)
// The projection of a horizontal circle is an ellipse of ry = r × roundness,
// which is the board's own foreshortening, so pieces sit in the board's
// perspective at any camera angle.
//
// Proportions follow the Staunton pattern: a bell base with a thin lip and a
// stepped shoulder, a concave body, a flat collar with a second ring under
// the head, and the heads themselves: a ball for the pawn, a notched cap for
// the rook, an onion mitre for the bishop, a flared goblet for the queen and
// king, and the horse for the knight.
// ---------------------------------------------------------------------------

type Knot = { h: number; mark?: "face" | "top" | "wall"; r: number };

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
      // Up, then in: a rounded shoulder.
      case "dome":
        out.push(knot(h0 + (h1 - h0) * Math.sin(angle), r1 + (r0 - r1) * Math.cos(angle)));
        break;
      // A long concave body narrowing to a neck.
      case "taper":
        out.push(knot(h0 + (h1 - h0) * t, r1 + (r0 - r1) * (1 - t) ** 1.6));
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

/** A ball standing on whatever is at `foot`: its stem, then the ball. */
function finial(foot: number, stem: number, radius: number, roundness: number): Knot[] {
  const center = foot + radius;
  return [knot(foot, stem), knot(ballFoot(center, radius, roundness), stem), ...ball(center, radius, roundness)];
}

/** Height of the base's shoulder step, where every piece's body begins. */
const SHOULDER = 1.1;

/**
 * The bell every piece stands on: a thin dark lip, a rounded shoulder, and a
 * lit step at the top that the body rises out of.
 */
function base(radius: number): Knot[] {
  return [
    knot(0, radius, "wall"),
    knot(0.3, radius, "face"),
    knot(0.3, radius * 0.96),
    ...sweep(0.3, radius * 0.96, SHOULDER, radius * 0.68, "dome"),
    knot(SHOULDER, radius * 0.68, "face"),
    knot(SHOULDER, radius * 0.58),
  ];
}

/** A flat disc standing proud of the stem at `h`; the part above stands on its lit top. */
function collar(h: number, stem: number, radius: number, thickness: number, neck: number): Knot[] {
  return [
    knot(h, stem),
    knot(h, radius, "wall"),
    knot(h + thickness, radius, "face"),
    knot(h + thickness, neck),
  ];
}

export const BASE_RADIUS: Record<PieceKind, number> = {
  b: 2.25,
  k: 2.55,
  n: 2.3,
  p: 2.0,
  q: 2.5,
  r: 2.3,
};

const PROFILES: Record<PieceKind, (roundness: number) => Knot[]> = {
  p: (roundness) => [
    ...base(BASE_RADIUS.p),
    ...sweep(SHOULDER, 1.16, 2.3, 0.74, "cove"),
    knot(2.3, 0.74),
    knot(3.95, 0.78),
    ...collar(3.95, 0.78, 1.22, 0.28, 0.66),
    ...finial(4.23, 0.66, 1.2, roundness),
  ],
  r: () => [
    ...base(BASE_RADIUS.r),
    ...sweep(SHOULDER, 1.33, 1.7, 1.6, "cove"),
    knot(1.7, 1.6),
    knot(5.4, 1.25),
    // The cap: a wider band the notches are cut into.
    knot(5.4, 1.75),
    knot(ROOK_CAP_TOP, 1.75, "top"),
  ],
  n: () => [
    ...base(BASE_RADIUS.n),
    ...sweep(SHOULDER, 1.33, 1.5, 1.5, "cove"),
    knot(1.5, 1.5, "top"),
  ],
  b: (roundness) => [
    ...base(BASE_RADIUS.b),
    ...sweep(SHOULDER, 1.3, 5.6, 0.74, "taper"),
    ...collar(5.6, 0.74, 1.36, 0.3, 0.92),
    ...collar(6.08, 0.92, 1.1, 0.2, 0.86),
    // The mitre: an onion bulb closing to a point the tip ball stands on.
    knot(6.5, 1.06),
    knot(6.75, 1.22),
    knot(7.05, 1.32),
    knot(7.4, 1.33),
    knot(7.75, 1.26),
    knot(8.1, 1.12),
    knot(8.45, 0.93),
    knot(8.8, 0.7),
    knot(9.1, 0.47),
    knot(9.35, 0.28),
    ...finial(9.5, 0.16, 0.3, roundness),
  ],
  q: () => [
    ...base(BASE_RADIUS.q),
    ...sweep(SHOULDER, 1.45, 6.4, 0.86, "taper"),
    ...collar(6.4, 0.86, 1.62, 0.32, 1.0),
    ...collar(6.95, 1.0, 1.22, 0.2, 0.95),
    // The goblet: a concave flare to the coronet's rim.
    ...sweep(7.15, 0.95, 9.5, 1.55, "flare"),
    knot(9.5, 1.55, "top"),
  ],
  k: () => [
    ...base(BASE_RADIUS.k),
    ...sweep(SHOULDER, 1.48, 7.0, 0.96, "taper"),
    ...collar(7.0, 0.96, 1.7, 0.35, 1.06),
    ...collar(7.6, 1.06, 1.3, 0.2, 1.0),
    ...sweep(7.8, 1.0, 10.2, 1.5, "flare"),
    knot(10.2, 1.5, "top"),
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
 * bottom to top and simplified, that is the piece's left outline.
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

const pathOf = (points: Point[]) => `M${points.map(({ x, y }) => `${f(x)},${f(y)}`).join(" ")}Z`;

/** One closed path for the whole profile: up the left side, down the right. */
export function silhouette(knots: Knot[], roundness: number): string {
  const left = outline(knots, roundness);
  const right = left
    .slice(1, -1)
    .reverse()
    .map(({ x, y }) => ({ x: -x, y }));
  return pathOf([...left, ...right]);
}

/** The right half of the silhouette, closed along the axis: the shaded side. */
function shadedHalf(knots: Knot[], roundness: number): string {
  return pathOf(outline(knots, roundness).map(({ x, y }) => ({ x: -x, y })));
}

type Face = { full: boolean; h: number; inner: number; r: number };
type Wall = { h0: number; h1: number; r: number };
type Layer = { d: string; face?: Face; half: string; walls: Wall[] };

/**
 * The profile cut at each face into layers drawn bottom to top, so a layer's
 * fill covers whatever of the face below it the part standing there hides.
 */
function layers(knots: Knot[], roundness: number): Layer[] {
  const out: Layer[] = [];
  let run: Knot[] = [];
  let walls: Wall[] = [];
  const close = (face?: Face) => {
    out.push({ d: silhouette(run, roundness), face, half: shadedHalf(run, roundness), walls });
    run = [];
    walls = [];
  };
  for (let i = 0; i < knots.length; i++) {
    const current = knots[i]!;
    const next = knots[i + 1];
    run.push(current);
    if (current.mark === "wall" && next) {
      walls.push({ h0: current.h, h1: next.h, r: current.r });
    }
    if (current.mark === "face" || current.mark === "top") {
      close({
        full: current.mark === "top",
        h: current.h,
        inner: current.mark === "top" ? 0 : (next?.r ?? 0),
        r: current.r,
      });
    }
  }
  if (run.length) close();
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
  /** The part of it turned from the light. */
  shade?: string;
};

/** A point on a horizontal circle of `radius` at height `h`, at `angle` around it. */
const around = (radius: number, h: number, angle: number, roundness: number) => ({
  x: radius * Math.cos(angle),
  y: -h + radius * roundness * Math.sin(angle),
});

const at = ({ x, y }: Point) => `${f(x)},${f(y)}`;

/**
 * The horse, in profile as every set draws it: the neck rises flush with the
 * base and bulges forward into the chest, the throat tucks under a long jaw,
 * and the forehead runs straight from the ears to a squared muzzle.
 */
const KNIGHT_HEAD =
  "M-1.5,-1.5 C-1.76,-3.2 -1.56,-5.6 -0.9,-7.2 C-0.75,-7.7 -0.55,-8.2 -0.2,-8.55 C0.1,-8.75 0.55,-8.75 0.95,-8.5 C1.45,-8.15 2.05,-7.2 2.55,-6.35 C2.75,-6.0 2.7,-5.55 2.45,-5.3 C2.2,-5.1 1.85,-5.15 1.55,-5.35 C1.2,-5.6 0.95,-5.95 0.8,-6.15 C0.85,-5.2 1.25,-3.8 1.55,-2.6 C1.62,-2.2 1.6,-1.8 1.55,-1.5";
const KNIGHT_BACK_EAR = "M-0.45,-8.45 L-0.72,-9.3 L-0.05,-8.62";
const KNIGHT_FRONT_EAR = "M0.15,-8.62 L0.32,-9.45 L0.85,-8.48";

function knightParts(roundness: number): Part[] {
  const foot = `A1.53,${f(1.53 * roundness)} 0 0 1 -1.5,-1.5`;
  return [
    { d: `${KNIGHT_BACK_EAR} Z`, fill: "shade" },
    { d: `${KNIGHT_HEAD} ${foot} Z` },
    { d: `${KNIGHT_FRONT_EAR} Z`, edge: KNIGHT_FRONT_EAR },
  ];
}

const ROOK_CAP_TOP = 7.0;
const ROOK_CAP = 1.75;
const ROOK_BORE = 1.3;
const ROOK_NOTCH_DEPTH = 0.5;

/**
 * Four narrow notches cut into the rook's cap at the diagonals, as the
 * Staunton pattern has them. Each takes a wedge out of the lit top ring; the
 * two in front also open a slot down the outer wall.
 */
function RookNotches({ palette, roundness }: { palette: PiecePalette; roundness: number }) {
  const halfSpan = (11 * Math.PI) / 180;
  return (
    <>
      {[45, 135, 225, 315].map((degrees) => {
        const angle = (degrees * Math.PI) / 180;
        const outerA = around(ROOK_CAP, ROOK_CAP_TOP, angle - halfSpan, roundness);
        const outerB = around(ROOK_CAP, ROOK_CAP_TOP, angle + halfSpan, roundness);
        const innerA = around(ROOK_BORE, ROOK_CAP_TOP, angle - halfSpan, roundness);
        const innerB = around(ROOK_BORE, ROOK_CAP_TOP, angle + halfSpan, roundness);
        const drop = (point: Point) => ({ x: point.x, y: point.y + ROOK_NOTCH_DEPTH });
        return (
          <g key={degrees}>
            <path
              d={`M${at(outerA)} L${at(outerB)} L${at(innerB)} L${at(innerA)} Z`}
              fill={palette.shade}
              opacity="0.55"
            />
            {Math.sin(angle) > 0 ? (
              <path
                d={`M${at(outerA)} L${at(outerB)} L${at(drop(outerB))} L${at(drop(outerA))} Z`}
                fill={palette.deep}
                opacity="0.85"
              />
            ) : null}
          </g>
        );
      })}
    </>
  );
}

/** Eight rounded teeth around the coronet, and the ball above its dish. */
function queenParts(roundness: number): Part[] {
  const rimH = 9.5;
  const rim = 1.55;
  const halfSpan = (13 * Math.PI) / 180;
  const teeth = Array.from({ length: 8 }, (_, i) => ((22.5 + i * 45) * Math.PI) / 180)
    .sort((first, second) => Math.sin(first) - Math.sin(second))
    .map((angle) => {
      const left = around(rim, rimH, angle - halfSpan, roundness);
      const right = around(rim, rimH, angle + halfSpan, roundness);
      const apex = around(rim * 0.97, rimH, angle, roundness);
      const open = `M${at(left)} Q${f(apex.x)},${f(apex.y - 0.62)} ${at(right)}`;
      return { d: `${open} Z`, edge: open };
    });
  const ballPath = silhouette(finial(9.5, 0.2, 0.42, roundness), roundness);
  return [...teeth, { d: ballPath, edge: ballPath }];
}

const KING_CROSS_EDGE =
  "M-0.36,-10.2 V-11.14 H-1.06 V-11.78 H-0.36 V-12.3 H0.36 V-11.78 H1.06 V-11.14 H0.36 V-10.2";
const KING_CROSS_SHADE = "M0,-12.3 H0.36 V-11.78 H1.06 V-11.14 H0.36 V-10.2 H0 Z";

// ---------------------------------------------------------------------------
// Piece specs
// ---------------------------------------------------------------------------

type PieceSpec = {
  /** A hole in the top, as a radius. */
  bore?: number;
  details?: (palette: PiecePalette, roundness: number) => ReactNode;
  /** A shallow hollow in the top, as a radius. */
  dish?: number;
  parts?: (roundness: number) => Part[];
};

/** The catchlight on a ball of `radius` about `center`. */
function Gleam({ center, palette, radius }: { center: number; palette: PiecePalette; radius: number }) {
  return (
    <ellipse
      cx={f(-radius * 0.36)}
      cy={f(-center - radius * 0.34)}
      fill={palette.highlight}
      opacity="0.85"
      rx={f(radius * 0.32)}
      ry={f(radius * 0.22)}
    />
  );
}

const PIECES: Record<PieceKind, PieceSpec> = {
  p: { details: (palette) => <Gleam center={5.43} palette={palette} radius={1.2} /> },
  r: {
    bore: ROOK_BORE,
    details: (palette, roundness) => <RookNotches palette={palette} roundness={roundness} />,
  },
  n: {
    parts: knightParts,
    details: (palette) => (
      <>
        {/* The mane, a dark ridge down the back of the neck. */}
        <path
          d="M-1.5,-1.55 C-1.76,-3.2 -1.56,-5.6 -0.9,-7.2 C-0.75,-7.7 -0.55,-8.2 -0.2,-8.55 L0.1,-8.28 C-0.25,-7.9 -0.42,-7.45 -0.5,-7.05 C-1.1,-5.5 -1.35,-3.4 -1.25,-1.55 Z"
          fill={palette.deep}
          opacity="0.42"
        />
        {/* The far side of the face and jaw. */}
        <path
          d="M0.95,-8.5 C1.45,-8.15 2.05,-7.2 2.55,-6.35 C2.75,-6.0 2.7,-5.55 2.45,-5.3 C2.2,-5.1 1.85,-5.15 1.55,-5.35 C1.2,-5.6 0.95,-5.95 0.8,-6.15 C1.05,-6.9 1.05,-7.8 0.95,-8.5 Z"
          fill={palette.shade}
          opacity="0.5"
        />
        {/* The chest, turned from the light. */}
        <path
          d="M0.8,-6.15 C0.85,-5.2 1.25,-3.8 1.55,-2.6 C1.62,-2.2 1.6,-1.8 1.55,-1.5 L0.6,-1.5 C0.45,-3.0 0.5,-4.6 0.8,-6.15 Z"
          fill={palette.shade}
          opacity="0.42"
        />
        {/* The throat's crease and the mane's teeth. */}
        <path
          d="M0.9,-6.0 C0.66,-5.1 0.62,-4.2 0.8,-3.1 M-1.62,-3.3 L-1.15,-3.0 M-1.66,-4.05 L-1.18,-3.75 M-1.62,-4.8 L-1.14,-4.5 M-1.5,-5.55 L-1.02,-5.25 M-1.3,-6.3 L-0.85,-6.0 M-1.05,-7.0 L-0.62,-6.72"
          fill="none"
          opacity="0.55"
          stroke={palette.stroke}
          strokeLinecap="round"
          strokeWidth="0.15"
          vectorEffect="non-scaling-stroke"
        />
        <circle
          cx="1.38"
          cy="-7.42"
          fill={palette.eye}
          r="0.17"
          stroke={palette.eyeStroke}
          strokeWidth="0.07"
          vectorEffect="non-scaling-stroke"
        />
        <circle cx="1.38" cy="-7.42" fill={palette.deep} r="0.07" />
        <circle cx="2.32" cy="-6.28" fill={palette.deep} r="0.1" />
        <path
          d="M2.28,-5.68 L2.6,-5.55"
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
      <>
        <path
          d="M-0.6,-9.1 L0.85,-7.5"
          fill="none"
          stroke={palette.deep}
          strokeLinecap="round"
          strokeWidth="0.52"
          vectorEffect="non-scaling-stroke"
        />
        <Gleam center={7.35} palette={palette} radius={1.33} />
      </>
    ),
  },
  q: {
    dish: 1.18,
    parts: queenParts,
    details: (palette) => <Gleam center={9.92} palette={palette} radius={0.42} />,
  },
  k: {
    parts: () => [{ d: `${KING_CROSS_EDGE} Z`, edge: KING_CROSS_EDGE, shade: KING_CROSS_SHADE }],
  },
};

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

/** How far the shaded half is turned from the light. */
const SHADE_OPACITY = 0.6;

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

/** The visible side of a short cylinder, between its top and bottom rims. */
function wallPath({ h0, h1, r }: Wall, roundness: number): string {
  const ry = f(r * roundness);
  return `M${f(-r)},${f(-h1)} A${f(r)},${ry} 0 0 0 ${f(r)},${f(-h1)} L${f(r)},${f(-h0)} A${f(r)},${ry} 0 0 1 ${f(-r)},${f(-h0)} Z`;
}

/**
 * A flat lit from above. A full face is the piece's own top, with its bore or
 * dish if it has one. Otherwise only the crescent left around the part
 * standing on it is drawn: the front between the two rims, and the ears behind.
 */
function FaceArt({
  bore,
  dish,
  face,
  palette,
  roundness,
}: {
  bore?: number;
  dish?: number;
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
        <ellipse cx="0" cy={f(y)} fill={palette.highlight} opacity="0.9" rx={f(r)} ry={f(ry)} />
        {bore ? (
          <>
            <ellipse
              cx="0"
              cy={f(y)}
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
        {dish ? (
          <ellipse
            cx="0"
            cy={f(y + ry * 0.05)}
            fill={palette.deep}
            opacity="0.3"
            rx={f(dish)}
            ry={f(dish * roundness)}
          />
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
      <path d={crescent} fill={palette.highlight} opacity="0.9" />
      <path d={frontArc(r, y, roundness)} stroke={palette.line} {...lineProps} />
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
          {detail ? (
            <>
              <path d={layer.half} fill={palette.shade} opacity={SHADE_OPACITY} />
              {layer.walls.map((wall) => (
                <path
                  d={wallPath(wall, roundness)}
                  fill={palette.deep}
                  key={wall.h0}
                  opacity="0.88"
                />
              ))}
              {layer.face ? (
                <FaceArt
                  bore={spec.bore}
                  dish={spec.dish}
                  face={layer.face}
                  palette={palette}
                  roundness={roundness}
                />
              ) : null}
            </>
          ) : null}
        </g>
      ))}
      {parts.map((part, index) => (
        <g key={`part-${index}`}>
          <path d={part.d} fill={part.fill === "shade" ? palette.shade : palette.body} />
          {detail && part.shade ? (
            <path d={part.shade} fill={palette.shade} opacity={SHADE_OPACITY} />
          ) : null}
          {detail && part.edge ? <path d={part.edge} stroke={palette.line} {...lineProps} /> : null}
        </g>
      ))}
      {detail && spec.details ? spec.details(palette, roundness) : null}
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
