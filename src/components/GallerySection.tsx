import {
  CanvasComponent,
  Draggable,
  type SectionCoordinates,
} from "@hunterchen/canvas";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Camera, Aperture, ImageIcon, Telescope } from "lucide-react";
import { fetchExifFromUrl, type ExifData } from "../utils/exif";

interface GallerySectionProps {
  offset: SectionCoordinates;
}

interface Photo {
  caption: string;
  rotation?: string;
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
    caption: "2025/09/06 01:52:21",
    rotation: "3deg",
    url: "https://photos.hunterchen.ca/HC_08284.jpg",
    thumbnailUrl: "https://photos.hunterchen.ca/HC_08284-thumb.webp",
  },
  // pigon
  {
    caption: "2025/08/19 20:59:29",
    rotation: "6deg",
    url: "https://photos.hunterchen.ca/HC_02986.jpg",
    thumbnailUrl: "https://photos.hunterchen.ca/HC_02986-thumb.webp",
  },
  // raven
  {
    caption: "2024/08/23 21:19:35",
    rotation: "-2deg",
    url: "https://photos.hunterchen.ca/HC_01728-Enhanced-NR.jpg",
    thumbnailUrl:
      "https://photos.hunterchen.ca/HC_01728-Enhanced-NR-thumb.webp",
  },
  // deer
  {
    caption: "2025/08/23 22:17:27",
    rotation: "-4deg",
    url: "https://photos.hunterchen.ca/HC_04701.jpg",
    thumbnailUrl: "https://photos.hunterchen.ca/HC_04701-thumb.webp",
  },
  // plane upsdie don
  {
    caption: "2025/09/05 23:20:11",
    rotation: "-2deg",
    url: "https://photos.hunterchen.ca/HC_06296-Enhanced-NR.jpg",
    thumbnailUrl:
      "https://photos.hunterchen.ca/HC_06296-Enhanced-NR-thumb.webp",
  },
  // ny
  {
    caption: "2025/08/20 23:27:07",
    rotation: "-4deg",
    url: "https://photos.hunterchen.ca/HC_03358.jpg",
    thumbnailUrl: "https://photos.hunterchen.ca/HC_03358-thumb.webp",
  },
  // plane sanwich
  {
    caption: "2025/09/06 00:30:04",
    rotation: "2deg",
    url: "https://photos.hunterchen.ca/HC_07534.jpg",
    thumbnailUrl: "https://photos.hunterchen.ca/HC_07534-thumb.webp",
  },
  // boat
  {
    caption: "2024/08/29 01:09:31",
    rotation: "3deg",
    url: "https://photos.hunterchen.ca/HC_04198.jpg",
    thumbnailUrl: "https://photos.hunterchen.ca/HC_04198-thumb.webp",
  },
];

const CARD_WIDTH = 260;
const CARD_HEIGHT = 300;

// Shared polaroid content component
const PolaroidCardContent = ({
  caption,
  thumbnailUrl,
  fullUrl,
  onImageClick,
}: {
  caption: string;
  thumbnailUrl?: string;
  fullUrl?: string;
  onImageClick?: (e: React.MouseEvent) => void;
}) => {
  return (
    <div className="absolute inset-0 bg-white shadow-xl">
      {/* Image area */}
      <div
        className={`m-3 h-[240px] bg-gray-200 flex items-center justify-center overflow-hidden relative ${onImageClick ? "cursor-pointer" : ""}`}
        onClick={onImageClick}
      >
        {thumbnailUrl ? (
          <>
            <img
              src={thumbnailUrl}
              alt={caption}
              draggable={false}
              className="h-full w-full object-cover"
            />
            {fullUrl && fullUrl !== thumbnailUrl && (
              <img
                src={fullUrl}
                alt={caption}
                className="h-full w-full object-cover absolute inset-0"
              />
            )}
          </>
        ) : (
          <div className="text-4xl text-gray-400">📷</div>
        )}
      </div>
      {/* Caption area */}
      <div className="px-4">
        <p
          className="text-center text-xs leading-tight text-gray-600"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          {caption}
        </p>
      </div>
    </div>
  );
};

const PolaroidCard = ({
  caption,
  className,
  rotation,
  thumbnailUrl,
  onImageClick,
}: {
  caption: string;
  className?: string;
  rotation?: string;
  thumbnailUrl?: string;
  onImageClick: (rect: DOMRect) => void;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      onImageClick(rect);
    }
  };

  return (
    <Draggable>
      <motion.div
        ref={cardRef}
        className={`relative h-[300px] w-[260px] cursor-grab transition-all ${className} active:cursor-grabbing`}
        style={{ perspective: 1200, rotate: rotation }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <PolaroidCardContent
          caption={caption}
          thumbnailUrl={thumbnailUrl}
          onImageClick={handleClick}
        />
      </motion.div>
    </Draggable>
  );
};

const ExifCard = ({
  exif,
  isLoading,
}: {
  exif: ExifData;
  isLoading: boolean;
}) => {
  const hasData =
    exif.camera || exif.lensModel || exif.shutter || exif.aperture || exif.iso;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: 0.2, duration: 0.3 }}
      className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-4 min-w-[200px] max-w-[240px] cursor-auto"
      onClick={(e) => e.stopPropagation()}
    >
      <h3 className="text-sm font-medium text-gray-800 mb-3 border-b border-gray-200 pb-2">
        Photo Info
      </h3>
      {isLoading ? (
        <div className="text-xs text-gray-500 animate-pulse">
          Loading metadata...
        </div>
      ) : !hasData ? (
        <div className="text-xs text-gray-500">No EXIF data available</div>
      ) : (
        <div className="space-y-2 text-xs text-gray-700">
          {exif.camera && (
            <div className="flex items-start gap-2">
              <Camera className="w-3.5 h-3.5 mt-0.5 text-gray-500 flex-shrink-0" />
              <span>{exif.camera}</span>
            </div>
          )}
          {exif.lensModel && (
            <div className="flex items-start gap-2">
              <Telescope className="w-3.5 h-3.5 mt-0.5 text-gray-500 flex-shrink-0" />
              <span>{exif.lensModel}</span>
            </div>
          )}
          {(exif.shutter || exif.aperture || exif.iso || exif.focalLength) && (
            <div className="flex items-start gap-2">
              <Aperture className="w-3.5 h-3.5 mt-0.5 text-gray-500 flex-shrink-0" />
              <div className="flex flex-wrap gap-x-2">
                {exif.shutter && <span>{exif.shutter}s</span>}
                {exif.aperture && <span>{exif.aperture}</span>}
                {exif.iso && <span>ISO {exif.iso}</span>}
                {exif.focalLength && <span>{exif.focalLength}</span>}
              </div>
            </div>
          )}
          {exif.width && exif.height && (
            <div className="flex items-start gap-2">
              <ImageIcon className="w-3.5 h-3.5 mt-0.5 text-gray-500 flex-shrink-0" />
              <span>
                {exif.width} × {exif.height}
                {exif.megapixels && ` (${exif.megapixels} MP)`}
              </span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

const ExpandedPolaroid = ({
  photo,
  startRect,
  onClose,
}: {
  photo: Photo;
  startRect: DOMRect;
  onClose: () => void;
}) => {
  const [exif, setExif] = useState<ExifData>({});
  const [exifLoading, setExifLoading] = useState(true);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Fetch EXIF data when modal opens
  useEffect(() => {
    if (photo.url) {
      setExifLoading(true);
      fetchExifFromUrl(photo.url)
        .then(setExif)
        .finally(() => setExifLoading(false));
    }
  }, [photo.url]);

  // Calculate the scale to fill most of the screen while maintaining aspect ratio
  // Account for the EXIF card width (260px + gap)
  const exifCardSpace = 280;
  const availableWidth = window.innerWidth - exifCardSpace;
  const maxWidthScale = (availableWidth * 0.75) / CARD_WIDTH;
  const maxHeightScale = (window.innerHeight * 0.85) / CARD_HEIGHT;
  const targetScale = Math.min(maxWidthScale, maxHeightScale);

  // Calculate positions - polaroid slightly left of center, exif card to the right
  const totalWidth = CARD_WIDTH * targetScale + exifCardSpace;
  const startX = (window.innerWidth - totalWidth) / 2;
  const centerX = startX;
  const centerY = window.innerHeight / 2 - (CARD_HEIGHT * targetScale) / 2;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm cursor-pointer"
      onClick={onClose}
      onContextMenu={(e) => e.stopPropagation()}
    >
      {/* Polaroid card */}
      <motion.div
        initial={{
          x: startRect.left,
          y: startRect.top,
          scale: 1,
          rotate: photo.rotation || "0deg",
        }}
        animate={{
          x: centerX,
          y: centerY,
          scale: targetScale,
          rotate: "0deg",
        }}
        exit={{
          x: startRect.left,
          y: startRect.top,
          scale: 1,
          rotate: photo.rotation || "0deg",
        }}
        transition={{
          type: "spring",
          damping: 25,
          stiffness: 200,
        }}
        style={{
          position: "fixed",
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          transformOrigin: "top left",
        }}
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.stopPropagation()}
        className="cursor-default"
      >
        <PolaroidCardContent
          caption={photo.caption}
          thumbnailUrl={photo.thumbnailUrl}
          fullUrl={photo.url}
        />
      </motion.div>

      {/* EXIF metadata card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed",
          left: centerX + CARD_WIDTH * targetScale + 24,
          top: centerY,
        }}
      >
        <ExifCard exif={exif} isLoading={exifLoading} />
      </motion.div>
    </motion.div>,
    document.body,
  );
};

export default function GallerySection({ offset }: GallerySectionProps) {
  const [selected, setSelected] = useState<SelectedPhoto | null>(null);

  const handleImageClick = (photo: Photo) => (rect: DOMRect) => {
    setSelected({ photo, rect });
  };

  return (
    <>
      <CanvasComponent offset={offset}>
        <div className="flex h-full w-full items-center justify-center pb-8 sm:pb-0 sm:pt-4">
          <div className="mx-auto flex items-center gap-16">
            {/* Left 2 polaroids */}
            <div className="flex flex-col gap-12">
              <PolaroidCard
                caption={photos[0]!.caption}
                rotation={photos[0]!.rotation}
                thumbnailUrl={photos[0]!.thumbnailUrl}
                onImageClick={handleImageClick(photos[0]!)}
              />
              <PolaroidCard
                caption={photos[1]!.caption}
                rotation={photos[1]!.rotation}
                thumbnailUrl={photos[1]!.thumbnailUrl}
                onImageClick={handleImageClick(photos[1]!)}
              />
            </div>

            {/* Middle section with cards and title */}
            <div className="flex flex-col items-center gap-14">
              <div className="flex gap-12">
                <PolaroidCard
                  caption={photos[2]!.caption}
                  rotation={photos[2]!.rotation}
                  thumbnailUrl={photos[2]!.thumbnailUrl}
                  onImageClick={handleImageClick(photos[2]!)}
                />
                <PolaroidCard
                  caption={photos[3]!.caption}
                  rotation={photos[3]!.rotation}
                  thumbnailUrl={photos[3]!.thumbnailUrl}
                  onImageClick={handleImageClick(photos[3]!)}
                />
              </div>

              <div className="flex w-96 flex-col items-center justify-center">
                <h2 className="mb-4 text-center text-2xl font-thin text-fuchsia-200">
                  gallery
                </h2>
                <div className="w-2/3 text-center text-sm text-fuchsia-300/60">
                  a collection of some photos i took that i like :)
                </div>
                <a
                  href="https://gallery.hunterchen.ca/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 text-xs text-fuchsia-300/80 hover:text-fuchsia-200 transition-colors"
                >
                  see more →
                </a>
              </div>

              <div className="flex gap-12">
                <PolaroidCard
                  caption={photos[4]!.caption}
                  rotation={photos[4]!.rotation}
                  thumbnailUrl={photos[4]!.thumbnailUrl}
                  onImageClick={handleImageClick(photos[4]!)}
                />
                <PolaroidCard
                  caption={photos[5]!.caption}
                  rotation={photos[5]!.rotation}
                  thumbnailUrl={photos[5]!.thumbnailUrl}
                  onImageClick={handleImageClick(photos[5]!)}
                />
              </div>
            </div>

            {/* Right 2 polaroids */}
            <div className="flex flex-col gap-12">
              <PolaroidCard
                caption={photos[6]!.caption}
                rotation={photos[6]!.rotation}
                thumbnailUrl={photos[6]!.thumbnailUrl}
                onImageClick={handleImageClick(photos[6]!)}
              />
              <PolaroidCard
                caption={photos[7]!.caption}
                rotation={photos[7]!.rotation}
                thumbnailUrl={photos[7]!.thumbnailUrl}
                onImageClick={handleImageClick(photos[7]!)}
              />
            </div>
          </div>
        </div>
      </CanvasComponent>

      <AnimatePresence>
        {selected && (
          <ExpandedPolaroid
            photo={selected.photo}
            startRect={selected.rect}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
