import { memo } from "react";
import { HERO_COLORS } from "../heroPalette";
import ModelSvg from "./ModelSvg";

const DOTS = [42, 60, 78] as const;

function ContactDotsWatermark() {
  return (
    <ModelSvg name="hello-dots" viewBox="0 0 120 40" withGlow={false}>
      {DOTS.map((cx, index) => (
        <circle
          key={cx}
          className="hero-contact-dot"
          cx={cx}
          cy="20"
          fill={HERO_COLORS.accent}
          r="4.25"
          style={{ animationDelay: `${index * 140}ms` }}
        />
      ))}
    </ModelSvg>
  );
}

export default memo(ContactDotsWatermark);
