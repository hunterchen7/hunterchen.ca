import type { CSSProperties } from "react";

export const HERO_COLORS = {
  surface: "#161519",
  raised: "#24212a",
  ink: "#0d0a14",
  deep: "#3d1a50",
  mid: "#453260",
  accent: "#c084fc",
  light: "#f5d0fe",
} as const;

export const HERO_RGB = {
  ink: [13, 10, 20],
  deep: [61, 26, 80],
  mid: [69, 50, 96],
  accent: [192, 132, 252],
  light: [245, 208, 254],
} as const;

export type HeroTone = keyof typeof HERO_RGB;

export function heroRgba(tone: HeroTone, alpha: number): string {
  const [red, green, blue] = HERO_RGB[tone];
  return `rgba(${red}, ${green}, ${blue}, ${alpha.toFixed(3)})`;
}

export function litHeroTone(tone: HeroTone, lift: number): string {
  const [red, green, blue] = HERO_RGB[tone];
  const channel = (value: number) => Math.min(255, Math.round(value + lift));
  return `rgb(${channel(red)}, ${channel(green)}, ${channel(blue)})`;
}

export const HERO_THEME_STYLE = {
  "--hero-surface": HERO_COLORS.surface,
  "--hero-raised": HERO_COLORS.raised,
  "--hero-ink": HERO_COLORS.ink,
  "--hero-deep": HERO_COLORS.deep,
  "--hero-mid": HERO_COLORS.mid,
  "--hero-accent": HERO_COLORS.accent,
  "--hero-light": HERO_COLORS.light,
  "--hero-border": heroRgba("accent", 0.45),
} as CSSProperties;
