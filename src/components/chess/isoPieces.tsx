import { memo } from "react";
import { HERO_COLORS, heroRgba, litHeroTone } from "../hero/heroPalette";
import { DIAMOND, clamp, type BoardGeometry } from "./isoGeometry";

/**
 * Piece artwork and board surface for the isometric chessboard, shared by the
 * ambient ChessboardWatermark and the playable IsoChessBoard.
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
  /** Fill for large body shapes; a left-to-right gradient when one is available. */
  body: string;
  deep: string;
  eye: string;
  eyeStroke: string;
  highlight: string;
  main: string;
  shade: string;
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
  stroke: heroRgba("light", 0.96),
};

export const DARK_PIECE: PiecePalette = {
  body: HERO_COLORS.deep,
  main: HERO_COLORS.deep,
  highlight: HERO_COLORS.mid,
  shade: HERO_COLORS.ink,
  deep: HERO_COLORS.ink,
  eye: HERO_COLORS.accent,
  eyeStroke: heroRgba("light", 0.78),
  stroke: heroRgba("accent", 0.62),
};


/**
 * `roundness` is the ratio of a horizontal circle's drawn height to its width,
 * i.e. the sine of the camera's elevation. Every disc, collar and rim on a
 * piece derives its `ry` from it, so the pieces sit in the same perspective as
 * the board they stand on: shallow for the corner-on diamond, much rounder for
 * the head-on board.
 */
type PieceProps = {
  detail: boolean;
  palette: PiecePalette;
  roundness: number;
};

/** Bottom half of a horizontal disc, as a quadratic through (0, ry). */
function frontArc(width: number, ry: number, y: number): string {
  return `Q0,${(y + ry * 2).toFixed(2)} ${(-width).toFixed(2)},${y.toFixed(2)}`;
}

/** A horizontal disc: lit top face, shaded right, with a front rim. */
function Disc({
  cy,
  palette,
  roundness,
  shade = true,
  width,
}: {
  cy: number;
  palette: PiecePalette;
  roundness: number;
  shade?: boolean;
  width: number;
}) {
  const ry = width * roundness;
  return (
    <>
      <ellipse
        cx="0"
        cy={cy}
        fill={palette.body}
        rx={width}
        ry={ry}
        stroke={palette.stroke}
        strokeWidth="0.3"
        vectorEffect="non-scaling-stroke"
      />
      {shade ? (
        <path
          d={`M0,${(cy - ry).toFixed(2)} A${width},${ry} 0 0 1 0,${(cy + ry).toFixed(2)} Z`}
          fill={palette.shade}
          opacity="0.2"
        />
      ) : null}
      <ellipse
        cx={-width * 0.22}
        cy={cy - ry * 0.3}
        fill={palette.highlight}
        opacity="0.26"
        rx={width * 0.6}
        ry={ry * 0.55}
      />
    </>
  );
}

/**
 * The turned base every piece stands on: a short cylinder (footprint disc, wall,
 * lit top disc) with the flared skirt of the piece rising out of it. Drawing the
 * wall rather than a single flat ellipse is most of what makes the piece read as
 * a solid object rather than a sticker.
 */
function PieceBase({
  detail,
  neckWidth = 1.02,
  palette,
  roundness,
  width = 2.35,
}: PieceProps & { neckWidth?: number; width?: number }) {
  const ry = width * roundness;
  const wall = 0.58;
  const neck = -2.55;
  const waist = width * 0.44;
  const top = neckWidth;

  return (
    <>
      {/* Footprint, and the wall of the base standing on it. */}
      <ellipse cx="0" cy="0" fill={palette.deep} rx={width} ry={ry} />
      <path
        d={`M${-width},${-wall} V0 ${frontArc(width, ry, 0)} V${-wall} Z`}
        fill={palette.main}
        stroke={palette.stroke}
        strokeWidth="0.3"
        vectorEffect="non-scaling-stroke"
      />
      {detail ? (
        <path
          d={`M0,${-wall} V${ry.toFixed(2)} ${frontArc(width, ry, 0)
            .replace("Q0,", `Q${(width * 0.62).toFixed(2)},`)
            .replace(`${(-width).toFixed(2)},0.00`, `${(-0).toFixed(2)},${ry.toFixed(2)}`)} Z`}
          fill={palette.shade}
          opacity="0.001"
        />
      ) : null}
      <Disc cy={-wall} palette={palette} roundness={roundness} shade={detail} width={width} />

      {/* Flared skirt from the base up to the neck. */}
      <path
        d={`M${-width},${-wall} C${(-width * 0.94).toFixed(2)},${(-wall - 0.85).toFixed(2)} ${(-waist - 0.5).toFixed(2)},${(neck + 0.75).toFixed(2)} ${-top},${neck} C${(-top * 0.5).toFixed(2)},${(neck - 0.3).toFixed(2)} ${(top * 0.5).toFixed(2)},${(neck - 0.3).toFixed(2)} ${top},${neck} C${(waist + 0.5).toFixed(2)},${(neck + 0.75).toFixed(2)} ${(width * 0.94).toFixed(2)},${(-wall - 0.85).toFixed(2)} ${width},${-wall} ${frontArc(width, ry, -wall)} Z`}
        fill={palette.body}
        stroke={palette.stroke}
        strokeWidth="0.32"
        vectorEffect="non-scaling-stroke"
      />
      {detail ? (
        <>
          <path
            d={`M0,${(neck - 0.16).toFixed(2)} C${(top * 0.5).toFixed(2)},${(neck - 0.3).toFixed(2)} ${top},${neck} ${top},${neck} C${(waist + 0.5).toFixed(2)},${(neck + 0.75).toFixed(2)} ${(width * 0.94).toFixed(2)},${(-wall - 0.85).toFixed(2)} ${width},${-wall} ${frontArc(width, ry, -wall)
              .replace(`${(-width).toFixed(2)}`, "0")} Z`}
            fill={palette.shade}
            opacity="0.26"
          />
          <path
            d={`M${(-width * 0.93).toFixed(2)},${(-wall - 0.2).toFixed(2)} C${(-width * 0.88).toFixed(2)},${(-wall - 0.95).toFixed(2)} ${(-waist - 0.45).toFixed(2)},${(neck + 0.8).toFixed(2)} ${(-top * 0.96).toFixed(2)},${(neck + 0.06).toFixed(2)}`}
            fill="none"
            opacity="0.5"
            stroke={palette.highlight}
            strokeLinecap="round"
            strokeWidth="0.26"
            vectorEffect="non-scaling-stroke"
          />
        </>
      ) : null}
    </>
  );
}

/** Tapered body shared by bishop, queen and king. */
function Body({
  detail,
  palette,
  spread,
  top,
  waist,
}: {
  detail: boolean;
  palette: PiecePalette;
  spread: number;
  top: number;
  waist: number;
}) {
  return (
    <>
      <path
        d={`M${-spread},-2.55 C${(-spread * 0.78).toFixed(2)},-4.2 ${(-waist - 0.2).toFixed(2)},-6.2 ${-waist},${top} H${waist} C${(waist + 0.2).toFixed(2)},-6.2 ${(spread * 0.78).toFixed(2)},-4.2 ${spread},-2.55 Z`}
        fill={palette.body}
        stroke={palette.stroke}
        strokeWidth="0.34"
        vectorEffect="non-scaling-stroke"
      />
      {detail ? (
        <>
          <path
            d={`M0,${top} H${waist} C${(waist + 0.2).toFixed(2)},-6.2 ${(spread * 0.78).toFixed(2)},-4.2 ${spread},-2.55 H0 Z`}
            fill={palette.shade}
            opacity="0.5"
          />
          <path
            d={`M${(-spread * 0.66).toFixed(2)},-2.9 C${(-spread * 0.6).toFixed(2)},-4.3 ${(-waist - 0.1).toFixed(2)},-6.0 ${(-waist * 0.7).toFixed(2)},${(top + 0.2).toFixed(2)}`}
            fill="none"
            opacity="0.42"
            stroke={palette.highlight}
            strokeLinecap="round"
            strokeWidth="0.26"
            vectorEffect="non-scaling-stroke"
          />
        </>
      ) : null}
    </>
  );
}

function Pawn({ detail, palette, roundness }: PieceProps) {
  return (
    <>
      <PieceBase detail={detail} palette={palette} roundness={roundness} width={2.12} />
      <path
        d="M-1.16,-2.55 C-0.98,-3.3 -0.72,-4.2 -0.7,-4.78 H0.7 C0.72,-4.2 0.98,-3.3 1.16,-2.55 Z"
        fill={palette.body}
        stroke={palette.stroke}
        strokeWidth="0.32"
        vectorEffect="non-scaling-stroke"
      />
      {detail ? (
        <path
          d="M0,-4.78 H0.7 C0.72,-4.2 0.98,-3.3 1.16,-2.55 H0 Z"
          fill={palette.shade}
          opacity="0.5"
        />
      ) : null}
      <Disc cy={-4.86} palette={palette} roundness={roundness} shade={detail} width={1.16} />
      <circle
        cy="-5.92"
        fill={palette.body}
        r="1.2"
        stroke={palette.stroke}
        strokeWidth="0.32"
        vectorEffect="non-scaling-stroke"
      />
      {detail ? (
        <>
          <path
            d="M0,-4.72 A1.2,1.2 0 0 0 0,-7.12 Z"
            fill={palette.shade}
            opacity="0.38"
          />
          <ellipse cx="-0.42" cy="-6.3" fill={palette.highlight} opacity="0.82" rx="0.42" ry="0.3" />
        </>
      ) : null}
    </>
  );
}

/**
 * A hollow round tower: shaft, flared rim, dark bore, and six merlons standing
 * on the rim. The merlons are placed around the ellipse and drawn back-to-front
 * so the near ones overlap the far ones, which is what sells the roundness.
 */
function Rook({ detail, palette, roundness }: PieceProps) {
  const rim = 1.98;
  const rimY = -6.78;
  const rimRy = rim * roundness;
  const merlon = { height: 1.02, width: 0.72 };
  const merlons = [0, 60, 120, 180, 240, 300].map((degrees) => {
    const radians = (degrees * Math.PI) / 180;
    return {
      depth: Math.sin(radians),
      x: Math.cos(radians) * (rim - merlon.width * 0.42),
      y: rimY + Math.sin(radians) * (rimRy - 0.08),
    };
  });

  const Merlon = ({ at }: { at: (typeof merlons)[number] }) => (
    <>
      <rect
        fill={palette.body}
        height={merlon.height}
        rx="0.1"
        stroke={palette.stroke}
        strokeWidth="0.28"
        vectorEffect="non-scaling-stroke"
        width={merlon.width}
        x={at.x - merlon.width / 2}
        y={at.y - merlon.height}
      />
      {detail ? (
        <rect
          fill={palette.shade}
          height={merlon.height}
          opacity="0.3"
          width={merlon.width * 0.4}
          x={at.x + merlon.width * 0.1}
          y={at.y - merlon.height}
        />
      ) : null}
    </>
  );

  return (
    <>
      <PieceBase detail={detail} palette={palette} roundness={roundness} width={2.35} />

      {/* Shaft, waisted in the middle and flaring out under the rim. */}
      <path
        d="M-1.46,-2.55 C-1.26,-3.9 -1.22,-5.0 -1.34,-5.72 L-1.98,-6.6 H1.98 L1.34,-5.72 C1.22,-5.0 1.26,-3.9 1.46,-2.55 Z"
        fill={palette.body}
        stroke={palette.stroke}
        strokeWidth="0.34"
        vectorEffect="non-scaling-stroke"
      />
      {detail ? (
        <path
          d="M-1.1,-3.1 C-0.94,-4.1 -0.92,-5.0 -1.0,-5.6"
          fill="none"
          opacity="0.4"
          stroke={palette.highlight}
          strokeLinecap="round"
          strokeWidth="0.26"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}

      {merlons
        .filter((at) => at.depth < -0.01)
        .map((at, index) => (
          <Merlon at={at} key={`back-${index}`} />
        ))}

      {/* Rim, then the bore sunk into it. */}
      <Disc cy={rimY} palette={palette} roundness={roundness} shade={detail} width={rim} />
      <ellipse
        cx="0"
        cy={rimY + rimRy * 0.16}
        fill={palette.shade}
        opacity="0.85"
        rx={rim * 0.48}
        ry={rimRy * 0.48}
      />
      {/* Far inner wall, catching a little light so the bore reads as a hole. */}
      {detail ? (
        <ellipse
          cx="0"
          cy={rimY - rimRy * 0.06}
          fill={palette.main}
          opacity="0.3"
          rx={rim * 0.38}
          ry={rimRy * 0.22}
        />
      ) : null}
      {detail ? (
        <path
          d={`M${(-rim * 0.48).toFixed(2)},${(rimY + rimRy * 0.16).toFixed(2)} A${(rim * 0.48).toFixed(2)},${(rimRy * 0.48).toFixed(2)} 0 0 0 ${(rim * 0.48).toFixed(2)},${(rimY + rimRy * 0.16).toFixed(2)}`}
          fill="none"
          opacity="0.55"
          stroke={palette.deep}
          strokeWidth="0.26"
          vectorEffect="non-scaling-stroke"
        />
      ) : null}

      {merlons
        .filter((at) => at.depth >= -0.01)
        .sort((first, second) => first.depth - second.depth)
        .map((at, index) => (
          <Merlon at={at} key={`front-${index}`} />
        ))}
    </>
  );
}

/**
 * Knights are shown in profile by convention, so this one keeps its side view.
 * Neck and head are a single silhouette flaring straight out of the base — a
 * separate chest block reads as a slab stuck on the front.
 */
function Knight({ detail, palette, roundness }: PieceProps) {
  return (
    <>
      <PieceBase
        detail={detail}
        neckWidth={1.72}
        palette={palette}
        roundness={roundness}
        width={2.42}
      />

      {/* Back ear, set behind the poll. */}
      <path
        d="M-0.3,-8.62 L-0.58,-9.05 Q-0.65,-9.25 -0.43,-9.15 L0.02,-8.66 Z"
        fill={palette.shade}
        stroke={palette.stroke}
        strokeLinejoin="round"
        strokeWidth="0.26"
        vectorEffect="non-scaling-stroke"
      />

      {/* Neck and head in one piece: up the mane, over the poll, down the face
          to the muzzle, back under the jaw and into the throat. */}
      <path
        d="M-1.98,-2.55 C-2.06,-4.22 -1.9,-6.28 -1.25,-7.68 C-0.93,-8.36 -0.48,-8.65 -0.08,-8.72 C0.1,-8.75 0.27,-8.72 0.43,-8.65 C0.84,-8.6 1.18,-8.37 1.4,-8 C1.59,-7.67 1.67,-7.18 1.78,-6.68 L2.08,-5.92 Q2.2,-5.62 2.1,-5.34 L2,-5.08 Q1.91,-4.86 1.62,-4.9 L1.37,-4.95 C0.99,-5.04 0.8,-5.58 0.6,-6.04 Q0.48,-6.29 0.3,-6.08 C0.48,-5.25 0.86,-3.93 1.55,-2.55 Z"
        fill={palette.body}
        stroke={palette.stroke}
        strokeLinejoin="round"
        strokeWidth="0.38"
        vectorEffect="non-scaling-stroke"
      />

      {detail ? (
        <>
          {/* Mane down the back. Kept soft, because the body gradient is
              already doing most of the modelling. */}
          <path
            d="M-1.93,-2.68 C-2.04,-4.46 -1.82,-6.36 -1.12,-7.76 C-0.8,-8.38 -0.4,-8.65 -0.08,-8.72 L0.21,-8.47 C-0.36,-7.43 -0.79,-5.82 -0.75,-4.05 L-0.68,-2.55 Z"
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
        </>
      ) : null}

      {/* Front ear. */}
      <path
        d="M-0.04,-8.69 L-0.1,-9.2 Q-0.1,-9.4 0.1,-9.26 L0.48,-8.68 Z"
        fill={palette.body}
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
      {detail ? (
        <>
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
      ) : null}
    </>
  );
}

function Bishop({ detail, palette, roundness }: PieceProps) {
  return (
    <>
      <PieceBase detail={detail} palette={palette} roundness={roundness} width={2.35} />
      <Body detail={detail} palette={palette} spread={1.55} top={-6.4} waist={0.72} />
      <Disc cy={-6.52} palette={palette} roundness={roundness} shade={detail} width={1.78} />
      <path
        d="M0,-10.5 C-1.66,-9.34 -2.04,-7.84 0,-6.62 C2.04,-7.84 1.66,-9.34 0,-10.5 Z"
        fill={palette.body}
        stroke={palette.stroke}
        strokeWidth="0.36"
        vectorEffect="non-scaling-stroke"
      />
      {detail ? (
        <>
          <path d="M0,-10.34 C1.5,-9.2 1.64,-7.84 0,-6.72 Z" fill={palette.shade} opacity="0.5" />
          <ellipse cx="-0.52" cy="-9.0" fill={palette.highlight} opacity="0.4" rx="0.4" ry="0.62" />
        </>
      ) : null}
      <path
        d="M-0.74,-9.42 L0.8,-7.5"
        fill="none"
        stroke={palette.deep}
        strokeLinecap="round"
        strokeWidth="0.46"
        vectorEffect="non-scaling-stroke"
      />
    </>
  );
}

function Queen({ detail, palette, roundness }: PieceProps) {
  const points = [-2.02, -1.01, 0, 1.01, 2.02];
  return (
    <>
      <PieceBase detail={detail} palette={palette} roundness={roundness} width={2.55} />
      <Body detail={detail} palette={palette} spread={1.72} top={-7.5} waist={0.82} />
      <Disc cy={-7.62} palette={palette} roundness={roundness} shade={detail} width={1.98} />
      <path
        d="M-2.02,-10.82 L-1.35,-9.12 L0,-11.05 L1.35,-9.12 L2.02,-10.82 L1.74,-7.96 Q0,-7.24 -1.74,-7.96 Z"
        fill={palette.body}
        stroke={palette.stroke}
        strokeLinejoin="round"
        strokeWidth="0.36"
        vectorEffect="non-scaling-stroke"
      />
      {detail ? (
        <path
          d="M0,-10.92 L1.35,-9.12 L2,-10.72 L1.72,-8.04 Q0.86,-7.62 0,-7.72 Z"
          fill={palette.shade}
          opacity="0.26"
        />
      ) : null}
      {points
        .filter((x) => Math.abs(x) !== 1.01)
        .map((x) => (
          <circle
            cx={x}
            cy={x === 0 ? -11.18 : -10.96}
            fill={x > 0 ? palette.shade : palette.highlight}
            key={x}
            r={x === 0 ? 0.46 : 0.36}
            stroke={palette.stroke}
            strokeWidth="0.22"
            vectorEffect="non-scaling-stroke"
          />
        ))}
    </>
  );
}

function King({ detail, palette, roundness }: PieceProps) {
  return (
    <>
      <PieceBase detail={detail} palette={palette} roundness={roundness} width={2.55} />
      <Body detail={detail} palette={palette} spread={1.75} top={-7.7} waist={0.82} />
      <Disc cy={-7.84} palette={palette} roundness={roundness} shade={detail} width={2.04} />
      <path
        d="M-1.56,-8.24 C-1.46,-9.68 -0.72,-10.6 0,-10.85 C0.72,-10.6 1.46,-9.68 1.56,-8.24 Z"
        fill={palette.body}
        stroke={palette.stroke}
        strokeWidth="0.34"
        vectorEffect="non-scaling-stroke"
      />
      {detail ? (
        <>
          <path d="M0,-10.75 C0.76,-10.44 1.4,-9.52 1.5,-8.3 H0 Z" fill={palette.shade} opacity="0.48" />
          <path
            d="M-0.96,-9.2 C-0.78,-9.86 -0.4,-10.3 -0.06,-10.5"
            fill="none"
            opacity="0.45"
            stroke={palette.highlight}
            strokeLinecap="round"
            strokeWidth="0.24"
            vectorEffect="non-scaling-stroke"
          />
        </>
      ) : null}
      <path
        d="M-0.42,-13.2 H0.42 V-12.2 H1.28 V-11.42 H0.42 V-10.52 H-0.42 V-11.42 H-1.28 V-12.2 H-0.42 Z"
        fill={palette.highlight}
        stroke={palette.stroke}
        strokeLinejoin="round"
        strokeWidth="0.28"
        vectorEffect="non-scaling-stroke"
      />
      {detail ? (
        <path d="M0,-13.2 H0.42 V-12.2 H1.28 V-11.42 H0.42 V-10.52 H0 Z" fill={palette.shade} opacity="0.3" />
      ) : null}
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
  const base = color === "w" ? LIGHT_PIECE : DARK_PIECE;
  const palette = bodyFill ? { ...base, body: bodyFill } : base;
  const props = { detail, palette, roundness };
  if (kind === "p") return <Pawn {...props} />;
  if (kind === "r") return <Rook {...props} />;
  if (kind === "n") return <Knight {...props} />;
  if (kind === "b") return <Bishop {...props} />;
  if (kind === "q") return <Queen {...props} />;
  return <King {...props} />;
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
          // the entire form instead of each sub-path getting its own.
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
  // Contact shadow. Two stacked ellipses fake a soft edge, which is far cheaper
  // than an SVG blur filter repeated across 32 pieces. It flattens and fades as
  // the piece lifts off the board mid-move.
  const shadowOpacity = clamp(0.9 - lift * 0.3 + impact * 0.08, 0.35, 0.95);
  const shadowRadiusX = 2.45 + lift * 0.3 + impact * 0.22;
  const shadowRadiusY = shadowRadiusX * roundness * 0.44;

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
          cx="0.42"
          cy="0.34"
          fill={heroRgba("ink", 0.18)}
          rx={shadowRadiusX * 1.22}
          ry={shadowRadiusY * 1.45}
        />
        <ellipse
          cx="0.26"
          cy="0.26"
          fill={heroRgba("ink", 0.46)}
          rx={shadowRadiusX}
          ry={shadowRadiusY}
        />
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

