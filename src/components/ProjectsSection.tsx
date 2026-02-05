import { useState, useRef, useEffect, useCallback } from "react";
import { ExternalLink, Github, Link as LinkIcon } from "lucide-react";
import { CanvasComponent, type SectionCoordinates } from "@hunterchen/canvas";
import Modal from "./Modal";

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
  images?: string[];
}

const featuredProjects: Project[] = [
  {
    id: "calc",
    title: "calc",
    overview: "Cross-platform TI-84 Plus CE emulator with custom Rust core",
    description: (
      <>
        A TI-84 Plus CE emulator for Android, iOS, and Web. Features an eZ80 CPU
        implementation in Rust, implementation of memory, bus, and various
        peripherals, including a 320x240 LCD rendering at 60 FPS, and full
        keypad support. Supports dual backend to switch between Rust
        implementation and the C++ based{" "}
        <a
          href="https://github.com/CE-Programming/CEmu"
          target="_blank"
          rel="noopener noreferrer"
          className="text-fuchsia-400 underline hover:text-fuchsia-300"
        >
          CEmu
        </a>
        .
      </>
    ),
    tech: ["Rust", "Swift", "Kotlin", "TypeScript", "WASM"],
    github: "https://github.com/hunterchen7/calc",
    demo: "https://ti84ce.pages.dev/",
    video: "/projects/calc/video.webm",
    thumbnailVideo: "/projects/calc/video-thumb.webm",
  },
  {
    id: "hackwestern",
    title: "hack western 12",
    overview:
      "Website, application & hacker portal for the 12th Iteration of Hack Western, Western University's flagship hackathon",
    description:
      "12th iteration of Western University's flagship Hack Western in 2025. Led a team of 7 to build the event website, the application portal and live dashboard for hackers. Next.js web app with a postgres db.",
    tech: ["TypeScript", "React", "Next.js", "PostgreSQL"],
    github: "https://github.com/hackwestern/hackwestern",
    demo: "https://archive.hackwestern.com/2025",
    video: "/projects/hw12/video.webm",
  },
  {
    id: "documind",
    title: "documind",
    overview: "AI-native Chrome extension PDF viewer with annotations",
    description:
      "A Chrome MV3 extension for viewing PDFs with virtualized rendering, annotations (highlights, notes, ink drawing), zoom controls, and persistent state. AI features include term extraction, page summaries, RAG-based chat with Gemini, and text-to-speech via ElevenLabs.",
    tech: ["TypeScript", "React", "Chrome Extension"],
    github: "https://github.com/WangNatalie/documind",
  },
  {
    id: "stabl",
    title: "stabl",
    overview:
      "AI-powered video stabilization tool built to stabilize my London Airshow 2025 footage",
    description:
      "A python program that stabilizes video footage by tracking a subject & cropping to center on it. Uses YOLOv8, OpenCV and FFMPEG. Built to stabilize some footage I shot from London Airshow 2025.",
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
    images: ["/projects/waveformer/graph.webp"],
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
];

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

    observer.observe(mediaRef.current);
    return () => observer.disconnect();
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
              preload="none"
              muted
              loop
              playsInline
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
            />
          ) : project.images && project.images.length > 0 ? (
            <img
              src={project.images[0]}
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
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  return (
    <CanvasComponent offset={offset}>
      <div className="flex h-full w-full flex-col items-center justify-center p-8 md:scale-110">
        <h2 className="mb-2 text-3xl font-thin text-fuchsia-200">projects</h2>
        <p className="mb-6 text-sm text-fuchsia-300/60">
          a compilation of some things i've enjoyed working on
        </p>

        {/* Project Cards Grid */}
        <div className="grid grid-cols-3 gap-6">
          {featuredProjects.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={index}
              onClick={() => setSelectedProject(project)}
            />
          ))}
        </div>

        {/* See all link */}
        <a
          href="https://hunterchen.ca/projects"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 text-sm text-fuchsia-400 underline-offset-4 hover:text-fuchsia-300 hover:underline"
        >
          see more →
        </a>

        {/* Project Detail Modal */}
        <Modal
          isOpen={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          title={selectedProject?.title}
        >
          {selectedProject && (
            <div className="h-full flex flex-col gap-4">
              {/* Media preview in modal */}
              {(selectedProject.video ||
                (selectedProject.images &&
                  selectedProject.images.length > 0)) && (
                <div className="w-full flex-1 min-h-0 bg-black rounded-lg overflow-hidden">
                  {selectedProject.video ? (
                    <video
                      src={selectedProject.video}
                      className="w-full h-full object-contain"
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                  ) : selectedProject.images && selectedProject.images[0] ? (
                    <img
                      src={selectedProject.images[0]}
                      alt={selectedProject.title}
                      className="w-full h-full object-contain"
                    />
                  ) : null}
                </div>
              )}

              <div className="text-sm text-fuchsia-200/90 leading-relaxed flex-shrink-0">
                {selectedProject.description}
              </div>

              {/* Tech stack and links row */}
              <div className="flex items-center justify-between gap-4 flex-shrink-0">
                <div className="flex flex-wrap gap-2">
                  {selectedProject.tech.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-fuchsia-900/50 px-3 py-1 text-sm text-fuchsia-200"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                {/* Links */}
                <div className="flex gap-3">
                  {selectedProject.github && (
                    <a
                      href={selectedProject.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-full bg-fuchsia-800/60 px-4 py-2 text-sm text-fuchsia-200 transition-transform hover:scale-105"
                    >
                      <Github className="h-4 w-4" />
                      Code
                    </a>
                  )}
                  {selectedProject.demo && (
                    <a
                      href={selectedProject.demo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-full bg-fuchsia-600/60 px-4 py-2 text-sm text-fuchsia-100 transition-transform hover:scale-105"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Demo
                    </a>
                  )}
                  {selectedProject.otherUrl && (
                    <a
                      href={selectedProject.otherUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-full bg-fuchsia-700/60 px-4 py-2 text-sm text-fuchsia-100 transition-transform hover:scale-105"
                    >
                      <LinkIcon className="h-4 w-4" />
                      More
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </CanvasComponent>
  );
}
