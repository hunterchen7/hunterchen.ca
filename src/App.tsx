import {
  lazy,
  startTransition,
  Suspense,
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Canvas,
  DefaultCanvasBackground,
  canvasWidth,
  canvasHeight,
  ScreenSizeEnum,
} from "@hunterchen/canvas";
import { coordinates, navItems } from "./constants/coordinates";
import HeroSection from "./components/HeroSection";
import HintSvg from "./components/HintSvg";
import ReaderContent from "./components/ReaderContent";
import { HERO_SEQUENCE_END } from "./components/HeroSection";
import {
  HERO_COLORS,
  HERO_THEME_STYLE,
  heroRgba,
} from "./components/hero/heroPalette";
import { afterFirstContentfulPaint } from "./utils/afterFirstContentfulPaint";
import {
  CanvasSectionTracker,
  SectionFocusContext,
  type SectionName,
} from "./contexts/SectionFocusContext";
import { ResumeViewerProvider } from "./contexts/ResumeViewerContext";

// Canvas spotlight - circular bloom at canvas center, falling off outward
const CANVAS_GRADIENT = `radial-gradient(circle ${canvasWidth / 2}px at ${canvasWidth / 2}px ${canvasHeight / 2}px, var(--canvas-bg-bloom) 0%, var(--canvas-bg-mid) 40%, var(--canvas-bg-deep) 85%)`;

// Dot color (warm purple highlight)
const DOT_COLOR = "var(--canvas-dot)";

const loadDeferredCanvasSections = () =>
  import("./components/DeferredCanvasSections");
const DeferredCanvasSections = lazy(loadDeferredCanvasSections);

export default function App() {
  const [showClickMe, setShowClickMe] = useState(true);
  const [loadDeferredSections, setLoadDeferredSections] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionName>("hero");
  const focusTimerRef = useRef<number | null>(null);

  const activateSection = useCallback(
    (section: SectionName, moveFocus = false) => {
      setActiveSection(section);
      if (focusTimerRef.current !== null) {
        window.clearTimeout(focusTimerRef.current);
        focusTimerRef.current = null;
      }
      if (!moveFocus) return;

      focusTimerRef.current = window.setTimeout(() => {
        setActiveSection(section);
        document
          .querySelector<HTMLElement>(`[data-canvas-section="${section}"]`)
          ?.focus({ preventScroll: true });
        focusTimerRef.current = null;
      }, 380);
    },
    [],
  );

  const sectionFocusValue = useMemo(
    () => ({ activeSection, activateSection, setActiveSection }),
    [activeSection, activateSection],
  );

  const handleNavigationClick = useCallback(
    (event: ReactMouseEvent<HTMLElement>) => {
      const button = (event.target as Element).closest<HTMLButtonElement>(
        ".site-navbar button[aria-label]",
      );
      if (!button) return;

      const item = navItems.find(
        ({ label }) => label === button.getAttribute("aria-label"),
      );
      if (item) activateSection(item.id as SectionName);
    },
    [activateSection],
  );

  useEffect(
    () => () => {
      if (focusTimerRef.current !== null) {
        window.clearTimeout(focusTimerRef.current);
      }
    },
    [],
  );

  // Keep the initial commit hero-only. As soon as it has actually painted,
  // eagerly fetch and mount the rest so its media can warm in the background.
  useEffect(() => {
    const cancel = afterFirstContentfulPaint(() => {
      void loadDeferredCanvasSections();
      startTransition(() => setLoadDeferredSections(true));
    });

    return cancel;
  }, []);

  useEffect(() => {
    if (!showClickMe) return;

    const handleClick = (e: MouseEvent) => {
      let el = e.target as HTMLElement | null;
      while (el) {
        if (el.style.position === "fixed" && el.style.zIndex === "1000") {
          setShowClickMe(false);
          return;
        }
        el = el.parentElement;
      }
    };

    // Use capture phase so we see clicks even if propagation is stopped
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [showClickMe]);

  return (
    <SectionFocusContext.Provider value={sectionFocusValue}>
      <ResumeViewerProvider>
        <main
          id="home"
          className="relative min-h-screen"
          style={HERO_THEME_STYLE}
          onClickCapture={handleNavigationClick}
        >
        <ReaderContent />
        <HintSvg
          variant="nav"
          show={showClickMe}
          enterDelay={Math.max(0, HERO_SEQUENCE_END - 0.45)}
          className="pointer-events-none fixed bottom-[49px] left-[53%] scale-[150%] z-[999] hidden -translate-x-1/2 md:block"
        />
        <Canvas
          homeCoordinates={coordinates.hero}
          navItems={navItems}
          skipIntro
          canvasBackground={
            <DefaultCanvasBackground
              gradientStyle={CANVAS_GRADIENT}
              dotColor={DOT_COLOR}
              dotOpacity={0.38}
            />
          }
          toolbarConfig={{
            position: "top-right",
            separatorGap: 8,
            style: {
              backgroundColor: HERO_COLORS.surface,
              borderColor: heroRgba("accent", 0.45),
              color: HERO_COLORS.light,
            },
          }}
          zoomConfig={{
            responsiveZoomMap: {
              [ScreenSizeEnum.SMALL_MOBILE]: 0.45,
              [ScreenSizeEnum.MOBILE]: 0.5,
            },
          }}
          navbarConfig={{
            className: "site-navbar",
            style: {
              backgroundColor: HERO_COLORS.surface,
              borderColor: heroRgba("accent", 0.45),
            },
            buttonConfig: {
              style: { color: heroRgba("light", 0.58) },
              hoverStyle: { backgroundColor: HERO_COLORS.raised },
              activeStyle: { backgroundColor: HERO_COLORS.deep },
              labelStyle: { color: HERO_COLORS.accent },
            },
            tooltipConfig: {
              style: {
                backgroundColor: HERO_COLORS.surface,
                color: HERO_COLORS.light,
              },
            },
          }}
        >
          <CanvasSectionTracker />
          <HeroSection offset={coordinates.hero} />
          {loadDeferredSections ? (
            <Suspense fallback={null}>
              <DeferredCanvasSections />
            </Suspense>
          ) : null}
        </Canvas>
        </main>
      </ResumeViewerProvider>
    </SectionFocusContext.Provider>
  );
}
