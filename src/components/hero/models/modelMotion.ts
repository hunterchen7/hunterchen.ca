import {
  usePerformanceMode,
  type PerformanceMode,
} from "@hunterchen/canvas";
import type { CSSProperties } from "react";
import { useHeroModelAnimationReady } from "../modelAnimationContext";

export type AnimatedModel = "camera" | "chess" | "laptop" | "rocket";

const MODEL_FPS: Record<
  PerformanceMode,
  Record<AnimatedModel, number>
> = {
  high: { camera: 24, chess: 60, laptop: 60, rocket: 24 },
  medium: { camera: 20, chess: 30, laptop: 20, rocket: 20 },
  low: { camera: 15, chess: 20, laptop: 15, rocket: 15 },
};

export function useModelTiming(model: AnimatedModel) {
  const { mode, prefersReducedMotion } = usePerformanceMode();
  const animationReady = useHeroModelAnimationReady();
  const fps = MODEL_FPS[mode][model];

  return {
    animationReady,
    fps,
    frameIntervalMs: 1_000 / fps,
    prefersReducedMotion: prefersReducedMotion || !animationReady,
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
