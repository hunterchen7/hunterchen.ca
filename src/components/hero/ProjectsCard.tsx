import { AnimatedLink } from "../AnimatedLink";
import { useNavigateToSection } from "../../hooks/useNavigateToSection";

export default function ProjectsCard() {
  const navigateTo = useNavigateToSection();

  return (
    <div className="text-[10.5px] my-auto text-left md:text-sm lg:text-base -mr-4 -ml-4 md:mr-0 md:ml-3 col-span-3 md:col-span-2">
      I build a bunch of random things:
      <ul className="list-disc list-outside text-left ml-6">
        <li>
          a{" "}
          <AnimatedLink href="https://ti84ce.pages.dev">
            TI-84 Plus CE emulator
          </AnimatedLink>
        </li>
        <li>
          the strongest{" "}
          <AnimatedLink href="https://github.com/hunterchen7/CE-games#chess">
            chess engine
          </AnimatedLink>{" "}
          available for it
        </li>
        <li>
          a React library to build interactive{" "}
          <AnimatedLink href="https://github.com/hunterchen7/canvas">
            canvas-based
          </AnimatedLink>{" "}
          web apps
        </li>
        <li>
          a chess neural network fine-tuned on my games to play like me, play
          against it{" "}
          <AnimatedLink onClick={() => navigateTo("chess")}>here</AnimatedLink>!
        </li>
        <li>
          and{" "}
          <AnimatedLink onClick={() => navigateTo("projects")}>
            more
          </AnimatedLink>
          !
        </li>
      </ul>
    </div>
  );
}
