import { usePerformanceMode } from "@hunterchen/canvas";
import type { CSSProperties } from "react";
import { useHeroModelAnimationReady } from "../modelAnimationContext";

export type AnimatedModel = "camera" | "chess" | "laptop" | "rocket";

// Every model targets 60fps on every device — frame rate is never the
// performance lever. Weaker devices get simplified geometry/effects (see
// `simplified` below), not a lower cadence. The rAF interval gate still
// matters on >60Hz displays, where it stops the JS update loops from running
// at 120/144fps and doubling their CPU cost.
const TARGET_FPS = 60;

export function useModelTiming(_model: AnimatedModel) {
  const { mode, prefersReducedMotion } = usePerformanceMode();
  const animationReady = useHeroModelAnimationReady();

  return {
    animationReady,
    fps: TARGET_FPS,
    frameIntervalMs: 1_000 / TARGET_FPS,
    prefersReducedMotion: prefersReducedMotion || !animationReady,
    // On non-desktop devices the models drop decorative detail (fewer SVG
    // nodes, no secondary effects) instead of dropping frame rate. Resolved
    // before any geometry is built, so simplified variants are constructed
    // directly rather than stripped after the fact.
    simplified: mode !== "high",
  };
}

export function readPinnedModelFrame(): number | null {
  if (!import.meta.env.DEV || typeof window === "undefined") return null;

  const rawFrame = new URLSearchParams(window.location.search).get(
    "modelFrame",
  );
  if (rawFrame === null) return null;

  const parsed = Number(rawFrame);
  if (!Number.isFinite(parsed)) return null;
  return Math.min(1, Math.max(0, parsed / 100));
}

export function modelAnimationStyle(
  frame: number | null,
  durationSeconds: number,
  phaseSeconds = 0,
): CSSProperties | undefined {
  if (frame === null) {
    return phaseSeconds === 0
      ? undefined
      : { animationDelay: `${phaseSeconds}s` };
  }

  const localTime =
    ((frame * durationSeconds - phaseSeconds) % durationSeconds +
      durationSeconds) %
    durationSeconds;

  return {
    animationDelay: `-${localTime}s`,
    animationPlayState: "paused",
  };
}
