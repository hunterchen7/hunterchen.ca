#!/usr/bin/env node
// Model-animation fps benchmark under CPU throttling.
//
// Validates the "always 60fps, simplify effects instead" policy empirically:
// loads the production build in Chrome, applies DevTools CPU throttling
// (Emulation.setCPUThrottlingRate — the same mechanism Lighthouse/DevTools
// use; 4x is Lighthouse's mobile default, 6-10x approximates genuinely slow
// phones), and measures the achieved main-thread frame rate plus per-model
// update rates at desktop and mobile viewports.
//
// Reads:
//   - rAF fps (achieved), mean / p95 / worst frame time
//   - % of frames over 20ms ("missed 60fps") and over 34ms ("under 30fps")
//   - per-model DOM update batches/sec (one React commit ≈ one batch)
//   - which variant the page chose (mobile widths → simplified models)
//
// Requires Chrome at the standard macOS path and playwright(-core); resolved
// from this repo's node_modules or the sibling canvas repo. No downloads.
//
// Usage:
//   node perf/fps-bench.mjs                          # 1,4,6,10x @ desktop+mobile
//   node perf/fps-bench.mjs --throttle 1,6 --seconds 6 --viewports mobile
//   node perf/fps-bench.mjs --url http://localhost:4173

import { createRequire } from "node:module";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  collectorSource,
  formatSample,
  waitForModelsAnimating,
} from "./fps-collector.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

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
        return { chromium: require(candidate).chromium, from: candidate };
      } catch {
        // fall through to the next candidate
      }
    }
  }
  throw new Error(
    "playwright not found. Install playwright-core (npm i -D playwright-core) or ensure ../canvas has it.",
  );
}

function parseArgs(argv) {
  const options = {
    url: "http://localhost:4173",
    throttle: [1, 4, 6, 10],
    seconds: 8,
    viewports: ["desktop", "mobile"],
    json: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--url") options.url = argv[++i];
    else if (arg === "--throttle")
      options.throttle = argv[++i].split(",").map(Number);
    else if (arg === "--seconds") options.seconds = Number(argv[++i]);
    else if (arg === "--viewports") options.viewports = argv[++i].split(",");
    else if (arg === "--json") options.json = argv[++i];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

const VIEWPORTS = {
  desktop: { width: 1280, height: 800 },
  mobile: { width: 375, height: 812 },
};

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const { chromium, from } = loadPlaywright();
  console.log(`playwright: ${from}`);
  if (!existsSync(CHROME)) throw new Error(`Chrome not found at ${CHROME}`);

  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: true,
  });

  const results = [];
  try {
    for (const viewportName of options.viewports) {
      const viewport = VIEWPORTS[viewportName];
      if (!viewport) throw new Error(`Unknown viewport: ${viewportName}`);

      for (const rate of options.throttle) {
        const context = await browser.newContext({ viewport });
        await context.addInitScript(() => {
          sessionStorage.setItem("hero-intro-seen", "true");
        });
        const page = await context.newPage();
        const cdp = await context.newCDPSession(page);
        await page.goto(options.url, { waitUntil: "load" });
        await cdp.send("Emulation.setCPUThrottlingRate", { rate });
        await waitForModelsAnimating(page);

        const sample = await page.evaluate(collectorSource(options.seconds));
        results.push({ viewport: viewportName, throttle: rate, ...sample });
        console.log(
          formatSample(
            `${viewportName.padEnd(8)} ${String(rate).padStart(2)}x`,
            sample,
          ),
        );
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }

  if (options.json) {
    mkdirSync(path.dirname(path.resolve(options.json)), { recursive: true });
    writeFileSync(options.json, JSON.stringify(results, null, 2) + "\n");
    console.log(`\nWrote ${options.json}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exit(1);
});
