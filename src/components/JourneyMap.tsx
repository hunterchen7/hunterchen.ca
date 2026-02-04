import { useState, useRef, useEffect } from "react";
import { motion, animate, useMotionValue } from "framer-motion";
import { useCanvasContext } from "@hunterchen/canvas";

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

// Physics-based string path with sag
interface StringConfig {
  from: { x: number; y: number; id: string };
  to: { x: number; y: number; id: string };
  sagOffset?: number; // Additional sag adjustment
}

function generatePhysicsString(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  swayOffsetX: number = 0,
  swayOffsetY: number = 0,
  sagMultiplier: number = 1
): string {
  const dx = x2 - x1;
  const dy = y2 - y1;

  // Sag increases with horizontal distance (gravity effect)
  const baseSag = Math.abs(dx) * 0.25 * sagMultiplier;
  const sag = Math.max(50, baseSag);

  // Control points with both X and Y sway
  const cp1x = x1 + dx * 0.25 + swayOffsetX * 0.5;
  const cp1y = y1 + dy * 0.25 + sag * 0.6 + swayOffsetY * 0.5;
  const cp2x = x1 + dx * 0.75 + swayOffsetX * 0.5;
  const cp2y = y1 + dy * 0.75 + sag * 0.6 + swayOffsetY * 0.5;

  return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
}

// String connection points (from pin to pin)
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

// Animated string component - smooth physics response to canvas movement
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

  // Directly respond to canvas movement (string sways opposite to movement)
  useEffect(() => {
    // Immediate response - string sways opposite to movement direction
    swayXRef.current -= canvasDeltaX * 0.54;
    swayYRef.current -= canvasDeltaY * 0.54;
    // Clamp both
    swayXRef.current = Math.max(-25, Math.min(25, swayXRef.current));
    swayYRef.current = Math.max(-25, Math.min(25, swayYRef.current));
  }, [canvasDeltaX, canvasDeltaY]);

  // Smooth return to center when not moving
  useEffect(() => {
    const animateString = () => {
      // Gently pull back toward center
      swayXRef.current *= 0.97;
      swayYRef.current *= 0.97;

      // Update path
      if (pathRef.current) {
        const newPath = generatePhysicsString(
          fromX, fromY, toX, toY,
          swayXRef.current,
          swayYRef.current,
          sagMultiplier
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

  const basePath = generatePhysicsString(fromX, fromY, toX, toY, 0, 0, sagMultiplier);

  // Staggered animation delay based on index
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

// Paper airplane SVG component
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

// Polaroid card component
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
      {/* Pin */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
        <div className="h-4 w-4 rounded-full bg-red-500 shadow-md border-2 border-red-600" />
      </div>

      {/* Card */}
      <div
        className={`bg-white p-2 pb-6 shadow-xl transition-all duration-300 ${
          isActive ? "ring-2 ring-fuchsia-400" : ""
        }`}
        style={{ width: 100 }}
      >
        {/* Photo area placeholder */}
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

        {/* Label */}
        <p className="mt-2 text-center font-serif text-xs text-neutral-700 font-medium">
          {destination.label}
        </p>
        <p className="text-center font-serif text-[10px] text-neutral-500 italic">
          {destination.subtitle}
        </p>

        {/* Visited indicator */}
        {isVisited && !isActive && (
          <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-fuchsia-500" />
        )}
      </div>
    </motion.button>
  );
}

export default function JourneyMap() {
  const [activeDestination, setActiveDestination] = useState<string | null>(
    "taiwan"
  );
  const [visitedDestinations, setVisitedDestinations] = useState<Set<string>>(
    new Set(["taiwan"])
  );
  const [isAnimating, setIsAnimating] = useState(false);

  // Canvas panning tracking for string physics
  const [canvasDeltaX, setCanvasDeltaX] = useState(0);
  const [canvasDeltaY, setCanvasDeltaY] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastCanvasX = useRef(0);
  const lastCanvasY = useRef(0);

  // Subscribe to canvas movement
  const { x: canvasX, y: canvasY } = useCanvasContext();

  // Track canvas movement delta for smooth string response
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

  // Motion values for airplane position
  const planeX = useMotionValue(destinations[0].x + 50);
  const planeY = useMotionValue(destinations[0].y + 40);
  const planeRotation = useMotionValue(0);

  const svgRef = useRef<SVGSVGElement>(null);

  const handleDestinationClick = async (destId: string) => {
    if (isAnimating || destId === activeDestination) return;

    const currentIndex = destinations.findIndex(
      (d) => d.id === activeDestination
    );
    const target = destinations.find((d) => d.id === destId);

    if (currentIndex === -1 || !target) return;

    setIsAnimating(true);

    // Calculate angle to target
    const dx = target.x + 50 - planeX.get();
    const dy = target.y + 40 - planeY.get();
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    // Rotate plane to face target
    await animate(planeRotation, angle, { duration: 0.3 });

    // Fly to target
    await Promise.all([
      animate(planeX, target.x + 50, {
        duration: 0.8,
        ease: [0.4, 0, 0.2, 1],
      }),
      animate(planeY, target.y + 40, {
        duration: 0.8,
        ease: [0.4, 0, 0.2, 1],
      }),
    ]);

    setActiveDestination(destId);
    setVisitedDestinations((prev) => new Set([...prev, destId]));
    setIsAnimating(false);
  };

  const activeDesc = destinations.find((d) => d.id === activeDestination);

  return (
    <div ref={containerRef} className="relative h-full w-full">
      {/* Title */}
      <h2 className="absolute left-8 top-4 text-2xl font-thin text-fuchsia-200">
        my journey
      </h2>

      {/* SVG layer for strings */}
      <svg
        ref={svgRef}
        className="absolute inset-0 h-full w-full pointer-events-none"
        style={{ overflow: "visible" }}
      >
        <defs>
          {/* String gradient */}
          <linearGradient id="stringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#b91c1c" />
          </linearGradient>
        </defs>

        {/* Draw strings between destinations with physics */}
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

      {/* Polaroid cards */}
      {destinations.map((dest) => (
        <PolaroidCard
          key={dest.id}
          destination={dest}
          isActive={activeDestination === dest.id}
          isVisited={visitedDestinations.has(dest.id)}
          onClick={() => handleDestinationClick(dest.id)}
        />
      ))}

      {/* Paper airplane */}
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

      {/* Description panel */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        key={activeDestination}
      >
        {activeDesc && (
          <div className="rounded-xl bg-fuchsia-950/70 backdrop-blur-sm border border-fuchsia-800/30 px-6 py-4 text-center">
            <p className="text-fuchsia-200/90 italic">"{activeDesc.description}"</p>
          </div>
        )}
      </motion.div>

      {/* Instructions hint */}
      <p className="absolute bottom-2 right-4 text-xs text-fuchsia-400/50">
        click a destination to explore
      </p>
    </div>
  );
}
