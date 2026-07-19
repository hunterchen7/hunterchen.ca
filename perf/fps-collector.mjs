// Shared in-page fps/update-rate collector used by fps-bench.mjs (local
// CPU-throttled Chrome) and fps-bench-android.mjs (emulator Chrome over CDP).

// Returns a JS expression string evaluated in the page: samples rAF deltas
// and per-model DOM mutation batches for `seconds`, after a 1s settle.
export function collectorSource(seconds) {
  return `(() => new Promise((resolve) => {
    const deltas = [];
    const models = [...document.querySelectorAll("[data-model]")];
    const updates = Object.fromEntries(models.map((m) => [m.getAttribute("data-model"), 0]));
    const observers = models.map((m) => {
      const name = m.getAttribute("data-model");
      const observer = new MutationObserver(() => { updates[name] += 1; });
      observer.observe(m, { attributes: true, childList: true, subtree: true, characterData: true });
      return observer;
    });

    let last = performance.now();
    let raf = 0;
    const end = last + ${seconds * 1000};
    const tick = (time) => {
      deltas.push(time - last);
      last = time;
      if (time < end) { raf = requestAnimationFrame(tick); return; }
      cancelAnimationFrame(raf);
      observers.forEach((o) => o.disconnect());
      deltas.sort((a, b) => a - b);
      const total = deltas.reduce((n, d) => n + d, 0);
      const at = (q) => deltas[Math.min(deltas.length - 1, Math.floor(q * deltas.length))];
      const laptop = document.querySelector('[data-model="work-laptop"]');
      const rocket = document.querySelector('[data-model="hackathons-rocket"]');
      resolve({
        frames: deltas.length,
        fps: (deltas.length / total) * 1000,
        meanMs: total / deltas.length,
        p95Ms: at(0.95),
        worstMs: deltas[deltas.length - 1],
        over20msPct: (deltas.filter((d) => d > 20).length / deltas.length) * 100,
        over34msPct: (deltas.filter((d) => d > 34).length / deltas.length) * 100,
        updatesPerSec: Object.fromEntries(
          Object.entries(updates).map(([k, v]) => [k, v / ${seconds}]),
        ),
        variant: {
          lidPhase: laptop && laptop.getAttribute("data-model-lid-phase"),
          embers: rocket ? rocket.querySelectorAll('[class*="ember"]').length : null,
        },
      });
    };
    // Skip the first second so throttling + observers settle before sampling.
    setTimeout(() => { last = performance.now(); raf = requestAnimationFrame(tick); }, 1000);
  }))()`;
}

// Waits until the hero models exist AND their clocks are advancing (they stay
// frozen until the intro completes; the revisit path takes ~3s). Heavily
// gimped devices parse/mount everything 5-10x slower — pass a larger
// timeoutMs there.
export async function waitForModelsAnimating(page, { timeoutMs = 30_000 } = {}) {
  await page.waitForSelector('[data-model="work-laptop"]', { timeout: timeoutMs });
  await page.waitForFunction(
    () => {
      const chess =
        document.querySelector('[data-model="projects-chessboard"] [data-chess-phase-elapsed]') ??
        document.querySelector("[data-chess-phase-elapsed]");
      if (!chess) return false;
      const now = Number(chess.getAttribute("data-chess-phase-elapsed"));
      const el = chess;
      el._lastElapsed ??= now;
      if (now !== el._lastElapsed) return true;
      el._lastElapsed = now;
      return false;
    },
    { polling: 250, timeout: timeoutMs },
  );
}

export function formatSample(label, sample) {
  const u = sample.updatesPerSec;
  const per = (k) => (u[k] === undefined ? "—" : u[k].toFixed(0));
  return (
    `${label}  ` +
    `fps ${sample.fps.toFixed(1).padStart(5)}  ` +
    `mean ${sample.meanMs.toFixed(1).padStart(5)}ms  ` +
    `p95 ${sample.p95Ms.toFixed(1).padStart(6)}ms  ` +
    `>20ms ${sample.over20msPct.toFixed(1).padStart(5)}%  ` +
    `>34ms ${sample.over34msPct.toFixed(1).padStart(5)}%  ` +
    `updates/s [laptop ${per("work-laptop")} chess ${per("projects-chessboard")} rocket ${per("hackathons-rocket")} camera ${per("hobbies-zdog-reference-camera")}]  ` +
    `variant ${sample.variant.lidPhase}/${sample.variant.embers}emb`
  );
}
