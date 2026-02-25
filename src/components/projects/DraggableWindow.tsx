import { useRef, useState, useEffect, useCallback, type ReactNode } from "react";
import { motion, useDragControls } from "framer-motion";
import { X } from "lucide-react";
import { Draggable } from "@hunterchen/canvas";

const MIN_WIDTH = 320;
const MIN_HEIGHT = 200;

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
  width: initialWidth = 880,
  maxHeight = 600,
  onClose,
  initialPos,
  contentClassName,
  children,
}: DraggableWindowProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  const windowRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number | null }>({ w: initialWidth, h: null });
  const resizing = useRef<{ startX: number; startY: number; startW: number; startH: number } | null>(null);

  // Native wheel listener to prevent canvas zoom from intercepting content scrolling.
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const stopWheel = (e: WheelEvent) => e.stopPropagation();
    el.addEventListener("wheel", stopWheel);
    return () => el.removeEventListener("wheel", stopWheel);
  }, []);

  const onResizePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const actualH = windowRef.current?.offsetHeight ?? size.h ?? maxHeight;
      resizing.current = { startX: e.clientX, startY: e.clientY, startW: size.w, startH: actualH };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [size, maxHeight],
  );

  const onResizePointerMove = useCallback((e: React.PointerEvent) => {
    if (!resizing.current) return;
    const { startX, startY, startW, startH } = resizing.current;
    setSize({
      w: Math.max(MIN_WIDTH, startW + (e.clientX - startX)),
      h: Math.max(MIN_HEIGHT, startH + (e.clientY - startY)),
    });
  }, []);

  const onResizePointerUp = useCallback(() => {
    resizing.current = null;
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
        className="relative bg-[#1a1528]/90 border-[1.5px] border-fuchsia-400/30 rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.5),0_0_80px_rgba(168,85,247,0.06)] backdrop-blur-xl flex flex-col overflow-hidden"
        ref={windowRef}
        style={{ width: size.w, ...(size.h != null ? { height: size.h } : { maxHeight }) }}
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

        {/* Resize handle — bottom-right corner */}
        <div
          onPointerDown={onResizePointerDown}
          onPointerMove={onResizePointerMove}
          onPointerUp={onResizePointerUp}
          className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-10 group"
        >
          {/* Diagonal lines indicator */}
          <svg
            viewBox="0 0 16 16"
            className="w-full h-full text-fuchsia-400/30 group-hover:text-fuchsia-400/60 transition-colors"
          >
            <line x1="14" y1="6" x2="6" y2="14" stroke="currentColor" strokeWidth="1.5" />
            <line x1="14" y1="10" x2="10" y2="14" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
      </motion.div>
    </Draggable>
  );
}
