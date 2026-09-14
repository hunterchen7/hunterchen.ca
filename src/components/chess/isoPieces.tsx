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
  main: HERO_COLORS.light,
  highlight: litHeroTone("light", 16),
  shade: HERO_COLORS.accent,
  deep: HERO_COLORS.mid,
  eye: HERO_COLORS.deep,
  eyeStroke: "none",
  stroke: heroRgba("light", 0.96),
};

export const DARK_PIECE: PiecePalette = {
  main: HERO_COLORS.deep,
  highlight: HERO_COLORS.mid,
  shade: HERO_COLORS.ink,
  deep: HERO_COLORS.ink,
  eye: HERO_COLORS.accent,
  eyeStroke: heroRgba("light", 0.78),
  stroke: heroRgba("accent", 0.62),
};


type PieceProps = { detail: boolean; palette: PiecePalette };

function PieceBase({
  detail,
  palette,
  width = 2.35,
}: PieceProps & { width?: number }) {
  return (
    <>
      <ellipse
        cy="0"
        fill={palette.deep}
        rx={width}
        ry="0.72"
        stroke={palette.stroke}
        strokeWidth="0.3"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={`M${-width},-0.25 C${-width * 0.92},-1.25 ${-width * 0.63},-1.95 -1.05,-2.45 C-0.55,-2.78 0.55,-2.78 1.05,-2.45 C${width * 0.63},-1.95 ${width * 0.92},-1.25 ${width},-0.25 Q0,1.05 ${-width},-0.25 Z`}
        fill={palette.main}
        stroke={palette.stroke}
        strokeWidth="0.34"
        vectorEffect="non-scaling-stroke"
      />
      {detail && (
        <>
          <path
            d={`M0,-2.7 C0.7,-2.66 1.05,-2.45 1.05,-2.45 C${width * 0.63},-1.95 ${width * 0.92},-1.25 ${width},-0.25 Q${width * 0.48},0.72 0,0.7 Z`}
            fill={palette.shade}
            opacity="0.74"
          />
          <ellipse
            cy="-2.42"
            fill={palette.highlight}
            opacity="0.78"
            rx="1.16"
            ry="0.42"
          />
        </>
      )}
    </>
  );
}

function Pawn({ detail, palette }: PieceProps) {
  return (
    <>
      <PieceBase detail={detail} palette={palette} width={2.12} />
      <path
        d="M-1.2,-2.55 C-1,-3.25 -0.72,-4.15 -0.7,-4.72 H0.7 C0.72,-4.15 1,-3.25 1.2,-2.55 Z"
        fill={palette.main}
        stroke={palette.stroke}
        strokeWidth="0.32"
        vectorEffect="non-scaling-stroke"
      />
      {detail && (
        <path d="M0,-4.72 H0.7 C0.72,-4.15 1,-3.25 1.2,-2.55 H0 Z" fill={palette.shade} opacity="0.7" />
      )}
      <ellipse cy="-4.72" fill={palette.deep} rx="1.1" ry="0.38" />
      <circle cy="-5.82" fill={palette.main} r="1.22" stroke={palette.stroke} strokeWidth="0.32" vectorEffect="non-scaling-stroke" />
      {detail && (
        <ellipse cx="-0.38" cy="-6.18" fill={palette.highlight} opacity="0.8" rx="0.4" ry="0.27" />
      )}
    </>
  );
}

function Rook({ detail, palette }: PieceProps) {
  return (
    <>
      <PieceBase detail={detail} palette={palette} width={2.35} />
      <path d="M-1.45,-2.55 L-1.62,-6.15 H1.62 L1.45,-2.55 Z" fill={palette.main} stroke={palette.stroke} strokeWidth="0.34" vectorEffect="non-scaling-stroke" />
      {detail && (
        <>
          <path d="M0,-6.15 H1.62 L1.45,-2.55 H0 Z" fill={palette.shade} opacity="0.76" />
          <ellipse cy="-6.08" fill={palette.highlight} opacity="0.76" rx="1.8" ry="0.48" />
        </>
      )}
      <path d="M-1.95,-7.92 V-6.2 H1.95 V-7.92 H1.12 V-7.18 H0.45 V-7.92 H-0.45 V-7.18 H-1.12 V-7.92 Z" fill={palette.main} stroke={palette.stroke} strokeLinejoin="round" strokeWidth="0.35" vectorEffect="non-scaling-stroke" />
      {detail && (
        <path d="M0,-7.92 H0.45 V-7.18 H1.12 V-7.92 H1.95 V-6.2 Q1,-5.8 0,-5.92 Z" fill={palette.shade} opacity="0.72" />
      )}
    </>
  );
}

function Knight({ detail, palette }: PieceProps) {
  return (
    <>
      <PieceBase detail={detail} palette={palette} width={2.42} />
      <path
        d="M-0.3,-8.62 L-0.58,-9.05 Q-0.65,-9.25 -0.43,-9.15 L0.02,-8.66 Z"
        fill={palette.shade}
        stroke={palette.stroke}
        strokeLinejoin="round"
        strokeWidth="0.26"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d="M-1.98,-2.55 C-2.06,-4.22 -1.9,-6.28 -1.25,-7.68 C-0.93,-8.36 -0.48,-8.65 -0.08,-8.72 C0.1,-8.75 0.27,-8.72 0.43,-8.65 C0.84,-8.6 1.18,-8.37 1.4,-8 C1.59,-7.67 1.67,-7.18 1.78,-6.68 L2.08,-5.92 Q2.2,-5.62 2.1,-5.34 L2,-5.08 Q1.91,-4.86 1.62,-4.9 L1.37,-4.95 C0.99,-5.04 0.8,-5.58 0.6,-6.04 Q0.48,-6.29 0.3,-6.08 C0.48,-5.25 0.86,-3.93 1.55,-2.55 Z"
        fill={palette.main}
        stroke={palette.stroke}
        strokeLinejoin="round"
        strokeWidth="0.38"
        vectorEffect="non-scaling-stroke"
      />
      {detail && (
        <>
          <path
            d="M-1.93,-2.68 C-2.04,-4.46 -1.82,-6.36 -1.12,-7.76 C-0.8,-8.38 -0.4,-8.65 -0.08,-8.72 L0.21,-8.47 C-0.36,-7.43 -0.79,-5.82 -0.75,-4.05 L-0.68,-2.55 Z"
            fill={palette.deep}
            opacity="0.72"
          />
          <path
            d="M0.56,-8.36 C1.1,-8.17 1.54,-7.31 1.78,-6.68 L2.08,-5.92 Q2.2,-5.62 2.1,-5.34 L2,-5.08 Q1.91,-4.86 1.62,-4.9 L1.37,-4.95 C1.02,-5.05 0.82,-5.55 0.61,-6.02 C0.79,-6.78 0.77,-7.66 0.56,-8.36 Z"
            fill={palette.shade}
            opacity="0.54"
          />
          <path
            d="M-0.48,-2.7 C-0.54,-4.1 -0.28,-5.36 0.28,-6.07 C0.48,-5.2 0.84,-3.86 1.35,-2.62 Z"
            fill={palette.highlight}
            opacity="0.48"
          />
          <path
            d="M-1.28,-7.24 L-0.9,-6.96 M-1.47,-6.7 L-0.96,-6.38 M-1.58,-6.08 L-1,-5.76"
            fill="none"
            opacity="0.55"
            stroke={palette.stroke}
            strokeLinecap="round"
            strokeWidth="0.15"
            vectorEffect="non-scaling-stroke"
          />
        </>
      )}
      <path
        d="M-0.04,-8.69 L-0.1,-9.2 Q-0.1,-9.4 0.1,-9.26 L0.48,-8.68 Z"
        fill={palette.main}
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
      {detail && (
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
      )}
    </>
  );
}

function Bishop({ detail, palette }: PieceProps) {
  return (
    <>
      <PieceBase detail={detail} palette={palette} width={2.35} />
      <path d="M-1.55,-2.55 C-1.2,-3.75 -0.92,-5.2 -0.72,-6.48 H0.72 C0.92,-5.2 1.2,-3.75 1.55,-2.55 Z" fill={palette.main} stroke={palette.stroke} strokeWidth="0.34" vectorEffect="non-scaling-stroke" />
      {detail && (
        <path d="M0,-6.48 H0.72 C0.92,-5.2 1.2,-3.75 1.55,-2.55 H0 Z" fill={palette.shade} opacity="0.72" />
      )}
      <ellipse cy="-6.45" fill={palette.deep} rx="1.72" ry="0.5" />
      {detail && (
        <ellipse cy="-6.72" fill={palette.highlight} opacity="0.74" rx="1.92" ry="0.52" />
      )}
      <path d="M0,-10.45 C-1.65,-9.3 -2.02,-7.82 0,-6.62 C2.02,-7.82 1.65,-9.3 0,-10.45 Z" fill={palette.main} stroke={palette.stroke} strokeWidth="0.36" vectorEffect="non-scaling-stroke" />
      {detail && (
        <path d="M0,-10.3 C1.48,-9.18 1.62,-7.82 0,-6.72 Z" fill={palette.shade} opacity="0.72" />
      )}
      <path d="M-0.72,-9.38 L0.78,-7.48" fill="none" stroke={palette.deep} strokeLinecap="round" strokeWidth="0.46" vectorEffect="non-scaling-stroke" />
    </>
  );
}

function Queen({ detail, palette }: PieceProps) {
  return (
    <>
      <PieceBase detail={detail} palette={palette} width={2.55} />
      <path d="M-1.72,-2.55 C-1.38,-4.2 -1.02,-6.2 -0.82,-7.62 H0.82 C1.02,-6.2 1.38,-4.2 1.72,-2.55 Z" fill={palette.main} stroke={palette.stroke} strokeWidth="0.35" vectorEffect="non-scaling-stroke" />
      {detail && (
        <path d="M0,-7.62 H0.82 C1.02,-6.2 1.38,-4.2 1.72,-2.55 H0 Z" fill={palette.shade} opacity="0.72" />
      )}
      <ellipse cy="-7.55" fill={palette.deep} rx="1.92" ry="0.52" />
      {detail && (
        <ellipse cy="-7.9" fill={palette.highlight} opacity="0.75" rx="2.08" ry="0.58" />
      )}
      <path d="M-2.02,-10.82 L-1.35,-9.12 L0,-11.05 L1.35,-9.12 L2.02,-10.82 L1.72,-7.9 Q0,-7.2 -1.72,-7.9 Z" fill={palette.main} stroke={palette.stroke} strokeLinejoin="round" strokeWidth="0.36" vectorEffect="non-scaling-stroke" />
      {detail && (
        <path d="M0,-10.92 L1.35,-9.12 L2,-10.72 L1.7,-7.98 Q0.86,-7.58 0,-7.68 Z" fill={palette.shade} opacity="0.7" />
      )}
      <circle cy="-11.18" fill={palette.highlight} r="0.46" stroke={palette.stroke} strokeWidth="0.25" vectorEffect="non-scaling-stroke" />
      {detail && (
        <>
          <circle cx="-2.04" cy="-10.96" fill={palette.highlight} r="0.34" />
          <circle cx="2.04" cy="-10.96" fill={palette.shade} r="0.34" />
        </>
      )}
    </>
  );
}

function King({ detail, palette }: PieceProps) {
  return (
    <>
      <PieceBase detail={detail} palette={palette} width={2.55} />
      <path d="M-1.75,-2.55 C-1.36,-4.35 -1.02,-6.35 -0.82,-7.82 H0.82 C1.02,-6.35 1.36,-4.35 1.75,-2.55 Z" fill={palette.main} stroke={palette.stroke} strokeWidth="0.35" vectorEffect="non-scaling-stroke" />
      {detail && (
        <path d="M0,-7.82 H0.82 C1.02,-6.35 1.36,-4.35 1.75,-2.55 H0 Z" fill={palette.shade} opacity="0.72" />
      )}
      <ellipse cy="-7.76" fill={palette.deep} rx="1.98" ry="0.54" />
      {detail && (
        <ellipse cy="-8.15" fill={palette.highlight} opacity="0.76" rx="2.15" ry="0.58" />
      )}
      <path d="M-1.55,-8.18 C-1.45,-9.65 -0.72,-10.58 0,-10.82 C0.72,-10.58 1.45,-9.65 1.55,-8.18 Z" fill={palette.main} stroke={palette.stroke} strokeWidth="0.34" vectorEffect="non-scaling-stroke" />
      {detail && (
        <path d="M0,-10.72 C0.75,-10.42 1.38,-9.5 1.48,-8.25 H0 Z" fill={palette.shade} opacity="0.7" />
      )}
      <path d="M-0.42,-13.18 H0.42 V-12.18 H1.28 V-11.4 H0.42 V-10.5 H-0.42 V-11.4 H-1.28 V-12.18 H-0.42 Z" fill={palette.highlight} stroke={palette.stroke} strokeLinejoin="round" strokeWidth="0.28" vectorEffect="non-scaling-stroke" />
    </>
  );
}

export function PieceShape({
  color,
  detail,
  kind,
}: {
  color: PieceColor;
  detail: boolean;
  kind: PieceKind;
}) {
  const palette = color === "w" ? LIGHT_PIECE : DARK_PIECE;
  if (kind === "p") return <Pawn detail={detail} palette={palette} />;
  if (kind === "r") return <Rook detail={detail} palette={palette} />;
  if (kind === "n") return <Knight detail={detail} palette={palette} />;
  if (kind === "b") return <Bishop detail={detail} palette={palette} />;
  if (kind === "q") return <Queen detail={detail} palette={palette} />;
  return <King detail={detail} palette={palette} />;
}


export const PIECE_COLORS: PieceColor[] = ["w", "b"];
export const PIECE_KINDS: PieceKind[] = ["p", "r", "n", "b", "q", "k"];


// Pieces are defined once here and instanced with <use>, so the detail flag
// swaps every piece on the board between the full and simplified builds.
export const PieceDefinitions = memo(function PieceDefinitions({
  detail,
  prefix,
}: {
  detail: boolean;
  prefix: string;
}) {
  return (
    <defs>
      {PIECE_COLORS.flatMap((color) =>
        PIECE_KINDS.map((kind) => (
          <g key={`${color}-${kind}`} id={`${prefix}-${color}-${kind}`}>
            <PieceShape color={color} detail={detail} kind={kind} />
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
}: RenderPiece & { pieceScale?: number; prefix: string }) {
  const shadowOpacity = clamp(0.92 - lift * 0.25 + impact * 0.08, 0.5, 0.98);
  const shadowRadiusX = 2.6 - lift * 0.18 + impact * 0.22;
  const shadowRadiusY = 0.78 - lift * 0.08 + impact * 0.08;

  return (
    <g
      data-piece={id}
      data-square={square}
      opacity={opacity}
      transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${(
        scale * pieceScale
      ).toFixed(3)})`}
    >
      <ellipse
        cy="0.72"
        fill={heroRgba("ink", 0.42)}
        opacity={shadowOpacity}
        rx={shadowRadiusX}
        ry={shadowRadiusY}
      />
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

