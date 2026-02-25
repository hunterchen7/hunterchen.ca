import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { type Project, PROJECTS_GRADIENT } from "./projects";

interface CardBounds {
  offsetLeft: number;
  offsetTop: number;
  width: number;
  height: number;
  gridWidth: number;
  gridHeight: number;
}

interface ProjectBentoCardProps {
  project: Project;
  gridArea: string;
  gridMouse: { x: number; y: number } | null;
  gridRef: React.RefObject<HTMLDivElement | null>;
  onClick: () => void;
  animationDelay: number;
}

export default function ProjectBentoCard({
  project,
  gridArea,
  gridMouse,
  gridRef,
  onClick,
  animationDelay,
}: ProjectBentoCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [bounds, setBounds] = useState<CardBounds | null>(null);
  const lastGlowPos = useRef({ localX: 0, localY: 0 });

  // Cache card position relative to grid via ResizeObserver
  useEffect(() => {
    const cardEl = cardRef.current;
    const gridEl = gridRef.current;
    if (!cardEl || !gridEl) return;

    const update = () => {
      const cardRect = cardEl.getBoundingClientRect();
      const gridRect = gridEl.getBoundingClientRect();
      const scaleX = gridEl.offsetWidth / gridRect.width;
      const scaleY = gridEl.offsetHeight / gridRect.height;
      setBounds({
        offsetLeft: (cardRect.left - gridRect.left) * scaleX,
        offsetTop: (cardRect.top - gridRect.top) * scaleY,
        width: cardRect.width * scaleX,
        height: cardRect.height * scaleY,
        gridWidth: gridEl.offsetWidth,
        gridHeight: gridEl.offsetHeight,
      });
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(gridEl);
    return () => ro.disconnect();
  }, [gridRef]);

  // Video autoplay via IntersectionObserver
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoEl.play().catch(() => {});
          } else {
            videoEl.pause();
          }
        });
      },
      { threshold: 0.25 },
    );

    observer.observe(videoEl);
    return () => observer.disconnect();
  }, []);

  // Shared gradient: each card shows its slice of the full grid gradient
  const sharedBg = bounds
    ? {
        background: PROJECTS_GRADIENT,
        backgroundSize: `${bounds.gridWidth}px ${bounds.gridHeight}px`,
        backgroundPosition: `${-bounds.offsetLeft}px ${-bounds.offsetTop}px`,
      }
    : { background: "#3d1a50" };

  // Compute local mouse position for glow
  const localX = bounds && gridMouse ? gridMouse.x - bounds.offsetLeft : 0;
  const localY = bounds && gridMouse ? gridMouse.y - bounds.offsetTop : 0;

  if (bounds && gridMouse) {
    lastGlowPos.current = { localX, localY };
  }
  const glowPos = lastGlowPos.current;
  const radialGlow = `radial-gradient(600px circle at ${glowPos.localX}px ${glowPos.localY}px, rgba(255, 255, 255, 0.022), transparent 40%)`;

  const videoSrc = project.thumbnailVideo || project.video;
  const imageSrc =
    project.thumbnailImage || (project.images && project.images[0]);
  const videoFit = project.videoFit ?? "cover";

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
        ref={cardRef}
        onClick={onClick}
        className="group relative w-full h-full border border-fuchsia-300/30 rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 ease-out hover:brightness-105 hover:scale-[1.01]"
        style={sharedBg}
      >
        {/* Glow overlay */}
        <div
          className="absolute inset-0 transition-opacity duration-500 pointer-events-none z-10"
          style={{
            opacity: gridMouse ? 1 : 0,
            background: radialGlow,
          }}
        />

        {/* Media fill */}
        <div className="absolute inset-0">
          {videoSrc ? (
            <video
              ref={videoRef}
              src={videoSrc}
              className={`w-full h-full ${videoFit === "contain" ? "object-contain" : "object-cover"}`}
              preload="metadata"
              muted
              loop
              playsInline
              draggable={false}
            />
          ) : imageSrc ? (
            <img
              src={imageSrc}
              alt={project.title}
              className="w-full h-full object-cover"
              draggable={false}
            />
          ) : null}
        </div>

        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

        {/* Content overlay */}
        <div className="absolute inset-0 flex flex-col justify-between p-3 pt-2 z-20">
          <h3 className="text-sm font-medium text-fuchsia-100 drop-shadow-[0_2px_6px_rgba(0,0,0,1)] [text-shadow:0_1px_8px_rgba(0,0,0,0.9),0_2px_16px_rgba(0,0,0,0.7)]">
            {project.title}
          </h3>
          <div className="flex flex-wrap gap-1">
            {project.tech.slice(0, 3).map((t) => (
              <span
                key={t}
                className="rounded-full bg-fuchsia-900/60 px-1.5 py-0.5 text-[9px] text-fuchsia-300 backdrop-blur-sm"
              >
                {t}
              </span>
            ))}
            {project.tech.length > 3 && (
              <span className="rounded-full bg-fuchsia-900/60 px-1.5 py-0.5 text-[9px] text-fuchsia-300 backdrop-blur-sm">
                +{project.tech.length - 3}
              </span>
            )}
          </div>
        </div>

        {/* Hover overview */}
        <div className="absolute left-0 right-0 bottom-0 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-black/80 pointer-events-none z-30">
          <p className="text-fuchsia-200/90 text-[10px] leading-tight p-2">
            {project.overview}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
