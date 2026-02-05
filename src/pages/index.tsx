import Head from "next/head";
import { useState } from "react";
import {
  Canvas,
  DefaultCanvasBackground,
  DefaultIntroContent,
  DefaultWrapperBackground,
  canvasWidth,
  canvasHeight,
  GROW_TRANSITION,
  BLUR_TRANSITION,
} from "@hunterchen/canvas";
import { coordinates, navItems } from "../constants/coordinates";
import HeroSection from "../components/HeroSection";
import AboutSection from "../components/AboutSection";
import ProjectsSection from "../components/ProjectsSection";
import GallerySection from "../components/GallerySection";
import ContactSection from "../components/ContactSection";
import { motion } from "framer-motion";
import StyledGitMosaic from "~/components/StyledGitMosaic";

// Canvas gradient - warm purple radial emanating from bottom
const CANVAS_GRADIENT = `radial-gradient(ellipse ${canvasWidth}px ${canvasHeight}px at ${canvasWidth / 2}px ${canvasHeight}px, #150f1d 0%, #2a1f3d 30%, #3e2d55 55%, #150f1d 100%)`;

// Intro screen gradient
const INTRO_GRADIENT =
  "linear-gradient(to top, #150f1d 0%, #2a1f3d 40%, #4a3660 100%)";

// Intro box gradient
const BOX_GRADIENT =
  "radial-gradient(130.38% 95% at 50.03% 97.25%, #2a1f3d 0%, #3e2d55 48.09%, #5a4270 100%)";

// Dot color (warm purple highlight)
const DOT_COLOR = "#7a5a99";

export default function Home() {
  const [showMosaic, setShowMosaic] = useState(true);

  return (
    <>
      <Head>
        <title>Hunter Chen</title>
        <meta name="description" content="Hunter Chen - Software Developer" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main id="home" className="relative min-h-screen">
        <Canvas
          homeCoordinates={coordinates.hero}
          navItems={navItems}
          introBackgroundGradient={INTRO_GRADIENT}
          canvasBoxGradient={BOX_GRADIENT}
          introContent={
            <DefaultIntroContent
              title="HUNTER CHEN"
              titleClassName="text-fuchsia-300"
            />
          }
          loadingText=""
          canvasBackground={
            <DefaultCanvasBackground
              gradientStyle={CANVAS_GRADIENT}
              dotColor={DOT_COLOR}
              dotOpacity={0.38}
            />
          }
          wrapperBackground={
            <DefaultWrapperBackground gradient={INTRO_GRADIENT} />
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
          growTransition={{
            ...GROW_TRANSITION,
            delay: GROW_TRANSITION.delay + 2,
          }}
          blurTransition={{
            ...BLUR_TRANSITION,
            duration: BLUR_TRANSITION.duration + 2,
          }}
        >
          <HeroSection offset={coordinates.hero} />
          <AboutSection offset={coordinates.about} />
          <ProjectsSection offset={coordinates.projects} />
          <GallerySection offset={coordinates.gallery} />
          <ContactSection offset={coordinates.contact} />
        </Canvas>

        {showMosaic && (
          <motion.div
            className="pointer-events-none fixed inset-0 z-[1000] flex items-center justify-center md:pt-10"
            initial={{ opacity: 1, scale: 0.25, y: "33vh" }}
            animate={{
              opacity: [1, 1, 1, 1, 0],
              scale: [0.25, 0.25, 1, 1, 1],
              y: ["37vh", "37vh", "0vh", "0vh", "0vh"],
            }}
            transition={{
              duration: 10,
              times: [0, 0.6, 0.7, 0.8, 1],
              ease: [0.65, 0, 0.35, 1],
            }}
            onAnimationComplete={() => setShowMosaic(false)}
          >
            <StyledGitMosaic />
          </motion.div>
        )}
      </main>
    </>
  );
}
