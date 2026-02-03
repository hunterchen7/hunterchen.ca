import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink } from "lucide-react";
import { CanvasComponent, type SectionCoordinates } from "@hunterchen/canvas";

interface GallerySectionProps {
  offset: SectionCoordinates;
}

interface Photo {
  id: string;
  title: string;
  color: string;
  emoji: string;
}

// Placeholder photos - will be replaced with real images
const photos: Photo[] = [
  { id: "1", title: "Mountain Landscape", color: "from-sky-300 to-blue-400", emoji: "🏔️" },
  { id: "2", title: "City Lights", color: "from-amber-300 to-orange-400", emoji: "🌃" },
  { id: "3", title: "Nature Trail", color: "from-green-300 to-emerald-400", emoji: "🌲" },
  { id: "4", title: "Airshow", color: "from-slate-300 to-gray-400", emoji: "✈️" },
  { id: "5", title: "Sunset", color: "from-rose-300 to-pink-400", emoji: "🌅" },
  { id: "6", title: "Wildlife", color: "from-lime-300 to-green-400", emoji: "🦌" },
];

export default function GallerySection({ offset }: GallerySectionProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  return (
    <CanvasComponent offset={offset}>
      <div className="flex h-full w-full flex-col items-center justify-center p-8">
      <h2 className="mb-2 text-3xl font-thin text-fuchsia-200">gallery</h2>
      <p className="mb-8 text-sm text-fuchsia-300/60">
        a collection of some photos I took that I like :)
      </p>

      {/* Photo Grid */}
      <div className="grid grid-cols-3 gap-3">
        {photos.map((photo, index) => (
          <motion.button
            key={photo.id}
            onClick={() => setSelectedPhoto(photo)}
            className={`relative overflow-hidden rounded-lg shadow-md transition-all hover:-translate-y-1 hover:shadow-xl border border-fuchsia-800/20 ${
              index === 0 ? "col-span-2 row-span-2" : ""
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Placeholder gradient */}
            <div
              className={`flex items-center justify-center bg-gradient-to-br ${photo.color} ${
                index === 0 ? "h-48 w-full" : "h-20 w-24"
              }`}
            >
              <span className={index === 0 ? "text-5xl" : "text-2xl"}>
                {photo.emoji}
              </span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Link to full gallery */}
      <a
        href="https://hunterchen.ca/gallery"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 flex items-center gap-2 text-sm text-fuchsia-400 underline-offset-4 hover:text-fuchsia-300 hover:underline"
      >
        View full gallery
        <ExternalLink className="h-3 w-3" />
      </a>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/90 p-8"
            onClick={() => setSelectedPhoto(null)}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute right-6 top-6 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Photo */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-h-[80vh] max-w-[80vw]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Placeholder for actual image */}
              <div
                className={`flex h-96 w-[500px] items-center justify-center rounded-lg bg-gradient-to-br ${selectedPhoto.color}`}
              >
                <span className="text-8xl">{selectedPhoto.emoji}</span>
              </div>
              <p className="mt-4 text-center text-fuchsia-200">{selectedPhoto.title}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </CanvasComponent>
  );
}
