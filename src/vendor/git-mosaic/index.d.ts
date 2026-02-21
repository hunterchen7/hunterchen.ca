import * as react0 from "react";
import * as react1 from "react";

//#region src/types.d.ts
interface GitData {
  stats: {
    totalCommits: number;
    totalContributionDays: number;
    dateRange: {
      from: string;
      to: string;
    };
    hourDistribution: number[];
    dayDistribution: number[];
    fetchDuration: string;
    fetchTimestamp: string;
  };
  commits: CommitData[];
  rawContributions: ContributionDay[];
}
interface CommitData {
  date: string;
  hour?: number;
  count: number;
  weekday: number;
}
interface ContributionDay {
  date: string;
  contributionCount: number;
  weekday: number;
}
type Variant = 'daily-bloom' | 'daily-rings' | 'daily-spiral';
type ColorScheme = 'aurora' | 'cosmic' | 'monochrome' | 'sunset' | 'matrix' | 'nebula' | 'ocean' | 'ember';
interface CustomColorPalette {
  background: string;
  primary: string[];
  accent: string;
}
interface GitMosaicProps {
  username?: string;
  data?: GitData;
  dataUrl?: string;
  variant?: Variant;
  width?: number;
  height?: number;
  colorScheme?: ColorScheme;
  customColors?: CustomColorPalette;
  className?: string;
  animated?: boolean;
  speed?: number;
  particleCount?: number;
  lifetimeSeconds?: number;
  maxRadius?: number;
  initialSpeed?: number;
  acceleration?: number;
  deceleration?: number;
  spawnRate?: number;
  particleGlow?: number;
  particleScale?: number;
  fadeInDuration?: number;
  interactive?: boolean;
  hoverGlow?: boolean;
  glowRadius?: number;
  glowIntensity?: number;
  mouseRepel?: boolean;
  repelRadius?: number;
  repelStrength?: number;
  mouseAttract?: boolean;
  attractRadius?: number;
  attractStrength?: number;
  luminanceBoost?: boolean;
  luminanceRadius?: number;
  luminanceAmount?: number;
  sizeOnHover?: boolean;
  sizeRadius?: number;
  sizeMultiplier?: number;
  mouseX?: number;
  mouseY?: number;
  mouseTransform?: (x: number, y: number) => {
    x: number;
    y: number;
  };
  spiralTurnRate?: number;
  spiralExpansion?: number;
  spiralClockwise?: boolean;
  spiralCenterOffset?: number;
  bloomVelocity?: number;
  bloomSpread?: number;
  ringsWobble?: number;
  ringsArcLength?: number;
  ringsClockwise?: boolean;
  clearTrigger?: number;
  resetTrigger?: number;
  onDayChange?: (dayInfo: {
    day: number;
    total: number;
    date: string;
  }) => void;
  paused?: boolean;
  showAllDays?: boolean;
} //#endregion
//#region src/utils/colorSchemes.d.ts
interface ColorPalette {
  background: string;
  primary: string[];
  accent: string;
}
declare const colorSchemes: Record<ColorScheme, ColorPalette>;

//#endregion
//#region src/components/variants/DailySpiral.d.ts
interface DailySpiralHandle {
  setColors: (colors: string[]) => void;
}

//#endregion
//#region src/components/GitMosaic.d.ts
type GitMosaicHandle = DailySpiralHandle;
declare const GitMosaic: react1.ForwardRefExoticComponent<GitMosaicProps & react0.RefAttributes<DailySpiralHandle>>;

//#endregion
export { ColorScheme, ContributionDay, CustomColorPalette, GitData, GitMosaic, GitMosaicHandle, GitMosaicProps, Variant, colorSchemes };
//# sourceMappingURL=index.d.ts.map