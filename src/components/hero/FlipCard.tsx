import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { SHARED_GRADIENT } from "./cards";

export interface Card {
  id: string;
  front: string;
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
  gridMouse,
  gridRef,
  onCardClick,
}: {
  card: Card;
  gridMouse: { x: number; y: number } | null;
  gridRef: React.RefObject<HTMLDivElement | null>;
  onCardClick?: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const cardRef = useRef<HTMLButtonElement>(null);
  const [bounds, setBounds] = useState<CardBounds | null>(null);

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
      setBounds({
        offsetLeft: cardRect.left - gridRect.left,
        offsetTop: cardRect.top - gridRect.top,
        width: cardRect.width,
        height: cardRect.height,
        gridWidth: gridRect.width,
        gridHeight: gridRect.height,
      });
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(gridEl);
    return () => ro.disconnect();
  }, [gridRef]);

  // Compute local mouse position relative to this card
  const localX = bounds && gridMouse ? gridMouse.x - bounds.offsetLeft : 0;
  const localY = bounds && gridMouse ? gridMouse.y - bounds.offsetTop : 0;
  const isMouseOverCard =
    bounds &&
    gridMouse &&
    localX >= 0 &&
    localX <= bounds.width &&
    localY >= 0 &&
    localY <= bounds.height;

  // Tilt only when mouse is directly over this card
  const tiltX = isMouseOverCard
    ? -(localY / bounds!.height - 0.5) * 14
    : 0;
  const tiltY = isMouseOverCard
    ? -(localX / bounds!.width - 0.5) * 14
    : 0;

  // Shared gradient: each card shows its slice of the full grid gradient
  const sharedBg = bounds
    ? {
        background: SHARED_GRADIENT,
        backgroundSize: `${bounds.gridWidth}px ${bounds.gridHeight}px`,
        backgroundPosition: `${-bounds.offsetLeft}px ${-bounds.offsetTop}px`,
      }
    : { background: card.color };

  // Shared glow: positioned relative to grid mouse, bleeds across card borders
  const radialGlow =
    bounds && gridMouse
      ? `radial-gradient(600px circle at ${localX}px ${localY}px, rgba(255, 255, 255, 0.022), transparent 40%)`
      : "none";

  const backContent = (
    <div className="relative z-10">
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
      className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
      style={{
        opacity: gridMouse ? 1 : 0,
        background: radialGlow,
      }}
    />
  );

  return (
    <button
      ref={cardRef}
      className="relative w-full h-full cursor-pointer transition-transform duration-200 ease-out"
      style={{
        perspective: 1200,
        zIndex: flipped ? 50 : 1,
        transform: !flipped
          ? `rotateX(${-tiltX}deg) rotateY(${-tiltY}deg) scale(1.01)`
          : "none",
      }}
      onClick={() => {
        setIsAnimating(true);
        setFlipped(!flipped);
        onCardClick?.();
      }}
      onKeyDown={(e) => e.key === " " && setFlipped(!flipped)}
      tabIndex={0}
    >
      {/* 3D flip container — always mounted so rotateY state is preserved */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        onAnimationComplete={() => setIsAnimating(false)}
        style={{
          transformStyle: "preserve-3d",
          WebkitTransformStyle: "preserve-3d",
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 flex items-center justify-center border border-fuchsia-300/30 rounded-2xl shadow-lg overflow-hidden"
          style={{
            ...sharedBg,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          {glowOverlay}
          <h3 className="text-sm md:text-base text-fuchsia-100 px-8 text-center relative z-10">
            {card.front}
          </h3>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 border border-fuchsia-300/30 rounded-2xl shadow-lg p-8 flex items-center justify-center overflow-hidden"
          style={{
            ...sharedBg,
            transform: "rotateY(180deg) translateZ(1px)",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          {glowOverlay}
          {backContent}
        </div>
      </motion.div>

      {/* Settled overlay: plain div on top, no 3D — renders at native zoom resolution */}
      {settled && (
        <div
          className="absolute inset-0 border border-fuchsia-300/30 rounded-2xl shadow-lg p-8 flex items-center justify-center overflow-hidden"
          style={sharedBg}
        >
          {glowOverlay}
          {backContent}
        </div>
      )}
    </button>
  );
}
