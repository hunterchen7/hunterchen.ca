import { Github, Linkedin, Instagram, Twitter } from "lucide-react";

const socialLinkClass =
  "rounded-full bg-[color:var(--hero-deep)] p-2.5 text-[color:var(--hero-accent)] transition-all hover:scale-105 hover:bg-[color:var(--hero-mid)] hover:text-[color:var(--hero-light)]";

export default function ContactCard() {
  return (
    <div className="text-[10.5px] md:text-sm flex flex-col items-center justify-center h-full w-full">
      <a
        href="mailto:hello@hunterchen.ca"
        className="group mb-6 text-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-[color:var(--hero-accent)] group-hover:text-[color:var(--hero-light)] transition-colors text-xs md:text-base">
          hello@hunterchen.ca
        </span>
        <span className="block h-0 max-w-0 border-b border-[color:var(--hero-border)] transition-all duration-200 group-hover:max-w-full group-hover:border-[color:var(--hero-light)]" />
      </a>

      <div className="flex gap-3 scale-75 md:scale-100 -mt-4 md:mt-auto">
        <a
          href="https://www.linkedin.com/in/hunterchen"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn"
          className={socialLinkClass}
          onClick={(e) => e.stopPropagation()}
        >
          <Linkedin className="h-6 w-6" />
        </a>
        <a
          href="https://github.com/hunterchen7"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          className={socialLinkClass}
          onClick={(e) => e.stopPropagation()}
        >
          <Github className="h-6 w-6" />
        </a>
        <a
          href="https://www.instagram.com/hunter.c_"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          className={socialLinkClass}
          onClick={(e) => e.stopPropagation()}
        >
          <Instagram className="h-6 w-6" />
        </a>
        <a
          href="https://x.com/hunterchen_7"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="X"
          className={socialLinkClass}
          onClick={(e) => e.stopPropagation()}
        >
          <Twitter className="h-6 w-6" />
        </a>
      </div>
    </div>
  );
}
