import Head from "next/head";
import {
  Canvas,
  DefaultCanvasBackground,
  DefaultIntroContent,
  DefaultWrapperBackground,
  canvasWidth,
  canvasHeight,
} from "@hunterchen/canvas";
import { coordinates, navItems } from "../constants/coordinates";
import HeroSection from "../components/HeroSection";
import AboutSection from "../components/AboutSection";
import ProjectsSection from "../components/ProjectsSection";
import GallerySection from "../components/GallerySection";
import ContactSection from "../components/ContactSection";
import GitMosaicOverlay from "../components/GitMosaicOverlay";

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
          loadingText="LOADING"
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
        >
          <HeroSection offset={coordinates.hero} />
          <AboutSection offset={coordinates.about} />
          <ProjectsSection offset={coordinates.projects} />
          <GallerySection offset={coordinates.gallery} />
          <ContactSection offset={coordinates.contact} />
        </Canvas>
        <GitMosaicOverlay />
      </main>
    </>
  );
}
