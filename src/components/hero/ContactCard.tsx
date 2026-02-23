import { Github, Linkedin, Instagram, Twitter } from "lucide-react";

const socialLinkClass =
  "rounded-full bg-fuchsia-900/50 p-2.5 text-fuchsia-200 transition-all hover:scale-105 hover:bg-fuchsia-800/60 hover:text-fuchsia-100";

export default function ContactCard() {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full">
      <a
        href="mailto:hello@hunterchen.ca"
        className="group mb-6 text-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-fuchsia-300/80 group-hover:text-fuchsia-200 transition-colors">
          hello@hunterchen.ca
        </span>
        <span className="block h-0 max-w-0 border-b border-fuchsia-300/60 transition-all duration-200 group-hover:max-w-full group-hover:border-fuchsia-200" />
      </a>

      <div className="flex gap-3">
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
