import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { AnimatedLink } from "../AnimatedLink";
import ContactCard from "./ContactCard";
import FunCard from "./FunCard";
import ContactDotsWatermark from "./models/ContactDotsWatermark";
import {
  CameraWatermark,
  ChessboardWatermark,
  LaptopWatermark,
  RocketWatermark,
} from "./deferredHeroModels";
import ProjectsCard from "./ProjectsCard";
import type { Card } from "./FlipCard";
import { heroRgba } from "./heroPalette";
import { useResumeViewer } from "../../contexts/resumeViewer";

export const SHARED_GRADIENT = "var(--surface-panel)";

const pillLinkClass =
  "relative inline-flex items-center rounded-full border border-[color:var(--hero-border)] bg-[color:var(--hero-surface)] px-1.5 py-0.5 text-[8px] md:text-xs md:px-2.5 md:py-1 text-[color:var(--hero-accent)] overflow-hidden transition-colors hover:text-[color:var(--hero-light)]";

function PillLink({
  href,
  children,
  onActivate,
}: {
  href: string;
  children: string;
  onActivate?: () => void;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    // Convert screen-space to layout-space (accounts for canvas zoom)
    const scaleX = el.offsetWidth / rect.width;
    const scaleY = el.offsetHeight / rect.height;
    setMouse({
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    });
  };

  return (
    <a
      ref={ref}
      href={href}
      target={onActivate ? undefined : "_blank"}
      rel={onActivate ? undefined : "noopener noreferrer"}
      onClick={(event) => {
        event.stopPropagation();
        if (onActivate) {
          event.preventDefault();
          onActivate();
        }
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMouse(null)}
      className={pillLinkClass}
    >
      {/* cursor-tracking glow */}
      <span
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: mouse ? 1 : 0,
          background: mouse
            ? `radial-gradient(37px circle at ${mouse.x}px ${mouse.y}px, ${heroRgba("accent", 0.25)}, transparent 60%)`
            : undefined,
        }}
      />
      {/* cursor-tracking border highlight */}
      <span
        className="pointer-events-none absolute inset-0 rounded-full transition-opacity duration-300"
        style={{
          opacity: mouse ? 1 : 0,
          mask: mouse
            ? `radial-gradient(100px circle at ${mouse.x}px ${mouse.y}px, black 30%, transparent 70%)`
            : undefined,
          WebkitMask: mouse
            ? `radial-gradient(100px circle at ${mouse.x}px ${mouse.y}px, black 30%, transparent 70%)`
            : undefined,
          boxShadow: `inset 0 0 0 1px ${heroRgba("accent", 0.6)}`,
        }}
      />
      <span className="relative z-10">{children}</span>
    </a>
  );
}

function ResumePillLink() {
  const { openResume } = useResumeViewer();

  return (
    <PillLink href="/resume.pdf" onActivate={openResume}>
      Resume
    </PillLink>
  );
}

export const cards: Card[] = [
  {
    id: "1",
    front: "work",
    frontAnchor: "bottom-right",
    frontArtwork: <LaptopWatermark />,
    frontArtworkClassName:
      "absolute left-1/2 top-[42%] h-[72%] w-[72%] -translate-x-1/2 -translate-y-1/2 md:h-[73%] md:w-[70%]",
    back: (
      <div className="h-full w-full flex flex-col justify-between gap-4 text-left">
        <div className="max-w-[34ch] space-y-3 text-[10.5px] md:text-sm lg:text-base leading-relaxed">
          <p>currently enjoying funemployment</p>
          <p>
            I&apos;ve previously built fullstack mobile & web apps for{" "}
            <AnimatedLink href="https://geneial.com">geneial</AnimatedLink>,{" "}
            <AnimatedLink href="https://mora.do">mora.do</AnimatedLink> and{" "}
            <AnimatedLink href="https://aramid.finance">aramid</AnimatedLink>.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PillLink href="https://www.linkedin.com/in/hunterchen">
            LinkedIn
          </PillLink>
          <PillLink href="https://github.com/hunterchen7">GitHub</PillLink>
          <ResumePillLink />
        </div>
      </div>
    ),
    gridArea: "[grid-area:1/1/3/4] md:[grid-area:1/1/3/3]",
    color: "var(--surface-mid)",
  },
  {
    id: "3",
    front: "projects",
    frontAnchor: "bottom-left",
    frontArtwork: <ChessboardWatermark />,
    frontArtworkClassName:
      "absolute left-1/2 top-1/2 h-[74%] w-[82%] -translate-x-1/2 -translate-y-1/2 md:h-[76%] md:w-[78%]",
    back: <ProjectsCard />,
    gridArea: "[grid-area:1/4/4/6] md:[grid-area:1/3/3/5]",
    color: "var(--surface-mid)",
  },
  {
    id: "2",
    front: "hobbies",
    frontAnchor: "top-left",
    frontArtwork: <CameraWatermark />,
    frontArtworkClassName:
      "absolute left-1/2 top-1/2 h-[64%] w-[74%] -translate-x-1/2 -translate-y-1/2 md:w-[66%]",
    back: <FunCard />,
    gridArea: "[grid-area:4/4/7/6] md:[grid-area:3/3/5/5]",
    color: "var(--surface-mid)",
  },
  {
    id: "4",
    front: "hackathons",
    frontAnchor: "top-right",
    frontArtwork: <RocketWatermark />,
    frontArtworkClassName:
      "absolute left-1/2 top-1/2 h-[58%] w-[58%] -translate-x-1/2 -translate-y-1/2",
    back: (
      <div className="h-full w-full flex flex-col gap-3 md:gap-4">
        <div className="text-[10.5px] md:text-sm leading-relaxed text-left text-balance">
          led dev team to build web experiences for 3000+ students @{" "}
          <AnimatedLink href="https://2024.hackwestern.com">
            hack western 2024
          </AnimatedLink>{" "}
          and{" "}
          <AnimatedLink href="https://2025.hackwestern.com">
            hack western 2025
          </AnimatedLink>
          ,{" "}
          <AnimatedLink href="https://www.uwo.ca">
            western university
          </AnimatedLink>
          's flagship hackathon.
        </div>
        <div className="relative min-h-[130px] md:min-h-[170px] flex-1 overflow-hidden rounded-lg border border-[color:var(--hero-border)] shadow-[0_12px_26px_rgba(0,0,0,0.22)]">
          <motion.img
            src="hero/team.webp"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[color:var(--hero-ink)] via-[color:var(--hero-deep)] to-transparent px-3 py-2">
            <p className="text-[10px] md:text-xs text-[color:var(--hero-light)] text-center">
              my team @ hack western 12 💜
            </p>
          </div>
        </div>
      </div>
    ),
    gridArea: "[grid-area:4/1/7/4] md:[grid-area:4/1/6/3]",
    color: "var(--surface-mid)",
  },
  {
    id: "5",
    front: "say hello!",
    frontAnchor: "top-left",
    frontArtwork: <ContactDotsWatermark />,
    frontArtworkClassName:
      "absolute bottom-3 right-3 h-9 w-24 md:bottom-6 md:right-6 md:h-10 md:w-28",
    backVariant: "classic",
    back: <ContactCard />,
    gridArea: "[grid-area:7/1/8/6] md:[grid-area:5/3/6/5]",
    color: "var(--surface-mid)",
  },
];
