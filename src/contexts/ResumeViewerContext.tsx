import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Download, ExternalLink, X } from "lucide-react";
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
  const closeButtonRef = useRef<HTMLButtonElement>(null);
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
      closeButtonRef.current?.focus();
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
            className="flex h-[min(98vh,1080px)] w-[min(98vw,980px)] flex-col overflow-hidden rounded-xl border border-fuchsia-300/25 bg-[#17131b] shadow-[0_28px_90px_rgba(0,0,0,0.65),0_0_50px_rgba(126,76,164,0.14)]"
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
            <header className="flex min-h-12 items-center justify-end gap-3 border-b border-fuchsia-200/15 bg-[#211a27] px-3 py-2 sm:px-4">
              <a
                href={RESUME_URL}
                download="Hunter-Chen-Resume.pdf"
                aria-label="Download resume"
                title="Download resume"
                className="inline-flex rounded-md border border-fuchsia-200/20 p-2 text-fuchsia-100/80 transition-colors hover:bg-fuchsia-100/10 hover:text-fuchsia-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-200"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href={RESUME_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open resume PDF in a new tab"
                title="Open resume PDF in a new tab"
                className="inline-flex rounded-md border border-fuchsia-200/20 p-2 text-fuchsia-100/80 transition-colors hover:bg-fuchsia-100/10 hover:text-fuchsia-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-200"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                aria-label="Close resume viewer"
                className="inline-flex rounded-md border border-fuchsia-200/20 p-2 text-fuchsia-100/70 transition-colors hover:bg-fuchsia-100/10 hover:text-fuchsia-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-200"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </header>

            <div className="min-h-0 flex-1 bg-[#ececf0]">
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
