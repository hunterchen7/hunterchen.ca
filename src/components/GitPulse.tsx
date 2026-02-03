import { useEffect, useState } from "react";

// Commit frequency by hour (from your actual git history)
// Normalized to 0-1 range, night owl pattern visible
const COMMIT_RHYTHM = [
  0.43, // 00
  0.29, // 01
  1.00, // 02
  1.00, // 03
  0.21, // 04
  1.00, // 05
  0.71, // 06
  0.29, // 07
  0.21, // 08
  0.14, // 09
  0.14, // 10
  0.00, // 11
  0.00, // 12
  0.00, // 13
  0.00, // 14
  0.07, // 15
  0.14, // 16
  0.14, // 17
  0.14, // 18
  0.29, // 19
  0.29, // 20
  0.64, // 21
  0.07, // 22
  0.14, // 23
];

interface GitPulseProps {
  className?: string;
}

export default function GitPulse({ className = "" }: GitPulseProps) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase((p) => (p + 0.02) % (Math.PI * 2));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex items-end justify-center gap-[2px] h-16 ${className}`}>
      {COMMIT_RHYTHM.map((intensity, i) => {
        // Create a wave effect that travels across the bars
        const waveOffset = Math.sin(phase + i * 0.3) * 0.3 + 0.7;
        const height = Math.max(0.1, intensity) * waveOffset;
        const opacity = 0.3 + intensity * 0.5;

        return (
          <div
            key={i}
            className="w-[3px] rounded-full bg-fuchsia-400 transition-all duration-150"
            style={{
              height: `${height * 100}%`,
              opacity: opacity * waveOffset,
            }}
          />
        );
      })}
    </div>
  );
}
