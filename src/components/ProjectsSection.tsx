import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Github, ExternalLink, Link as LinkIcon } from "lucide-react";
import { CanvasComponent, type SectionCoordinates } from "@hunterchen/canvas";
import ProjectBentoCard from "./projects/ProjectBentoCard";
import DraggableWindow from "./projects/DraggableWindow";
import HintSvg from "./HintSvg";
import {
  type Project,
  featuredProjects,
  otherProjects,
  GRID_AREAS,
  MORE_GRID_AREA,
  PROJECTS_GRADIENT,
} from "./projects/projects";

interface ProjectsSectionProps {
  offset: SectionCoordinates;
}

const CARD_STAGGER = 0.15;
const MORE_WINDOW_ID = "__more__";

type WindowEntry =
  | {
      type: "project";
      project: Project;
      pos: { x: number; y: number };
      order: number;
      showDragHint?: boolean;
    }
  | {
      type: "more";
      pos: { x: number; y: number };
      order: number;
      showDragHint?: boolean;
    };

// --- Project detail content (rendered inside DraggableWindow) ---
function ProjectContent({ project }: { project: Project }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    videoRef.current?.play().catch(() => {});
  }, []);

  const linkClass =
    "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-transform hover:scale-105";

  return (
    <div className="p-4 space-y-3 cursor-auto">
      {/* Video/Image */}
      {project.video ? (
        <video
          ref={videoRef}
          src={project.video}
          className="w-full rounded-lg bg-black/60"
          style={{ maxHeight: 450 }}
          muted
          loop
          playsInline
        />
      ) : project.images && project.images[0] ? (
        <img
          src={project.images[0]}
          alt={project.title}
          className="w-full rounded-lg bg-black/60 object-contain"
          style={{ maxHeight: 450 }}
        />
      ) : null}

      {/* Description */}
      <div className="text-sm text-neutral-300/90 leading-relaxed select-text cursor-text">
        {project.description}
      </div>

      {/* Tech tags */}
      <div className="flex flex-wrap gap-1.5">
        {project.tech.map((t) => (
          <span
            key={t}
            className="rounded-full bg-fuchsia-950/40 px-2.5 py-0.5 text-xs text-fuchsia-300/60"
          >
            {t}
          </span>
        ))}
      </div>

      {/* Links */}
      <div className="flex gap-1.5 flex-wrap">
        {project.github && (
          <a
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            className={`${linkClass} bg-neutral-800/60 text-neutral-300 hover:bg-neutral-700/60`}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Github className="h-3 w-3" />
            Code
          </a>
        )}
        {project.demo && (
          <a
            href={project.demo}
            target="_blank"
            rel="noopener noreferrer"
            className={`${linkClass} bg-violet-950/50 text-violet-300/80 hover:bg-violet-900/50`}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3 w-3" />
            Demo
          </a>
        )}
        {project.otherUrl && (
          <a
            href={project.otherUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${linkClass} bg-fuchsia-950/40 text-fuchsia-300/70 hover:bg-fuchsia-900/50`}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <LinkIcon className="h-3 w-3" />
            More
          </a>
        )}
      </div>
    </div>
  );
}

// --- More projects list content (rendered inside DraggableWindow) ---
function MoreProjectsContent({
  projects,
  onProjectClick,
}: {
  projects: Project[];
  onProjectClick: (project: Project) => void;
}) {
  return (
    <>
      {projects.map((project, idx) => {
        const thumb =
          project.thumbnailImage || (project.images && project.images[0]);
        const video = project.thumbnailVideo || project.video;
        const thumbnailEl = video ? (
          <video
            src={video}
            className="w-[266px] h-[200px] rounded-lg object-cover flex-shrink-0 bg-black/40 border border-fuchsia-400/20"
            muted
            loop
            playsInline
            autoPlay
          />
        ) : thumb ? (
          <img
            src={thumb}
            alt={project.title}
            className="w-[266px] h-[200px] rounded-lg object-cover flex-shrink-0 bg-black/40 border border-fuchsia-400/20"
            draggable={false}
          />
        ) : (
          <div className="w-[266px] h-[200px] rounded-lg bg-fuchsia-950/40 flex-shrink-0 border border-fuchsia-400/20" />
        );

        const rowBg =
          idx % 2 === 0 ? "bg-[#1e1a28]/40" : "bg-neutral-800/[0.35]";

        return (
          <div
            key={project.id}
            onClick={() => onProjectClick(project)}
            className={`flex items-center gap-3 px-4 py-3 border-b border-fuchsia-300/10 cursor-pointer hover:bg-fuchsia-500/[0.06] transition-colors ${rowBg}`}
          >
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-medium text-neutral-200 truncate">
                {project.title}
              </h4>
              <p className="text-sm text-neutral-500 line-clamp-2 mt-0.5">
                {project.overview}
              </p>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {project.tech.slice(0, 3).map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-fuchsia-950/40 px-2 py-0.5 text-xs text-fuchsia-300/50"
                  >
                    {t}
                  </span>
                ))}
                {project.tech.length > 3 && (
                  <span className="rounded-full bg-fuchsia-950/40 px-2 py-0.5 text-xs text-fuchsia-300/50">
                    +{project.tech.length - 3}
                  </span>
                )}
              </div>
            </div>
            {thumbnailEl}
          </div>
        );
      })}
    </>
  );
}

// --- "More projects" bento tile ---
function MoreProjectsTile({
  count,
  gridArea,
  gridMouse,
  gridRef,
  onClick,
  animationDelay,
}: {
  count: number;
  gridArea: string;
  gridMouse: { x: number; y: number } | null;
  gridRef: React.RefObject<HTMLDivElement | null>;
  onClick: () => void;
  animationDelay: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState<{
    offsetLeft: number;
    offsetTop: number;
    gridWidth: number;
    gridHeight: number;
  } | null>(null);
  const lastGlowPos = useRef({ localX: 0, localY: 0 });

  const boundsCallback = useCallback(
    (el: HTMLDivElement | null) => {
      cardRef.current = el;
      if (!el || !gridRef.current) return;

      const update = () => {
        const gridEl = gridRef.current;
        if (!gridEl || !el) return;
        const cardRect = el.getBoundingClientRect();
        const gridRect = gridEl.getBoundingClientRect();
        const scaleX = gridEl.offsetWidth / gridRect.width;
        const scaleY = gridEl.offsetHeight / gridRect.height;
        setBounds({
          offsetLeft: (cardRect.left - gridRect.left) * scaleX,
          offsetTop: (cardRect.top - gridRect.top) * scaleY,
          gridWidth: gridEl.offsetWidth,
          gridHeight: gridEl.offsetHeight,
        });
      };

      update();
      const ro = new ResizeObserver(update);
      ro.observe(gridRef.current);
      return () => ro.disconnect();
    },
    [gridRef],
  );

  const sharedBg = bounds
    ? {
        background: PROJECTS_GRADIENT,
        backgroundSize: `${bounds.gridWidth}px ${bounds.gridHeight}px`,
        backgroundPosition: `${-bounds.offsetLeft}px ${-bounds.offsetTop}px`,
      }
    : { background: "#3d1a50" };

  const localX = bounds && gridMouse ? gridMouse.x - bounds.offsetLeft : 0;
  const localY = bounds && gridMouse ? gridMouse.y - bounds.offsetTop : 0;
  if (bounds && gridMouse) lastGlowPos.current = { localX, localY };
  const glowPos = lastGlowPos.current;
  const radialGlow = `radial-gradient(600px circle at ${glowPos.localX}px ${glowPos.localY}px, rgba(255, 255, 255, 0.022), transparent 40%)`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay: animationDelay,
        type: "spring",
        stiffness: 130,
        damping: 17,
      }}
      style={{ gridArea }}
      className="min-h-0 min-w-0"
    >
      <div
        ref={boundsCallback}
        onClick={onClick}
        className="group relative w-full h-full border border-fuchsia-300/30 rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 ease-out hover:brightness-105 hover:scale-[1.01] flex items-center justify-center"
        style={sharedBg}
      >
        <div
          className="absolute inset-0 transition-opacity duration-500 pointer-events-none"
          style={{ opacity: gridMouse ? 1 : 0, background: radialGlow }}
        />
        <div className="relative">
          <div className="absolute -top-2 -left-1 w-16 h-20 rounded-lg border border-fuchsia-500/20 bg-fuchsia-900/30 rotate-[-6deg]" />
          <div className="absolute -top-1 left-0 w-16 h-20 rounded-lg border border-fuchsia-500/20 bg-fuchsia-900/40 rotate-[-3deg]" />
          <div className="relative w-16 h-20 rounded-lg border border-fuchsia-500/30 bg-fuchsia-900/50 flex items-center justify-center">
            <span className="text-fuchsia-200 text-lg font-light">
              +{count}
            </span>
          </div>
        </div>
        <p className="absolute bottom-3 left-0 right-0 text-center text-[10px] text-fuchsia-300/70">
          more projects
        </p>
      </div>
    </motion.div>
  );
}

// --- Random position with overlap check ---
function getOverlapFraction(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
): number {
  const overlapX = Math.max(
    0,
    Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x),
  );
  const overlapY = Math.max(
    0,
    Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y),
  );
  const overlapArea = overlapX * overlapY;
  const smallerArea = Math.min(a.w * a.h, b.w * b.h);
  return smallerArea > 0 ? overlapArea / smallerArea : 0;
}

function randomWindowPos(
  sectionW: number,
  sectionH: number,
  winW: number,
  winH: number,
  existing: Map<string, WindowEntry>,
  maxAttempts = 20,
): { x: number; y: number } {
  const pad = 20;
  const maxX = Math.max(pad, sectionW - winW - pad);
  const maxY = Math.max(pad, sectionH - winH - pad);

  for (let i = 0; i < maxAttempts; i++) {
    const x = pad + Math.random() * (maxX - pad);
    const y = pad + Math.random() * (maxY - pad);
    const candidate = { x, y, w: winW, h: winH };

    let tooMuchOverlap = false;
    for (const entry of existing.values()) {
      const ew = entry.type === "more" ? 900 : 880;
      const eh = entry.type === "more" ? 800 : 600;
      const overlap = getOverlapFraction(candidate, {
        x: entry.pos.x,
        y: entry.pos.y,
        w: ew,
        h: eh,
      });
      if (overlap > 0.9) {
        tooMuchOverlap = true;
        break;
      }
    }
    if (!tooMuchOverlap) return { x, y };
  }

  // Fallback: return last attempt
  return {
    x: pad + Math.random() * (maxX - pad),
    y: pad + Math.random() * (maxY - pad),
  };
}

// --- Main section ---
export default function ProjectsSection({ offset }: ProjectsSectionProps) {
  const [windows, setWindows] = useState<Map<string, WindowEntry>>(new Map());
  const [hasClicked, setHasClicked] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const orderRef = useRef(0);
  const hasShownDragHint = useRef(false);
  const hasEverDragged = useRef(false);

  // Grid mouse tracking
  const gridRef = useRef<HTMLDivElement>(null);
  const [gridMouse, setGridMouse] = useState<{ x: number; y: number } | null>(
    null,
  );

  const handleGridMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const grid = gridRef.current;
      if (!grid) return;
      const rect = grid.getBoundingClientRect();
      const scaleX = grid.offsetWidth / rect.width;
      const scaleY = grid.offsetHeight / rect.height;
      setGridMouse({
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      });
    },
    [],
  );

  // Track wrapper elements so we can bring-to-front via DOM without re-render
  const windowElsRef = useRef<Map<string, HTMLDivElement>>(new Map());

  const openProjectWindow = useCallback((project: Project) => {
    setHasClicked(true);
    // Read ref outside updater — strict mode double-invokes updaters,
    // so mutating refs inside would cause the second run to see stale values.
    const isFirst = !hasShownDragHint.current;
    hasShownDragHint.current = true;

    setWindows((prev) => {
      if (prev.has(project.id)) {
        // Already open — bring to front via DOM
        const el = windowElsRef.current.get(project.id);
        if (el) {
          orderRef.current++;
          el.style.zIndex = String(orderRef.current);
        }
        return prev;
      }
      const next = new Map(prev);
      const el = sectionRef.current;
      const sW = el?.offsetWidth ?? 1200;
      const sH = el?.offsetHeight ?? 1000;
      const pos = randomWindowPos(sW, sH, 880, 600, prev);
      pos.y = Math.max(20, pos.y - 100);

      orderRef.current++;
      next.set(project.id, {
        type: "project",
        project,
        pos,
        order: orderRef.current,
        showDragHint: isFirst,
      });
      return next;
    });
  }, []);

  const openMoreWindow = useCallback(() => {
    setHasClicked(true);
    const isFirst = !hasShownDragHint.current;
    hasShownDragHint.current = true;

    setWindows((prev) => {
      if (prev.has(MORE_WINDOW_ID)) {
        const el = windowElsRef.current.get(MORE_WINDOW_ID);
        if (el) {
          orderRef.current++;
          el.style.zIndex = String(orderRef.current);
        }
        return prev;
      }
      const next = new Map(prev);
      const el = sectionRef.current;
      const sW = el?.offsetWidth ?? 1200;
      const sH = el?.offsetHeight ?? 1000;
      const pos = randomWindowPos(sW, sH, 900, 800, prev);
      // Push the taller window higher so it doesn't hang off the bottom
      pos.y = Math.min(pos.y, -40);

      orderRef.current++;
      next.set(MORE_WINDOW_ID, {
        type: "more",
        pos,
        order: orderRef.current,
        showDragHint: isFirst,
      });
      return next;
    });
  }, []);

  const closeWindow = useCallback((id: string) => {
    // Remove from ref map immediately so Escape doesn't target the exiting window
    windowElsRef.current.delete(id);
    setWindows((prev) => {
      const entry = prev.get(id);
      // If the hinted window closes before the user ever dragged, allow the
      // next window to show the hint again.
      if (entry?.showDragHint && !hasEverDragged.current) {
        hasShownDragHint.current = false;
      }
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  // Bring window to front on any interaction — native listener avoids
  // interfering with Draggable's gesture system
  const makeWindowRef = useCallback(
    (id: string) => (el: HTMLDivElement | null) => {
      if (!el) {
        windowElsRef.current.delete(id);
        return;
      }
      windowElsRef.current.set(id, el);
      el.addEventListener(
        "pointerdown",
        () => {
          orderRef.current++;
          el.style.zIndex = String(orderRef.current);
        },
        true,
      );
    },
    [],
  );

  // Escape closes the topmost window (highest z-index from DOM)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      let topId: string | null = null;
      let topZ = -1;
      for (const [id, el] of windowElsRef.current) {
        const z = parseInt(el.style.zIndex || "0", 10);
        if (z > topZ) {
          topZ = z;
          topId = id;
        }
      }
      if (topId) closeWindow(topId);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeWindow]);

  return (
    <CanvasComponent offset={offset}>
      <div
        ref={sectionRef}
        className="relative flex h-full w-full flex-col items-center justify-center p-8"
      >
        <h2 className="mb-2 text-3xl font-thin text-fuchsia-200">projects</h2>
        <p className="mb-4 text-sm text-fuchsia-300/60">
          a compilation of some things i've worked on..
        </p>

        {/* Click me hint */}
        <div className="relative w-full max-w-[850px]">
          <div className="pointer-events-none absolute -top-14 left-0 z-10 scale-[150%]">
            <HintSvg
              variant="projects"
              show={!hasClicked}
              enterDelay={featuredProjects.length * CARD_STAGGER + 0.5}
            />
          </div>
        </div>

        {/* Bento Grid */}
        <div
          ref={gridRef}
          onMouseMove={handleGridMouseMove}
          onMouseLeave={() => setGridMouse(null)}
          className="grid grid-cols-3 grid-rows-4 gap-3 w-full max-w-[850px]"
          style={{ height: 850 }}
        >
          {featuredProjects.map((project, idx) => (
            <ProjectBentoCard
              key={project.id}
              project={project}
              gridArea={GRID_AREAS[idx]!}
              gridMouse={gridMouse}
              gridRef={gridRef}
              onClick={() => openProjectWindow(project)}
              animationDelay={idx * CARD_STAGGER}
            />
          ))}
          <MoreProjectsTile
            count={otherProjects.length}
            gridArea={MORE_GRID_AREA}
            gridMouse={gridMouse}
            gridRef={gridRef}
            onClick={openMoreWindow}
            animationDelay={featuredProjects.length * CARD_STAGGER}
          />
        </div>

        {/* Floating windows layer — all windows in one list for unified z-index */}
        <div className="absolute inset-0 pointer-events-none overflow-visible z-[100]">
          <AnimatePresence>
            {Array.from(windows.entries()).map(([id, entry]) => (
              <div
                key={id}
                ref={makeWindowRef(id)}
                className="absolute top-0 left-0"
                style={{ zIndex: entry.order }}
              >
                {entry.type === "project" ? (
                  <DraggableWindow
                    title={entry.project.title}
                    width={920}
                    maxHeight={777}
                    initialPos={entry.pos}
                    onClose={() => closeWindow(id)}
                    showDragHint={entry.showDragHint}
                    onFirstDrag={() => {
                      hasEverDragged.current = true;
                    }}
                  >
                    <ProjectContent project={entry.project} />
                  </DraggableWindow>
                ) : (
                  <DraggableWindow
                    title="more projects"
                    width={900}
                    maxHeight={800}
                    initialPos={entry.pos}
                    onClose={() => closeWindow(id)}
                    contentClassName="overflow-y-scroll"
                    showDragHint={entry.showDragHint}
                    onFirstDrag={() => {
                      hasEverDragged.current = true;
                    }}
                  >
                    <MoreProjectsContent
                      projects={otherProjects}
                      onProjectClick={openProjectWindow}
                    />
                  </DraggableWindow>
                )}
              </div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </CanvasComponent>
  );
}
