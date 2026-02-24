import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { CanvasComponent, type SectionCoordinates } from "@hunterchen/canvas";
import FlipCard from "./hero/FlipCard";
import { cards } from "./hero/cards";
import ClickMeSvg, { CLICKME_TOTAL_DURATION } from "./ClickMeSvg";

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
const CHAR_DELAY = 60;
const PUNCT_DELAY = 120;
const PUNCTUATION = ",;:.!?";
const TYPING_DURATION_MS = Array.from({ length: INTRO_TEXT.length }, (_, i) =>
  PUNCTUATION.includes(INTRO_TEXT[i - 1] ?? "") ? PUNCT_DELAY : CHAR_DELAY,
).reduce((a, b) => a + b, 0);
const POST_TYPING_DELAY_MS = 700;

// Content timing (seconds, relative to showContent becoming true)
const TEXT_CONTAINER_DELAY = 0.2;
const SUBTITLE_FADE_DURATION = 0.4;
const CARD_STAGGER = 0.2;
const CARD_SPRING_SETTLE = 0.3;
const CARDS_FINISH = (cards.length - 1) * CARD_STAGGER + CARD_SPRING_SETTLE;
const HERO_CLICKME_DELAY = CARDS_FINISH + 0.05;

/** Seconds from page load until the hero clickme animation finishes */
export const HERO_SEQUENCE_END = IS_REVISIT
  ? HERO_CLICKME_DELAY + CLICKME_TOTAL_DURATION
  : (TYPING_DURATION_MS + POST_TYPING_DELAY_MS) / 1000 +
    HERO_CLICKME_DELAY +
    CLICKME_TOTAL_DURATION;

export default function HeroSection({ offset }: HeroSectionProps) {
  const [hasBeenClicked, setHasBeenClicked] = useState(false);
  const [charCount, setCharCount] = useState(
    IS_REVISIT ? INTRO_TEXT.length : 0,
  );
  const [showContent, setShowContent] = useState(IS_REVISIT);
  const gridRef = useRef<HTMLDivElement>(null);
  const [gridMouse, setGridMouse] = useState<{ x: number; y: number } | null>(
    null,
  );

  const handleGridMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const grid = gridRef.current;
      if (!grid) return;
      const rect = grid.getBoundingClientRect();
      setGridMouse({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    [],
  );

  const handleGridMouseLeave = useCallback(() => {
    setGridMouse(null);
  }, []);
  const typingDone = charCount >= INTRO_TEXT.length;

  // Typewriter effect (skipped on revisit since typingDone is already true)
  useEffect(() => {
    if (typingDone) return;
    let cancelled = false;
    const tick = (count: number) => {
      if (cancelled || count >= INTRO_TEXT.length) return;
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

  // Mark intro as seen for future visits
  useEffect(() => {
    if (showContent) {
      sessionStorage.setItem(INTRO_SEEN_KEY, "true");
    }
  }, [showContent]);

  return (
    <CanvasComponent offset={offset}>
      <div className="relative h-full w-full flex items-center justify-center p-8">
        <div className="w-[95vw] md:w-[700px] lg:w-[1000px] -mt-32 md:-mt-24 md:h-[1000px] flex flex-col">
          <div
            ref={gridRef}
            onMouseMove={handleGridMouseMove}
            onMouseLeave={handleGridMouseLeave}
            className="relative grid gap-2 md:gap-3 lg:gap-4 grid-cols-5 grid-rows-7 md:grid-cols-4 md:grid-rows-5 mt-20"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                delay: IS_REVISIT ? 0 : TEXT_CONTAINER_DELAY,
                duration: IS_REVISIT ? 0.3 : 0.5,
              }}
              className="transition-all [grid-area:3/1/4/4] md:[grid-area:3/1/4/3] relative flex items-center mx-auto text-right px-2 text-fuchsia-100/80"
            >
              <div className="pointer-events-none absolute top-1 left-0 z-10 scale-[200%] md:scale-[300%]">
                <ClickMeSvg
                  variant="hero"
                  show={showContent && !hasBeenClicked}
                  enterDelay={HERO_CLICKME_DELAY}
                  width={60}
                  height={38}
                />
              </div>
              <div>
                <p className="text-sm md:text-base lg:text-lg bg-gradient-to-r from-white to-fuchsia-300/80 bg-clip-text text-transparent">
                  {INTRO_TEXT.slice(0, charCount)}
                  {!typingDone && <span className="animate-pulse">|</span>}
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: typingDone ? 1 : 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className={`inline-block ml-1 text-white ${typingDone ? "animate-wave" : ""}`}
                    style={{
                      WebkitTextFillColor: "initial",
                      animationDelay: "-200ms",
                    }}
                  >
                    👋
                  </motion.span>
                </p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: showContent ? 1 : 0 }}
                  transition={{ duration: SUBTITLE_FADE_DURATION }}
                  className="text-sm md:text-base mt-3 bg-gradient-to-r from-fuchsia-200 to-fuchsia-300/80 bg-clip-text text-transparent"
                >
                  welcome to my website, have a look around :)
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
                  stiffness: 130,
                  damping: 17,
                }}
                className={`${card.gridArea} min-h-[92px] md:min-h-44`}
              >
                <FlipCard
                  card={card}
                  gridMouse={gridMouse}
                  gridRef={gridRef}
                  onCardClick={() => setHasBeenClicked(true)}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </CanvasComponent>
  );
}
