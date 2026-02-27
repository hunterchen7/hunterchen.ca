import { featuredProjects, otherProjects } from "./projects/projects";

export default function ReaderContent() {
  return (
    <div className="absolute inset-0 z-[-1] overflow-auto pointer-events-none text-transparent">
      <article className="content">
        <header>
          <h1>Hunter Chen</h1>
          <p>
            Hey, I&apos;m Hunter! I&apos;m a software developer who loves
            building polished, performant user experiences. Welcome to my
            playground.
          </p>
        </header>

        <section>
          <h2>About Me</h2>
          <p>
            I&apos;m currently building frontend and mobile applications with
            React and React Native at <a href="https://geneial.com">Geneial</a>.
            Before that, I built fullstack web apps for{" "}
            <a href="https://mora.do">mora.do</a> and{" "}
            <a href="https://aramid.finance">Aramid</a>.
          </p>
          <p>
            I&apos;m also an avid hackathon attendee and former organizer. I
            helped build the web experience for{" "}
            <a href="https://2024.hackwestern.com">Hack Western 2024</a> and led
            the dev team for{" "}
            <a href="https://hackwestern.com">Hack Western 2025</a> —{" "}
            <a href="https://www.uwo.ca">Western University</a>&apos;s largest
            hackathon, bringing together hundreds of students for a weekend of
            building and learning.
          </p>
          <p>
            When I&apos;m not at my computer, you&apos;ll probably find me
            climbing rocks, playing chess, or taking pictures.
          </p>
        </section>

        <section>
          <h2>Featured Projects</h2>
          <p>
            Here are some highlights from the things I&apos;ve built — ranging
            from cross-platform emulators and chess engines to hackathon
            websites and AI tools.
          </p>
          {featuredProjects.map((project) => {
            return (
              <div key={project.id} className="article-body">
                <h3>{project.title}</h3>
                <p>
                  {typeof project.description === "string"
                    ? project.description
                    : project.overview}
                </p>
                <p>Built with {project.tech.join(", ")}.</p>
                {(project.github || project.demo) && (
                  <p>
                    {project.github && (
                      <a href={project.github}>View source on GitHub</a>
                    )}
                    {project.github && project.demo && " · "}
                    {project.demo && (
                      <a href={project.demo}>Try the live demo</a>
                    )}
                  </p>
                )}
              </div>
            );
          })}
        </section>

        <section>
          <h2>More Projects</h2>
          <p>
            A selection of other projects, hackathon submissions, and open
            source contributions.
          </p>
          {otherProjects.map((project) => {
            return (
              <div key={project.id} className="article-body">
                <h3>{project.title}</h3>
                <p>
                  {project.overview}.{" "}
                  {project.tech.length > 0 &&
                    `Built with ${project.tech.join(", ")}.`}
                  {project.github && (
                    <>
                      {" "}
                      <a href={project.github}>GitHub</a>.
                    </>
                  )}
                  {project.demo && (
                    <>
                      {" "}
                      <a href={project.demo}>Demo</a>.
                    </>
                  )}
                </p>
              </div>
            );
          })}
        </section>

        <section>
          <h2>Photography</h2>
          <p>
            I shoot landscapes, wildlife, city scenes, and aviation — mostly
            focused on composition and natural light.
          </p>
          <p>
            Browse the full collection at{" "}
            <a href="https://gallery.hunterchen.ca/">gallery.hunterchen.ca</a>.
          </p>
        </section>

        <section>
          <h2>Chess AI</h2>
          <p>
            This site features an interactive chess board where you can play
            against a neural network that was fine-tuned on my own games.{" "}
            <a href="https://maiachess.com">Maia</a> is a neural network chess
            engine series trained on human games from Lichess. I fine-tuned a
            Maia model on roughly 2,000 of my own games so it plays like me —
            you can pick white or black and give it a go.
          </p>
          <p>
            The source code is available at{" "}
            <a href="https://github.com/hunterchen7/hunter-chessbot">
              hunter-chessbot on GitHub
            </a>
            .
          </p>
        </section>

        <section>
          <h2>Get in Touch</h2>
          <p>
            I&apos;d love to hear from you — reach out at{" "}
            <a href="mailto:hello@hunterchen.ca">hello@hunterchen.ca</a>, or
            find me on{" "}
            <a href="https://www.linkedin.com/in/hunterchen">LinkedIn</a>,{" "}
            <a href="https://github.com/hunterchen7">GitHub</a>,{" "}
            <a href="https://www.instagram.com/hunter.c_">Instagram</a>, and{" "}
            <a href="https://x.com/hunterchen_7">X</a>.
          </p>
          <p>
            <a href="https://hunterchen.ca/resume.pdf">Download my resume</a>.
          </p>
        </section>
      </article>
    </div>
  );
}
