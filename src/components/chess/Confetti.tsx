import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  shape: "rect" | "circle";
}

const COLORS = [
  "#c084fc", // purple-400
  "#a855f7", // purple-500
  "#d8b4fe", // purple-300
  "#e9d5ff", // purple-200
  "#f0abfc", // fuchsia-300
  "#e879f9", // fuchsia-400
  "#ffffff",
];

const PARTICLE_COUNT = 120;
const DURATION = 4000;
const GRAVITY = 0.12;

export default function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;

    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: width * (0.2 + Math.random() * 0.6),
      y: height * (0.1 + Math.random() * 0.3),
      vx: (Math.random() - 0.5) * 8,
      vy: -(Math.random() * 6 + 2),
      size: Math.random() * 6 + 3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      opacity: 1,
      shape: Math.random() > 0.5 ? "rect" : "circle",
    }));

    const start = performance.now();
    let raf: number;

    const animate = (now: number) => {
      const elapsed = now - start;
      if (elapsed > DURATION) return;

      ctx.clearRect(0, 0, width, height);

      const fadeStart = DURATION * 0.6;
      const globalFade = elapsed > fadeStart
        ? 1 - (elapsed - fadeStart) / (DURATION - fadeStart)
        : 1;

      for (const p of particles) {
        p.vy += GRAVITY;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.99;
        p.rotation += p.rotationSpeed;
        p.opacity = globalFade;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;

        if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 5,
      }}
    />
  );
}
