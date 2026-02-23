import { useState, useRef, useEffect, useCallback } from "react";
import { ExternalLink, Github, Link as LinkIcon } from "lucide-react";
import { CanvasComponent, type SectionCoordinates } from "@hunterchen/canvas";
import ProjectCarousel from "./ProjectCarousel";

interface ProjectsSectionProps {
  offset: SectionCoordinates;
}

interface Project {
  id: string;
  title: string;
  overview: string;
  description: React.ReactNode;
  tech: string[];
  github?: string;
  demo?: string;
  otherUrl?: string;
  video?: string;
  thumbnailVideo?: string; // Cropped/alternate video for card preview
  thumbnailImage?: string; // Cropped/alternate image for card preview
  images?: string[];
}

// Projects shown as cards on canvas
const featuredProjects: Project[] = [
  {
    id: "ti84ce",
    title: "ti84ce",
    overview:
      "Cross-platform TI-84 Plus CE emulator with custom Rust implementation of eZ80 CPU & accompanying peripherals",
    description: (
      <>
        A TI-84 Plus CE emulator for Android, iOS, and Web. Features an eZ80 CPU
        implementation in Rust, with accompanying memory, including a 320x240
        LCD rendering at 60 FPS, and full keypad support. Supports dual backend
        to switch between Rust implementation and the C++ based{" "}
        <a
          href="https://github.com/CE-Programming/CEmu"
          target="_blank"
          rel="noopener noreferrer"
          className="text-fuchsia-400 underline hover:text-fuchsia-300"
        >
          CEmu
        </a>
        . Android app is built with Kotlin/Jetpack Compose, iOS app with Swift,
        and web with TypeScript/React.
      </>
    ),
    tech: ["Rust", "C/C++", "Swift", "Kotlin", "TypeScript", "WASM"],
    github: "https://github.com/hunterchen7/calc",
    demo: "https://ti84ce.pages.dev/",
    video: "/projects/ti84ce/video.webm",
    thumbnailVideo: "/projects/ti84ce/video-thumb.webm",
  },
  {
    id: "play-lc0",
    title: "play lc0",
    overview:
      "Play chess against 50+ chess neural networks in client-side, powered by WebGPU & ONNX Runtime. Also run engine-vs-engine tournaments with round-robin and Swiss formats.",
    description:
      "A fully client-side chess platform for playing against chess neural networks in the browser. Runs ONNX model inference via WebGPU (with WASM fallback) in a Web Worker. Features 50+ pre-configured networks ranging from ~800 to ~2800 Elo, including a model fine-tuned on my ~2000 of own games to play like me. Also supports custom ONNX model uploads, engine-vs-engine tournaments with round-robin/Swiss formats, and IndexedDB model caching. Demo shows a real-time 27 participant tournament with 8 running simultaneously (16 models loaded into VRAM). ",
    tech: ["TypeScript", "React", "ONNX Runtime", "WebGPU", "WASM"],
    github: "https://github.com/hunterchen7/play-lc0",
    demo: "https://play-lc0.pages.dev",
    video: "/projects/play-lc0/video.webm",
  },
  {
    id: "hackwestern",
    title: "hack western 12",
    overview:
      "Website, application & hacker portal for the 12th Iteration of Hack Western, Western University's flagship hackathon",
    description:
      "12th iteration of Western University's flagship Hack Western in 2025. Led a team of 7 to build the promo website, the application portal and live dashboard for hackers. The promo website includes a custom-made canvas made from framer motion. Next.js web app with a postgres db.",
    tech: ["TypeScript", "React", "Next.js", "PostgreSQL"],
    github: "https://github.com/hackwestern/hackwestern/tree/2025",
    demo: "https://archive.hackwestern.com/2025",
    video: "/projects/hw12/video.webm",
  },
  {
    id: "stabl",
    title: "stabl",
    overview:
      "AI-powered video stabilization tool built to stabilize my London Airshow 2025 footage",
    description:
      "A python program that stabilizes video footage by tracking a subject & cropping to center on it. Uses YOLOv8, OpenCV and FFMPEG. Built to stabilize some footage I shot from London Airshow 2025 (shows off my poor camera work).",
    tech: ["Python", "YOLOv8", "OpenCV"],
    github: "https://github.com/hunterchen7/stabl",
    video: "/projects/stabl/video.webm",
  },
  {
    id: "waveformer",
    title: "waveformer",
    overview: "Convert images into parametric equations",
    description:
      "A Rust program that converts images into a series of parametric equations using a combination of fourier transforms and edge detection algorithms.",
    tech: ["Rust"],
    github: "https://github.com/hunterchen7/waveformer",
    thumbnailImage: "/projects/waveformer/graph-thumb.webp",
    images: ["/projects/waveformer/graph.webp"],
  },
  {
    id: "ce-chess",
    title: "ce-chess",
    overview:
      "Chess engine & GUI for the TI-84 Plus CE graphing calculator, with alpha-beta negamax search, texel-tuned evaluation, opening book, and 5 difficulty levels",
    description:
      'A chess engine and GUI that runs on the TI-84 Plus CE calculator, ft. 48 mhz eZ80 CPU and ~45 kb of usable RAM. Features alpha-beta negamax with iterative deepening, a texel-tuned evaluation function, null move pruning, LMR, futility pruning, and a transposition table. Includes different tiers of Polyglot opening book stored in Flash AppVars. 5 difficulty levels from ~1350 to ~2100 Elo. Play against it via "pgrm" command on emulator.',
    tech: ["C", "eZ80 ASM"],
    github: "https://github.com/hunterchen7/ce-games",
    demo: "https://ti84ce.pages.dev/chess",
    video: "/projects/ce-chess/video.webm",
  },
];

// Additional projects only shown in the carousel
const carouselOnlyProjects: Project[] = [
  {
    id: "documind",
    title: "documind",
    overview:
      "AI-native Chrome extension PDF viewer with advanced annotation & export features",
    description:
      "A Chrome MV3 extension for viewing PDFs with virtualized rendering, annotations (highlights, notes, ink drawing), zoom controls, and persistent state. AI features include term extraction, page summaries, RAG-based chat with Gemini, and text-to-speech via ElevenLabs. Built for Hack the Valley 2025",
    tech: ["TypeScript", "React", "Chrome Extension"],
    github: "https://github.com/WangNatalie/documind",
    images: ["/projects/documind/image.png"],
  },
  {
    id: "chessbench",
    title: "chessbench LLM",
    overview:
      "Benchmarking LLMs on solving chess puzzles, also play chess against llama-4-scout",
    description:
      "Play chess against llama-4-scout. Contains benchmarks from different LLMs playing chess puzzles, with their Elo ratings. Models also play games against each other. React frontend, TS cloudflare worker backend.",
    tech: ["TypeScript", "React", "Python"],
    github: "https://github.com/hunterchen7/chessbench-llm",
    demo: "https://chessbench.pages.dev/",
    images: [
      "/projects/chessbench/image.webp",
      "/projects/chessbench/game.webp",
    ],
  },
  {
    id: "hw-archive",
    title: "hack western archive",
    overview: "Compilation of the past 10 years of hack western websites",
    description:
      "Compilation of the past 10 years of hack western websites; features a mix of Next.js, CRA, Vue, Pug, Express, PHP, Bootstrap & JQuery sites, all compiled & combined into a single static site.",
    tech: ["TypeScript", "JavaScript", "React", "Next.js"],
    demo: "https://archive.hackwestern.com/",
    images: ["/projects/hw-archive/image.webp"],
  },
  {
    id: "marvin",
    title: "marvin",
    overview: "AI Discord bot that can chat and generate images",
    description:
      "AI discord chat bot that can also generate images from user prompts. Uses llama-4-maverick for text gen and gemini flash 2.0 for image gen. I use a modified version on a personal server and it has sent 2,000+ messages.",
    tech: ["TypeScript"],
    github: "https://github.com/hunterchen7/marvin",
    video: "/projects/marvin/video.webm",
  },
  {
    id: "viewr",
    title: "viewr",
    overview:
      "High-performance image viewer with multi-threaded buffering & caching",
    description:
      "A high-performance image viewer with multi-threaded buffering & caching, built with C++ and Qt. Decompresses JPEGs into memory for near instant loading times; for 20 MP images, loading times go from ~200 ms to <1 ms.",
    tech: ["C++"],
    github: "https://github.com/hunterchen7/viewr",
    images: [
      "/projects/viewr/image.webp",
      "/projects/viewr/image2.webp",
      "/projects/viewr/image3.webp",
    ],
  },
  {
    id: "pawfect",
    title: '"pawfect pitch"',
    overview: "AI-driven speech coaching web app",
    description:
      "AI-driven speech coaching; upload audio to get feedback. Built for NWhacks 2025. React frontend, Python/fastAPI backend, uses local ~1B LLM & whisper.",
    tech: ["TypeScript", "React", "Python"],
    github: "https://github.com/hunterchen7/pawfect-pitch",
    demo: "https://devpost.com/software/pawfect-pitch",
    video: "/projects/pawfect/video.webm",
    images: [
      "/projects/pawfect/1.webp",
      "/projects/pawfect/2.webp",
      "/projects/pawfect/3.webp",
      "/projects/pawfect/4.webp",
    ],
  },
  {
    id: "hw11",
    title: "hack western 11",
    overview:
      "Website, Application & Hacker portal for the 11th Iteration of Hack Western",
    description:
      "2024's iteration of Hack Western; built components for event website and application portal, created internal review dashboard. Implemented CI/CD pipelines and email automation.",
    tech: ["TypeScript", "React", "Next.js", "PostgreSQL"],
    github: "https://github.com/hackwestern/hackwestern/tree/hw11",
    demo: "https://2024.hackwestern.com",
    video: "/projects/hw11/video.webm",
    images: ["/projects/hw11/image.webp", "/projects/hw11/live.webp"],
  },
  {
    id: "typing",
    title: "typing game",
    overview: "Typing game where you destroy falling asteroids by typing words",
    description:
      "Led a group of 4 to build a Java/LibGDX typing game where you type words to destroy asteroids. Designed database schema to store user profiles, game stats and word lists.",
    tech: ["Java", "SQLite"],
    github: "https://github.com/hunterchen7/typing-game",
    demo: "https://www.youtube.com/watch?v=1PN8l_tNcNQ",
    video: "/projects/typing/video.webm",
  },
  {
    id: "docket",
    title: "docket",
    overview: "Markdown note-taking chrome extension",
    description:
      "Markdown note-taking chrome extension. My friend built most of it but I implemented a couple features :)",
    tech: ["TypeScript"],
    github: "https://github.com/LordExodius/docket",
    demo: "https://chromewebstore.google.com/detail/docket/hlfjljigolpdfpljaogaiklelolbemfc",
    images: ["/projects/docket/image.webp"],
  },
  {
    id: "pointless",
    title: "pointless",
    overview: "Infinite drawing canvas desktop app built with Tauri & React",
    description:
      "Not my app! Infinite drawing canvas desktop app built with Tauri (Rust) and React. Added the colour picker feature - my first open source contribution!",
    tech: ["Rust", "React", "JavaScript"],
    github: "https://github.com/kkoomen/pointless",
    images: ["/projects/pointless/image.webp"],
  },
  {
    id: "gameoflife",
    title: "WASM game of life",
    overview: "Conway's Game of Life in Rust & WebAssembly",
    description:
      "A Rust implementation of Conway's Game of Life, compiled to WebAssembly. Based on a tutorial from the rustwasm book.",
    tech: ["Rust", "TypeScript", "WASM"],
    github: "https://github.com/hunterchen7/wasm-game-of-life",
    demo: "https://hunterchen7.github.io/wasm-game-of-life/",
    video: "/projects/gameoflife/video.webm",
  },
  {
    id: "scavenger",
    title: "HW scavenger hunt",
    overview:
      "Scavenger hunt game for hack western 11 and 12 organizer socials",
    description:
      "A scavenger hunt game for the first hack western 11 organizer social, and updated/reused for hack western 12. Use code 1023 for a demo.",
    tech: ["TypeScript", "React", "Next.js", "PostgreSQL"],
    github: "https://github.com/hunterchen7/scavenger-hunt",
    demo: "https://scavenger-hunt-pink.vercel.app/",
    video: "/projects/scavenger/video.webm",
    images: [
      "/projects/scavenger/image.webp",
      "/projects/scavenger/submission.webp",
    ],
  },
  {
    id: "bluefin",
    title: "bluefin",
    overview:
      "WIP (abandoned) MCTS chess engine using bitboards, built with Rust",
    description:
      "A WIP (abandoned) MCTS (monte-carlo tree-search) chess engine using bitboards, built with Rust.",
    tech: ["Rust"],
    github: "https://github.com/bluefin-chess/bluefin",
    images: ["/projects/bluefin/image.webp"],
  },
  {
    id: "voyage",
    title: "voyage",
    overview: "WIP (abandoned) magic-bitboard chess move-generator",
    description:
      "A WIP (abandoned) magic-bitboard chess move-generator intended for use in bluefin. Written in Rust, based on Gigantua.",
    tech: ["Rust"],
    github: "https://github.com/bluefin-chess/voyage",
    otherUrl:
      "https://www.codeproject.com/Articles/5313417/Worlds-Fastest-Bitboard-Chess-Movegenerator",
    images: ["/projects/voyage/image.webp"],
  },
  {
    id: "ballotbox",
    title: "ballotbox",
    overview: "Anonymous data marketplace using zero-knowledge proofs",
    description:
      "Anonymous data marketplace using zero-knowledge proofs; built for the 2023 FVM spacewarp hackathon.",
    tech: ["TypeScript", "React"],
    github: "https://github.com/KingGizzard/Ballotbox",
    demo: "https://ethglobal.com/showcase/ballotbox-23fge",
    images: [
      "/projects/ballotbox/architecture.webp",
      "/projects/ballotbox/answerer.webp",
      "/projects/ballotbox/asker.webp",
    ],
  },
  {
    id: "daovoz",
    title: "DAOVOZ website",
    overview: "Website for DAOVOZ, a DAO forum based in Davos, Switzerland",
    description:
      "DAOVOZ is a DAO forum for DAOs; built website to promote & sell tickets to in-person event in Davos, Switzerland.",
    tech: ["TypeScript", "React", "Next.js"],
    github: "https://github.com/hunterchen7/daovos-website",
    demo: "https://daovoz.pages.dev/",
    video: "/projects/daovoz/video.webm",
  },
  {
    id: "dechess",
    title: "deChess",
    overview: "Decentralized p2p chess web app with tradeable NFT chess pieces",
    description:
      "Decentralized p2p chess web app built for ETHGlobal hackathon(s). Won 6k+ USD in prizes, and got a 5k USD grant from Streamr. Also built to let you mint NFTs of chess pieces. My first time using React!",
    tech: ["JavaScript", "React", "Solidity"],
    github: "https://github.com/deChess/deChess",
    demo: "https://ethglobal.com/showcase/dechess-yzza8",
    images: ["/projects/dechess/image.webp", "/projects/dechess/image2.webp"],
  },
  {
    id: "spacestagram",
    title: "spacestagram",
    overview:
      '"Image sharing from the final frontier" - see some images from NASA\'s API',
    description:
      "\"Image sharing from the final frontier\" - see some images from NASA's API, built for Shopify's 2021 Frontend Developer Intern Challenge.",
    tech: ["JavaScript", "React"],
    github: "https://github.com/hunterchen7/spacestagram",
    demo: "https://spacestagram.hunterchen.ca",
    video: "/projects/spacestagram/video.webm",
    images: [
      "/projects/spacestagram/image.webp",
      "/projects/spacestagram/image2.webp",
    ],
  },
  {
    id: "coinport",
    title: "coinport",
    overview: "DeFi (decentralized finance) portfolio dashboard",
    description:
      "A dashboard that breaks down the makeup & history of your DeFi portfolio. Python/flask backend, displayed with chartJS. Won $1000 USD from Covalent - first ever hackathon win!",
    tech: ["Python", "JavaScript"],
    github: "https://github.com/Coin-Port/CoinPort",
    demo: "https://ethglobal.com/showcase/coinport-todjy",
    video: "/projects/coinport/video.webm",
    images: ["/projects/coinport/image.webp", "/projects/coinport/image2.webp"],
  },
  {
    id: "benchmark",
    title: "human benchmark bot",
    overview:
      "AI bot that automates tasks from Human Benchmark at 99+ percentiles",
    description:
      "A python bot that automates tasks from Human Benchmark using pyautogui, tesseract, and other libraries, getting in the top 0.1% of 5 tasks.",
    tech: ["Python"],
    github: "https://github.com/hunterchen7/HumanBenchmarkBot",
    images: ["/projects/benchmark/image.webp"],
  },
  {
    id: "secrypt",
    title: "seCrypt",
    overview: "Simple file encryption/decryption tool",
    description:
      "A simple file encryption/decryption tool built with python using tkinter and fernet.",
    tech: ["Python"],
    github: "https://github.com/hunterchen7/SeCrypt",
    images: ["/projects/secrypt/image.webp", "/projects/secrypt/image2.webp"],
  },
  {
    id: "tank",
    title: "tank game",
    overview: "Birds-eye view tank game built with gamemaker",
    description:
      "A birds-eye view tank game I made in high school with gamemaker. Has a tutorial, 3 normal levels, a boss level, different enemy types, ammo types and a menu screen. I've included the originl .gmz (gamemaker project) and the compiled .exe, run at your own risk!",
    tech: [],
    demo: "https://hunterchen.ca/tank/tankgame.exe",
    otherUrl: "https://hunterchen.ca/tank/tankgame.gmz",
    video: "/projects/tank/video.webm",
    images: [
      "/projects/tank/level1.webp",
      "/projects/tank/level2.webp",
      "/projects/tank/level3.webp",
    ],
  },
];

// All projects for the carousel
const allProjects: Project[] = [...featuredProjects, ...carouselOnlyProjects];

function ProjectCard({
  project,
  index,
  onClick,
}: {
  project: Project;
  index: number;
  onClick: () => void;
}) {
  const mediaRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!mediaRef.current || !videoRef.current) return;

    // Explicitly pause to load first frame
    // videoRef.current.pause();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoRef.current?.play().catch(() => {});
          } else {
            videoRef.current?.pause();
          }
        });
      },
      { threshold: 0.25 },
    );

    // Wait 9 seconds after page load before starting video autoplay
    const timeout = setTimeout(() => {
      if (mediaRef.current) {
        observer.observe(mediaRef.current);
      }
    }, 9000);

    return () => {
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // Don't open modal when clicking links
      const target = e.target as HTMLElement;
      if (target.closest("a")) return;
      onClick();
    },
    [onClick],
  );

  const linkClass =
    "text-fuchsia-400/60 hover:text-fuchsia-200 opacity-0 group-hover:opacity-100 transition-all duration-300";

  return (
    <div
      onClick={handleClick}
      className="project-card group bg-fuchsia-950/40 hover:bg-fuchsia-900/50 shadow-md shadow-fuchsia-900/40 rounded-lg border border-fuchsia-700/40 hover:shadow-lg transition-all duration-300 overflow-visible cursor-pointer w-2xl"
      style={{
        animationDelay: `${Math.min(0.4 + index * 0.15, 1.5)}s`,
      }}
    >
      {/* Header with title and links */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 px-3 pt-2 pb-1">
          <h3 className="text-sm font-medium text-fuchsia-200">
            {project.title}
          </h3>
        </div>
        <div className="flex gap-1.5 items-center px-3 py-1">
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub Repository"
              className={linkClass}
              onClick={(e) => e.stopPropagation()}
            >
              <Github size={18} />
            </a>
          )}
          {project.demo && (
            <a
              href={project.demo}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Live Demo"
              className={linkClass}
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={18} />
            </a>
          )}
          {project.otherUrl && (
            <a
              href={project.otherUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Other Link"
              className={linkClass}
              onClick={(e) => e.stopPropagation()}
            >
              <LinkIcon size={18} />
            </a>
          )}
        </div>
      </div>

      {/* Media preview with overlay */}
      <div className="relative overflow-hidden rounded-b-lg">
        <div
          ref={mediaRef}
          className="w-full h-72 overflow-hidden bg-fuchsia-950/60 flex items-center justify-center hover:brightness-105 transition-all duration-300 hover:scale-[1.02]"
        >
          {project.video || project.thumbnailVideo ? (
            <video
              ref={videoRef}
              src={project.thumbnailVideo || project.video}
              className="w-full h-full object-cover"
              preload="metadata"
              muted
              loop
              playsInline
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
            />
          ) : project.thumbnailImage ||
            (project.images && project.images.length > 0) ? (
            <img
              src={project.thumbnailImage || project.images?.[0]}
              alt={project.title}
              className="w-full h-full object-cover"
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-fuchsia-400/40">
              <span className="text-4xl">📁</span>
            </div>
          )}
        </div>

        {/* Overview overlay - slides up on hover */}
        <div
          className="absolute left-0 right-0 bottom-0 transform translate-y-full group-hover:translate-y-0 transition-all duration-300 bg-black/80 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-fuchsia-200/90 text-left text-xs p-3 m-0 cursor-text">
            {project.overview}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ProjectsSection({ offset }: ProjectsSectionProps) {
  const [carouselIndex, setCarouselIndex] = useState<number | null>(null);
  const [lastOpenedIndex, setLastOpenedIndex] = useState<number>(
    featuredProjects.length,
  );

  const handleIndexChange = (index: number) => {
    setCarouselIndex(index);
    setLastOpenedIndex(index);
  };

  return (
    <CanvasComponent offset={offset}>
      <div className="flex h-full w-full flex-col items-center justify-center p-8 md:scale-110">
        <h2 className="mb-2 text-3xl font-thin text-fuchsia-200">projects</h2>
        <p className="mb-6 text-sm text-fuchsia-300/60">
          a compilation of some things i've worked on.. click to learn more!
        </p>

        {/* Project Cards Grid */}
        <div className="grid grid-cols-3 gap-6">
          {featuredProjects.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={index}
              onClick={() => handleIndexChange(index)}
            />
          ))}
        </div>

        {/* See more button - opens carousel at last viewed position */}
        <button
          onClick={() => setCarouselIndex(lastOpenedIndex)}
          className="group mt-6 text-sm"
        >
          <span className="text-fuchsia-300/80 group-hover:text-fuchsia-200 transition-colors">
            see more →
          </span>
          <span className="block h-0 max-w-0 border-b border-fuchsia-300/60 transition-all duration-200 group-hover:max-w-full group-hover:border-fuchsia-200" />
        </button>

        {/* Project Carousel */}
        <ProjectCarousel
          projects={allProjects}
          currentIndex={carouselIndex}
          onClose={() => setCarouselIndex(null)}
          onIndexChange={handleIndexChange}
        />
      </div>
    </CanvasComponent>
  );
}
