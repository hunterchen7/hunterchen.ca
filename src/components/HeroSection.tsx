import { useState } from "react";
import { motion } from "framer-motion";
import {
  CanvasComponent,
  useCanvasContext,
  useWindowDimensions,
  getSectionPanCoordinates,
  panToOffsetScene,
  type SectionCoordinates,
} from "@hunterchen/canvas";
import { coordinates } from "../constants/coordinates";
import FlipCard, { type Card } from "./hero/FlipCard";
import ContactCard from "./hero/ContactCard";
import { AnimatedLink } from "./AnimatedLink";

interface HeroSectionProps {
  offset: SectionCoordinates;
}

function FunCard() {
  const { x, y, scale } = useCanvasContext();
  const { width, height } = useWindowDimensions();

  const navigateToGallery = () => {
    const panCoords = getSectionPanCoordinates({
      windowDimensions: { width, height },
      coords: coordinates.gallery,
      targetZoom: 1,
      negative: false,
    });
    void panToOffsetScene(panCoords, x, y, scale, 1);
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="text-sm md:text-base text-center col-span-2 justify-center my-auto">
        If I'm not working on something, you'll likely find me climbing rocks 🧗‍♂️
        or playing chess ♟️. I'm also trying to get good at photography, see
        some photos I've taken{" "}
        <AnimatedLink onClick={navigateToGallery}>here</AnimatedLink>!
      </div>
      <div>
        <motion.img src="hero/rocks.jpg" className="rounded-md my-2" />
      </div>
    </div>
  );
}

const cards: Card[] = [
  {
    id: "1",
    front: "Work 🧑‍💻",
    back: (
      <div className="text-sm lg:text-base">
        I'm currently building frontend & mobile w/ React & React Native @{" "}
        <AnimatedLink
          textClassName="text-fuchsia-400 "
          href="https://geneial.com"
        >
          geneial
        </AnimatedLink>
        . Previously, I've also built fullstack web appliactions for{" "}
        <AnimatedLink textClassName="text-fuchsia-400" href="https://mora.do">
          mora.do
        </AnimatedLink>{" "}
        and{" "}
        <AnimatedLink
          textClassName="text-fuchsia-400"
          href="https://aramid.finance"
        >
          aramid
        </AnimatedLink>
        .
      </div>
    ),
    gridArea: "[grid-area:1/1/3/3]",
    color: "#351638",
  },
  {
    id: "2",
    front: "Fun 🤩",
    back: <FunCard />,
    gridArea: "[grid-area:4/3/7/4] md:[grid-area:3/3/5/5]",
    color: "#3d1744",
  },
  {
    id: "3",
    front: "Projects 🤓",
    back: "Description for category three. Add your content here.",
    gridArea: "[grid-area:1/3/4/4] md:[grid-area:1/3/3/5]",
    color: "#3a1540",
  },
  {
    id: "4",
    front: "Hackathons 💻",
    back: (
      <div className="flex flex-col gap-2">
        <div className="text-xs lg:text-sm">
          in my last 2 years studying CS @{" "}
          <AnimatedLink
            textClassName="text-fuchsia-400"
            href="https://www.uwo.ca"
          >
            Western University
          </AnimatedLink>
          , I led a team of 6 devs to build the website and application portal
          for our annual flagship hackathon,{" "}
          <AnimatedLink
            textClassName="text-fuchsia-400"
            href="https://www.hackwestern.com"
          >
            Hack Western
          </AnimatedLink>
          .
        </div>
        <motion.img
          src="hero/team.jpg"
          className="w-[320px] mx-auto rounded-md"
        />
        <p className="text-center text-xs -mt-1">my team at Hack Western 12</p>
      </div>
    ),
    gridArea: "[grid-area:4/1/7/3] md:[grid-area:4/1/6/3]",
    color: "#2e1432",
  },
  {
    id: "5",
    front: "say hello! 👋",
    back: <ContactCard />,
    gridArea: "[grid-area:7/1/8/4] md:[grid-area:5/3/6/5]",
    color: "#341739",
  },
];

export default function HeroSection({ offset }: HeroSectionProps) {
  const [hasBeenClicked, setHasBeenClicked] = useState(false);

  return (
    <CanvasComponent offset={offset}>
      <div className="relative h-full w-full flex items-center justify-center p-8">
        <div className="w-[95vw] md:w-[700px] lg:w-[1000px] -mt-32 md:-mt-24 md:h-[1000px] flex flex-col">
          <div className="relative grid gap-2 md:gap-3 lg:gap-4 grid-cols-3 grid-rows-7 md:grid-cols-4 md:grid-rows-5 mt-20">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="transition-all [grid-area:3/1/4/3] relative flex items-center mx-auto text-right px-2 text-fuchsia-100/80"
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
                <p className="text-sm md:text-base">hey, I'm Hunter! 👋</p>
                <p className="text-xs lg:text-sm mt-3">
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
                className={`${card.gridArea} min-h-28 md:min-h-44`}
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
