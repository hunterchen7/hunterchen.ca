import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Github,
  ExternalLink,
  Link as LinkIcon,
} from "lucide-react";
import { useEffect, useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface Project {
  id: string;
  title: string;
  overview: string;
  description: React.ReactNode;
  tech: string[];
  github?: string;
  demo?: string;
  otherUrl?: string;
  video?: string;
  thumbnailVideo?: string;
  thumbnailImage?: string;
  images?: string[];
}

interface ProjectCarouselProps {
  projects: Project[];
  currentIndex: number | null;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

function ProjectCard3D({
  project,
  position,
  onClick,
  isCenter,
}: {
  project: Project;
  position: number; // -2, -1, 0, 1, 2 (0 = center)
  onClick: () => void;
  isCenter: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Play/pause video based on whether card is centered
  useEffect(() => {
    if (!videoRef.current) return;
    if (isCenter) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [isCenter]);

  // Calculate transforms based on position
  // Scale: 100% -> 75% -> 50% -> 25%
  const scaleMap: Record<number, number> = { 0: 1, 1: 0.75, 2: 0.5, 3: 0.25 };
  const scale = scaleMap[Math.abs(position)] ?? 0.1;
  const zIndex = 10 - Math.abs(position);
  const rotateY = position * -5;
  const blur = isCenter ? 0 : Math.abs(position) * 1.5;
  const brightness = isCenter ? 1 : 1 - Math.abs(position) * 0.25;

  // Center card is static, others offset from it
  // Offset reduces as cards get smaller
  const getXOffset = (pos: number): number => {
    if (pos === 0) return 0;
    const sign = pos > 0 ? 1 : -1;
    const absPos = Math.abs(pos);
    // Cumulative offset based on card sizes
    let offset = 0;
    for (let i = 1; i <= absPos; i++) {
      offset += 350 * (scaleMap[i - 1] ?? 0.1) + 220;
    }
    return offset * sign;
  };
  const xOffset = getXOffset(position);

  return (
    <motion.div
      className={`pointer-events-auto ${isCenter ? "relative cursor-pointer" : "absolute top-0 left-0 cursor-pointer"}`}
      style={{ zIndex }}
      initial={false}
      animate={{
        x: xOffset,
        scale,
        rotateY,
        filter: `blur(${blur}px) brightness(${brightness})`,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
      onClick={onClick}
    >
      <div
        className={`w-[min(80vw,80vh)] aspect-[9/16] md:aspect-[5/4] bg-fuchsia-950/70 rounded-2xl overflow-hidden shadow-2xl flex flex-col cursor-auto ${
          isCenter
            ? "ring-2 ring-fuchsia-500/50 border border-fuchsia-800/40"
            : ""
        }`}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Media */}
        <div className="w-full flex-1 min-h-0 bg-black/80 overflow-hidden">
          {project.video ? (
            <video
              ref={videoRef}
              key={project.video}
              src={project.video}
              className="w-full h-full object-contain"
              muted
              loop
              playsInline
            />
          ) : project.images && project.images[0] ? (
            <img
              src={project.images[0]}
              alt={project.title}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-fuchsia-400/40">
              <span className="text-4xl md:text-6xl">📁</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 flex-shrink-0">
          <h3 className="text-base md:text-xl font-semibold text-fuchsia-100 mb-1 md:mb-2">
            {project.title}
          </h3>

          <div className="text-xs md:text-sm text-fuchsia-200/80 leading-relaxed mb-2 md:mb-4">
            {project.description}
          </div>

          {/* Tech tags + Links */}
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between md:gap-4">
            <div className="flex flex-wrap gap-1 md:gap-1.5">
              {project.tech.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-fuchsia-900/50 px-1.5 md:px-2.5 py-0.5 text-[10px] md:text-sm text-fuchsia-300"
                >
                  {t}
                </span>
              ))}
            </div>

            <div className="flex gap-1.5 md:gap-2 flex-shrink-0">
              {project.github && (
                <a
                  href={project.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 md:gap-2 rounded-full bg-fuchsia-800/60 px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm text-fuchsia-200 transition-transform hover:scale-105"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Github className="h-3 w-3 md:h-4 md:w-4" />
                  Code
                </a>
              )}
              {project.demo && (
                <a
                  href={project.demo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 md:gap-2 rounded-full bg-fuchsia-600/60 px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm text-fuchsia-100 transition-transform hover:scale-105"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3 w-3 md:h-4 md:w-4" />
                  Demo
                </a>
              )}
              {project.otherUrl && (
                <a
                  href={project.otherUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 md:gap-2 rounded-full bg-fuchsia-700/60 px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm text-fuchsia-100 transition-transform hover:scale-105"
                  onClick={(e) => e.stopPropagation()}
                >
                  <LinkIcon className="h-3 w-3 md:h-4 md:w-4" />
                  More
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function ProjectCarousel({
  projects,
  currentIndex,
  onClose,
  onIndexChange,
}: ProjectCarouselProps) {
  const isOpen = currentIndex !== null;

  // Internal display index for animated stepping
  const [displayIndex, setDisplayIndex] = useState<number | null>(currentIndex);
  const animatingRef = useRef(false);

  // Animate through steps when target changes
  useEffect(() => {
    if (currentIndex === null) {
      setDisplayIndex(null);
      return;
    }

    if (displayIndex === null) {
      setDisplayIndex(currentIndex);
      return;
    }

    if (displayIndex === currentIndex || animatingRef.current) return;

    const diff = currentIndex - displayIndex;
    if (Math.abs(diff) <= 1) {
      setDisplayIndex(currentIndex);
      return;
    }

    // Animate through each step
    animatingRef.current = true;
    const step = diff > 0 ? 1 : -1;
    const stepDelay = Math.min(150, 600 / Math.abs(diff)); // Faster for longer jumps

    let current = displayIndex;
    const interval = setInterval(() => {
      current += step;
      setDisplayIndex(current);

      if (current === currentIndex) {
        clearInterval(interval);
        animatingRef.current = false;
      }
    }, stepDelay);

    return () => {
      clearInterval(interval);
      animatingRef.current = false;
    };
  }, [currentIndex, displayIndex]);

  const goNext = useCallback(() => {
    if (currentIndex !== null && currentIndex < projects.length - 1) {
      onIndexChange(currentIndex + 1);
    }
  }, [currentIndex, projects.length, onIndexChange]);

  const goPrev = useCallback(() => {
    if (currentIndex !== null && currentIndex > 0) {
      onIndexChange(currentIndex - 1);
    }
  }, [currentIndex, onIndexChange]);

  const canGoNext = currentIndex !== null && currentIndex < projects.length - 1;
  const canGoPrev = currentIndex !== null && currentIndex > 0;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };

    document.addEventListener("keydown", handleKeyDown);
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose, goNext, goPrev]);

  // Get visible cards (current + neighbors) - no wrapping
  const getVisibleCards = () => {
    if (displayIndex === null) return [];

    const visible: { project: Project; position: number; index: number }[] = [];

    // Show 3 cards on each side (7 total)
    for (let offset = -3; offset <= 3; offset++) {
      const idx = displayIndex + offset;
      // Only include if within bounds (no wrapping)
      if (idx >= 0 && idx < projects.length) {
        visible.push({
          project: projects[idx] as Project,
          position: offset,
          index: idx,
        });
      }
    }

    return visible;
  };

  if (typeof document === "undefined") return null;

  const visibleCards = getVisibleCards();

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[2000] font-mono"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            touchAction: "none",
            perspective: "1200px",
          }}
          onContextMenu={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
        >
          {/* Backdrop - click to close */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
            onClick={onClose}
          />

          {/* Navigation Arrows */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            disabled={!canGoPrev}
            className={`absolute bottom-6 left-1/2 -translate-x-16 md:left-6 md:translate-x-0 md:top-1/2 md:bottom-auto md:-translate-y-1/2 z-50 p-3 rounded-full bg-fuchsia-950/80 border border-fuchsia-800/40 transition-colors pointer-events-auto ${
              canGoPrev
                ? "text-fuchsia-400 hover:text-fuchsia-200 hover:bg-fuchsia-900/80"
                : "text-fuchsia-800 cursor-not-allowed"
            }`}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            disabled={!canGoNext}
            className={`absolute bottom-6 left-1/2 translate-x-4 md:left-auto md:right-6 md:translate-x-0 md:top-1/2 md:bottom-auto md:-translate-y-1/2 z-50 p-3 rounded-full bg-fuchsia-950/80 border border-fuchsia-800/40 transition-colors pointer-events-auto ${
              canGoNext
                ? "text-fuchsia-400 hover:text-fuchsia-200 hover:bg-fuchsia-900/80"
                : "text-fuchsia-800 cursor-not-allowed"
            }`}
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* 3D Carousel */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative" style={{ transformStyle: "preserve-3d" }}>
              {/* Render center card first so it establishes size */}
              {visibleCards
                .sort((a, b) => Math.abs(a.position) - Math.abs(b.position))
                .map(({ project, position, index }) => (
                  <ProjectCard3D
                    key={project.id}
                    project={project}
                    position={position}
                    isCenter={position === 0}
                    onClick={() => onIndexChange(index)}
                  />
                ))}
            </div>
          </div>

          {/* Position indicators */}
          <div className="absolute top-6 md:top-auto md:bottom-6 left-1/2 -translate-x-1/2 flex gap-2 pointer-events-auto">
            {projects.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  onIndexChange(idx);
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === displayIndex
                    ? "bg-fuchsia-400 w-6"
                    : "bg-fuchsia-800 hover:bg-fuchsia-600"
                }`}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
