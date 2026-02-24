import { useState, useEffect } from "react";
import {
  Canvas,
  DefaultCanvasBackground,
  canvasWidth,
  canvasHeight,
} from "@hunterchen/canvas";
import { coordinates, navItems } from "./constants/coordinates";
import HeroSection from "./components/HeroSection";
import ProjectsSection from "./components/ProjectsSection";
import GallerySection from "./components/GallerySection";
import ChessSection from "./components/ChessSection";
import { motion, AnimatePresence } from "framer-motion";

// Canvas gradient - warm purple radial emanating from bottom
const CANVAS_GRADIENT = `radial-gradient(ellipse ${canvasWidth}px ${canvasHeight}px at ${canvasWidth / 2}px ${canvasHeight}px, #150f1d 0%, #2a1f3d 30%, #3e2d55 55%, #150f1d 100%)`;

// Dot color (warm purple highlight)
const DOT_COLOR = "#7a5a99";

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
      <AnimatePresence>
        {showClickMe && (
          <motion.img
            key="clickme-nav"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3, ease: "easeInOut" } }}
            transition={{ delay: 1.4, duration: 0.5, ease: "easeInOut" }}
            src="/clickme_nav.svg"
            alt=""
            className="pointer-events-none fixed bottom-[49px] left-[55%] scale-[150%] z-[999] hidden -translate-x-1/2 md:block"
          />
        )}
      </AnimatePresence>
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
            backgroundColor: "#1a1520",
            borderColor: "#3e2d55",
            color: "#ede8f2",
          },
        }}
        navbarConfig={{
          style: {
            backgroundColor: "#1a1520",
            borderColor: "#3e2d55",
          },
          buttonConfig: {
            style: { color: "#9580a8" },
            hoverStyle: { backgroundColor: "#271f30" },
            activeStyle: { backgroundColor: "#3d2a50" },
            labelStyle: { color: "#c084fc" },
          },
          tooltipConfig: {
            style: { backgroundColor: "#1a1520", color: "#ede8f2" },
          },
        }}
      >
        <HeroSection offset={coordinates.hero} />
        <ProjectsSection offset={coordinates.projects} />
        <GallerySection offset={coordinates.gallery} />
        <ChessSection offset={coordinates.chess} />
      </Canvas>
    </main>
  );
}
