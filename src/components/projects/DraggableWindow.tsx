import { useRef, useEffect, type ReactNode } from "react";
import { motion, useDragControls } from "framer-motion";
import { X } from "lucide-react";
import { Draggable } from "@hunterchen/canvas";

interface DraggableWindowProps {
  title: string;
  width?: number;
  maxHeight?: number;
  onClose: () => void;
  initialPos?: { x: number; y: number };
  contentClassName?: string;
  children: ReactNode;
}

export default function DraggableWindow({
  title,
  width = 880,
  maxHeight = 600,
  onClose,
  initialPos,
  contentClassName,
  children,
}: DraggableWindowProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  // Native wheel listener to prevent canvas zoom from intercepting content scrolling.
  // React's onWheel stopPropagation doesn't work here because the canvas uses a
  // native wheel listener that fires before React processes the synthetic event.
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const stopWheel = (e: WheelEvent) => e.stopPropagation();
    el.addEventListener("wheel", stopWheel);
    return () => el.removeEventListener("wheel", stopWheel);
  }, []);

  return (
    <Draggable
      initialPos={initialPos ?? { x: 0, y: 0 }}
      dragListener={false}
      dragControls={dragControls}
      className="pointer-events-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.85 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="bg-[#1a1528]/90 border-[1.5px] border-fuchsia-400/30 rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.5),0_0_80px_rgba(168,85,247,0.06)] backdrop-blur-xl flex flex-col overflow-hidden"
        style={{ width, maxHeight }}
      >
        {/* Title bar — drag handle */}
        <div
          onPointerDown={(e) => dragControls.start(e)}
          className="flex items-center justify-between px-4 py-2.5 border-b border-fuchsia-300/15 cursor-grab active:cursor-grabbing flex-shrink-0 select-none"
        >
          <h3 className="text-sm font-medium text-fuchsia-100/90">{title}</h3>
          <button
            onClick={onClose}
            onPointerDown={(e) => e.stopPropagation()}
            className="p-1 rounded-full text-neutral-500 hover:bg-fuchsia-400/10 hover:text-fuchsia-200/70 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content — scrollable */}
        <div
          ref={contentRef}
          className={`flex-1 min-h-0 overflow-y-auto ${contentClassName ?? ""}`}
        >
          {children}
        </div>
      </motion.div>
    </Draggable>
  );
}
