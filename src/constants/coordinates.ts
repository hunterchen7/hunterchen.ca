import type { SectionCoordinates, NavItem } from "@hunterchen/canvas";
// Passed as components, not names. The canvas library resolves a string icon by
// dynamically importing the whole lucide barrel and indexing it, which pulls the
// entire icon set (~526 kB) at runtime; handing it the component skips that.
import { Camera, Folders, Home, Info } from "lucide-react";

/**
 * Canvas Layout (7000 x 4000 — width set via CANVAS_WIDTH in App.tsx):
 *
 *      [Home: play chess]            [About: who I am]
 *
 *          [Projects]                    [Gallery]
 *
 * `home` is the landing: the playable isometric board. `about` holds the card
 * grid that used to be the landing.
 */

// Layout constants
const SECTION_WIDTH = 900;
const SECTION_HEIGHT = 700;

// All sections are shifted +700 to the right of their original x so the default
// (hero-centered) viewport keeps enough virtual canvas to its left and no longer
// reveals the off-canvas area on wide screens. Rightmost edge (chess) is 4300 +
// 1200 = 5500, leaving ~1500px of open space on the right of the 7000-wide canvas.
export const coordinates = {
  home: {
    // The canvas shows the home section at zoom 1, centred, so one unit here is
    // one CSS pixel of viewport. The section is sized past any common desktop
    // viewport; the landing lays its board out in a band the size of the
    // viewport in the middle of it, so the board fills whatever screen it is
    // on rather than a fixed box.
    x: 1550,
    y: 700,
    width: 1700,
    height: 1500,
  },

  projects: {
    x: 1800,
    y: 2340,
    width: 1200,
    height: 1000,
  },
  about: {
    x: 4300,
    y: 700,
    width: 1200,
    height: 1200,
  },
  gallery: {
    x: 4500,
    y: 2400,
    width: SECTION_WIDTH,
    height: SECTION_HEIGHT,
  },
} as const satisfies Record<string, SectionCoordinates>;

export const navItems: NavItem[] = [
  {
    id: "home",
    label: "Home",
    icon: Home,
    ...coordinates.home,
    isHome: true,
  },
  {
    id: "projects",
    label: "Projects",
    icon: Folders,
    ...coordinates.projects,
  },
  { id: "about", label: "About", icon: Info, ...coordinates.about },
  {
    id: "gallery",
    label: "Gallery",
    icon: Camera,
    ...coordinates.gallery,
  },
];
