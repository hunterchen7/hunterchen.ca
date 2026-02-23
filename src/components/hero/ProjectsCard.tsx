import { AnimatedLink } from "../AnimatedLink";
import { useNavigateToSection } from "../../hooks/useNavigateToSection";

export default function ProjectsCard() {
  const navigateTo = useNavigateToSection();

  return (
    <div className="grid grid-cols-3">
      <div className="rounded-3xl mb-3 overflow-hidden">
        <video className="scale-[102%]" autoPlay loop muted playsInline>
          <source src="/projects/ti84ce/video.webm" type="video/webm" />
        </video>
      </div>
      <div className="text-xs md:text-md lg:text-base -mr-4 ml-2 md:mr-0 md:ml-3 col-span-2">
        I recently made a cross-platform{" "}
        <AnimatedLink href="https://ti84ce.pages.dev">
          TI-84 Plus CE emulator
        </AnimatedLink>
        ; along with the strongest{" "}
        <AnimatedLink href="https://github.com/hunterchen7/CE-games#chess">
          chess engine
        </AnimatedLink>{" "}
        available for it. I also fine-tuned a chess AI on my own games to have
        it play like me, you can play against it{" "}
        <AnimatedLink onClick={() => navigateTo("chess")}>here</AnimatedLink>!
        See more projects{" "}
        <AnimatedLink onClick={() => navigateTo("projects")}>here</AnimatedLink>
        .
      </div>
    </div>
  );
}
