# Personal Website - Claude Code Guidelines

## Project Overview

Hunter Chen's personal website built with the `@hunterchen/canvas` library.

**Framework:** Next.js 15 (Pages Router)
**Styling:** Tailwind CSS v3
**Canvas Library:** `@hunterchen/canvas` (linked from parent repo)

## Development Workflow

**IMPORTANT:**
- Assume `npm run dev` is always running
- **DO NOT run `npm run build`** - use hot reload instead
- For type checking, run `npx tsc --noEmit`
- For linting, run `npm run lint`

## Project Structure

```
src/
├── components/          # Section components
│   ├── HeroSection.tsx
│   ├── AboutSection.tsx
│   ├── ProjectsSection.tsx
│   ├── GallerySection.tsx
│   ├── ContactSection.tsx
│   └── Modal.tsx
├── constants/
│   └── coordinates.ts   # Canvas layout & nav items
├── pages/
│   ├── _app.tsx         # App wrapper with PerformanceProvider
│   └── index.tsx        # Main page with Canvas
└── styles/
    └── globals.css      # Tailwind + theme variables
```

## Theming

### Current Theme: Deep Violet

The theme is configured in two places:

1. **globals.css** - CSS variables for navbar/toolbar:
   - `--canvas-offwhite` - navbar/toolbar background
   - `--canvas-highlight` - hover states
   - `--canvas-emphasis` - active accent color
   - `--canvas-medium` - icon color
   - `--canvas-light` - separator color
   - `--canvas-heavy` - text color

2. **index.tsx** - Canvas gradients:
   - `CANVAS_GRADIENT` - main background radial gradient
   - `INTRO_GRADIENT` - loading screen gradient
   - `BOX_GRADIENT` - intro animation box
   - `DOT_COLOR` - dot pattern color

### Changing Themes

To switch themes, update both files with the new color values. Available theme presets:

- **Deep Violet** (current): `#1a1625` base, elegant purple
- **Cosmic Purple**: `#0d0a14` base, space-inspired darker
- **Amethyst Glow**: `#150f1d` base, warmer magenta tones

## Canvas Configuration

### Coordinates (coordinates.ts)

Canvas is 6000x4000. Sections are positioned:
```
        [About]
           \
  [Gallery] - [Hero] - [Projects]
                |
            [Contact]
```

### Customizable Props

- `introBackgroundGradient` - loading screen background
- `canvasBoxGradient` - intro animation box
- `canvasBackground` - main canvas (use DefaultCanvasBackground)
- `wrapperBackground` - intro wrapper (use DefaultWrapperBackground)
- `toolbarConfig` - position, style, display mode
- `introContent` - custom loading content
- `loadingText` - text shown during load

## Section Components

Each section receives full width/height from CanvasComponent. They should:
- Use `h-full w-full` to fill the container
- Handle their own internal layout
- Use the theme's color variables where appropriate
