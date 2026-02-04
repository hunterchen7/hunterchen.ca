import { CanvasComponent, type SectionCoordinates } from "@hunterchen/canvas";
import { motion } from "framer-motion";
import StyledGitMosaic from "./StyledGitMosaic";

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
            and i like building things.. feel free to look around :)
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
            <a
              href="https://www.uwo.ca"
              target="_blank"
              rel="noopener noreferrer"
              className="text-fuchsia-300 underline underline-offset-2 hover:text-fuchsia-200"
            >
              western university
            </a>{" "}
            '26, frontend & mobile @{" "}
            <a
              href="https://geneial.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-fuchsia-300 underline underline-offset-2 hover:text-fuchsia-200"
            >
              geneial
            </a>
            .
          </p>

          <p className="mx-auto mt-8 text-base md:text-lg text-fuchsia-300/80 w-[90vw] md:w-auto">
            see my{" "}
            <a
              href="https://hunterchen.ca/resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="text-fuchsia-300 underline underline-offset-2 hover:text-fuchsia-200"
            >
              resume
            </a>
            , or find me on{" "}
            <a
              href="https://github.com/hunterchen7"
              target="_blank"
              rel="noopener noreferrer"
              className="text-fuchsia-300 underline underline-offset-2 hover:text-fuchsia-200"
            >
              github
            </a>
            {" and "}
            <a
              href="https://www.linkedin.com/in/hunterchen"
              target="_blank"
              rel="noopener noreferrer"
              className="text-fuchsia-300 underline underline-offset-2 hover:text-fuchsia-200"
            >
              linkedin
            </a>
            .
          </p>
        </div>
      </div>
    </CanvasComponent>
  );
}
