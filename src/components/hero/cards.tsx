import { motion } from "framer-motion";
import { AnimatedLink } from "../AnimatedLink";
import ContactCard from "./ContactCard";
import FunCard from "./FunCard";
import ProjectsCard from "./ProjectsCard";
import type { Card } from "./FlipCard";

export const cards: Card[] = [
  {
    id: "1",
    front: "Work 🧑‍💻",
    back: (
      <div className="text-[10.5px] md:text-sm lg:text-base ">
        I'm currently building frontend & mobile w/ React & React Native @{" "}
        <AnimatedLink href="https://geneial.com">geneial</AnimatedLink>. I've
        also previously built fullstack web apps for{" "}
        <AnimatedLink href="https://mora.do">mora.do</AnimatedLink> and{" "}
        <AnimatedLink href="https://aramid.finance">aramid</AnimatedLink>
        .
        <br />
        <br />
        See here for my{" "}
        <AnimatedLink href="https://www.linkedin.com/in/hunterchen">
          Linkedin<span className="text-white">,</span>
        </AnimatedLink>{" "}
        <AnimatedLink href="https://github.com/hunterchen7">
          GitHub
        </AnimatedLink>{" "}
        and{" "}
        <AnimatedLink href="https://hunterchen.ca/resume.pdf">
          resume
        </AnimatedLink>
        .
      </div>
    ),
    gridArea: "[grid-area:1/1/3/4] md:[grid-area:1/1/3/3]",
    color: "#462858",
  },
  {
    id: "2",
    front: "Fun 🤩",
    back: <FunCard />,
    gridArea: "[grid-area:4/4/7/6] md:[grid-area:3/3/5/5]",
    color: "#532963",
  },
  {
    id: "3",
    front: "Projects 🤓",
    back: <ProjectsCard />,
    gridArea: "[grid-area:1/4/4/6] md:[grid-area:1/3/3/5]",
    color: "#48205a",
  },
  {
    id: "4",
    front: "Hackathons 💻",
    back: (
      <div className="flex flex-col gap-2 -mx-4 md:mx-auto">
        <div className="text-[10.5px] md:text-sm">
          avid hackathon attendee and ex-organized! led the team to build web
          for{" "}
          <AnimatedLink
            textClassName="text-fuchsia-400"
            href="https://2024.hackwestern.com"
          >
            Hack Western 11
          </AnimatedLink>{" "}
          and{" "}
          <AnimatedLink
            textClassName="text-fuchsia-400"
            href="https://hackwestern.com"
          >
            Hack Western 12
          </AnimatedLink>
          ,{" "}
          <AnimatedLink
            textClassName="text-fuchsia-400"
            href="https://www.uwo.ca"
          >
            Western University
          </AnimatedLink>{" "}
          annual flagship hackathon.
        </div>
        <motion.img
          src="hero/team.webp"
          className="w-[320px] mx-auto rounded-md"
        />
        <p className="text-center text-[10px] md:text-xs -mt-1">
          my team @ hack western 12 💜
        </p>
      </div>
    ),
    gridArea: "[grid-area:4/1/7/4] md:[grid-area:4/1/6/3]",
    color: "#471f52",
  },
  {
    id: "5",
    front: "say hello! 👋",
    back: <ContactCard />,
    gridArea: "[grid-area:7/1/8/6] md:[grid-area:5/3/6/5]",
    color: "#442662",
  },
];
