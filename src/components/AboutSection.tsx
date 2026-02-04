import { CanvasComponent, type SectionCoordinates } from "@hunterchen/canvas";
import JourneyMap from "./JourneyMap";

interface AboutSectionProps {
  offset: SectionCoordinates;
}

export default function AboutSection({ offset }: AboutSectionProps) {
  return (
    <CanvasComponent offset={offset}>
      <JourneyMap />
    </CanvasComponent>
  );
}
