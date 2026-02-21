import { CanvasComponent, type SectionCoordinates } from "@hunterchen/canvas";
import { motion } from "framer-motion";
import StyledGitMosaic from "./StyledGitMosaic";
import { AnimatedLink } from "./AnimatedLink";

interface HeroSectionProps {
  offset: SectionCoordinates;
}

export default function HeroSection({ offset }: HeroSectionProps) {
  return (
    <CanvasComponent offset={offset}>
      <div className="relative flex h-full w-full items-center justify-center">
        {/* Name and Tagline */}
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-thin text-fuchsia-200">
            hey, i'm hunter
            <span className="ml-3 inline-block animate-wave select-none">
              👋
            </span>
          </h1>
          <p className="mx-auto mt-6 text-base md:text-lg text-fuchsia-300/80 w-[90vw] md:w-auto">
            welcome to my web page! feel free to look around :)
          </p>

          {/* Git Activity Mosaic - fades in as overlay fades out */}
          <motion.div
            className="mx-auto mt-8 mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ duration: 0.8, delay: 7 }}
          >
            <StyledGitMosaic />
          </motion.div>

          <p className="mx-auto md:mt-6 text-base md:text-lg text-fuchsia-300/80 w-[90vw] md:w-auto">
            cs @{" "}
            <AnimatedLink textClassName="text-fuchsia-400" href="https://www.uwo.ca">
              western university
            </AnimatedLink>{" "}
            '26, frontend & mobile @{" "}
            <AnimatedLink textClassName="text-fuchsia-400" href="https://geneial.com">
              geneial
            </AnimatedLink>
            .
          </p>

          <p className="mx-auto mt-8 text-base md:text-lg text-fuchsia-300/80 w-[90vw] md:w-auto">
            see my{" "}
            <AnimatedLink textClassName="text-fuchsia-400" href="https://hunterchen.ca/resume.pdf">
              resume
            </AnimatedLink>
            , or find me on{" "}
            <AnimatedLink textClassName="text-fuchsia-400" href="https://github.com/hunterchen7">
              github
            </AnimatedLink>
            {", "}
            <AnimatedLink textClassName="text-fuchsia-400" href="https://www.linkedin.com/in/hunterchen">
              linkedin
            </AnimatedLink>
            {", and "}
            <AnimatedLink textClassName="text-fuchsia-400" href="https://x.com/hunterchen_7">
              x
            </AnimatedLink>
            .
          </p>
        </div>
      </div>
    </CanvasComponent>
  );
}
