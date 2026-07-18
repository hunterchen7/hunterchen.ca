import { useState, useEffect } from "react";
import {
  Canvas,
  DefaultCanvasBackground,
  canvasWidth,
  canvasHeight,
  ScreenSizeEnum,
} from "@hunterchen/canvas";
import { coordinates, navItems } from "./constants/coordinates";
import HeroSection from "./components/HeroSection";
import ProjectsSection from "./components/ProjectsSection";
import GallerySection from "./components/GallerySection";
import ChessSection from "./components/ChessSection";
import HintSvg from "./components/HintSvg";
import ReaderContent from "./components/ReaderContent";
import { HERO_SEQUENCE_END } from "./components/HeroSection";
import {
  HERO_COLORS,
  HERO_THEME_STYLE,
  heroRgba,
} from "./components/hero/heroPalette";

// Canvas spotlight - circular bloom at canvas center, falling off outward
const CANVAS_GRADIENT = `radial-gradient(circle ${canvasWidth / 2}px at ${canvasWidth / 2}px ${canvasHeight / 2}px, var(--canvas-bg-bloom) 0%, var(--canvas-bg-mid) 40%, var(--canvas-bg-deep) 85%)`;

// Dot color (warm purple highlight)
const DOT_COLOR = "var(--canvas-dot)";

export default function App() {
  const [showClickMe, setShowClickMe] = useState(true);

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
    <main
      id="home"
      className="relative min-h-screen"
      style={HERO_THEME_STYLE}
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
        <HeroSection offset={coordinates.hero} />
        <GallerySection offset={coordinates.gallery} />
        <ChessSection offset={coordinates.chess} />
        <ProjectsSection offset={coordinates.projects} />
      </Canvas>
    </main>
  );
}
