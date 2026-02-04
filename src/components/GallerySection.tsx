import { CanvasComponent, type SectionCoordinates } from "@hunterchen/canvas";
import { motion } from "framer-motion";

interface GallerySectionProps {
  offset: SectionCoordinates;
}

interface Photo {
  caption: string;
  rotation?: string;
  url?: string;
  thumbnailUrl?: string;
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

const PolaroidCard = ({
  caption,
  className,
  rotation,
  thumbnailUrl,
}: {
  caption: string;
  className?: string;
  rotation?: string;
  thumbnailUrl?: string;
}) => {
  return (
    <motion.div
      className={`relative h-[300px] w-[260px] cursor-pointer transition-all hover:scale-[1.02] ${className}`}
      style={{ perspective: 1200, rotate: rotation }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Polaroid card */}
      <div className="absolute inset-0 bg-white shadow-xl">
        {/* Image area */}
        <div className="m-3 h-[240px] bg-gray-200 flex items-center justify-center overflow-hidden">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={caption}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="text-4xl text-gray-400">📷</div>
          )}
        </div>
        {/* Caption area */}
        <div className="px-4">
          <p className="text-center font-mono text-xs leading-tight text-gray-700">
            {caption}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default function GallerySection({ offset }: GallerySectionProps) {
  return (
    <CanvasComponent offset={offset}>
      <div className="flex h-full w-full items-center justify-center pb-8 sm:pb-0 sm:pt-4">
        <div className="mx-auto flex items-center gap-16">
          {/* Left 2 polaroids */}
          <div className="flex flex-col gap-12">
            <PolaroidCard
              caption={photos[0]!.caption}
              rotation={photos[0]!.rotation}
              thumbnailUrl={photos[0]!.thumbnailUrl}
            />
            <PolaroidCard
              caption={photos[1]!.caption}
              rotation={photos[1]!.rotation}
              thumbnailUrl={photos[1]!.thumbnailUrl}
            />
          </div>

          {/* Middle section with cards and title */}
          <div className="flex flex-col items-center gap-14">
            <div className="flex gap-12">
              <PolaroidCard
                caption={photos[2]!.caption}
                rotation={photos[2]!.rotation}
                thumbnailUrl={photos[2]!.thumbnailUrl}
              />
              <PolaroidCard
                caption={photos[3]!.caption}
                rotation={photos[3]!.rotation}
                thumbnailUrl={photos[3]!.thumbnailUrl}
              />
            </div>

            <div className="flex w-96 flex-col items-center justify-center">
              <h2 className="mb-4 text-center text-2xl font-thin text-fuchsia-200">
                gallery
              </h2>
              <div className="w-2/3 text-center text-sm text-fuchsia-300/60">
                a collection of some photos i took that i like :)
              </div>
            </div>

            <div className="flex gap-12">
              <PolaroidCard
                caption={photos[4]!.caption}
                rotation={photos[4]!.rotation}
                thumbnailUrl={photos[4]!.thumbnailUrl}
              />
              <PolaroidCard
                caption={photos[5]!.caption}
                rotation={photos[5]!.rotation}
                thumbnailUrl={photos[5]!.thumbnailUrl}
              />
            </div>
          </div>

          {/* Right 2 polaroids */}
          <div className="flex flex-col gap-12">
            <PolaroidCard
              caption={photos[6]!.caption}
              rotation={photos[6]!.rotation}
              thumbnailUrl={photos[6]!.thumbnailUrl}
            />
            <PolaroidCard
              caption={photos[7]!.caption}
              rotation={photos[7]!.rotation}
              thumbnailUrl={photos[7]!.thumbnailUrl}
            />
          </div>
        </div>
      </div>
    </CanvasComponent>
  );
}
