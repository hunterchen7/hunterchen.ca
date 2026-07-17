import { useState, useEffect, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { SHARED_GRADIENT } from "./cards";

const ARTWORK_HIDDEN = { opacity: 0, scale: 0.78, y: 7 };
const ARTWORK_RESTING = { opacity: 1, scale: 1, y: 0 };
const ARTWORK_POP_IN = {
  opacity: [0, 1, 1, 1],
  scale: [0.78, 1.025, 0.992, 1],
  y: [7, -1, 0, 0],
};

export interface Card {
  id: string;
  front: string;
  frontArtwork?: React.ReactNode;
  frontArtworkClassName?: string;
  frontAnchor?:
    | "top-left"
    | "top-left-lower"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "top-center"
    | "center";
  backVariant?: "modern" | "classic";
  back: string | React.ReactNode;
  gridArea: string;
  color: string;
}

interface CardBounds {
  offsetLeft: number;
  offsetTop: number;
  width: number;
  height: number;
  gridWidth: number;
  gridHeight: number;
}

export default function FlipCard({
  card,
  gridRef,
  onCardClick,
  artworkDelay = 0,
  artworkDuration = 1.05,
  showArtwork = true,
}: {
  card: Card;
  gridRef: React.RefObject<HTMLDivElement | null>;
  onCardClick?: () => void;
  artworkDelay?: number;
  artworkDuration?: number;
  showArtwork?: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();
  const [rotation, setRotation] = useState(0);
  const flipped = Math.round(Math.abs(rotation) / 180) % 2 !== 0;
  const [isAnimating, setIsAnimating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [bounds, setBounds] = useState<CardBounds | null>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const wasDragged = useRef(false);
  const frontAnchor = card.frontAnchor ?? "center";
  const backVariant = card.backVariant ?? "modern";

  // After flip animation completes, overlay a plain div on top so the browser
  // renders content at native resolution instead of caching a composite layer.
  const settled = flipped && !isAnimating;

  // Cache card position relative to grid via ResizeObserver
  useEffect(() => {
    const cardEl = cardRef.current;
    const gridEl = gridRef.current;
    if (!cardEl || !gridEl) return;

    const update = () => {
      const cardRect = cardEl.getBoundingClientRect();
      const gridRect = gridEl.getBoundingClientRect();
      // Convert screen-space to layout-space (accounts for canvas zoom)
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

  const TAP_THRESHOLD = 8;

  const frontArtworkClass =
    card.frontArtworkClassName ??
    {
      center: "absolute inset-[18%]",
      "top-left":
        "absolute bottom-3 right-3 h-[58%] w-[58%] md:bottom-5 md:right-5",
      "top-left-lower":
        "absolute bottom-3 right-3 h-[58%] w-[58%] md:bottom-5 md:right-5",
      "top-right":
        "absolute bottom-3 left-3 h-[58%] w-[58%] md:bottom-5 md:left-5",
      "bottom-left":
        "absolute top-3 right-3 h-[58%] w-[58%] md:top-5 md:right-5",
      "bottom-right":
        "absolute left-3 top-3 h-[62%] w-[62%] md:left-5 md:top-16 md:h-[60%] md:w-[58%]",
      "top-center":
        "absolute bottom-3 left-1/2 h-[52%] w-[52%] -translate-x-1/2 md:bottom-5",
    }[frontAnchor];

  // Shared gradient: each card shows its slice of the full grid gradient
  const sharedBg = bounds
    ? {
        background: SHARED_GRADIENT,
        backgroundSize: `${bounds.gridWidth}px ${bounds.gridHeight}px`,
        backgroundPosition: `${-bounds.offsetLeft}px ${-bounds.offsetTop}px`,
      }
    : { background: card.color };

  const radialGlow = bounds
    ? `radial-gradient(600px circle at calc(var(--hero-glow-x, 0px) - ${bounds.offsetLeft}px) calc(var(--hero-glow-y, 0px) - ${bounds.offsetTop}px), rgba(255, 255, 255, 0.022), transparent 40%)`
    : "radial-gradient(600px circle at 50% 50%, rgba(255, 255, 255, 0.022), transparent 40%)";

  const frontAnchorClass = {
    center:
      "absolute inset-0 flex items-center justify-center text-center px-8",
    "top-left":
      "absolute top-5 left-5 md:top-6 md:left-6 text-left max-w-[70%]",
    "top-left-lower":
      "absolute top-5 left-5 md:top-16 md:left-6 text-left max-w-[70%]",
    "top-right":
      "absolute top-5 right-5 md:top-6 md:right-6 text-right max-w-[70%]",
    "bottom-left":
      "absolute bottom-5 left-5 md:bottom-6 md:left-6 text-left max-w-[70%]",
    "bottom-right":
      "absolute bottom-5 right-5 md:bottom-6 md:right-6 text-right max-w-[70%]",
    "top-center":
      "absolute top-5 left-1/2 -translate-x-1/2 md:top-6 text-center max-w-[80%]",
  }[frontAnchor];

  const backContentClass =
    backVariant === "classic" ? "relative z-10" : "relative z-10 h-full w-full";
  const backFaceClass =
    backVariant === "classic"
      ? "absolute inset-0 border border-fuchsia-200/25 rounded-2xl shadow-[0_18px_38px_rgba(7,2,12,0.34),inset_0_1px_0_rgba(255,255,255,0.08)] p-8 flex items-center justify-center overflow-hidden"
      : "absolute inset-0 border border-fuchsia-200/25 rounded-2xl shadow-[0_18px_38px_rgba(7,2,12,0.34),inset_0_1px_0_rgba(255,255,255,0.08)] p-5 md:p-6 flex items-stretch justify-stretch overflow-hidden";

  const backContent = (
    <div className={backContentClass}>
      {typeof card.back === "string" ? (
        <p className="text-fuchsia-100/90 text-base leading-relaxed text-center">
          {card.back}
        </p>
      ) : (
        card.back
      )}
    </div>
  );

  const glowOverlay = (
    <div
      className="pointer-events-none absolute inset-0 z-[60] overflow-hidden rounded-2xl transition-opacity duration-500"
      style={{
        opacity: "var(--hero-glow-opacity, 0)",
        background: radialGlow,
      }}
    />
  );

  return (
    <div
      ref={cardRef}
      className="relative w-full h-full cursor-pointer"
      data-flip-card={card.id}
      style={{
        perspective: 1200,
        zIndex: flipped ? 50 : 1,
      }}
      onPointerDown={(e) => {
        pointerStart.current = { x: e.clientX, y: e.clientY };
        wasDragged.current = false;
      }}
      onPointerMove={(e) => {
        if (!pointerStart.current || wasDragged.current) return;
        const dx = e.clientX - pointerStart.current.x;
        const dy = e.clientY - pointerStart.current.y;
        if (dx * dx + dy * dy > TAP_THRESHOLD * TAP_THRESHOLD) {
          wasDragged.current = true;
        }
      }}
      onPointerUp={(e) => {
        if (wasDragged.current || !pointerStart.current) return;
        // Don't flip when tapping interactive children (links, buttons)
        if ((e.target as HTMLElement).closest("a, button, input")) return;
        setIsAnimating(true);
        setRotation(flipped ? 0 : 180);
        onCardClick?.();
      }}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          setIsAnimating(true);
          setRotation(flipped ? 0 : 180);
          onCardClick?.();
        }
      }}
      tabIndex={0}
    >
      {/* 3D flip container — always mounted so rotateY state is preserved */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotateY: rotation }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        onAnimationComplete={() => setIsAnimating(false)}
        style={{
          transformStyle: "preserve-3d",
          WebkitTransformStyle: "preserve-3d",
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-2xl border border-fuchsia-200/25 shadow-[0_18px_38px_rgba(7,2,12,0.34),inset_0_1px_0_rgba(255,255,255,0.08)]"
          style={{
            ...sharedBg,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          {card.frontArtwork && (
            <div
              className={`${frontArtworkClass} pointer-events-none z-[1]`}
            >
              <motion.div
                className="h-full w-full"
                data-front-artwork={card.id}
                data-front-artwork-delay={artworkDelay.toFixed(3)}
                initial={prefersReducedMotion ? false : ARTWORK_HIDDEN}
                animate={
                  prefersReducedMotion
                    ? showArtwork
                      ? ARTWORK_RESTING
                      : ARTWORK_HIDDEN
                    : showArtwork
                      ? ARTWORK_POP_IN
                      : ARTWORK_HIDDEN
                }
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : {
                        delay: showArtwork ? artworkDelay : 0,
                        duration: artworkDuration,
                        ease: [0.16, 1, 0.3, 1],
                        times: [0, 0.68, 0.86, 1],
                      }
                }
                style={{ transformOrigin: "50% 58%" }}
              >
                {card.frontArtwork}
              </motion.div>
            </div>
          )}
          <h3
            className={`${frontAnchorClass} text-sm md:text-base text-fuchsia-100 leading-tight z-10 drop-shadow-[0_3px_6px_rgba(0,0,0,0.6)]`}
          >
            {card.front}
          </h3>
        </div>

        {/* Back */}
        <div
          className={backFaceClass}
          style={{
            ...sharedBg,
            transform: "rotateY(180deg) translateZ(1px)",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          {backContent}
        </div>
      </motion.div>

      {/* Settled overlay: plain div on top, no 3D — renders at native zoom resolution */}
      {settled && (
        <div className={backFaceClass} style={sharedBg}>
          {backContent}
        </div>
      )}
      {glowOverlay}
    </div>
  );
}
