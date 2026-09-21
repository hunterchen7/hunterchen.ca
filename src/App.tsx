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
  canvasHeight,
  ScreenSizeEnum,
} from "@hunterchen/canvas";
import { coordinates, navItems } from "./constants/coordinates";
import ChessLandingSection from "./components/ChessLandingSection";
import ReaderContent from "./components/ReaderContent";
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

// Virtual canvas width — wider than the library default (6000) to give extra
// pannable room to the right of the sections. Height keeps the library default.
const CANVAS_WIDTH = 7000;

// Canvas spotlight - circular bloom at canvas center, falling off outward
const CANVAS_GRADIENT = `radial-gradient(circle ${CANVAS_WIDTH / 2}px at ${CANVAS_WIDTH / 2}px ${canvasHeight / 2}px, var(--canvas-bg-bloom) 0%, var(--canvas-bg-mid) 40%, var(--canvas-bg-deep) 85%)`;

// Seconds from load before the navbar hint draws itself.

// Dot color (warm purple highlight)
const DOT_COLOR = "var(--canvas-dot)";

const loadDeferredCanvasSections = () =>
  import("./components/DeferredCanvasSections");
const DeferredCanvasSections = lazy(loadDeferredCanvasSections);

export default function App() {
  const [loadDeferredSections, setLoadDeferredSections] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionName>("home");
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
        <Canvas
          homeCoordinates={coordinates.home}
          canvasWidth={CANVAS_WIDTH}
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
              backgroundColor: "var(--surface-deep)",
              borderColor: heroRgba("accent", 0.45),
              color: HERO_COLORS.light,
            },
          }}
          zoomConfig={{
            maxZoom: 5,
            responsiveZoomMap: {
              [ScreenSizeEnum.SMALL_MOBILE]: 0.45,
              [ScreenSizeEnum.MOBILE]: 0.5,
            },
          }}
          navbarConfig={{
            className: "site-navbar",
            style: {
              backgroundColor: "var(--surface-deep)",
              borderColor: heroRgba("accent", 0.45),
            },
            buttonConfig: {
              style: { color: HERO_COLORS.accent },
              hoverStyle: { backgroundColor: "var(--surface-mid)" },
              activeStyle: { backgroundColor: "var(--surface-bloom)" },
              labelStyle: { color: HERO_COLORS.accent },
            },
            tooltipConfig: {
              style: {
                backgroundColor: "var(--surface-deep)",
                color: HERO_COLORS.light,
              },
            },
          }}
        >
          <CanvasSectionTracker />
          <ChessLandingSection offset={coordinates.home} />
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
