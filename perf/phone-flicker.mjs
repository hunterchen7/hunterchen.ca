#!/usr/bin/env node
// Raw-CDP flicker probe for a REAL Android phone's Chrome.
//
// playwright's connectOverCDP needs the browser-level /devtools/browser
// target, which newer Android Chrome builds (150+) never complete the
// handshake for. This probe skips it entirely: it opens its own tab via the
// DevTools HTTP API, attaches to that tab's page-level websocket with Node's
// built-in WebSocket, and drives everything over raw CDP — gestures
// (Input.synthesize*Gesture), screencast capture, and in-page evaluation.
// The user's own tabs are never touched; our tab is closed at the end.
//
// Usage (after: adb forward tcp:9333 localabstract:chrome_devtools_remote):
//   node perf/phone-flicker.mjs --url https://hunterchen.ca --dump-dir /tmp/frames
//   node perf/phone-flicker.mjs --cdp http://127.0.0.1:9333 --url <tunnel>

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const options = {
    cdp: "http://127.0.0.1:9333",
    url: "https://hunterchen.ca",
    seconds: 8,
    dumpDir: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--cdp") options.cdp = argv[++i];
    else if (arg === "--url") options.url = argv[++i];
    else if (arg === "--seconds") options.seconds = Number(argv[++i]);
    else if (arg === "--dump-dir") options.dumpDir = argv[++i];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Minimal CDP client over a page-target websocket.
class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
    ws.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(`${message.error.message} (${message.error.code})`));
        else resolve(message.result);
      } else if (message.method) {
        const handler = this.listeners.get(message.method);
        if (handler) handler(message.params);
      }
    });
  }
  send(method, params = {}, timeoutMs = 60_000) {
    return new Promise((resolve, reject) => {
      const id = this.nextId++;
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`CDP timeout: ${method}`));
        }
      }, timeoutMs);
    });
  }
  on(method, handler) {
    this.listeners.set(method, handler);
  }
}

async function evaluate(cdp, expression, { awaitPromise = false } = {}) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise,
  });
  if (result.exceptionDetails) {
    throw new Error(`evaluate failed: ${result.exceptionDetails.text} ${result.exceptionDetails.exception?.description ?? ""}`);
  }
  return result.result.value;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  // Android Chrome disables /json/new — the tab is opened externally via an
  // Android VIEW intent (see the calling shell script). Several tabs of the
  // site may exist and BACKGROUND tabs have frozen renderers (their CDP
  // commands time out), so try every matching target and keep the first one
  // that actually answers a command.
  const wantedHost = new URL(options.url).host;
  let candidates = [];
  for (let i = 0; i < 40 && candidates.length === 0; i++) {
    try {
      const response = await fetch(`${options.cdp}/json/list`);
      const targets = await response.json();
      candidates = targets.filter(
        (t) => t.type === "page" && t.url && t.url.includes(wantedHost),
      );
    } catch {
      /* retry */
    }
    if (candidates.length === 0) await sleep(500);
  }
  if (candidates.length === 0) {
    throw new Error(
      `No page target for ${wantedHost} appeared — was the tab opened (am start -a android.intent.action.VIEW -d <url>)?`,
    );
  }

  let target = null;
  let ws = null;
  let cdp = null;
  // A just-opened tab can be renderer-busy while the page loads; retry the
  // whole selection several times before concluding everything is frozen.
  for (let attempt = 0; attempt < 5 && !cdp; attempt++) {
    if (attempt > 0) {
      await sleep(4000);
      try {
        const response = await fetch(`${options.cdp}/json/list`);
        const targets = await response.json();
        candidates = targets.filter(
          (t) => t.type === "page" && t.url && t.url.includes(wantedHost),
        );
      } catch {
        /* keep previous candidates */
      }
    }
    for (const candidate of candidates) {
      const candidateWs = new WebSocket(candidate.webSocketDebuggerUrl);
      try {
        await new Promise((resolve, reject) => {
          candidateWs.addEventListener("open", resolve, { once: true });
          candidateWs.addEventListener("error", () => reject(new Error("ws failed")), { once: true });
        });
        const candidateCdp = new Cdp(candidateWs);
        await candidateCdp.send("Runtime.enable", {}, 12_000);
        target = candidate;
        ws = candidateWs;
        cdp = candidateCdp;
        break;
      } catch {
        console.log(`tab ${candidate.id} unresponsive (attempt ${attempt + 1}) — skipping`);
        try {
          candidateWs.close();
        } catch {
          /* ignore */
        }
      }
    }
  }
  if (!cdp) throw new Error("All matching tabs stayed unresponsive — is Chrome foreground with the site visible?");
  console.log(`attached to tab ${target.id} (${target.url.slice(0, 60)})`);
  await cdp.send("Page.bringToFront").catch(() => {});

  try {
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");

    // Event-based load waits race across document swaps; poll instead until
    // the RIGHT document (our host) is fully loaded, then act on it.
    const waitLoadedOnHost = async (label) => {
      for (let i = 0; i < 120; i++) {
        try {
          const state = await evaluate(
            cdp,
            `location.host + ":" + document.readyState`,
          );
          if (state === `${wantedHost}:complete`) return;
        } catch {
          /* interim document — keep polling */
        }
        await sleep(500);
      }
      throw new Error(`page never finished loading (${label})`);
    };

    await waitLoadedOnHost("initial");
    // Seed the intro-skip flag (retry through any lingering swap).
    for (let i = 0; i < 5; i++) {
      try {
        await evaluate(cdp, `sessionStorage.setItem("hero-intro-seen", "true")`);
        break;
      } catch {
        await sleep(500);
      }
    }
    await cdp.send("Page.reload");
    await sleep(1500);
    await waitLoadedOnHost("post-reload");

    // Wait for models to exist and their clock to advance.
    const modelsReady = async () => {
      for (let i = 0; i < 240; i++) {
        const state = await evaluate(cdp, `(() => {
          const laptop = document.querySelector('[data-model="work-laptop"]');
          const chess = document.querySelector('[data-chess-phase-elapsed]');
          if (!laptop || !chess) return "missing";
          const now = Number(chess.getAttribute("data-chess-phase-elapsed"));
          if (window.__lastElapsed !== undefined && now !== window.__lastElapsed) return "animating";
          window.__lastElapsed = now;
          return "frozen";
        })()`);
        if (state === "animating") return;
        await sleep(500);
      }
      throw new Error("models never started animating");
    };
    await modelsReady();
    console.log("models animating");

    // Device signals + will-change sampler.
    const signals = await evaluate(cdp, `(() => {
      let gpu = "?";
      try {
        const gl = document.createElement("canvas").getContext("webgl");
        const ext = gl && gl.getExtension("WEBGL_debug_renderer_info");
        if (gl && ext) gpu = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
      } catch {}
      return JSON.stringify({
        deviceMemory: navigator.deviceMemory ?? null,
        cores: navigator.hardwareConcurrency ?? null,
        dpr: devicePixelRatio,
        viewport: innerWidth + "x" + innerHeight,
        gpu,
      });
    })()`);
    console.log(`device signals: ${signals}`);

    await evaluate(cdp, `(() => {
      const scene = document.querySelector(".origin-top-left");
      window.__wc = [];
      const tick = () => {
        window.__wc.push({ t: performance.now(), wc: scene ? getComputedStyle(scene).willChange : "?" });
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      return "sampler on";
    })()`);

    // Screencast capture.
    const frames = [];
    cdp.on("Page.screencastFrame", (params) => {
      frames.push({ t: params.metadata.timestamp, b64: params.data });
      cdp.send("Page.screencastFrameAck", { sessionId: params.sessionId }).catch(() => {});
    });
    await cdp.send("Page.startScreencast", { format: "jpeg", quality: 70, everyNthFrame: 1 });

    const gesture = async (name, method, params) => {
      const transform = await evaluate(
        cdp,
        `(() => { const s = document.querySelector(".origin-top-left"); const t = s ? getComputedStyle(s).transform : "?"; window.__wc.push({t: performance.now(), marker: ${JSON.stringify(name)}}); return t; })()`,
      );
      console.log(`  [${name}] transform: ${transform}`);
      if (method) await cdp.send(method, params);
    };

    const viewport = await evaluate(cdp, `innerWidth + "," + innerHeight`);
    const [vw, vh] = viewport.split(",").map(Number);
    const cx = Math.round(vw * 0.5);
    const cy = Math.round(vh * 0.5);

    // Zoom-heavy sequence: the reported flashing happens mostly while
    // zooming (scale changes invalidate every rasterized tile; panning can
    // reuse them), so hammer pinch in/out back-to-back like a person
    // exploring, with one drag for contrast.
    await gesture("idle", null);
    await sleep(1000);
    await gesture("pinch-out-1", "Input.synthesizePinchGesture", {
      x: cx, y: cy, scaleFactor: 2.2, relativeSpeed: 450, gestureSourceType: "touch",
    });
    await sleep(700);
    await gesture("pinch-in-1", "Input.synthesizePinchGesture", {
      x: cx, y: cy, scaleFactor: 0.45, relativeSpeed: 450, gestureSourceType: "touch",
    });
    await sleep(700);
    await gesture("pinch-out-2", "Input.synthesizePinchGesture", {
      x: cx, y: cy, scaleFactor: 2.0, relativeSpeed: 500, gestureSourceType: "touch",
    });
    await sleep(700);
    await gesture("pinch-in-2", "Input.synthesizePinchGesture", {
      x: cx, y: cy, scaleFactor: 0.5, relativeSpeed: 500, gestureSourceType: "touch",
    });
    await sleep(1000);
    await gesture("drag-1", "Input.synthesizeScrollGesture", {
      x: cx, y: cy, xDistance: -Math.round(vw * 0.5), yDistance: -Math.round(vh * 0.15),
      speed: 900, gestureSourceType: "touch", preventFling: true,
    });
    await sleep(1000);
    await gesture("pinch-out-3", "Input.synthesizePinchGesture", {
      x: cx, y: cy, scaleFactor: 1.9, relativeSpeed: 450, gestureSourceType: "touch",
    });
    await sleep(700);
    await gesture("pinch-in-3", "Input.synthesizePinchGesture", {
      x: cx, y: cy, scaleFactor: 0.55, relativeSpeed: 450, gestureSourceType: "touch",
    });
    await sleep(1200);
    await gesture("end", null);

    await cdp.send("Page.stopScreencast");
    const wcTimeline = await evaluate(cdp, `JSON.stringify(window.__wc)`);
    const wc = JSON.parse(wcTimeline);

    // Frame diffing in-page (the page is idle now; cheap downsampled diff).
    await evaluate(cdp, `(() => {
      const c = document.createElement("canvas"); c.width = 48; c.height = 48;
      window.__ctx = c.getContext("2d", { willReadFrequently: true });
      window.__prev = null;
      window.__diff = async (b64) => {
        const blob = await (await fetch("data:image/jpeg;base64," + b64)).blob();
        const bmp = await createImageBitmap(blob);
        window.__ctx.drawImage(bmp, 0, 0, 48, 48); bmp.close();
        const { data } = window.__ctx.getImageData(0, 0, 48, 48);
        const gray = new Float64Array(48 * 48);
        for (let i = 0; i < gray.length; i++) {
          const o = i * 4;
          gray[i] = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
        }
        let delta = null;
        if (window.__prev) {
          let sum = 0;
          for (let i = 0; i < gray.length; i++) sum += Math.abs(gray[i] - window.__prev[i]);
          delta = sum / gray.length;
        }
        window.__prev = gray;
        return delta;
      };
      return "differ on";
    })()`);

    const deltas = [];
    for (const frame of frames) {
      const delta = await evaluate(cdp, `window.__diff(${JSON.stringify(frame.b64)})`, {
        awaitPromise: true,
      });
      deltas.push({ t: frame.t, delta });
    }

    const valid = deltas.filter((d) => d.delta !== null);
    const sorted = [...valid].sort((a, b) => a.delta - b.delta);
    const median = sorted[Math.floor(sorted.length / 2)]?.delta ?? 0;
    const p95 = sorted[Math.floor(sorted.length * 0.95)]?.delta ?? 0;
    const max = sorted[sorted.length - 1]?.delta ?? 0;
    const threshold = Math.max(median * 4, 18);
    const spikes = valid.filter((d) => d.delta > threshold);

    let wcTransitions = 0;
    let lastWc = null;
    for (const sample of wc) {
      if (sample.wc === undefined) continue;
      if (lastWc !== null && sample.wc !== lastWc) wcTransitions += 1;
      lastWc = sample.wc;
    }

    console.log(`frames: ${frames.length}`);
    console.log(`delta median ${median.toFixed(2)}  p95 ${p95.toFixed(2)}  max ${max.toFixed(2)}`);
    console.log(`SPIKES (>${threshold.toFixed(1)}): ${spikes.length}`);
    console.log(`will-change transitions: ${wcTransitions}`);
    console.log(
      JSON.stringify({ url: options.url, frames: frames.length, median, p95, max, spikes: spikes.length, wcTransitions }),
    );

    if (options.dumpDir && spikes.length) {
      mkdirSync(options.dumpDir, { recursive: true });
      let dumped = 0;
      for (const spike of spikes.slice(0, 10)) {
        const index = frames.findIndex((f) => f.t === spike.t);
        for (const j of [index - 1, index, index + 1]) {
          const f = frames[j];
          if (!f) continue;
          const tag = j === index ? "hit" : j < index ? "before" : "after";
          writeFileSync(
            path.join(options.dumpDir, `spike${dumped}-${tag}-d${spike.delta.toFixed(0)}.jpg`),
            Buffer.from(f.b64, "base64"),
          );
        }
        dumped += 1;
      }
      console.log(`dumped ${dumped} spike triplets -> ${options.dumpDir}`);
    }
  } finally {
    // Close the test tab (ours alone); the user's tabs are untouched.
    try {
      await cdp.send("Page.close");
    } catch {
      /* already closing */
    }
    ws.close();
    await fetch(`${options.cdp}/json/close/${target.id}`).catch(() => {});
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exit(1);
});
