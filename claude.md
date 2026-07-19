# Personal Website - Claude Code Guidelines

## Project Overview

Hunter Chen's personal website built with the `@hunterchen/canvas` library.

**Framework:** Vite + React 19, with `src/main.tsx` loading `src/App.tsx`
**Styling:** Tailwind CSS v3 (shadcn-style HSL variable tokens in `tailwind.config.ts`)
**Canvas Library:** `@hunterchen/canvas`

## Development Workflow

**IMPORTANT:**
- Work with the existing `npm run dev` process and Vite hot reload
- Use hot reload for development feedback
- Run `npx tsc --noEmit` for type checking
- Available npm scripts are `dev`, `build`, and `preview`

## Project Structure

```
src/
├── App.tsx              # Main app: Canvas setup, gradients, navbar/toolbar styles
├── main.tsx             # Entry point
├── components/
│   ├── HeroSection.tsx      # + hero/ (cards.tsx, FlipCard, FunCard, ContactCard, ProjectsCard)
│   ├── ProjectsSection.tsx  # + projects/ (DraggableWindow, ProjectBentoCard, projects.tsx)
│   ├── ChessSection.tsx     # + chess/ (ChessBoard, Confetti, PromotionPicker, ...)
│   ├── GallerySection.tsx   # polaroid gallery with film-reveal/holo effects
│   ├── Modal.tsx, AnimatedLink.tsx, HintSvg.tsx, ReaderContent.tsx
├── constants/
│   └── coordinates.ts   # Canvas layout & nav items
└── styles/
    └── globals.css      # Tailwind + theme variables + canvas overrides + effect keyframes
```

Canvas sections rendered in `App.tsx`: Hero, Gallery, Chess, Projects.

## Theming — read this before restyling

The theme spans several layers. A full re-theme covers all of these:

1. **`src/styles/globals.css`**
   - shadcn-style HSL tokens (`--background`, `--foreground`, `--primary`, ...) inside `@layer base`
   - `--canvas-*` overrides for the canvas library (navbar/toolbar colors), placed at the top
     level so they take precedence over the library defaults
   - scrollbar, scanline/VHS, film-reveal, and holo effect styles with hardcoded rgba colors
2. **`src/App.tsx`** — `CANVAS_GRADIENT` (main background radial), `DOT_COLOR` + `dotOpacity`,
   and inline `toolbarConfig`/`navbarConfig` style hexes
3. **`tailwind.config.ts`** — `neon-pulse` and holo keyframes contain hardcoded rgba glows
4. **~17 component files** carry Tailwind color classes (historically `fuchsia-*`/`purple-*`
   with opacity suffixes) and hex/rgba literals. Hotspots:
   - `hero/cards.tsx` + `projects/projects.tsx` — shared card radial-gradient constants
   - `projects/DraggableWindow.tsx` — window chrome bg/border/glow
   - `ChessSection.tsx` + `chess/ChessBoard.tsx` — board square colors, highlight rgba values
   - `HintSvg.tsx` — animated SVG gradient constants for handwritten hints
   - `GallerySection.tsx`, `ContactSection.tsx`, `Modal.tsx`, `chess/Confetti.tsx`
5. Preserve the theme-independent semantic colors (red capture/error highlights) and neutral
   blacks/whites used for shadows, polaroid frames, and photo overlays.

Design constraint from Hunter: purple stays the site's identity. Use neutralized body text,
controlled surface saturation, and deliberate purple accents. Maintain distinct value bands for
the background, cards, and text so the composition retains depth and visual hierarchy.

## Section Components

Each section receives full width/height from CanvasComponent. They should:
- Use `h-full w-full` to fill the container
- Handle their own internal layout
- Use the theme's color variables where appropriate
