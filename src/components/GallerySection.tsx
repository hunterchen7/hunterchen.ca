import { CanvasComponent, type SectionCoordinates } from "@hunterchen/canvas";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Camera, Aperture, ImageIcon, Telescope, Calendar } from "lucide-react";
import { fetchExifFromUrl, type ExifData } from "../utils/exif";
import { AnimatedLink } from "./AnimatedLink";

interface GallerySectionProps {
  offset: SectionCoordinates;
}

interface Photo {
  caption: string;
  url?: string;
  thumbnailUrl?: string;
}

interface SelectedPhoto {
  photo: Photo;
  rect: DOMRect;
}

const photos: Photo[] = [
  // plane moon
  {
    caption: "2025/09/06",
    url: "https://photos.hunterchen.ca/HC_08284.jpg",
    thumbnailUrl: "https://photos.hunterchen.ca/HC_08284-thumb.webp",
  },
  // pigon
  {
    caption: "2025/08/19",
    url: "https://photos.hunterchen.ca/HC_02986.jpg",
    thumbnailUrl: "https://photos.hunterchen.ca/HC_02986-thumb.webp",
  },
  // raven
  {
    caption: "2024/08/23",
    url: "https://photos.hunterchen.ca/HC_01728-Enhanced-NR.jpg",
    thumbnailUrl:
      "https://photos.hunterchen.ca/HC_01728-Enhanced-NR-thumb.webp",
  },
  // deer
  {
    caption: "2025/08/23",
    url: "https://photos.hunterchen.ca/HC_04701.jpg",
    thumbnailUrl: "https://photos.hunterchen.ca/HC_04701-thumb.webp",
  },
  // plane upside down
  {
    caption: "2025/09/05",
    url: "https://photos.hunterchen.ca/HC_06296-Enhanced-NR.jpg",
    thumbnailUrl:
      "https://photos.hunterchen.ca/HC_06296-Enhanced-NR-thumb.webp",
  },
  // ny
  {
    caption: "2025/08/20",
    url: "https://photos.hunterchen.ca/HC_03358.jpg",
    thumbnailUrl: "https://photos.hunterchen.ca/HC_03358-thumb.webp",
  },
  // plane sandwich
  {
    caption: "2025/09/06",
    url: "https://photos.hunterchen.ca/HC_07534.jpg",
    thumbnailUrl: "https://photos.hunterchen.ca/HC_07534-thumb.webp",
  },
  // boat
  {
    caption: "2024/08/29",
    url: "https://photos.hunterchen.ca/HC_04198.jpg",
    thumbnailUrl: "https://photos.hunterchen.ca/HC_04198-thumb.webp",
  },
];

const CARD_SIZE = 260;
const CARD_WIDTH = CARD_SIZE;
const CARD_HEIGHT = CARD_SIZE;
const BOB_DELAYS = [0, 0.7, 1.4, 2.1, 0.35, 1.05, 1.75, 2.45];

const HoloFrameContent = ({
  thumbnailUrl,
  fullUrl,
  revealed,
  ambient,
  static: isStatic,
  onImageClick,
}: {
  thumbnailUrl?: string;
  fullUrl?: string;
  revealed?: boolean;
  ambient?: boolean;
  static?: boolean;
  onImageClick?: (e: React.MouseEvent) => void;
}) => {
  const isRevealed = revealed ?? true;

  return (
    <div
      className={`absolute inset-0 rounded-lg border border-purple-500/40 bg-[#0d0a14]/70 backdrop-blur-md overflow-hidden ${
        !isStatic ? "animate-neon-pulse" : ""
      } ${onImageClick ? "cursor-pointer" : ""}`}
      onClick={onImageClick}
    >
      {/* Static overlay — z-stacked on top of image */}
      <AnimatePresence>
        {!isRevealed && (
          <motion.div
            key="static"
            className="holo-static absolute inset-0 flex items-center justify-center z-10"
            initial={{
              clipPath: "inset(50% 0 50% 0)",
              opacity: 0,
              filter: "brightness(2) saturate(0)",
            }}
            animate={{
              clipPath: "inset(0 0 0 0)",
              opacity: 1,
              filter: "brightness(1) saturate(1)",
            }}
            exit={{
              clipPath: "inset(50% 0 50% 0)",
              opacity: 0,
              filter: "brightness(2) saturate(0)",
            }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          >
            <span className="text-purple-500/30 text-xs font-mono tracking-widest uppercase">
              [ offline ]
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image layer — fills the entire frame */}
      {thumbnailUrl ? (
        <motion.div
          className="absolute inset-0"
          animate={
            isStatic
              ? {}
              : isRevealed
                ? { clipPath: "inset(0 0 0 0)", filter: "none" }
                : {
                    clipPath: "inset(50% 0 50% 0)",
                    filter: "brightness(2) saturate(0) hue-rotate(180deg)",
                  }
          }
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
          <div
            className={`absolute inset-0 ${!isStatic && isRevealed ? "holo-revealing" : ""}`}
          >
            <img
              src={thumbnailUrl}
              alt=""
              draggable={false}
              className="h-full w-full object-cover"
            />
            {fullUrl && fullUrl !== thumbnailUrl && (
              <img
                src={fullUrl}
                alt=""
                className="h-full w-full object-cover absolute inset-0"
              />
            )}
          </div>
        </motion.div>
      ) : (
        <div className="absolute inset-0 bg-[#0d0a14] flex items-center justify-center">
          <span className="text-purple-500/30 text-xs font-mono">
            [ no data ]
          </span>
        </div>
      )}

      {/* Ambient hologram effect — scanlines + occasional flicker */}
      {isRevealed && ambient && !isStatic && (
        <div className="holo-ambient-scanlines absolute inset-0 z-[5] pointer-events-none" />
      )}
    </div>
  );
};

const HoloFrame = ({
  thumbnailUrl,
  revealed,
  onReveal,
  onImageClick,
  bobDelay,
}: {
  thumbnailUrl?: string;
  revealed: boolean;
  onReveal: () => void;
  onImageClick: (rect: DOMRect) => void;
  bobDelay: number;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!revealed) {
      onReveal();
      return;
    }
    if (cardRef.current) {
      onImageClick(cardRef.current.getBoundingClientRect());
    }
  };

  return (
    <div
      className="animate-holo-bob"
      style={{ animationDelay: `${bobDelay}s` }}
    >
      <motion.div
        ref={cardRef}
        className="relative h-[260px] w-[260px] cursor-pointer"
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
      >
        <HoloFrameContent
          thumbnailUrl={thumbnailUrl}
          revealed={revealed}
          ambient
          onImageClick={handleClick}
        />
      </motion.div>
    </div>
  );
};

const HoloExifCard = ({
  exif,
  isLoading,
  fallbackDate,
}: {
  exif: ExifData;
  isLoading: boolean;
  fallbackDate?: string;
}) => {
  const date = exif.date || fallbackDate;
  const hasData =
    date ||
    exif.camera ||
    exif.lensModel ||
    exif.shutter ||
    exif.aperture ||
    exif.iso;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: 0.2, duration: 0.3 }}
      className="rounded-lg border border-purple-500/40 bg-[#0d0a14]/80 backdrop-blur-md p-4 min-w-[200px] max-w-[240px] cursor-auto animate-neon-pulse"
      onClick={(e) => e.stopPropagation()}
    >
      {isLoading ? (
        <div className="text-xs font-mono text-purple-300/50 animate-pulse">
          decoding metadata...
        </div>
      ) : !hasData ? (
        <div className="text-xs font-mono text-purple-300/50">
          no metadata found
        </div>
      ) : (
        <div className="space-y-2 text-xs text-fuchsia-300/70">
          {date && (
            <div className="flex items-start gap-2">
              <Calendar className="w-3.5 h-3.5 mt-0.5 text-purple-400/60 flex-shrink-0" />
              <span className="font-mono">{date}</span>
            </div>
          )}
          {exif.camera && (
            <div className="flex items-start gap-2">
              <Camera className="w-3.5 h-3.5 mt-0.5 text-purple-400/60 flex-shrink-0" />
              <span className="font-mono">{exif.camera}</span>
            </div>
          )}
          {exif.lensModel && (
            <div className="flex items-start gap-2">
              <Telescope className="w-3.5 h-3.5 mt-0.5 text-purple-400/60 flex-shrink-0" />
              <span className="font-mono">{exif.lensModel}</span>
            </div>
          )}
          {(exif.shutter || exif.aperture || exif.iso || exif.focalLength) && (
            <div className="flex items-start gap-2">
              <Aperture className="w-3.5 h-3.5 mt-0.5 text-purple-400/60 flex-shrink-0" />
              <div className="flex flex-wrap gap-x-2 font-mono">
                {exif.shutter && <span>{exif.shutter}s</span>}
                {exif.aperture && <span>{exif.aperture}</span>}
                {exif.iso && <span>ISO {exif.iso}</span>}
                {exif.focalLength && <span>{exif.focalLength}</span>}
              </div>
            </div>
          )}
          {exif.width && exif.height && (
            <div className="flex items-start gap-2">
              <ImageIcon className="w-3.5 h-3.5 mt-0.5 text-purple-400/60 flex-shrink-0" />
              <span className="font-mono">
                {exif.width} x {exif.height}
                {exif.megapixels && ` (${exif.megapixels} MP)`}
              </span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

const ExpandedHoloFrame = ({
  photo,
  startRect,
  onClose,
}: {
  photo: Photo;
  startRect: DOMRect;
  onClose: () => void;
}) => {
  const [exif, setExif] = useState<ExifData>({});
  const [exifReady, setExifReady] = useState(false);
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    if (isClosing) return;
    if (!exifReady) {
      onClose();
      return;
    }
    setIsClosing(true);
    setTimeout(() => onClose(), 250);
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [handleClose]);

  useEffect(() => {
    if (photo.url) {
      const minDelay = new Promise((r) => setTimeout(r, 670));
      Promise.all([fetchExifFromUrl(photo.url), minDelay]).then(([data]) => {
        setExif(data);
        setExifReady(true);
      });
    }
  }, [photo.url]);

  useEffect(() => {
    const src = photo.thumbnailUrl || photo.url;
    if (src) {
      const img = new Image();
      img.onload = () =>
        setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
      img.src = src;
    }
  }, [photo.thumbnailUrl, photo.url]);

  const aspect = imgSize ? imgSize.w / imgSize.h : 1;
  const exifCardSpace = 280;
  const maxW = window.innerWidth * 0.75;
  const maxH = window.innerHeight * 0.85;

  let targetW: number, targetH: number;
  if (aspect >= maxW / maxH) {
    targetW = maxW;
    targetH = maxW / aspect;
  } else {
    targetH = maxH;
    targetW = maxH * aspect;
  }

  // Centered position (no EXIF)
  const centeredX = (window.innerWidth - targetW) / 2;
  const centerY = (window.innerHeight - targetH) / 2;

  // Shifted position (with EXIF card)
  const totalWidth = targetW + exifCardSpace;
  const shiftedX = (window.innerWidth - totalWidth) / 2;

  const cardX = exifReady && !isClosing ? shiftedX : centeredX;

  return createPortal(
    <motion.div
      initial={{ clipPath: "inset(50% 0 50% 0)" }}
      animate={{ clipPath: "inset(0 0 0 0)" }}
      exit={{ clipPath: "inset(50% 0 50% 0)" }}
      transition={{ duration: 0.42, ease: [0.4, 0, 0.2, 1] }}
      className="fixed inset-0 z-50 bg-[#0d0a14]/85 backdrop-blur-md cursor-pointer"
      onClick={handleClose}
      onContextMenu={(e) => e.stopPropagation()}
    >
      {/* Holographic projector beam — bright line at the split point */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.6, delay: 0.18, ease: "easeOut" }}
        className="fixed left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent 5%, rgba(192, 132, 252, 0.8) 30%, rgba(100, 200, 255, 0.6) 50%, rgba(192, 132, 252, 0.8) 70%, transparent 95%)",
          boxShadow:
            "0 0 15px rgba(192, 132, 252, 0.6), 0 0 40px rgba(100, 200, 255, 0.3)",
        }}
      />

      {/* Holo flash wash */}
      <motion.div
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.48, ease: "easeOut" }}
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(192, 132, 252, 0.15) 0%, transparent 70%)",
        }}
      />

      {/* Holo frame card */}
      <motion.div
        initial={{
          x: startRect.left,
          y: startRect.top,
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
        }}
        animate={{
          x: cardX,
          y: centerY,
          width: targetW,
          height: targetH,
        }}
        exit={{
          x: startRect.left,
          y: startRect.top,
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
        }}
        transition={{
          type: "spring",
          damping: 28,
          stiffness: 165,
        }}
        style={{
          position: "fixed",
        }}
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.stopPropagation()}
        className="cursor-default"
      >
        <HoloFrameContent
          thumbnailUrl={photo.thumbnailUrl}
          fullUrl={photo.url}
          revealed={true}
          static
        />
      </motion.div>

      {/* EXIF metadata card — appears once loaded */}
      {exifReady && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={isClosing ? { opacity: 0, x: 20 } : { opacity: 1, x: 0 }}
          transition={{ duration: isClosing ? 0.2 : 0.3 }}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            left: shiftedX + targetW + 24,
            top: centerY,
          }}
        >
          <HoloExifCard
            exif={exif}
            isLoading={false}
            fallbackDate={photo.caption}
          />
        </motion.div>
      )}
    </motion.div>,
    document.body,
  );
};

export default function GallerySection({ offset }: GallerySectionProps) {
  const [selected, setSelected] = useState<SelectedPhoto | null>(null);
  const [openCount, setOpenCount] = useState(0);
  const [revealedPhotos, setRevealedPhotos] = useState<Set<number>>(new Set());
  const [revealOrder, setRevealOrder] = useState<number[]>([]);
  const [isResetting, setIsResetting] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);

  const allRevealed = revealedPhotos.size === photos.length;

  const handleReveal = (index: number) => () => {
    if (isRevealing) return;
    setRevealedPhotos((prev) => new Set(prev).add(index));
    setRevealOrder((prev) => [...prev, index]);
  };

  const handleRevealAll = () => {
    if (isRevealing || isResetting) return;
    setIsRevealing(true);
    const unrevealed = photos
      .map((_, i) => i)
      .filter((i) => !revealedPhotos.has(i))
      .map((v) => ({ v, k: Math.random() }))
      .sort((a, b) => a.k - b.k)
      .map(({ v }) => v);
    unrevealed.forEach((idx, i) => {
      setTimeout(
        () => {
          setRevealedPhotos((prev) => new Set(prev).add(idx));
          setRevealOrder((prev) => [...prev, idx]);
          if (i === unrevealed.length - 1) {
            setIsRevealing(false);
          }
        },
        350 + i * 200,
      );
    });
  };

  const handleReset = () => {
    if (isResetting) return;
    setIsResetting(true);
    const reversed = [...revealOrder].reverse();
    reversed.forEach((idx, i) => {
      setTimeout(
        () => {
          setRevealedPhotos((prev) => {
            const next = new Set(prev);
            next.delete(idx);
            return next;
          });
          if (i === reversed.length - 1) {
            setRevealOrder([]);
            setIsResetting(false);
          }
        },
        350 + i * 100,
      );
    });
  };

  const handleImageClick = (photo: Photo) => (rect: DOMRect) => {
    setOpenCount((c) => c + 1);
    setSelected({ photo, rect });
  };

  return (
    <>
      <CanvasComponent offset={offset}>
        <div className="flex h-full w-full items-center justify-center pb-8 sm:pb-0 sm:pt-4">
          <div className="mx-auto flex items-center gap-16">
            {/* Left 2 frames */}
            <div className="flex flex-col gap-12">
              <HoloFrame
                thumbnailUrl={photos[0]!.thumbnailUrl}
                revealed={revealedPhotos.has(0)}
                onReveal={handleReveal(0)}
                onImageClick={handleImageClick(photos[0]!)}
                bobDelay={BOB_DELAYS[0]!}
              />
              <HoloFrame
                thumbnailUrl={photos[1]!.thumbnailUrl}
                revealed={revealedPhotos.has(1)}
                onReveal={handleReveal(1)}
                onImageClick={handleImageClick(photos[1]!)}
                bobDelay={BOB_DELAYS[1]!}
              />
            </div>

            {/* Middle section with frames and title */}
            <div className="flex flex-col items-center gap-14">
              <div className="flex gap-12">
                <HoloFrame
                  thumbnailUrl={photos[2]!.thumbnailUrl}
                  revealed={revealedPhotos.has(2)}
                  onReveal={handleReveal(2)}
                  onImageClick={handleImageClick(photos[2]!)}
                  bobDelay={BOB_DELAYS[2]!}
                />
                <HoloFrame
                  thumbnailUrl={photos[3]!.thumbnailUrl}
                  revealed={revealedPhotos.has(3)}
                  onReveal={handleReveal(3)}
                  onImageClick={handleImageClick(photos[3]!)}
                  bobDelay={BOB_DELAYS[3]!}
                />
              </div>

              <div className="flex w-96 flex-col items-center justify-center">
                <h2
                  className="mb-4 text-center text-2xl font-thin text-fuchsia-200"
                  style={{
                    textShadow: "0 0 20px rgba(192, 132, 252, 0.4)",
                  }}
                >
                  gallery
                </h2>
                <div className="w-2/3 text-center text-sm text-fuchsia-300/60">
                  a collection of some photos i took that i like :)
                </div>
                <div className="mt-3 h-5 relative flex items-center justify-center overflow-hidden">
                  <AnimatePresence mode="wait">
                    {revealedPhotos.size === 0 ? (
                      <motion.button
                        key="reveal"
                        initial={{
                          scaleX: 0,
                          opacity: 0,
                          filter: "brightness(3)",
                          textShadow: "0 0 12px rgba(100, 200, 255, 0.8)",
                        }}
                        animate={
                          isRevealing
                            ? {
                                scaleX: 1,
                                opacity: [1, 1, 0.7],
                                filter: [
                                  "brightness(1)",
                                  "brightness(3)",
                                  "brightness(1.5)",
                                ],
                                textShadow: [
                                  "0 0 0px rgba(100, 200, 255, 0)",
                                  "0 0 20px rgba(100, 200, 255, 1)",
                                  "0 0 6px rgba(100, 200, 255, 0.4)",
                                ],
                              }
                            : {
                                scaleX: 1,
                                opacity: 1,
                                filter: "brightness(1)",
                                textShadow: "0 0 0px rgba(100, 200, 255, 0)",
                              }
                        }
                        exit={{
                          scaleX: 0,
                          opacity: 0,
                          filter: "brightness(3)",
                          textShadow: "0 0 12px rgba(100, 200, 255, 0.8)",
                        }}
                        transition={
                          isRevealing
                            ? { duration: 0.3, ease: "easeOut" }
                            : { duration: 0.2, ease: "easeInOut" }
                        }
                        onClick={handleRevealAll}
                        className="text-xs text-cyan-300/50 font-mono tracking-widest select-none cursor-pointer hover:text-cyan-300/80 transition-colors"
                      >
                        click to reveal
                      </motion.button>
                    ) : (
                      <motion.button
                        key="reset"
                        initial={{
                          scaleX: 0,
                          opacity: 0,
                          filter: "brightness(3)",
                          textShadow: "0 0 12px rgba(100, 200, 255, 0.8)",
                        }}
                        animate={
                          isResetting
                            ? {
                                scaleX: 1,
                                opacity: [1, 1, 0.7],
                                filter: [
                                  "brightness(1)",
                                  "brightness(3)",
                                  "brightness(1.5)",
                                ],
                                textShadow: [
                                  "0 0 0px rgba(100, 200, 255, 0)",
                                  "0 0 20px rgba(100, 200, 255, 1)",
                                  "0 0 6px rgba(100, 200, 255, 0.4)",
                                ],
                              }
                            : {
                                scaleX: 1,
                                opacity: 1,
                                filter: "brightness(1)",
                                textShadow: "0 0 0px rgba(100, 200, 255, 0)",
                              }
                        }
                        exit={{
                          scaleX: 0,
                          opacity: 0,
                          filter: "brightness(3)",
                          textShadow: "0 0 12px rgba(100, 200, 255, 0.8)",
                        }}
                        transition={
                          isResetting
                            ? { duration: 0.3, ease: "easeOut" }
                            : { duration: 0.2, ease: "easeInOut" }
                        }
                        onClick={handleReset}
                        className="text-xs text-cyan-300/50 font-mono tracking-widest select-none cursor-pointer hover:text-cyan-300/80 transition-colors"
                      >
                        reset
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
                <AnimatedLink
                  href="https://gallery.hunterchen.ca/"
                  className="mt-3 text-xs"
                >
                  see more →
                </AnimatedLink>
              </div>

              <div className="flex gap-12">
                <HoloFrame
                  thumbnailUrl={photos[4]!.thumbnailUrl}
                  revealed={revealedPhotos.has(4)}
                  onReveal={handleReveal(4)}
                  onImageClick={handleImageClick(photos[4]!)}
                  bobDelay={BOB_DELAYS[4]!}
                />
                <HoloFrame
                  thumbnailUrl={photos[5]!.thumbnailUrl}
                  revealed={revealedPhotos.has(5)}
                  onReveal={handleReveal(5)}
                  onImageClick={handleImageClick(photos[5]!)}
                  bobDelay={BOB_DELAYS[5]!}
                />
              </div>
            </div>

            {/* Right 2 frames */}
            <div className="flex flex-col gap-12">
              <HoloFrame
                thumbnailUrl={photos[6]!.thumbnailUrl}
                revealed={revealedPhotos.has(6)}
                onReveal={handleReveal(6)}
                onImageClick={handleImageClick(photos[6]!)}
                bobDelay={BOB_DELAYS[6]!}
              />
              <HoloFrame
                thumbnailUrl={photos[7]!.thumbnailUrl}
                revealed={revealedPhotos.has(7)}
                onReveal={handleReveal(7)}
                onImageClick={handleImageClick(photos[7]!)}
                bobDelay={BOB_DELAYS[7]!}
              />
            </div>
          </div>
        </div>
      </CanvasComponent>

      <AnimatePresence>
        {selected && (
          <ExpandedHoloFrame
            key={openCount}
            photo={selected.photo}
            startRect={selected.rect}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
