import { AnimatedLink } from "../AnimatedLink";
import { useNavigateToSection } from "../../hooks/useNavigateToSection";

export function ListItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="border-t border-fuchsia-200/10 py-0.5 md:pt-2">
      {children}
    </li>
  );
}

export default function ProjectsCard() {
  const navigateTo = useNavigateToSection();

  return (
    <div className="h-full w-full flex items-center">
      <div className="w-full text-left">
        <p className="text-[9px] md:text-sm lg:text-base">
          I've made a bunch of random things:
        </p>
        <ul className="md:mt-3 md:space-y-2 text-[9px] md:text-sm">
          <ListItem>
            a cross-platform{" "}
            <AnimatedLink href="https://ti84ce.pages.dev">
              TI-84 Plus CE emulator
            </AnimatedLink>
          </ListItem>
          <ListItem>
            the TI-84 Plus CE's{" "}
            <AnimatedLink href="https://github.com/hunterchen7/CE-games#chess">
              strongest chess engine
            </AnimatedLink>{" "}
          </ListItem>
          <ListItem>
            a{" "}
            <AnimatedLink href="https://www.npmjs.com/package/@hunterchen/canvas">
              React library
            </AnimatedLink>{" "}
            for building interactive zoomable & pannable "canvas" web UIs
          </ListItem>
          <ListItem>
            a{" "}
            <AnimatedLink href="https://github.com/hunterchen7/hunter-chessbot">
              chess neural network
            </AnimatedLink>{" "}
            trained on my games to play like me, play against it{" "}
            <AnimatedLink onClick={() => navigateTo("chess")}>
              here
            </AnimatedLink>
          </ListItem>
          <ListItem>
            and{" "}
            <AnimatedLink onClick={() => navigateTo("projects")}>
              more
            </AnimatedLink>
            !
          </ListItem>
        </ul>
      </div>
    </div>
  );
}
