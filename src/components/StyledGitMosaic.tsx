import {
  GitMosaic,
  type GitMosaicHandle,
  type GitMosaicProps,
  colorSchemes,
} from "git-mosaic";
import { animate, useMotionValue } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { ExternalLink } from "lucide-react";

// Initial parameters (intro state)
const INITIAL = {
  speed: 2.94,
  lifetimeSeconds: 30,
  maxRadius: 0.89,
  spawnRate: 7.23,
  particleGlow: 0,
  spiralTurnRate: 4.211,
  spiralExpansion: 0.017,
  spiralCenterOffset: -3,
  spiralClockwise: true,
  particleScale: 1.05,
  mouseRepel: true,
  repelStrength: 0,
  repelRadius: 0,
} satisfies Partial<GitMosaicProps>;

// Final parameters (settled state)
const FINAL = {
  speed: 1,
  lifetimeSeconds: 37,
  maxRadius: 1,
  spawnRate: 3,
  particleGlow: 0.0,
  spiralTurnRate: 1.279,
  spiralExpansion: 0.408,
  spiralCenterOffset: -0.16,
  particleScale: 1,
  mouseRepel: true,
  repelStrength: 4,
  repelRadius: 150,
} satisfies Partial<GitMosaicProps>;

const TRANSITION_DELAY = 6; // seconds before transition starts
const TRANSITION_DURATION = 12; // seconds for transition

// Phase 2: transition turn rate to 0
const PHASE2_DELAY = TRANSITION_DELAY + TRANSITION_DURATION; // 24s
const PHASE2_DURATION = 15;

// Phase 3: start randomizing speed, turn rate, expansion
const PHASE3_DELAY = PHASE2_DELAY + PHASE2_DURATION; // 39s
const RANDOM_TRANSITION_DURATION = 15;

// Random parameter ranges
const RANDOM_RANGES = {
  speed: { min: 0.067, max: 3.5 },
  spiralTurnRate: { min: 0, max: 3.5 },
  spiralExpansion: { min: 0, max: 0.67 },
  spiralCenterOffset: { min: -0.5, max: 0.5 },
  spawnRate: { min: 1, max: 4 },
};

// Cubic bezier easing (ease-in-out style)
const EASING: [number, number, number, number] = [0.4, 0, 0.2, 1];

// Base colors (initial purple theme)
const BASE_COLORS = ["#2d1b4e", "#4a1f7c", "#7b2cbf", "#9d4edd", "#c77dff"];

const COLOR_CYCLE_START = 8; // seconds before starting color cycling
const COLOR_CYCLE_MIN = 10; // minimum seconds between color changes
const COLOR_CYCLE_MAX = 15; // maximum seconds between color changes
const FIBONACCI_COLOR_START = 10; // seconds before starting fibonacci color additions

// Color presets to cycle through
const CYCLE_PRESETS = ["ember", "nebula", "ocean", "cosmic"] as const;
type CyclePreset = (typeof CYCLE_PRESETS)[number];

function getRandomPreset(exclude: CyclePreset): CyclePreset {
  const available = CYCLE_PRESETS.filter((name) => name !== exclude);
  return available[Math.floor(Math.random() * available.length)] as CyclePreset;
}

function getRandomInterval(): number {
  return (
    (COLOR_CYCLE_MIN + Math.random() * (COLOR_CYCLE_MAX - COLOR_CYCLE_MIN)) *
    1000
  );
}

// Generate a random bright color (HSL with high saturation, medium lightness)
function generateBrightColor(): string {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 70 + Math.floor(Math.random() * 30); // 70-100%
  const lightness = 45 + Math.floor(Math.random() * 20); // 45-65%
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

export default function StyledGitMosaic() {
  const [params, setParams] = useState(INITIAL);
  const [spiralClockwise, setSpiralClockwise] = useState<boolean>(
    INITIAL.spiralClockwise,
  );
  const mosaicRef = useRef<GitMosaicHandle>(null);
  const fibonacciColorsRef = useRef<string[]>([]);
  const currentPresetRef = useRef<CyclePreset>("nebula");

  // Motion values for smooth interpolation
  const speed = useMotionValue(INITIAL.speed);
  const lifetimeSeconds = useMotionValue(INITIAL.lifetimeSeconds);
  const maxRadius = useMotionValue(INITIAL.maxRadius);
  const spawnRate = useMotionValue(INITIAL.spawnRate);
  const particleGlow = useMotionValue(INITIAL.particleGlow);
  const spiralTurnRate = useMotionValue(INITIAL.spiralTurnRate);
  const spiralExpansion = useMotionValue(INITIAL.spiralExpansion);
  const spiralCenterOffset = useMotionValue(INITIAL.spiralCenterOffset);
  const particleScale = useMotionValue(INITIAL.particleScale);
  const repelStrength = useMotionValue(INITIAL.repelStrength);
  const repelRadius = useMotionValue(INITIAL.repelRadius);

  // Helper to generate random value in range
  const randomInRange = (min: number, max: number) =>
    Math.random() * (max - min) + min;

  useEffect(() => {
    console.log("[GitMosaic] Phase 0: Initial state");
    const timers: NodeJS.Timeout[] = [];
    let randomInterval: NodeJS.Timeout | null = null;

    // Phase 1: Initial transition to FINAL params
    const phase1Timer = setTimeout(() => {
      console.log("[GitMosaic] Phase 1: Transitioning to FINAL params");
      const animConfig = { duration: TRANSITION_DURATION, ease: EASING };

      animate(speed, FINAL.speed, animConfig);
      animate(lifetimeSeconds, FINAL.lifetimeSeconds, animConfig);
      animate(maxRadius, FINAL.maxRadius, animConfig);
      animate(spawnRate, FINAL.spawnRate, animConfig);
      animate(particleGlow, FINAL.particleGlow, animConfig);
      animate(spiralTurnRate, FINAL.spiralTurnRate, animConfig);
      animate(spiralExpansion, FINAL.spiralExpansion, animConfig);
      animate(spiralCenterOffset, FINAL.spiralCenterOffset, animConfig);
      animate(particleScale, FINAL.particleScale, animConfig);
      animate(repelStrength, FINAL.repelStrength, animConfig);
      animate(repelRadius, FINAL.repelRadius, animConfig);
    }, TRANSITION_DELAY * 1000);
    timers.push(phase1Timer);

    // Phase 2: Transition turn rate to 0
    const phase2Timer = setTimeout(() => {
      console.log("[GitMosaic] Phase 2: Transitioning turn rate to 0");
      animate(spiralTurnRate, 0, { duration: PHASE2_DURATION, ease: EASING });
    }, PHASE2_DELAY * 1000);
    timers.push(phase2Timer);

    // Phase 3: Start randomizing speed, turn rate, and expansion
    const phase3Timer = setTimeout(() => {
      console.log("[GitMosaic] Phase 3: Starting random transitions");
      const animConfig = { duration: RANDOM_TRANSITION_DURATION, ease: EASING };

      // Animate to first random values
      animate(
        speed,
        randomInRange(RANDOM_RANGES.speed.min, RANDOM_RANGES.speed.max),
        animConfig,
      );
      animate(
        spiralTurnRate,
        randomInRange(
          RANDOM_RANGES.spiralTurnRate.min,
          RANDOM_RANGES.spiralTurnRate.max,
        ),
        animConfig,
      );
      animate(
        spiralExpansion,
        randomInRange(
          RANDOM_RANGES.spiralExpansion.min,
          RANDOM_RANGES.spiralExpansion.max,
        ),
        animConfig,
      );
      animate(
        spiralCenterOffset,
        randomInRange(
          RANDOM_RANGES.spiralCenterOffset.min,
          RANDOM_RANGES.spiralCenterOffset.max,
        ),
        animConfig,
      );
      animate(
        spawnRate,
        randomInRange(RANDOM_RANGES.spawnRate.min, RANDOM_RANGES.spawnRate.max),
        animConfig,
      );
      if (speed.get() * spiralTurnRate.get() < 2) {
        setSpiralClockwise(Math.random() > 0.5);
      }

      // Continue randomizing every 15s
      randomInterval = setInterval(() => {
        console.log("[GitMosaic] Phase 3: New random transition");
        animate(
          speed,
          randomInRange(RANDOM_RANGES.speed.min, RANDOM_RANGES.speed.max),
          animConfig,
        );
        animate(
          spiralTurnRate,
          randomInRange(
            RANDOM_RANGES.spiralTurnRate.min,
            RANDOM_RANGES.spiralTurnRate.max,
          ),
          animConfig,
        );
        animate(
          spiralExpansion,
          randomInRange(
            RANDOM_RANGES.spiralExpansion.min,
            RANDOM_RANGES.spiralExpansion.max,
          ),
          animConfig,
        );
        animate(
          spiralCenterOffset,
          randomInRange(
            RANDOM_RANGES.spiralCenterOffset.min,
            RANDOM_RANGES.spiralCenterOffset.max,
          ),
          animConfig,
        );
        animate(
          spawnRate,
          randomInRange(
            RANDOM_RANGES.spawnRate.min,
            RANDOM_RANGES.spawnRate.max,
          ),
          animConfig,
        );
        if (speed.get() * spiralTurnRate.get() < 2) {
          setSpiralClockwise(Math.random() > 0.5);
        }
      }, RANDOM_TRANSITION_DURATION * 1000);
    }, PHASE3_DELAY * 1000);
    timers.push(phase3Timer);

    return () => {
      timers.forEach(clearTimeout);
      if (randomInterval) clearInterval(randomInterval);
    };
  }, []);

  // Helper to get combined colors (preset + fibonacci)
  const getCombinedColors = (preset: CyclePreset) => {
    return [...colorSchemes[preset].primary, ...fibonacciColorsRef.current];
  };

  // Cycle through color presets
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const cycleColors = () => {
      const nextPreset = getRandomPreset(currentPresetRef.current);
      currentPresetRef.current = nextPreset;
      console.log(
        `[GitMosaic] Switching to ${nextPreset} colors (+ ${fibonacciColorsRef.current.length} fibonacci)`,
      );
      mosaicRef.current?.setColors(getCombinedColors(nextPreset));

      // Schedule next cycle with random interval
      timeoutId = setTimeout(cycleColors, getRandomInterval());
    };

    // Start cycling after initial delay
    const startTimer = setTimeout(() => {
      cycleColors();
    }, COLOR_CYCLE_START * 1000);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(timeoutId);
    };
  }, []);

  // Add random colors with Fibonacci falloff timing
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    let fib1 = 1;
    let fib2 = 1;

    const scheduleNextColor = () => {
      const delay = fib1;

      // Advance Fibonacci sequence
      const nextFib = fib1 + fib2;
      fib1 = fib2;
      fib2 = nextFib;

      const timer = setTimeout(() => {
        const newColor = generateBrightColor();
        fibonacciColorsRef.current = [...fibonacciColorsRef.current, newColor];
        console.log(
          `[GitMosaic] Adding fibonacci color (delay was ${delay}s):`,
          newColor,
        );
        mosaicRef.current?.setColors(
          getCombinedColors(currentPresetRef.current),
        );
        scheduleNextColor();
      }, delay * 1000);

      timers.push(timer);
    };

    // Start after initial delay
    const startTimer = setTimeout(() => {
      console.log("[GitMosaic] Starting fibonacci color additions");
      scheduleNextColor();
    }, FIBONACCI_COLOR_START * 1000);
    timers.push(startTimer);

    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  // Subscribe to motion value changes and update params
  useEffect(() => {
    const unsubscribers = [
      speed.on("change", (v) => setParams((p) => ({ ...p, speed: v }))),
      lifetimeSeconds.on("change", (v) =>
        setParams((p) => ({ ...p, lifetimeSeconds: v })),
      ),
      maxRadius.on("change", (v) => setParams((p) => ({ ...p, maxRadius: v }))),
      spawnRate.on("change", (v) => setParams((p) => ({ ...p, spawnRate: v }))),
      particleGlow.on("change", (v) =>
        setParams((p) => ({ ...p, particleGlow: v })),
      ),
      spiralTurnRate.on("change", (v) =>
        setParams((p) => ({ ...p, spiralTurnRate: v })),
      ),
      spiralExpansion.on("change", (v) =>
        setParams((p) => ({ ...p, spiralExpansion: v })),
      ),
      spiralCenterOffset.on("change", (v) =>
        setParams((p) => ({ ...p, spiralCenterOffset: v })),
      ),
      particleScale.on("change", (v) =>
        setParams((p) => ({ ...p, particleScale: v })),
      ),
      repelStrength.on("change", (v) =>
        setParams((p) => ({ ...p, repelStrength: v })),
      ),
      repelRadius.on("change", (v) =>
        setParams((p) => ({ ...p, repelRadius: v })),
      ),
    ];

    return () => unsubscribers.forEach((unsub) => unsub());
  }, []);

  return (
    <div className="group relative scale-[80%] md:scale-100 -my-16 md:my-auto">
      <GitMosaic
        ref={mosaicRef}
        username="hunterchen7"
        variant="daily-spiral"
        customColors={{
          background: "#000000",
          primary: BASE_COLORS,
          accent: "#2d1b4e",
        }}
        width={600}
        height={600}
        speed={params.speed}
        lifetimeSeconds={params.lifetimeSeconds}
        maxRadius={params.maxRadius}
        spawnRate={params.spawnRate}
        particleGlow={params.particleGlow}
        spiralTurnRate={params.spiralTurnRate}
        spiralExpansion={params.spiralExpansion}
        spiralCenterOffset={params.spiralCenterOffset}
        particleScale={params.particleScale}
        mouseRepel={params.mouseRepel}
        repelStrength={params.repelStrength}
        repelRadius={params.repelRadius}
        spiralClockwise={spiralClockwise}
        fadeInDuration={1.67}
        showAllDays={true}
      />
      <a
        href="https://github.com/hunterchen7/git-mosaic"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute right-2 top-2 p-2 text-white/60 opacity-0 transition-all hover:text-white group-hover:opacity-100"
        aria-label="View git-mosaic on GitHub"
      >
        <ExternalLink className="h-5 w-5" />
      </a>
    </div>
  );
}
