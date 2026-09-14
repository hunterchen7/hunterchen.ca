import { coordinates } from "../constants/coordinates";
import GallerySection from "./GallerySection";
import HeroSection from "./HeroSection";
import ProjectsSection from "./ProjectsSection";

export default function DeferredCanvasSections() {
  return (
    <>
      <GallerySection offset={coordinates.gallery} />
      <HeroSection offset={coordinates.about} />
      <ProjectsSection offset={coordinates.projects} />
    </>
  );
}
