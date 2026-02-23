import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PerformanceProvider } from "@hunterchen/canvas";

import "@hunterchen/canvas/styles.css";
import "./styles/globals.css";

import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PerformanceProvider>
      <main className="font-mono">
        <App />
      </main>
    </PerformanceProvider>
  </StrictMode>,
);
