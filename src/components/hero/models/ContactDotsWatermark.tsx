import { memo } from "react";
import ModelSvg from "./ModelSvg";

const DOTS = [42, 60, 78] as const;

function ContactDotsWatermark() {
  return (
    <ModelSvg name="hello-dots" viewBox="0 0 120 40" withGlow={false}>
      {DOTS.map((cx, index) => (
        <circle
          key={cx}
          cx={cx}
          cy="20"
          fill="rgba(246, 227, 255, 0.82)"
          opacity={index === 1 ? 1 : 0.72}
          r="5"
          stroke="rgba(221, 173, 242, 0.5)"
          strokeWidth="0.7"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </ModelSvg>
  );
}

export default memo(ContactDotsWatermark);
