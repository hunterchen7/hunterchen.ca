import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { AnimatedLink } from "../AnimatedLink";
import ContactCard from "./ContactCard";
import FunCard from "./FunCard";
import ProjectsCard from "./ProjectsCard";
import type { Card } from "./FlipCard";

export const SHARED_GRADIENT =
  "radial-gradient(ellipse at 50% 50%, #5a2d6e 0%, #3d1a50 40%, #2a1035 70%, #1e0a28 100%)";

const pillLinkClass =
  "relative inline-flex items-center rounded-full border border-fuchsia-200/15 bg-fuchsia-950/35 px-1.5 py-0.5 text-[8px] md:text-xs md:px-2.5 md:py-1 text-fuchsia-100/85 overflow-hidden";

function PillLink({ href, children }: { href: string; children: string }) {
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
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
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
            ? `radial-gradient(37px circle at ${mouse.x}px ${mouse.y}px, rgba(217, 70, 239, 0.2), transparent 60%)`
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
          boxShadow: "inset 0 0 0 1px rgba(217, 70, 239, 0.5)",
        }}
      />
      <span className="relative z-10">{children}</span>
    </a>
  );
}

export const cards: Card[] = [
  {
    id: "1",
    front: "work",
    frontAnchor: "bottom-right",
    back: (
      <div className="h-full w-full flex flex-col justify-between gap-4 text-left">
        <div className="max-w-[34ch] space-y-3 text-[10.5px] md:text-sm lg:text-base leading-relaxed">
          <p>
            I&apos;m currently building frontend & mobile with React and React
            Native at{" "}
            <AnimatedLink href="https://geneial.com">geneial</AnimatedLink>.
          </p>
          <p>
            I&apos;ve also built fullstack web apps for{" "}
            <AnimatedLink href="https://mora.do">mora.do</AnimatedLink> and{" "}
            <AnimatedLink href="https://aramid.finance">aramid</AnimatedLink>.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PillLink href="https://www.linkedin.com/in/hunterchen">
            LinkedIn
          </PillLink>
          <PillLink href="https://github.com/hunterchen7">GitHub</PillLink>
          <PillLink href="https://hunterchen.ca/resume.pdf">Resume</PillLink>
        </div>
      </div>
    ),
    gridArea: "[grid-area:1/1/3/4] md:[grid-area:1/1/3/3]",
    color: "#462858",
  },
  {
    id: "3",
    front: "projects",
    frontAnchor: "bottom-left",
    back: <ProjectsCard />,
    gridArea: "[grid-area:1/4/4/6] md:[grid-area:1/3/3/5]",
    color: "#48205a",
  },
  {
    id: "2",
    front: "hobbies",
    frontAnchor: "top-left-lower",
    back: <FunCard />,
    gridArea: "[grid-area:4/4/7/6] md:[grid-area:3/3/5/5]",
    color: "#532963",
  },
  {
    id: "4",
    front: "hackathons",
    frontAnchor: "top-right",
    back: (
      <div className="h-full w-full flex flex-col gap-3 md:gap-4">
        <div className="text-[10.5px] md:text-sm leading-relaxed text-left text-balance">
          Avid hackathon attendee and former organizer. I helped build web for{" "}
          <AnimatedLink href="https://2024.hackwestern.com">
            Hack Western 2024
          </AnimatedLink>{" "}
          and led the dev team for{" "}
          <AnimatedLink href="https://hackwestern.com">
            Hack Western 2025
          </AnimatedLink>
          ,{" "}
          <AnimatedLink href="https://www.uwo.ca">
            Western University
          </AnimatedLink>
          's largest hackathon.
        </div>
        <div className="relative min-h-[130px] md:min-h-[170px] flex-1 overflow-hidden rounded-lg border border-fuchsia-200/15 shadow-[0_12px_26px_rgba(0,0,0,0.22)]">
          <motion.img
            src="hero/team.webp"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#140a1d]/95 via-[#140a1d]/55 to-transparent px-3 py-2">
            <p className="text-[10px] md:text-xs text-fuchsia-100/90 text-center">
              my team @ hack western 12 💜
            </p>
          </div>
        </div>
      </div>
    ),
    gridArea: "[grid-area:4/1/7/4] md:[grid-area:4/1/6/3]",
    color: "#471f52",
  },
  {
    id: "5",
    front: "say hello!",
    frontAnchor: "top-left",
    backVariant: "classic",
    back: <ContactCard />,
    gridArea: "[grid-area:7/1/8/6] md:[grid-area:5/3/6/5]",
    color: "#442662",
  },
];
