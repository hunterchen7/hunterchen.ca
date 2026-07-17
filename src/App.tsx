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

// Deep amethyst canvas with a softer, warmer center bloom.
const CANVAS_GRADIENT = `radial-gradient(ellipse ${canvasWidth}px ${canvasHeight}px at ${canvasWidth / 2}px ${canvasHeight}px, var(--canvas-bg-deep) 0%, var(--canvas-bg-mid) 30%, var(--canvas-bg-bloom) 55%, var(--canvas-bg-deep) 100%)`;

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
    <main id="home" className="relative min-h-screen">
      <ReaderContent />
      <HintSvg
        variant="nav"
        show={showClickMe}
        enterDelay={HERO_SEQUENCE_END}
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
            backgroundColor: "#19131f",
            borderColor: "#4b315e",
            color: "#f3edf6",
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
            backgroundColor: "#19131f",
            borderColor: "#4b315e",
          },
          buttonConfig: {
            style: { color: "#a58eaf" },
            hoverStyle: { backgroundColor: "#261c30" },
            activeStyle: { backgroundColor: "#392448" },
            labelStyle: { color: "#d092ff" },
          },
          tooltipConfig: {
            style: { backgroundColor: "#19131f", color: "#f3edf6" },
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
