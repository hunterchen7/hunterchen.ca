import { createContext, useContext } from "react";

export interface ResumeViewerContextValue {
  openResume: () => void;
}

export const ResumeViewerContext =
  createContext<ResumeViewerContextValue | null>(null);

export function useResumeViewer() {
  const context = useContext(ResumeViewerContext);
  if (!context) {
    throw new Error("useResumeViewer must be used within ResumeViewerProvider");
  }
  return context;
}
