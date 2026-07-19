import {
  createContext,
  type HTMLAttributes,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
} from "react";
import {
  useCanvasContext,
  type SectionCoordinates,
} from "@hunterchen/canvas";
import { coordinates } from "../constants/coordinates";

export type SectionName = keyof typeof coordinates;

interface SectionFocusContextValue {
  activeSection: SectionName;
  activateSection: (section: SectionName, moveFocus?: boolean) => void;
  setActiveSection: (section: SectionName) => void;
}

export const SectionFocusContext =
  createContext<SectionFocusContextValue | null>(null);

export function useSectionFocus() {
  const context = useContext(SectionFocusContext);
  if (!context) {
    throw new Error("useSectionFocus must be used within SectionFocusContext");
  }
  return context;
}

interface AccessibleCanvasSectionProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  label: string;
  sectionId: SectionName;
}

export function AccessibleCanvasSection({
  children,
  className = "",
  label,
  sectionId,
  ...props
}: AccessibleCanvasSectionProps) {
  const { activeSection } = useSectionFocus();
  const isActive = activeSection === sectionId;

  return (
    <section
      {...props}
      aria-hidden={isActive ? undefined : true}
      aria-label={label}
      className={`canvas-focus-section ${className}`}
      data-canvas-section={sectionId}
      inert={isActive ? undefined : true}
      tabIndex={isActive ? -1 : undefined}
    >
      {children}
    </section>
  );
}

const sectionEntries = Object.entries(coordinates) as Array<
  [SectionName, SectionCoordinates]
>;

/** Keep pointer-panned sections usable while excluding every off-screen section. */
export function CanvasSectionTracker() {
  const { animationStage, scale, x, y } = useCanvasContext();
  const { setActiveSection } = useSectionFocus();
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (animationStage < 2) return;

    const updateActiveSection = () => {
      frameRef.current = null;
      const sceneX = x.get();
      const sceneY = y.get();
      const sceneScale = scale.get();
      const viewportCenterX = window.innerWidth / 2;
      const viewportCenterY = window.innerHeight / 2;

      let closestSection: SectionName = "hero";
      let closestDistance = Number.POSITIVE_INFINITY;

      for (const [section, bounds] of sectionEntries) {
        const centerX = sceneX + (bounds.x + bounds.width / 2) * sceneScale;
        const centerY = sceneY + (bounds.y + bounds.height / 2) * sceneScale;
        const distance = Math.hypot(
          centerX - viewportCenterX,
          centerY - viewportCenterY,
        );

        if (distance < closestDistance) {
          closestDistance = distance;
          closestSection = section;
        }
      }

      setActiveSection(closestSection);
    };

    const scheduleUpdate = () => {
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(updateActiveSection);
    };

    const unsubscribeX = x.on("change", scheduleUpdate);
    const unsubscribeY = y.on("change", scheduleUpdate);
    const unsubscribeScale = scale.on("change", scheduleUpdate);
    window.addEventListener("resize", scheduleUpdate);
    scheduleUpdate();

    return () => {
      unsubscribeX();
      unsubscribeY();
      unsubscribeScale();
      window.removeEventListener("resize", scheduleUpdate);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [animationStage, scale, setActiveSection, x, y]);

  return null;
}
