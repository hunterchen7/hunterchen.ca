import { useState } from "react";
import { CanvasComponent, Draggable, type SectionCoordinates } from "@hunterchen/canvas";
import Modal from "./Modal";

const technologies = ["TypeScript", "React", "Python", "Rust", "Java"];

interface AboutSectionProps {
  offset: SectionCoordinates;
}

export default function AboutSection({ offset }: AboutSectionProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <CanvasComponent offset={offset}>
      <div className="relative flex h-full w-full items-center justify-center p-8">
      {/* Center Card */}
      <div className="z-10 max-w-md rounded-2xl bg-fuchsia-950/60 p-8 text-center shadow-xl backdrop-blur-sm border border-fuchsia-800/30">
        <h2 className="text-3xl font-thin text-fuchsia-200">about me..</h2>

        {/* Tech stack */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <span className="text-fuchsia-300/80">building with</span>
          {technologies.map((tech) => (
            <span
              key={tech}
              className="rounded-full bg-fuchsia-900/50 px-3 py-1 text-sm text-fuchsia-200"
            >
              {tech}
            </span>
          ))}
          <a href="/projects" className="text-fuchsia-300 underline underline-offset-2 hover:text-fuchsia-200">
            and more..
          </a>
        </div>

        <p className="mt-6 text-sm leading-relaxed text-fuchsia-300/80">
          currently studying computer science @{" "}
          <a
            href="https://www.uwo.ca"
            target="_blank"
            rel="noopener noreferrer"
            className="text-fuchsia-300 underline underline-offset-2 hover:text-fuchsia-200"
          >
            western university
          </a>
          , and building on web & mobile @{" "}
          <a
            href="https://geneial.ca"
            target="_blank"
            rel="noopener noreferrer"
            className="text-fuchsia-300 underline underline-offset-2 hover:text-fuchsia-200"
          >
            Geneial
          </a>
          . also currently leading the web team @{" "}
          <a
            href="https://hackwestern.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-fuchsia-300 underline underline-offset-2 hover:text-fuchsia-200"
          >
            hack western 💜
          </a>{" "}
          for 2025.
        </p>

        <button
          onClick={() => setModalOpen(true)}
          className="mt-6 rounded-full bg-fuchsia-800/60 px-6 py-2 text-sm text-fuchsia-200 transition-all hover:bg-fuchsia-700/60 hover:scale-105"
        >
          Read more
        </button>
      </div>

      {/* Draggable Climbing Photo */}
      <Draggable initialPos={{ x: 280, y: 80 }}>
        <div className="cursor-grab active:cursor-grabbing rotate-3">
          <div className="bg-white p-2 pb-10 shadow-xl">
            <div className="h-40 w-56 overflow-hidden">
              <img
                src="/climb.webp"
                alt="Rock Climbing"
                className="h-full w-full object-cover"
              />
            </div>
            <p className="mt-1 text-center font-serif text-xs text-neutral-600 italic">
              kananaskis, alberta 🇨🇦
            </p>
          </div>
        </div>
      </Draggable>

      {/* Full Bio Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="About Me">
        <div className="space-y-4 text-fuchsia-200/90">
          <p>
            At{" "}
            <a
              href="https://geneial.ca"
              target="_blank"
              rel="noopener noreferrer"
              className="text-fuchsia-300 underline underline-offset-2 hover:text-fuchsia-200"
            >
              Geneial
            </a>
            , I work on React & React Native apps. I work with AG Grid on web to build
            performant data-heavy applications. On mobile, I build cross-platform
            applications with React Native.
          </p>

          <p>
            Previously, I contracted as a frontend developer @{" "}
            <a
              href="https://aramid.finance"
              target="_blank"
              rel="noopener noreferrer"
              className="text-fuchsia-300 underline underline-offset-2 hover:text-fuchsia-200"
            >
              Aramid Finance
            </a>
            , where I built the landing website, the frontend of the core web3 bridge
            application, as well as a fullstack web app to track usage. I've also
            contracted at{" "}
            <a
              href="https://mora.do"
              target="_blank"
              rel="noopener noreferrer"
              className="text-fuchsia-300 underline underline-offset-2 hover:text-fuchsia-200"
            >
              mora.do
            </a>{" "}
            to build various web apps & sites.
          </p>

          <h3 className="pt-2 text-lg font-semibold text-fuchsia-100">When I'm Not Coding</h3>
          <p>
            Outside of tech, I spend most of my time climbing rocks 🧗‍♂️, playing video
            games, taking pictures 📷, playing chess ♟️, and reading books 📖..
          </p>
        </div>
      </Modal>
    </div>
    </CanvasComponent>
  );
}
