import { useCanvasContext } from "@hunterchen/canvas";
import {
  type SectionName,
  useSectionFocus,
} from "../contexts/SectionFocusContext";

export function useNavigateToSection() {
  const { navigateToSection } = useCanvasContext();
  const { activateSection } = useSectionFocus();

  return (section: SectionName) => {
    activateSection(section, true);
    navigateToSection(section);
  };
}
