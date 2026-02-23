import { useState } from "react";
import { motion } from "framer-motion";
import { CanvasComponent, type SectionCoordinates } from "@hunterchen/canvas";
import FlipCard from "./hero/FlipCard";
import { cards } from "./hero/cards";

interface HeroSectionProps {
  offset: SectionCoordinates;
}

export default function HeroSection({ offset }: HeroSectionProps) {
  const [hasBeenClicked, setHasBeenClicked] = useState(false);

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
                animate={{ opacity: hasBeenClicked ? 0 : 1 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="pointer-events-none absolute top-1 left-0 z-10 scale-[180%] md:scale-[230%]"
              >
                <motion.img
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2, duration: 0.5, ease: "easeInOut" }}
                  src="/clickme.svg"
                  alt="Click me!"
                  width={60}
                  height={38}
                />
              </motion.div>
              <div>
                <p className="text-xs md:text-sm lg:text-base">
                  hey, I'm Hunter!{" "}
                  <span className="inline-block animate-wave">👋</span>
                </p>
                <p className="text-xs md:text-sm lg:text-base mt-3">
                  welcome to my personal website, have a look around!
                </p>
              </div>
            </motion.div>
            {cards.map((card, idx) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: 0.5 + idx * 0.167,
                  type: "spring",
                  stiffness: 100,
                  damping: 15,
                }}
                className={`${card.gridArea} min-h-24 md:min-h-44`}
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
