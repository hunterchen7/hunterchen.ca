#!/usr/bin/env node
// Flicker/flash detector for canvas pan+zoom gestures.
//
// Reproduces the mobile Chromium artifact where dragging/pinching the canvas
// causes visible flashing. Loads the site in mobile-emulated Chrome (touch +
// mobile UA + narrow viewport → the library's non-"high" performance mode),
// synthesizes drag and pinch gestures over CDP, captures every composited
// frame via Page.startScreencast, and measures inter-frame pixel deltas in an
// analyzer page (downsampled mean absolute difference). A flash reads as a
// spike: a frame that deviates hard from its neighbors and then reverts.
// The scene's computed will-change is sampled in parallel so layer
// promote/demote events line up with the spikes.
//
// Usage:
//   node perf/flicker-bench.mjs                     # mobile emulation (repro)
//   node perf/flicker-bench.mjs --desktop           # desktop control (no toggle path)
//   node perf/flicker-bench.mjs --dump-frames       # save spike frames as JPEGs
//
// Assumes `npm run preview` is serving on 4173.

import { createRequire } from "node:module";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const SCRATCH_DEFAULT = path.join(ROOT, "perf", "fps-results", "flicker-frames");

const PLAYWRIGHT_CANDIDATES = [
  path.join(ROOT, "node_modules", "playwright"),
  path.join(ROOT, "node_modules", "playwright-core"),
  "/Users/hunterchen/Documents/GitHub/canvas/node_modules/playwright",
  "/Users/hunterchen/Documents/GitHub/canvas/node_modules/playwright-core",
];

function loadPlaywright() {
  const require = createRequire(import.meta.url);
  for (const candidate of PLAYWRIGHT_CANDIDATES) {
    if (existsSync(candidate)) {
      try {
        return require(candidate).chromium;
      } catch {
        /* next */
      }
    }
  }
  throw new Error("playwright not found (repo or ../canvas node_modules).");
}

function parseArgs(argv) {
  const options = {
    url: "http://localhost:4173",
    desktop: false,
    dumpFrames: false,
    dumpDir: SCRATCH_DEFAULT,
    // Attach to an existing Chrome over CDP (e.g. Android emulator Chrome via
    // `adb forward tcp:9333 localabstract:chrome_devtools_remote`) instead of
    // launching a local headless one. Headless local Chrome rasters
    // synchronously and can NEVER present a checkerboard/flash frame — real
    // repro needs a real compositor.
    cdp: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--url") options.url = argv[++i];
    else if (arg === "--desktop") options.desktop = true;
    else if (arg === "--dump-frames") options.dumpFrames = true;
    else if (arg === "--dump-dir") options.dumpDir = argv[++i];
    else if (arg === "--cdp") options.cdp = argv[++i];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Analyzer page: decodes screencast JPEGs, downsamples to 48x48 grayscale,
// returns mean absolute difference vs the previous frame (0-255 scale).
const ANALYZER_PAGE = `<!doctype html><canvas id="c" width="48" height="48"></canvas><script>
  const ctx = document.getElementById("c").getContext("2d", { willReadFrequently: true });
  let prev = null;
  window.analyze = async (b64) => {
    const blob = await (await fetch("data:image/jpeg;base64," + b64)).blob();
    const bmp = await createImageBitmap(blob);
    ctx.drawImage(bmp, 0, 0, 48, 48);
    bmp.close();
    const { data } = ctx.getImageData(0, 0, 48, 48);
    const gray = new Float64Array(48 * 48);
    for (let i = 0; i < gray.length; i++) {
      const o = i * 4;
      gray[i] = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
    }
    let delta = null;
    if (prev) {
      let sum = 0;
      for (let i = 0; i < gray.length; i++) sum += Math.abs(gray[i] - prev[i]);
      delta = sum / gray.length;
    }
    prev = gray;
    return delta;
  };
</script>`;

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const chromium = loadPlaywright();

  // The analyzer always runs in a local headless Chrome so frame diffing
  // never competes with the device under test.
  const analyzerBrowser = await chromium.launch({ executablePath: CHROME, headless: true });
  const analyzer = await (await analyzerBrowser.newContext()).newPage();
  await analyzer.setContent(ANALYZER_PAGE);

  const browser = options.cdp
    ? await chromium.connectOverCDP(options.cdp)
    : await chromium.launch({ executablePath: CHROME, headless: true });
  try {
    let page;
    let ownsPage = false;
    if (options.cdp) {
      const context = browser.contexts()[0];
      // NEVER navigate an existing tab — on a real phone that's the user's
      // browsing session. Open our own tab and close it afterwards; fall back
      // to an existing about:blank tab only.
      try {
        page = await context.newPage();
        ownsPage = true;
      } catch {
        const blank = context.pages().find((p) => p.url() === "about:blank");
        if (!blank) throw new Error("Could not open a new tab and no about:blank tab to reuse.");
        page = blank;
      }
      await page.goto(options.url, { waitUntil: "load", timeout: 120_000 });
      await page.evaluate(`sessionStorage.setItem("hero-intro-seen", "true")`);
      await page.reload({ waitUntil: "load", timeout: 120_000 });
    } else {
      const context = await browser.newContext(
        options.desktop
          ? { viewport: { width: 1280, height: 800 } }
          : {
              viewport: { width: 412, height: 915 },
              isMobile: true,
              hasTouch: true,
              deviceScaleFactor: 2.6,
              userAgent:
                "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36",
            },
      );
      await context.addInitScript(() => {
        sessionStorage.setItem("hero-intro-seen", "true");
      });
      page = await context.newPage();
      // The will-change hint path only exists on non-"high" tiers; tier
      // detection is capability-based (assume-good), so force the low tier
      // for the mobile-emulated repro run.
      const localUrl = options.desktop
        ? options.url
        : `${options.url}${options.url.includes("?") ? "&" : "?"}canvasPerf=low`;
      await page.goto(localUrl, { waitUntil: "load" });
    }

    // Let the intro finish and models settle so baseline motion is small.
    await page.waitForSelector('[data-model="work-laptop"]', { timeout: 120_000 });
    await sleep(5000);
    await page.bringToFront();

    // Capability signals — data for device-tier detection design.
    const signals = await page.evaluate(`(() => {
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
        colorGamutP3: matchMedia("(color-gamut: p3)").matches,
        dynamicRangeHigh: matchMedia("(dynamic-range: high)").matches,
        pointerCoarse: matchMedia("(pointer: coarse)").matches,
        gpu,
        ua: navigator.userAgent.slice(0, 80),
      });
    })()`);
    console.log(`device signals: ${signals}`);

    const cdp = await page.context().newCDPSession(page);

    // Sample the scene's computed will-change + a gesture marker each frame.
    await page.evaluate(() => {
      const scene = document.querySelector(".origin-top-left");
      window.__wc = [];
      const tick = () => {
        window.__wc.push({
          t: performance.now(),
          wc: scene ? getComputedStyle(scene).willChange : "?",
        });
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });

    // Screencast capture.
    const frames = [];
    cdp.on("Page.screencastFrame", async (frame) => {
      frames.push({ t: frame.metadata.timestamp, b64: frame.data });
      try {
        await cdp.send("Page.screencastFrameAck", { sessionId: frame.sessionId });
      } catch {
        /* stopped */
      }
    });
    await cdp.send("Page.startScreencast", {
      format: "jpeg",
      quality: 70,
      everyNthFrame: 1,
    });

    const mark = async (name) => {
      // Record the marker plus the scene's live transform, so we can verify
      // the synthetic gestures actually drove the app (scale must move on
      // pinch, translate on drag).
      const state = await page.evaluate((n) => {
        const scene = document.querySelector(".origin-top-left");
        const transform = scene ? getComputedStyle(scene).transform : "?";
        window.__wc.push({ t: performance.now(), marker: n, transform });
        return transform;
      }, name);
      console.log(`  [${name}] scene transform: ${state}`);
      return Date.now();
    };

    const cx = options.desktop ? 640 : 206;
    const cy = options.desktop ? 400 : 460;

    // Gesture script: idle → drag → idle → pinch out → idle → pinch in → drag.
    await mark("idle");
    await sleep(1200);

    await mark("drag-1");
    await cdp.send("Input.synthesizeScrollGesture", {
      x: cx,
      y: cy,
      xDistance: -220,
      yDistance: -120,
      speed: 900,
      gestureSourceType: options.desktop ? "mouse" : "touch",
      preventFling: true,
    });
    await mark("idle");
    await sleep(1200);

    if (!options.desktop) {
      await mark("pinch-out");
      await cdp.send("Input.synthesizePinchGesture", {
        x: cx,
        y: cy,
        scaleFactor: 1.8,
        relativeSpeed: 400,
        gestureSourceType: "touch",
      });
      await mark("idle");
      await sleep(1200);

      await mark("pinch-in");
      await cdp.send("Input.synthesizePinchGesture", {
        x: cx,
        y: cy,
        scaleFactor: 0.6,
        relativeSpeed: 400,
        gestureSourceType: "touch",
      });
      await mark("idle");
      await sleep(1200);
    }

    await mark("drag-2");
    await cdp.send("Input.synthesizeScrollGesture", {
      x: cx,
      y: cy,
      xDistance: 200,
      yDistance: 100,
      speed: 900,
      gestureSourceType: options.desktop ? "mouse" : "touch",
      preventFling: true,
    });
    await mark("idle");
    await sleep(1200);

    await cdp.send("Page.stopScreencast");
    const wcTimeline = await page.evaluate(() => window.__wc);

    // Analyze frame deltas in the analyzer page (sequentially, order matters).
    const deltas = [];
    for (const frame of frames) {
      const delta = await analyzer.evaluate(
        (b64) => window.analyze(b64),
        frame.b64,
      );
      deltas.push({ t: frame.t, delta });
    }

    const valid = deltas.filter((d) => d.delta !== null);
    const sorted = [...valid].sort((a, b) => a.delta - b.delta);
    const median = sorted[Math.floor(sorted.length / 2)]?.delta ?? 0;
    const p95 = sorted[Math.floor(sorted.length * 0.95)]?.delta ?? 0;
    const max = sorted[sorted.length - 1]?.delta ?? 0;
    // Spike = way beyond both the median and an absolute floor. Smooth panning
    // produces moderate consistent deltas; a flash is an outlier burst.
    const threshold = Math.max(median * 4, 18);
    const spikes = valid.filter((d) => d.delta > threshold);

    // Correlate: how did will-change behave? Count transitions.
    let wcTransitions = 0;
    let lastWc = null;
    for (const s of wcTimeline) {
      if (s.wc === undefined) continue;
      if (lastWc !== null && s.wc !== lastWc) wcTransitions += 1;
      lastWc = s.wc;
    }

    const modeLabel = options.cdp
      ? "cdp-attached (device)"
      : options.desktop
        ? "desktop"
        : "mobile-emulated";
    console.log(`mode: ${modeLabel}`);
    console.log(`frames captured: ${frames.length}`);
    console.log(
      `frame delta: median ${median.toFixed(2)}  p95 ${p95.toFixed(2)}  max ${max.toFixed(2)}  (0-255 gray)`,
    );
    console.log(`spike threshold: ${threshold.toFixed(2)}`);
    console.log(`SPIKES (flash candidates): ${spikes.length}`);
    console.log(`will-change transitions during run: ${wcTransitions}`);

    if (options.dumpFrames && spikes.length) {
      mkdirSync(options.dumpDir, { recursive: true });
      const byTime = new Map(frames.map((f) => [f.t, f.b64]));
      let dumped = 0;
      for (const spike of spikes.slice(0, 12)) {
        const index = frames.findIndex((f) => f.t === spike.t);
        for (const j of [index - 1, index, index + 1]) {
          const f = frames[j];
          if (!f) continue;
          const name = `spike${dumped}-${j === index ? "hit" : j < index ? "before" : "after"}-d${spike.delta.toFixed(0)}.jpg`;
          writeFileSync(path.join(options.dumpDir, name), Buffer.from(f.b64, "base64"));
        }
        dumped += 1;
      }
      console.log(`dumped ${dumped} spike frame triplets -> ${options.dumpDir}`);
    }

    console.log(
      JSON.stringify({
        mode: modeLabel,
        frames: frames.length,
        median,
        p95,
        max,
        spikes: spikes.length,
        wcTransitions,
      }),
    );
  } finally {
    if (options.cdp) {
      // Close only the tab we opened; leave the user's browser alone.
      try {
        const context = browser.contexts()[0];
        const ours = context.pages().find((p) => p.url().includes(new URL(options.url).host));
        if (ours) await ours.close();
      } catch {
        /* best effort */
      }
      // Disconnect (does not kill the remote browser).
      await browser.close();
    } else {
      await browser.close();
    }
    await analyzerBrowser.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exit(1);
});
