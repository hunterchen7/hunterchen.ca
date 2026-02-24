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
  const [rotation, setRotation] = useState(0);
  const flipped = Math.round(Math.abs(rotation) / 180) % 2 !== 0;
  const [isAnimating, setIsAnimating] = useState(false);
  const [tiltPosition, setTiltPosition] = useState({ x: 0.5, y: 0.5 });
  const cardRef = useRef<HTMLButtonElement>(null);
  const [bounds, setBounds] = useState<CardBounds | null>(null);
  const lastGlowPos = useRef({ localX: 0, localY: 0 });

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

  // Per-card mouse tracking for tilt only (avoids re-rendering all cards)
  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTiltPosition({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  };

  const handleMouseLeave = () => {
    setTiltPosition({ x: 0.5, y: 0.5 });
  };

  // Compute local mouse position relative to this card (for shared glow)
  const localX = bounds && gridMouse ? gridMouse.x - bounds.offsetLeft : 0;
  const localY = bounds && gridMouse ? gridMouse.y - bounds.offsetTop : 0;

  // Tilt: "press down" — surface tilts away under the cursor
  const tiltX = (0.5 - tiltPosition.y) * 10;
  const tiltY = (tiltPosition.x - 0.5) * 10;

  // 2D parallax for front title text (simulates depth without 3D compositing blur)
  const textShiftX = (tiltPosition.x - 0.5) * 8;
  const textShiftY = (tiltPosition.y - 0.5) * 8;

  // Shared gradient: each card shows its slice of the full grid gradient
  const sharedBg = bounds
    ? {
        background: SHARED_GRADIENT,
        backgroundSize: `${bounds.gridWidth}px ${bounds.gridHeight}px`,
        backgroundPosition: `${-bounds.offsetLeft}px ${-bounds.offsetTop}px`,
      }
    : { background: card.color };

  // Remember last glow position so gradient stays rendered during fade-out
  if (bounds && gridMouse) {
    lastGlowPos.current = { localX, localY };
  }
  const glowPos = lastGlowPos.current;
  const radialGlow = `radial-gradient(600px circle at ${glowPos.localX}px ${glowPos.localY}px, rgba(255, 255, 255, 0.022), transparent 40%)`;

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
      className="absolute inset-0 transition-opacity duration-500 pointer-events-none"
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
        transform: flipped
          ? `perspective(1000px) rotateX(${tiltX / 3}deg) rotateY(${tiltY / 3}deg)`
          : `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.01)`,
      }}
      onClick={() => {
        setIsAnimating(true);
        const delta = tiltPosition.x >= 0.5 ? 180 : -180;
        setRotation((r) => r + delta);
        onCardClick?.();
      }}
      onKeyDown={(e) => {
        if (e.key === " ") {
          setRotation((r) => r + 180);
        }
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
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
          className="absolute inset-0 flex items-center justify-center border border-fuchsia-300/30 rounded-2xl shadow-lg overflow-hidden"
          style={{
            ...sharedBg,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          {glowOverlay}
          <h3
            className="text-sm md:text-base text-fuchsia-100 px-8 text-center relative z-10 transition-transform duration-200 ease-out drop-shadow-[0_3px_6px_rgba(0,0,0,0.6)]"
            style={{ transform: `translate(${textShiftX}px, ${textShiftY}px)` }}
          >
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
