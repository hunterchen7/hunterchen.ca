import { memo } from "react";
import ModelSvg from "./ModelSvg";

const BUBBLE_PATH =
  "M30 16 H86 Q94 16 94 24 V53 Q94 61 86 61 H52 L39 72 L42 61 H30 Q22 61 22 53 V24 Q22 16 30 16 Z";

function SpeechBubbleWatermark() {
  return (
    <ModelSvg name="hello-bubble" viewBox="0 0 120 80" withGlow={false}>
      <g strokeLinecap="round" strokeLinejoin="round">
        <path
          d={BUBBLE_PATH}
          fill="rgba(174, 105, 205, 0.38)"
          stroke="rgba(245, 221, 255, 0.78)"
          strokeWidth="1.1"
          vectorEffect="non-scaling-stroke"
        />

        {[43, 58, 73].map((cx) => (
          <circle
            key={cx}
            cx={cx}
            cy="39"
            fill="rgba(246, 227, 255, 0.9)"
            r="4.2"
          />
        ))}
      </g>
    </ModelSvg>
  );
}

export default memo(SpeechBubbleWatermark);
