import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { motion } from "framer-motion";
import { CanvasComponent, type SectionCoordinates } from "@hunterchen/canvas";
import FlipCard from "./hero/FlipCard";
import { cards } from "./hero/cards";
import { HeroModelAnimationProvider } from "./hero/modelAnimationContext";
import { preloadHeroModels } from "./hero/deferredHeroModels";
import HintSvg, {
  HINT_TOTAL_DURATION,
  HINT_ARROW_DRAW_OFFSET,
} from "./HintSvg";
import { afterFirstContentfulPaint } from "../utils/afterFirstContentfulPaint";
import { AccessibleCanvasSection } from "../contexts/SectionFocusContext";

interface HeroSectionProps {
  offset: SectionCoordinates;
}

// Session storage — skip typewriter on revisit
const INTRO_SEEN_KEY = "hero-intro-seen";
const IS_REVISIT =
  typeof window !== "undefined" &&
  sessionStorage.getItem(INTRO_SEEN_KEY) === "true";

// Typewriter timing (ms)
const INTRO_TEXT = "hey, I'm Hunter!";
const INTRO_SEQUENCE_LENGTH = INTRO_TEXT.length + 1;
const CHAR_DELAY = 50;
const PUNCT_DELAY = 120;
const PUNCTUATION = ",;:.!?";
const TYPING_DURATION_MS = Array.from(
  { length: INTRO_SEQUENCE_LENGTH },
  (_, i) =>
    PUNCTUATION.includes(INTRO_TEXT[i - 1] ?? "")
      ? PUNCT_DELAY
      : CHAR_DELAY,
).reduce((a, b) => a + b, 0);
const POST_TYPING_DELAY_MS = 200;

// Content timing (seconds, relative to showContent becoming true).
//
// The intro plays as a STAGED sequence — one thing at a time, minimal overlap:
//   1. cards come in
//   2. objects (card artwork) load in
//   3. the hero arrow draws
//   4. the nav arrow draws
//   5. the pseudo-3D object animations begin
// Stages 1→2→3 are seamless (boxes flow into objects flow into the first hint);
// the only PHASE_GAP beat is before the nav arrow. INTRO_PACE scales the speed
// within each stage. The steady-state model loops are unaffected.
const INTRO_PACE = 1.0;
const PHASE_GAP = 0.45;

const TEXT_CONTAINER_DELAY = 0.2 * INTRO_PACE;
const SUBTITLE_FADE_DURATION = 0.2 * INTRO_PACE;
const CARD_STAGGER = (IS_REVISIT ? 0.2 : 0.25) * INTRO_PACE;
const CARD_SPRING_SETTLE = (IS_REVISIT ? 0.65 : 0.7) * INTRO_PACE;
const ARTWORK_STAGGER = (IS_REVISIT ? 0.2 : 0.25) * INTRO_PACE;
const ARTWORK_REVEAL_DURATION = (IS_REVISIT ? 1.15 : 1.25) * INTRO_PACE;
// const WAVE_AFTER_BOXES =
//   (cards.length - 1) * CARD_STAGGER + (IS_REVISIT ? 0.25 : 0.3); // wave emoji retired

// Stage 1 — cards come in.
const CARDS_FINISH = (cards.length - 1) * CARD_STAGGER + CARD_SPRING_SETTLE;
// Stage 2 — objects (card artwork) load in right as the last box lands (no
// beat here, so the boxes and their contents read as one continuous move).
const ARTWORK_REVEAL_START = CARDS_FINISH;
// FlipCard's pop-in brings each object to full opacity at ARTWORK_LAND_FRACTION
// of its duration (times:[0, 0.68, …]); the remainder is just a small scale
// settle. So the last object is visually "in" here — not at the full duration.
const ARTWORK_LAND_FRACTION = 0.68;
const ARTWORKS_LANDED =
  ARTWORK_REVEAL_START +
  (cards.length - 1) * ARTWORK_STAGGER +
  ARTWORK_LAND_FRACTION * ARTWORK_REVEAL_DURATION;
// Stage 3 — the hero arrow's LINE draws HINT_ARROW_DRAW_OFFSET into its own
// enter (the "click me" text fades first), so start the hint that much earlier
// and the stroke lands right as the last object arrives.
const HERO_CLICKME_DELAY = ARTWORKS_LANDED - HINT_ARROW_DRAW_OFFSET;
const HERO_CLICKME_FINISH = HERO_CLICKME_DELAY + HINT_TOTAL_DURATION;
// Stage 4 — nav arrow draws after the hero arrow finishes
// (showContent-relative; the export below adds the pre-content typing time).
const NAV_HINT_FROM_CONTENT = HERO_CLICKME_FINISH + PHASE_GAP;
// Stage 5 — begin the pseudo-3D loops only after the second (nav) arrow has
// completely drawn.
const HERO_MODEL_MOTION_DELAY = NAV_HINT_FROM_CONTENT + HINT_TOTAL_DURATION;

const INTRO_FINISH = IS_REVISIT
  ? 0
  : (TYPING_DURATION_MS + POST_TYPING_DELAY_MS) / 1000;

/** Seconds from page load until the navbar hint should begin. The nav hint
 *  lives in App.tsx and is measured from page mount, so it includes the
 *  pre-content typing time (0 on a revisit). */
export const HERO_NAV_HINT_DELAY = INTRO_FINISH + NAV_HINT_FROM_CONTENT;

export default function HeroSection({ offset }: HeroSectionProps) {
  const [hasBeenClicked, setHasBeenClicked] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [showContent, setShowContent] = useState(IS_REVISIT);
  const [showArtwork, setShowArtwork] = useState(false);
  // const [waveAnimationReady, setWaveAnimationReady] = useState(false); // wave emoji retired
  const [modelAnimationsReady, setModelAnimationsReady] = useState(false);
  const [isHeroVisible, setIsHeroVisible] = useState(true);
  const [isDocumentVisible, setIsDocumentVisible] = useState(
    () =>
      typeof document === "undefined" ||
      document.visibilityState !== "hidden",
  );
  const gridRef = useRef<HTMLDivElement>(null);
  const pendingPointerRef = useRef<{ x: number; y: number } | null>(null);
  const glowFrameRef = useRef<number | null>(null);

  const handleGridMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      pendingPointerRef.current = { x: e.clientX, y: e.clientY };
      if (glowFrameRef.current !== null) return;

      glowFrameRef.current = window.requestAnimationFrame(() => {
        const grid = gridRef.current;
        const pointer = pendingPointerRef.current;
        if (!grid || !pointer) {
          glowFrameRef.current = null;
          return;
        }

        // Canvas pan/zoom is an ancestor transform, which does not trigger a
        // ResizeObserver. Read the live rect once per animation frame so the
        // screen-to-layout conversion always uses the current canvas scale.
        const rect = grid.getBoundingClientRect();
        const scaleX = grid.offsetWidth / rect.width;
        const scaleY = grid.offsetHeight / rect.height;
        grid.style.setProperty(
          "--hero-glow-x",
          `${(pointer.x - rect.left) * scaleX}px`,
        );
        grid.style.setProperty(
          "--hero-glow-y",
          `${(pointer.y - rect.top) * scaleY}px`,
        );
        grid.style.setProperty("--hero-glow-opacity", "1");
        glowFrameRef.current = null;
      });
    },
    [],
  );

  const handleGridMouseLeave = useCallback(() => {
    pendingPointerRef.current = null;
    if (glowFrameRef.current !== null) {
      window.cancelAnimationFrame(glowFrameRef.current);
      glowFrameRef.current = null;
    }
    gridRef.current?.style.setProperty("--hero-glow-opacity", "0");
  }, []);
  const typingDone = charCount >= INTRO_SEQUENCE_LENGTH;
  // const waveTyped = charCount > INTRO_TEXT.length; // wave emoji retired

  // Typewriter effect (skipped on revisit since typingDone is already true)
  useEffect(() => {
    if (typingDone) return;
    let cancelled = false;
    const tick = (count: number) => {
      if (cancelled || count >= INTRO_SEQUENCE_LENGTH) return;
      const delay = PUNCTUATION.includes(INTRO_TEXT[count - 1] ?? "")
        ? PUNCT_DELAY
        : CHAR_DELAY;
      setTimeout(() => {
        if (cancelled) return;
        setCharCount(count + 1);
        tick(count + 1);
      }, delay);
    };
    tick(charCount);
    return () => {
      cancelled = true;
    };
  }, [typingDone]);

  // Show content after typing (skipped on revisit since both are already true)
  useEffect(() => {
    if (!typingDone) return;
    const timer = setTimeout(() => setShowContent(true), POST_TYPING_DELAY_MS);
    return () => clearTimeout(timer);
  }, [typingDone]);

  // Wave emoji retired — armed its animation once the boxes had landed.
  // useEffect(() => {
  //   if (!showContent) {
  //     setWaveAnimationReady(false);
  //     return;
  //   }
  //
  //   const timer = window.setTimeout(
  //     () => setWaveAnimationReady(true),
  //     WAVE_AFTER_BOXES * 1_000,
  //   );
  //   return () => window.clearTimeout(timer);
  // }, [showContent]);

  // Mark intro as seen for future visits
  useEffect(() => {
    if (showContent) {
      sessionStorage.setItem(INTRO_SEEN_KEY, "true");
    }
  }, [showContent]);

  // Fetch the decorative model chunks immediately after the hero's first
  // contentful paint instead of competing with it.
  useEffect(() => {
    return afterFirstContentfulPaint(preloadHeroModels);
  }, []);

  // Mount the large inline SVG trees in a later commit than the card shells.
  useEffect(() => {
    if (!showContent) {
      setShowArtwork(false);
      return;
    }

    let secondFrame: number | null = null;
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        startTransition(() => setShowArtwork(true));
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame !== null) {
        window.cancelAnimationFrame(secondFrame);
      }
    };
  }, [showContent]);

  useEffect(() => {
    if (!showContent) {
      setModelAnimationsReady(false);
      return;
    }

    const timer = window.setTimeout(
      () => setModelAnimationsReady(true),
      HERO_MODEL_MOTION_DELAY * 1_000,
    );
    return () => window.clearTimeout(timer);
  }, [showContent]);

  // Canvas sections stay mounted while the viewport pans elsewhere. Pause the
  // model clocks when the hero is offscreen or the tab is hidden so the large
  // SVG scenes do not keep scheduling React updates in the background.
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsHeroVisible(entry?.isIntersecting ?? true),
      { threshold: 0.01 },
    );
    observer.observe(grid);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const updateVisibility = () => {
      setIsDocumentVisible(document.visibilityState !== "hidden");
    };
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () =>
      document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

  const modelAnimationsActive =
    modelAnimationsReady && isHeroVisible && isDocumentVisible;

  useEffect(
    () => () => {
      if (glowFrameRef.current !== null) {
        window.cancelAnimationFrame(glowFrameRef.current);
      }
    },
    [],
  );

  return (
    <CanvasComponent offset={offset}>
      <AccessibleCanvasSection
        sectionId="hero"
        label="Home"
        className="relative flex h-full w-full items-center justify-center p-8"
      >
        <div className="hero-composition w-[95vw] md:w-[700px] lg:w-[1000px] -mt-32 md:-mt-24 md:h-[1000px] flex flex-col">
          <HeroModelAnimationProvider ready={modelAnimationsActive}>
            <div
              ref={gridRef}
              onMouseMove={handleGridMouseMove}
              onMouseLeave={handleGridMouseLeave}
              className={`relative grid gap-2 md:gap-3 lg:gap-4 grid-cols-5 grid-rows-7 md:grid-cols-4 md:grid-rows-5 mt-20 ${
                modelAnimationsActive ? "" : "hero-models-paused"
              }`}
              style={
                {
                  "--hero-glow-opacity": "0",
                  "--hero-glow-x": "0px",
                  "--hero-glow-y": "0px",
                } as React.CSSProperties
              }
            >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                delay: IS_REVISIT ? 0 : TEXT_CONTAINER_DELAY,
                duration: IS_REVISIT ? 0.3 : 0.5,
              }}
              className="transition-all [grid-area:3/1/4/4] md:[grid-area:3/1/4/3] relative flex items-center mx-auto text-right px-2 text-[#e8e5ee]/80"
            >
              <div className="pointer-events-none absolute left-0 -top-1 z-10 scale-[160%] md:top-1 md:scale-[300%]">
                <HintSvg
                  variant="hero"
                  show={showContent && !hasBeenClicked}
                  enterDelay={HERO_CLICKME_DELAY}
                  width={60}
                  height={38}
                />
              </div>
              <div>
              <p className="text-[10px] leading-3 md:text-base md:leading-normal lg:text-lg bg-gradient-to-r from-[#e48dff] via-[#f09efd] to-[#c4b5fd] bg-clip-text text-transparent">
                  {INTRO_TEXT.slice(0, Math.min(charCount, INTRO_TEXT.length))}
                  {!typingDone && <span className="animate-pulse">|</span>}
                  {/* Waving hand emoji \u2014 retired, kept for reference.
                  {waveTyped ? (
                    <span
                      className={
                        waveAnimationReady
                          ? "inline-block ml-1 animate-wave"
                          : "inline-block ml-1"
                      }
                      style={{
                        WebkitTextFillColor: "initial",
                        animationDelay: "-200ms",
                        color: "initial",
                        fontFamily:
                          '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
                      }}
                    >
                      {"\u{1F44B}\uFE0F"}
                    </span>
                  ) : null}
                  */}
                </p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: showContent ? 1 : 0 }}
                  transition={{ duration: SUBTITLE_FADE_DURATION }}
                className="text-[10px] leading-3 md:text-base md:leading-normal mt-2 md:mt-3 bg-gradient-to-r from-[#e48dff]/80 via-[#f09efd]/80 to-[#c4b5fd]/80 bg-clip-text text-transparent"
                >
                  welcome to my playground, have a look around
                </motion.p>
              </div>
            </motion.div>
            {cards.map((card, idx) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={
                  showContent
                    ? { opacity: 1, scale: 1 }
                    : { opacity: 0, scale: 0.9 }
                }
                transition={{
                  delay: showContent ? idx * CARD_STAGGER : 0,
                  type: "spring",
                  // Gentle, essentially critically-damped spring: cards ease in
                  // without a bounce, settling in roughly one stage-beat.
                  stiffness: 90,
                  damping: 19,
                }}
                className={`${card.gridArea} min-h-[92px] md:min-h-40`}
              >
                <FlipCard
                  card={card}
                  gridRef={gridRef}
                  onCardClick={() => setHasBeenClicked(true)}
                  showArtwork={showArtwork}
                  artworkDelay={
                    ARTWORK_REVEAL_START + idx * ARTWORK_STAGGER
                  }
                  artworkDuration={ARTWORK_REVEAL_DURATION}
                />
              </motion.div>
            ))}
            </div>
          </HeroModelAnimationProvider>
        </div>
      </AccessibleCanvasSection>
    </CanvasComponent>
  );
}
