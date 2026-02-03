import { useEffect, useRef, useState } from "react";

// ASCII characters from dark to light for shading
const CHARS = ".,-~:;=!*#$@";

interface AsciiDonutProps {
  width?: number;
  height?: number;
  className?: string;
}

export default function AsciiDonut({
  width = 80,
  height = 24,
  className = ""
}: AsciiDonutProps) {
  const [frame, setFrame] = useState("");
  const angleA = useRef(0);
  const angleB = useRef(0);

  useEffect(() => {
    const renderFrame = () => {
      const output: string[] = [];
      const zBuffer: number[] = [];

      // Initialize buffers
      for (let i = 0; i < width * height; i++) {
        output[i] = " ";
        zBuffer[i] = 0;
      }

      const A = angleA.current;
      const B = angleB.current;

      // Precompute sines and cosines
      const sinA = Math.sin(A);
      const cosA = Math.cos(A);
      const sinB = Math.sin(B);
      const cosB = Math.cos(B);

      // Torus parameters
      const R1 = 1;    // Radius of the tube
      const R2 = 2;    // Distance from center to tube center
      const K2 = 5;    // Distance from viewer
      const K1 = width * K2 * 3 / (8 * (R1 + R2)); // Scale factor

      // Iterate over the surface of the torus
      for (let theta = 0; theta < 6.28; theta += 0.07) {
        const sinTheta = Math.sin(theta);
        const cosTheta = Math.cos(theta);

        for (let phi = 0; phi < 6.28; phi += 0.02) {
          const sinPhi = Math.sin(phi);
          const cosPhi = Math.cos(phi);

          // 3D coordinates of point on torus
          const circleX = R2 + R1 * cosTheta;
          const circleY = R1 * sinTheta;

          // 3D rotation
          const x = circleX * (cosB * cosPhi + sinA * sinB * sinPhi) - circleY * cosA * sinB;
          const y = circleX * (sinB * cosPhi - sinA * cosB * sinPhi) + circleY * cosA * cosB;
          const z = K2 + cosA * circleX * sinPhi + circleY * sinA;
          const ooz = 1 / z; // One over z (for depth)

          // Project to 2D
          const xp = Math.floor(width / 2 + K1 * ooz * x);
          const yp = Math.floor(height / 2 - K1 * ooz * y * 0.5); // 0.5 for aspect ratio

          // Calculate luminance (surface normal dotted with light direction)
          const L = cosPhi * cosTheta * sinB - cosA * cosTheta * sinPhi - sinA * sinTheta + cosB * (cosA * sinTheta - cosTheta * sinA * sinPhi);

          if (L > 0 && xp >= 0 && xp < width && yp >= 0 && yp < height) {
            const idx = xp + yp * width;
            if (ooz > zBuffer[idx]) {
              zBuffer[idx] = ooz;
              const luminanceIndex = Math.floor(L * 8);
              output[idx] = CHARS[Math.min(luminanceIndex, CHARS.length - 1)];
            }
          }
        }
      }

      // Convert buffer to string with newlines
      let result = "";
      for (let j = 0; j < height; j++) {
        for (let i = 0; i < width; i++) {
          result += output[i + j * width];
        }
        result += "\n";
      }

      setFrame(result);

      // Update rotation angles
      angleA.current += 0.04;
      angleB.current += 0.02;
    };

    const interval = setInterval(renderFrame, 50);
    return () => clearInterval(interval);
  }, [width, height]);

  return (
    <pre
      className={`leading-none text-fuchsia-300 select-none ${className}`}
      style={{
        fontSize: "10px",
        lineHeight: "10px",
        letterSpacing: "2px"
      }}
    >
      {frame}
    </pre>
  );
}
