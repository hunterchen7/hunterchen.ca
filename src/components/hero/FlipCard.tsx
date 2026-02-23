import { useState } from "react";
import { motion } from "framer-motion";

export interface Card {
  id: string;
  front: string;
  back: string | React.ReactNode;
  gridArea: string;
  color: string;
}

export default function FlipCard({
  card,
  onCardClick,
}: {
  card: Card;
  onCardClick?: () => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const [tiltPosition, setTiltPosition] = useState({ x: 0.5, y: 0.5 });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!e.currentTarget) return;
    setIsHovering(true);
    const rect = e.currentTarget.getBoundingClientRect();

    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    setMousePosition({ x, y });
    setTiltPosition({ x, y });
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    setTiltPosition({ x: 0.5, y: 0.5 });
  };

  const tiltX = -(tiltPosition.y - 0.5) * 14;
  const tiltY = -(tiltPosition.x - 0.5) * 14;

  const radialGlow = `radial-gradient(600px circle at ${mousePosition.x * 100}% ${mousePosition.y * 100}%, rgba(255, 255, 255, 0.022), transparent 40%)`;

  return (
    <button
      className="relative w-full h-full cursor-pointer transition-transform duration-200 ease-out"
      style={{
        perspective: 1200,
        willChange: flipped ? "transform" : "auto",
        zIndex: flipped ? 50 : 1,
        transform: !flipped
          ? `rotateX(${-tiltX}deg) rotateY(${-tiltY}deg) scale(1.01)`
          : "none",
      }}
      onClick={() => {
        setFlipped(!flipped);
        onCardClick?.();
      }}
      onKeyDown={(e) => e.key === " " && setFlipped(!flipped)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      tabIndex={0}
    >
      <motion.div
        className="absolute inset-0"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        style={{
          transformStyle: "preserve-3d",
          WebkitTransformStyle: "preserve-3d",
        }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 flex items-center justify-center border border-fuchsia-300/30 rounded-2xl shadow-lg overflow-hidden"
          style={{
            backgroundColor: card.color,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          <div
            className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
            style={{
              opacity: isHovering ? 1 : 0,
              background: radialGlow,
            }}
          />
          <h3 className="text-sm md:text-base text-fuchsia-100 px-8 text-center relative z-10">
            {card.front}
          </h3>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 border border-fuchsia-300/30 rounded-2xl shadow-lg p-8 flex items-center justify-center overflow-hidden"
          style={{
            backgroundColor: card.color,
            transform: "rotateY(180deg) translateZ(1px)",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          <div
            className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
            style={{
              opacity: isHovering ? 1 : 0,
              background: radialGlow,
            }}
          />
          <div className="relative z-10">
            {typeof card.back === "string" ? (
              <p className="text-fuchsia-100/90 text-base leading-relaxed text-center">
                {card.back}
              </p>
            ) : (
              card.back
            )}
          </div>
        </div>
      </motion.div>
    </button>
  );
}
