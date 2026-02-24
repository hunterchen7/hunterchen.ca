import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CanvasComponent, type SectionCoordinates } from "@hunterchen/canvas";
import FlipCard from "./hero/FlipCard";
import { cards } from "./hero/cards";

interface HeroSectionProps {
  offset: SectionCoordinates;
}

const INTRO_TEXT = "hey, I'm Hunter!";
const CHAR_DELAY = 75;
const PUNCT_DELAY = 150;

export default function HeroSection({ offset }: HeroSectionProps) {
  const [hasBeenClicked, setHasBeenClicked] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const typingDone = charCount >= INTRO_TEXT.length;

  useEffect(() => {
    if (typingDone) return;
    let cancelled = false;
    const tick = (count: number) => {
      if (cancelled || count >= INTRO_TEXT.length) return;
      const delay = ",;:.!?".includes(INTRO_TEXT[count - 1] ?? "")
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

  useEffect(() => {
    if (!typingDone) return;
    const timer = setTimeout(() => setShowContent(true), 700);
    return () => clearTimeout(timer);
  }, [typingDone]);

  return (
    <CanvasComponent offset={offset}>
      <div className="relative h-full w-full flex items-center justify-center p-8">
        <div className="w-[95vw] md:w-[700px] lg:w-[1000px] -mt-32 md:-mt-24 md:h-[1000px] flex flex-col">
          <div className="relative grid gap-2 md:gap-3 lg:gap-4 grid-cols-5 grid-rows-7 md:grid-cols-4 md:grid-rows-5 mt-20">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="transition-all [grid-area:3/1/4/4] md:[grid-area:3/1/4/3] relative flex items-center mx-auto text-right px-2 text-fuchsia-100/80"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: showContent && !hasBeenClicked ? 1 : 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="pointer-events-none absolute top-1 left-0 z-10 scale-[180%] md:scale-[230%]"
              >
                <motion.img
                  initial={{ opacity: 0 }}
                  animate={{ opacity: showContent ? 1 : 0 }}
                  transition={{ delay: 0.5, duration: 0.5, ease: "easeInOut" }}
                  src="/clickme.svg"
                  alt="Click me!"
                  width={60}
                  height={38}
                />
              </motion.div>
              <div>
                <p className="text-sm md:text-base lg:text-lg bg-gradient-to-r from-white to-fuchsia-300/80 bg-clip-text text-transparent">
                  {INTRO_TEXT.slice(0, charCount)}
                  {!typingDone && <span className="animate-pulse">|</span>}
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: typingDone ? 1 : 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="inline-block animate-wave ml-1 text-white"
                    style={{ WebkitTextFillColor: "initial" }}
                  >
                    👋
                  </motion.span>
                </p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: showContent ? 1 : 0 }}
                  transition={{ duration: 0.4 }}
                  className="text-sm md:text-base mt-3 bg-gradient-to-r from-white to-fuchsia-300/80 bg-clip-text text-transparent"
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
                  delay: showContent ? idx * 0.267 : 0,
                  type: "spring",
                  stiffness: 100,
                  damping: 15,
                }}
                className={`${card.gridArea} min-h-[92px] md:min-h-44`}
              >
                <FlipCard
                  card={card}
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
