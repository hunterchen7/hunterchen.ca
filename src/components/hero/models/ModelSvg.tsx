import type { ReactNode } from "react";
import { HERO_COLORS } from "../heroPalette";

type ModelSvgProps = {
  children: ReactNode;
  fps?: number;
  frame?: number | null;
  name: string;
  viewBox?: string;
  withGlow?: boolean;
};

export default function ModelSvg({
  children,
  fps,
  frame,
  name,
  viewBox = "0 0 120 100",
  withGlow = true,
}: ModelSvgProps) {
  const glowId = `${name}-soft-glow`;

  return (
    <svg
      aria-hidden="true"
      className="hero-model-svg h-full w-full overflow-visible"
      data-model={name}
      data-model-fps={fps}
      data-model-frame={frame === null || frame === undefined ? undefined : frame.toFixed(3)}
      fill="none"
      viewBox={viewBox}
    >
      {withGlow && (
        <defs>
          <filter id={glowId} x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow
              dx="0"
              dy="1.4"
              floodColor={HERO_COLORS.accent}
              floodOpacity="0.24"
              stdDeviation="1.6"
            />
          </filter>
        </defs>
      )}
      {withGlow ? <g filter={`url(#${glowId})`}>{children}</g> : children}
    </svg>
  );
}
