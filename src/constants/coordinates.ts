import type { SectionCoordinates, NavItem } from "@hunterchen/canvas";
import { ChessKnight } from "lucide-react";

/**
 * Canvas Layout (6000 x 4000):
 *
 *              [About]
 *
 *              [Hero]
 *
 *      [Gallery]       [Projects]
 *
 * Grid layout with Hero and About centered vertically, Gallery and Projects at bottom
 */

// Layout constants
const SECTION_WIDTH = 900;
const SECTION_HEIGHT = 700;

export const coordinates = {
  hero: {
    x: 1200, // Centered horizontally
    y: 800,
    width: 1000,
    height: 900,
  },

  projects: {
    x: 1100,
    y: 2340,
    width: 1200,
    height: 800,
  },
  chess: {
    x: 3600,
    y: 700,
    width: 1200,
    height: 1200,
  },
  gallery: {
    x: 3800,
    y: 2400,
    width: SECTION_WIDTH,
    height: SECTION_HEIGHT,
  },
} as const satisfies Record<string, SectionCoordinates>;

export const navItems: NavItem[] = [
  {
    id: "hero",
    label: "Home",
    icon: "Home",
    ...coordinates.hero,
    isHome: true,
  },
  {
    id: "projects",
    label: "Projects",
    icon: "Code",
    ...coordinates.projects,
  },
  { id: "chess", label: "Chess", icon: ChessKnight, ...coordinates.chess },
  {
    id: "gallery",
    label: "Gallery",
    icon: "Camera",
    ...coordinates.gallery,
  },
];
