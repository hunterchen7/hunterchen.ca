import { usePerformanceMode } from "@hunterchen/canvas";
import type { CSSProperties } from "react";
import { useHeroModelAnimationReady } from "../modelAnimationContext";

export type AnimatedModel = "camera" | "chess" | "laptop" | "rocket";

// One cadence per model, identical across devices. Mobile used to run reduced
// caps (e.g. chess 30fps) which just read as choppy; instead the models render
// SIMPLER variants on mobile (see `simplified` below) and keep the full frame
// rate. Camera/rocket run 24fps everywhere by design (deliberate film-like
// cadence), not as a performance concession.
const MODEL_FPS: Record<AnimatedModel, number> = {
  camera: 24,
  chess: 60,
  laptop: 60,
  rocket: 24,
};

export function useModelTiming(model: AnimatedModel) {
  const { mode, prefersReducedMotion } = usePerformanceMode();
  const animationReady = useHeroModelAnimationReady();
  const fps = MODEL_FPS[model];

  return {
    animationReady,
    fps,
    frameIntervalMs: 1_000 / fps,
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
