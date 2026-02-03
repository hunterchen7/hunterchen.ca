import { useState } from "react";
import { ExternalLink, Github } from "lucide-react";
import { CanvasComponent, type SectionCoordinates } from "@hunterchen/canvas";
import Modal from "./Modal";

interface ProjectsSectionProps {
  offset: SectionCoordinates;
}

interface Project {
  id: string;
  title: string;
  tagline: string;
  description: string;
  tech: string[];
  github?: string;
  demo?: string;
  favourite?: boolean;
}

const featuredProjects: Project[] = [
  {
    id: "hackwestern",
    title: "hack western 12",
    tagline: "Western University's flagship hackathon",
    description:
      "12th iteration of Hack Western in 2025. Co-leading the web team of 7 this year; building the event website, the application portal and live dashboard for hackers. Next.js web app with a postgres db.",
    tech: ["TypeScript", "React", "Next.js", "PostgreSQL"],
    github: "https://github.com/hackwestern/hackwestern",
    demo: "https://hackwestern.com",
    favourite: true,
  },
  {
    id: "stabl",
    title: "stabl",
    tagline: "AI-powered video stabilization",
    description:
      "A python program that stabilizes video footage by tracking a subject & cropping to center on it. Uses YOLOv8, OpenCV and FFMPEG. Built to stabilize some footage I shot from London Airshow 2025.",
    tech: ["Python", "YOLOv8", "OpenCV"],
    github: "https://github.com/hunterchen7/stabl",
    favourite: true,
  },
  {
    id: "waveformer",
    title: "waveformer",
    tagline: "Convert images into parametric equations",
    description:
      "A Rust program that converts images into a series of parametric equations using a combination of fourier transforms and edge detection algorithms.",
    tech: ["Rust"],
    github: "https://github.com/hunterchen7/waveformer",
    favourite: true,
  },
  {
    id: "dechess",
    title: "deChess",
    tagline: "Decentralized chess with NFT pieces",
    description:
      "Decentralized p2p chess web app built for ETHGlobal hackathon(s). Won 6k+ USD in prizes, and got a 5k USD grant from Streamr. Also built to let you mint NFTs of chess pieces. My first time using React!",
    tech: ["JavaScript", "React", "Solidity"],
    github: "https://github.com/deChess/deChess",
    demo: "https://ethglobal.com/showcase/dechess-yzza8",
    favourite: true,
  },
  {
    id: "marvin",
    title: "marvin",
    tagline: "AI Discord bot that can chat and generate images",
    description:
      "AI discord chat bot that can also generate images from user prompts. Uses llama-4-maverick for text gen and gemini flash 2.0 for image gen. A modified version of marvin is used in a personal discord server, has currently sent 1,000+ messages!",
    tech: ["TypeScript"],
    github: "https://github.com/hunterchen7/marvin",
    favourite: true,
  },
  {
    id: "benchmark",
    title: "human benchmark bot",
    tagline: "AI bot for Human Benchmark at 99+ percentiles",
    description:
      "A python bot that automates tasks from Human Benchmark using pyautogui, tesseract, and other libraries, getting in the top 0.1% of 5 tasks and 0.4% of another.",
    tech: ["Python"],
    github: "https://github.com/hunterchen7/HumanBenchmarkBot",
    favourite: true,
  },
];

export default function ProjectsSection({ offset }: ProjectsSectionProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  return (
    <CanvasComponent offset={offset}>
      <div className="flex h-full w-full flex-col items-center justify-center p-8">
      <h2 className="mb-2 text-3xl font-thin text-fuchsia-200">projects</h2>
      <p className="mb-6 text-sm text-fuchsia-300/60">
        a compilation of most of my past & current projects
      </p>

      {/* GitHub Profile Card */}
      <a
        href="https://github.com/hunterchen7"
        target="_blank"
        rel="noreferrer"
        className="mb-6 transition-transform hover:scale-[1.02]"
      >
        <img
          src="http://github-profile-summary-cards.vercel.app/api/cards/profile-details?username=hunterchen7&theme=midnight_purple"
          className="rounded-lg shadow-lg"
          alt="GitHub profile card"
        />
      </a>

      {/* Project Cards Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {featuredProjects.map((project) => (
          <button
            key={project.id}
            onClick={() => setSelectedProject(project)}
            className="group relative overflow-hidden rounded-xl bg-fuchsia-950/60 p-4 text-left shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl border border-fuchsia-800/30"
          >
            {/* Title */}
            <h3 className="text-sm font-semibold text-fuchsia-200 group-hover:text-fuchsia-100">
              {project.title}
            </h3>

            {/* Tagline */}
            <p className="mt-1 text-xs text-fuchsia-300/60 line-clamp-2">{project.tagline}</p>

            {/* Tech preview */}
            <div className="mt-3 flex flex-wrap gap-1">
              {project.tech.slice(0, 2).map((t) => (
                <span
                  key={t}
                  className="rounded bg-fuchsia-900/50 px-2 py-0.5 text-xs text-fuchsia-300"
                >
                  {t}
                </span>
              ))}
              {project.tech.length > 2 && (
                <span className="rounded bg-fuchsia-900/50 px-2 py-0.5 text-xs text-fuchsia-400">
                  +{project.tech.length - 2}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* See all link */}
      <a
        href="https://hunterchen.ca/projects"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 text-sm text-fuchsia-400 underline-offset-4 hover:text-fuchsia-300 hover:underline"
      >
        See all 25+ projects →
      </a>

      {/* Project Detail Modal */}
      <Modal
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
        title={selectedProject?.title}
      >
        {selectedProject && (
          <div className="space-y-4">
            <p className="text-fuchsia-200/90">{selectedProject.description}</p>

            {/* Tech stack */}
            <div>
              <h4 className="mb-2 font-semibold text-fuchsia-100">Built with</h4>
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
            </div>

            {/* Links */}
            <div className="flex gap-3 pt-4">
              {selectedProject.github && (
                <a
                  href={selectedProject.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-full bg-fuchsia-800/60 px-4 py-2 text-sm text-fuchsia-200 transition-transform hover:scale-105"
                >
                  <Github className="h-4 w-4" />
                  View Code
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
                  Live Demo
                </a>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
    </CanvasComponent>
  );
}
