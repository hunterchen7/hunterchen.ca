import { AnimatedLink } from "../AnimatedLink";
import { useNavigateToSection } from "../../hooks/useNavigateToSection";

export default function ProjectsCard() {
  const navigateTo = useNavigateToSection();

  return (
    <div className="text-xs md:text-md lg:text-base -mx-4">
      I recently made a cross-platform{" "}
      <AnimatedLink href="https://ti84ce.pages.dev">
        TI-84 Plus CE emulator
      </AnimatedLink>
      ; along with the strongest{" "}
      <AnimatedLink href="https://github.com/hunterchen7/CE-games#chess">
        chess engine
      </AnimatedLink>{" "}
      available for it. I also fine-tuned a chess AI on my own games to have it
      play like me, you can play against it{" "}
      <AnimatedLink onClick={() => navigateTo("chess")}>here</AnimatedLink>! See
      more projects{" "}
      <AnimatedLink onClick={() => navigateTo("projects")}>here</AnimatedLink>.
    </div>
  );
}
