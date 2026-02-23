import { useCanvasContext } from "@hunterchen/canvas";
import { coordinates } from "../constants/coordinates";

type SectionName = keyof typeof coordinates;

export function useNavigateToSection() {
  const { navigateToSection } = useCanvasContext();

  return (section: SectionName) => {
    navigateToSection(section);
  };
}
