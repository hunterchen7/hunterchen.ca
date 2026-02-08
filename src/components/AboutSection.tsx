import { useState, useRef, useEffect, useCallback } from "react";
import { motion, useMotionValue } from "framer-motion";
import {
  CanvasComponent,
  useCanvasContext,
  type SectionCoordinates,
} from "@hunterchen/canvas";

interface AboutSectionProps {
  offset: SectionCoordinates;
}

interface Particle {
  id: number;
  x: number;
  y: number;
}

function quadBezier(t: number, p0: number, p1: number, p2: number) {
  return (1 - t) ** 2 * p0 + 2 * (1 - t) * t * p1 + t ** 2 * p2;
}

interface Destination {
  id: string;
  label: string;
  subtitle: string;
  description: string;
  x: number;
  y: number;
  rotation: number;
}

const destinations = [
  {
    id: "taiwan",
    label: "Taiwan",
    subtitle: "where it began",
    description: "Where my story started—a place I carry with me.",
    x: 60,
    y: 40,
    rotation: -3,
  },
  {
    id: "calgary",
    label: "Calgary",
    subtitle: "grew up",
    description: "Where I learned to embrace the cold—and the quiet.",
    x: 520,
    y: 80,
    rotation: 4,
  },
  {
    id: "london",
    label: "London, ON",
    subtitle: "university",
    description: "Where curiosity became craft.",
    x: 80,
    y: 300,
    rotation: -2,
  },
  {
    id: "next",
    label: "?",
    subtitle: "next chapter",
    description: "To be written...",
    x: 510,
    y: 300,
    rotation: 3,
  },
] as const satisfies readonly Destination[];

function generatePhysicsString(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  swayOffsetX: number = 0,
  swayOffsetY: number = 0,
  sagMultiplier: number = 1,
): string {
  const dx = x2 - x1;
  const dy = y2 - y1;

  const baseSag = Math.abs(dx) * 0.25 * sagMultiplier;
  const sag = Math.max(50, baseSag);

  const cp1x = x1 + dx * 0.25 + swayOffsetX * 0.5;
  const cp1y = y1 + dy * 0.25 + sag * 0.6 + swayOffsetY * 0.5;
  const cp2x = x1 + dx * 0.75 + swayOffsetX * 0.5;
  const cp2y = y1 + dy * 0.75 + sag * 0.6 + swayOffsetY * 0.5;

  return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
}

function getStringEndpoints() {
  const [taiwan, calgary, london, next] = destinations;

  return [
    {
      id: "taiwan-calgary",
      from: { x: taiwan.x + 50, y: taiwan.y + 10 },
      to: { x: calgary.x + 50, y: calgary.y + 10 },
      sagMultiplier: 0.8,
    },
    {
      id: "calgary-london",
      from: { x: calgary.x + 50, y: calgary.y + 10 },
      to: { x: london.x + 50, y: london.y + 10 },
      sagMultiplier: 1.2,
    },
    {
      id: "london-next",
      from: { x: london.x + 50, y: london.y + 10 },
      to: { x: next.x + 50, y: next.y + 10 },
      sagMultiplier: 1.0,
    },
  ];
}

function PhysicsString({
  fromX,
  fromY,
  toX,
  toY,
  sagMultiplier = 1,
  canvasDeltaX,
  canvasDeltaY,
  index,
}: {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  sagMultiplier?: number;
  canvasDeltaX: number;
  canvasDeltaY: number;
  index: number;
}) {
  const pathRef = useRef<SVGPathElement>(null);
  const swayXRef = useRef(0);
  const swayYRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    swayXRef.current -= canvasDeltaX * 0.54;
    swayYRef.current -= canvasDeltaY * 0.54;
    swayXRef.current = Math.max(-25, Math.min(25, swayXRef.current));
    swayYRef.current = Math.max(-25, Math.min(25, swayYRef.current));
  }, [canvasDeltaX, canvasDeltaY]);

  useEffect(() => {
    const animateString = () => {
      swayXRef.current *= 0.97;
      swayYRef.current *= 0.97;

      if (pathRef.current) {
        const newPath = generatePhysicsString(
          fromX,
          fromY,
          toX,
          toY,
          swayXRef.current,
          swayYRef.current,
          sagMultiplier,
        );
        pathRef.current.setAttribute("d", newPath);
      }

      animationFrameRef.current = requestAnimationFrame(animateString);
    };

    animationFrameRef.current = requestAnimationFrame(animateString);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [fromX, fromY, toX, toY, sagMultiplier]);

  const basePath = generatePhysicsString(
    fromX,
    fromY,
    toX,
    toY,
    0,
    0,
    sagMultiplier,
  );
  const animationDelay = index * 0.8;

  return (
    <path
      ref={pathRef}
      d={basePath}
      stroke="url(#stringGradient)"
      strokeWidth={2.5}
      fill="none"
      className="opacity-80 animate-string-sway"
      strokeLinecap="round"
      style={{
        animationDelay: `${animationDelay}s`,
        transformOrigin: "center",
      }}
    />
  );
}

function PaperAirplane({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}
    >
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  );
}

function PolaroidCard({
  destination,
  isActive,
  isVisited,
  onClick,
}: {
  destination: Destination;
  isActive: boolean;
  isVisited: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      className="absolute cursor-pointer"
      style={{
        left: destination.x,
        top: destination.y,
        transform: `rotate(${destination.rotation}deg)`,
      }}
      whileHover={{ scale: 1.05, zIndex: 20 }}
      whileTap={{ scale: 0.98 }}
      animate={{
        boxShadow: isActive
          ? "0 8px 32px rgba(192, 132, 252, 0.4)"
          : "0 4px 12px rgba(0,0,0,0.3)",
      }}
    >
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
        <div className="h-4 w-4 rounded-full bg-red-500 shadow-md border-2 border-red-600" />
      </div>

      <div
        className={`bg-white p-2 pb-6 shadow-xl transition-all duration-300 ${
          isActive ? "ring-2 ring-fuchsia-400" : ""
        }`}
        style={{ width: 100 }}
      >
        <div
          className={`h-16 w-full flex items-center justify-center text-2xl ${
            destination.id === "next"
              ? "bg-gradient-to-br from-fuchsia-200 to-purple-300"
              : "bg-gradient-to-br from-slate-100 to-slate-200"
          }`}
        >
          {destination.id === "taiwan" && "🇹🇼"}
          {destination.id === "calgary" && "🏔️"}
          {destination.id === "london" && "🎓"}
          {destination.id === "next" && "✨"}
        </div>

        <p className="mt-2 text-center font-serif text-xs text-neutral-700 font-medium">
          {destination.label}
        </p>
        <p className="text-center font-serif text-[10px] text-neutral-500 italic">
          {destination.subtitle}
        </p>

        {isVisited && !isActive && (
          <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-fuchsia-500" />
        )}
      </div>
    </motion.button>
  );
}

export default function AboutSection({ offset }: AboutSectionProps) {
  const [activeDestination, setActiveDestination] = useState<string | null>(
    "taiwan",
  );
  const [visitedDestinations, setVisitedDestinations] = useState<Set<string>>(
    new Set(["taiwan"]),
  );
  const [isAnimating, setIsAnimating] = useState(false);

  const [canvasDeltaX, setCanvasDeltaX] = useState(0);
  const [canvasDeltaY, setCanvasDeltaY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastCanvasX = useRef(0);
  const lastCanvasY = useRef(0);

  const { x: canvasX, y: canvasY } = useCanvasContext();

  useEffect(() => {
    const unsubX = canvasX.on("change", (newX) => {
      const delta = newX - lastCanvasX.current;
      lastCanvasX.current = newX;
      setCanvasDeltaX(delta);
    });

    const unsubY = canvasY.on("change", (newY) => {
      const delta = newY - lastCanvasY.current;
      lastCanvasY.current = newY;
      setCanvasDeltaY(delta);
    });

    return () => {
      unsubX();
      unsubY();
    };
  }, [canvasX, canvasY]);

  const planeX = useMotionValue(destinations[0].x + 50);
  const planeY = useMotionValue(destinations[0].y + 40);
  const planeRotation = useMotionValue(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const particleIdRef = useRef(0);

  const svgRef = useRef<SVGSVGElement>(null);

  const handleDestinationClick = useCallback(
    async (destId: string) => {
      if (isAnimating || destId === activeDestination) return;

      const target = destinations.find((d) => d.id === destId);
      if (!target) return;

      setIsAnimating(true);

      const startX = planeX.get();
      const startY = planeY.get();
      const endX = target.x + 50;
      const endY = target.y + 40;

      // Control point: midpoint offset perpendicular for arc
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;
      const dx = endX - startX;
      const dy = endY - startY;
      const len = Math.sqrt(dx * dx + dy * dy);
      // Arc upward (perpendicular, pick direction with negative Y)
      let perpX = -dy / len;
      let perpY = dx / len;
      if (perpY > 0) {
        perpX = -perpX;
        perpY = -perpY;
      }
      const arcAmount = Math.min(100, len * 0.3);
      const cpX = midX + perpX * arcAmount;
      const cpY = midY + perpY * arcAmount;

      await new Promise<void>((resolve) => {
        const duration = 900;
        const startTime = performance.now();
        let lastParticleTime = 0;

        const step = (now: number) => {
          const elapsed = now - startTime;
          const rawT = Math.min(elapsed / duration, 1);
          // Ease in-out cubic
          const t =
            rawT < 0.5
              ? 4 * rawT * rawT * rawT
              : 1 - Math.pow(-2 * rawT + 2, 3) / 2;

          const x = quadBezier(t, startX, cpX, endX);
          const y = quadBezier(t, startY, cpY, endY);

          planeX.set(x);
          planeY.set(y);

          // Tangent for rotation
          const tx = 2 * (1 - t) * (cpX - startX) + 2 * t * (endX - cpX);
          const ty = 2 * (1 - t) * (cpY - startY) + 2 * t * (endY - cpY);
          planeRotation.set(Math.atan2(ty, tx) * (180 / Math.PI));

          // Spawn particle every ~35ms
          if (now - lastParticleTime > 35) {
            lastParticleTime = now;
            const id = particleIdRef.current++;
            setParticles((prev) => [...prev, { id, x, y }]);
            setTimeout(() => {
              setParticles((prev) => prev.filter((p) => p.id !== id));
            }, 500);
          }

          if (rawT < 1) {
            requestAnimationFrame(step);
          } else {
            resolve();
          }
        };

        requestAnimationFrame(step);
      });

      setActiveDestination(destId);
      setVisitedDestinations((prev) => new Set([...prev, destId]));
      setIsAnimating(false);
    },
    [isAnimating, activeDestination, planeX, planeY, planeRotation],
  );

  const activeDesc = destinations.find((d) => d.id === activeDestination);

  return (
    <CanvasComponent offset={offset}>
      <div ref={containerRef} className="relative h-full w-full">
        <svg
          ref={svgRef}
          className="absolute inset-0 h-full w-full pointer-events-none"
          style={{ overflow: "visible" }}
        >
          <defs>
            <linearGradient
              id="stringGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#b91c1c" />
            </linearGradient>
          </defs>

          {getStringEndpoints().map((string, index) => (
            <PhysicsString
              key={string.id}
              fromX={string.from.x}
              fromY={string.from.y}
              toX={string.to.x}
              toY={string.to.y}
              sagMultiplier={string.sagMultiplier}
              canvasDeltaX={canvasDeltaX}
              canvasDeltaY={canvasDeltaY}
              index={index}
            />
          ))}
        </svg>

        {destinations.map((dest) => (
          <PolaroidCard
            key={dest.id}
            destination={dest}
            isActive={activeDestination === dest.id}
            isVisited={visitedDestinations.has(dest.id)}
            onClick={() => handleDestinationClick(dest.id)}
          />
        ))}

        {/* Particle trail */}
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute pointer-events-none z-20 rounded-full bg-fuchsia-400 animate-particle-fade"
            style={{
              left: p.x,
              top: p.y,
              width: 5,
              height: 5,
              translate: "-50% -50%",
            }}
          />
        ))}

        <motion.div
          className="absolute pointer-events-none z-30"
          style={{
            x: planeX,
            y: planeY,
            rotate: planeRotation,
            translateX: "-50%",
            translateY: "-50%",
          }}
        >
          <PaperAirplane className="h-8 w-8 text-fuchsia-300" />
        </motion.div>

        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          key={activeDestination}
        >
          {activeDesc && (
            <div className="rounded-xl bg-fuchsia-950/70 backdrop-blur-sm border border-fuchsia-800/30 px-6 py-4 text-center">
              <p className="text-fuchsia-200/90 italic">
                "{activeDesc.description}"
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </CanvasComponent>
  );
}
