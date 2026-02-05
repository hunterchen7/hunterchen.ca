import type { SectionCoordinates, NavItem } from "@hunterchen/canvas";

/**
 * Canvas Layout (6000 x 4000):
 *
 *      [About]         [Projects]
 *
 *              [Hero]
 *
 *      [Gallery]       [Contact]
 *
 * Grid layout with Hero centered, 2 sections top, 2 sections bottom
 */

// Layout constants
const SECTION_WIDTH = 900;
const SECTION_HEIGHT = 700;

// Canvas dimensions
const CANVAS_WIDTH = 6000;
const CANVAS_HEIGHT = 4000;

// Space-around: generous margins and gaps to use the full canvas
const HORIZONTAL_MARGIN = 1400; // Distance from canvas edge (200px closer to center)
const VERTICAL_MARGIN = 500; // Distance from canvas edge
const VERTICAL_GAP = 450; // Gap between rows

// Calculate positions (spread across canvas)
const LEFT_X = HORIZONTAL_MARGIN;
const RIGHT_X = CANVAS_WIDTH - HORIZONTAL_MARGIN - SECTION_WIDTH; // 3700
const TOP_Y = VERTICAL_MARGIN;
const MIDDLE_Y = TOP_Y + SECTION_HEIGHT + VERTICAL_GAP; // 1650
const BOTTOM_Y = MIDDLE_Y + SECTION_HEIGHT + VERTICAL_GAP; // 2900

export const coordinates = {
  hero: {
    x: CANVAS_WIDTH / 2 - SECTION_WIDTH / 2, // Centered horizontally
    y: MIDDLE_Y,
    width: SECTION_WIDTH,
    height: SECTION_HEIGHT,
  },
  about: {
    x: LEFT_X,
    y: TOP_Y,
    width: SECTION_WIDTH,
    height: SECTION_HEIGHT,
  },
  projects: {
    x: RIGHT_X,
    y: TOP_Y,
    width: 1200,
    height: SECTION_HEIGHT,
  },
  gallery: {
    x: LEFT_X,
    y: BOTTOM_Y,
    width: SECTION_WIDTH,
    height: SECTION_HEIGHT,
  },
  contact: {
    x: RIGHT_X,
    y: BOTTOM_Y,
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
    id: "about",
    label: "About",
    icon: "User",
    ...coordinates.about,
  },
  {
    id: "projects",
    label: "Projects",
    icon: "Code",
    ...coordinates.projects,
  },
  {
    id: "gallery",
    label: "Gallery",
    icon: "Camera",
    ...coordinates.gallery,
  },
  {
    id: "contact",
    label: "Contact",
    icon: "Mail",
    ...coordinates.contact,
  },
];
