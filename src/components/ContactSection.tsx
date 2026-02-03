import { Github, Linkedin, Instagram } from "lucide-react";
import { CanvasComponent, type SectionCoordinates } from "@hunterchen/canvas";

interface ContactSectionProps {
  offset: SectionCoordinates;
}

export default function ContactSection({ offset }: ContactSectionProps) {
  return (
    <CanvasComponent offset={offset}>
      <div className="relative flex h-full w-full flex-col items-center justify-center p-8">
      <h2 className="text-4xl font-thin text-fuchsia-200">say hello!</h2>

      <a
        href="mailto:hello@hunterchen.ca"
        className="mt-8 text-xl text-fuchsia-400 underline-offset-4 hover:text-fuchsia-300 hover:underline"
      >
        hello@hunterchen.ca
      </a>

      {/* Social Links */}
      <div className="mt-8 flex gap-4">
        <a
          href="https://www.linkedin.com/in/hunterchen"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn"
          className="rounded-full bg-fuchsia-900/50 p-3 text-fuchsia-200 transition-all hover:scale-105 hover:bg-fuchsia-800/60 hover:text-fuchsia-100"
        >
          <Linkedin className="h-8 w-8" />
        </a>
        <a
          href="https://github.com/hunterchen7"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          className="rounded-full bg-fuchsia-900/50 p-3 text-fuchsia-200 transition-all hover:scale-105 hover:bg-fuchsia-800/60 hover:text-fuchsia-100"
        >
          <Github className="h-8 w-8" />
        </a>
        <a
          href="https://www.instagram.com/hunter.c_"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          className="rounded-full bg-fuchsia-900/50 p-3 text-fuchsia-200 transition-all hover:scale-105 hover:bg-fuchsia-800/60 hover:text-fuchsia-100"
        >
          <Instagram className="h-8 w-8" />
        </a>
      </div>
    </div>
    </CanvasComponent>
  );
}
