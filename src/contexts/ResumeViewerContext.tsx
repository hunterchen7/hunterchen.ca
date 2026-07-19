import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { ResumeViewerContext } from "./resumeViewer";

const RESUME_URL = "/resume.pdf";

export function ResumeViewerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const openResume = useCallback(() => setIsOpen(true), []);
  const closeResume = useCallback(() => setIsOpen(false), []);
  const value = useMemo(() => ({ openResume }), [openResume]);

  return (
    <ResumeViewerContext.Provider value={value}>
      {children}
      <ResumeViewerDialog isOpen={isOpen} onClose={closeResume} />
    </ResumeViewerContext.Provider>
  );
}

function ResumeViewerDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    const mainContent = document.querySelector("main");
    const mainWasInert = mainContent?.hasAttribute("inert") ?? false;
    document.body.style.overflow = "hidden";
    mainContent?.setAttribute("inert", "");

    const focusFrame = window.requestAnimationFrame(() => {
      dialogRef.current?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      const activeElement = document.activeElement;

      if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (!mainWasInert) mainContent?.removeAttribute("inert");
      previousFocusRef.current?.focus({ preventScroll: true });
    };
  }, [isOpen, onClose]);

  if (typeof document === "undefined") return null;

  const transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.22, ease: "easeOut" as const };

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/75 p-1 font-mono backdrop-blur-sm sm:p-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transition}
          onClick={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Resume viewer"
            tabIndex={-1}
            className="relative h-[min(98vh,1080px)] w-[min(98vw,980px)] outline-none"
            initial={
              prefersReducedMotion
                ? false
                : { opacity: 0, scale: 0.98, y: 12 }
            }
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 0.98, y: 12 }
            }
            transition={transition}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close resume viewer"
              className="absolute right-2 top-2 z-10 inline-flex p-1.5 text-white/70 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] transition-[color,transform] hover:scale-110 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-200 sm:-right-10 sm:top-0"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>

            <div className="h-full overflow-hidden rounded-xl border border-fuchsia-300/25 bg-[#ececf0] shadow-[0_28px_90px_rgba(0,0,0,0.65),0_0_50px_rgba(126,76,164,0.14)]">
              <iframe
                src={RESUME_URL + "#page=1&view=Fit&navpanes=0"}
                title="Hunter Chen resume PDF"
                className="h-full w-full border-0"
              >
                <p>
                  Your browser cannot display this PDF.{" "}
                  <a href={RESUME_URL}>Download the resume</a>.
                </p>
              </iframe>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
