import { coordinates } from "../constants/coordinates";
import ChessSection from "./ChessSection";
import GallerySection from "./GallerySection";
import ProjectsSection from "./ProjectsSection";

export default function DeferredCanvasSections() {
  return (
    <>
      <GallerySection offset={coordinates.gallery} />
      <ChessSection offset={coordinates.chess} />
      <ProjectsSection offset={coordinates.projects} />
    </>
  );
}
