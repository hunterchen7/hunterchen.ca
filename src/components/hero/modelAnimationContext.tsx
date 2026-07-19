import { createContext, useContext, type ReactNode } from "react";

const HeroModelAnimationContext = createContext(true);

export function HeroModelAnimationProvider({
  children,
  ready,
}: {
  children: ReactNode;
  ready: boolean;
}) {
  return (
    <HeroModelAnimationContext.Provider value={ready}>
      {children}
    </HeroModelAnimationContext.Provider>
  );
}

export function useHeroModelAnimationReady(): boolean {
  return useContext(HeroModelAnimationContext);
}
