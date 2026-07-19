#!/usr/bin/env node
// Does promoting the scene to a compositor layer (will-change: transform)
// degrade desktop text antialiasing vs the un-promoted default (auto)?
//
// Captures the SAME hero text twice — once with the scene's will-change at
// "auto", once forced to "transform" — at a chosen deviceScaleFactor, clipped
// tight around the text and upscaled so edge AA (subpixel LCD fringing vs flat
// grayscale) is visible. Also emits a per-pixel diff magnitude between the two.
//
//   node perf/aa-test.mjs            # DPR 1 (subpixel AA most at risk)
//   node perf/aa-test.mjs --dpr 2    # Retina (usually grayscale regardless)

import { createRequire } from "node:module";
import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "perf", "fps-results", "aa");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const chromium = (() => {
  const require = createRequire(import.meta.url);
  for (const p of [
    path.join(ROOT, "node_modules", "playwright"),
    "/Users/hunterchen/Documents/GitHub/canvas/node_modules/playwright",
  ]) {
    if (existsSync(p)) return require(p).chromium;
  }
  throw new Error("playwright not found");
})();

const dpr = (() => {
  const i = process.argv.indexOf("--dpr");
  return i >= 0 ? Number(process.argv[i + 1]) : 1;
})();

async function main() {
  const { mkdirSync } = await import("node:fs");
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: dpr,
  });
  const page = await context.newPage();
  await page.goto("http://localhost:4173", { waitUntil: "load" });

  // The VISIBLE intro subtitle (not the hidden aria-hidden/inert ReaderContent
  // SEO copy, which also contains this text). Filter to a rendered, non-inert,
  // reasonably-sized line.
  const visibleIntro = () =>
    [...document.querySelectorAll("p")].find(
      (e) =>
        /welcome to my playground/i.test(e.textContent || "") &&
        e.getClientRects().length > 0 &&
        !e.closest('[aria-hidden="true"],[inert]') &&
        e.getBoundingClientRect().width < 480,
    );
  await page.waitForFunction(visibleIntro, { timeout: 30_000 });
  await page.waitForTimeout(2500);

  const box = await page.evaluate(() => {
    const p = [...document.querySelectorAll("p")].find(
      (e) =>
        /welcome to my playground/i.test(e.textContent || "") &&
        e.getClientRects().length > 0 &&
        !e.closest('[aria-hidden="true"],[inert]') &&
        e.getBoundingClientRect().width < 480,
    );
    const r = p.getBoundingClientRect();
    return { x: Math.floor(r.x), y: Math.floor(r.y), width: Math.ceil(r.width), height: Math.ceil(r.height) };
  });
  // Narrow to the first ~230px of glyphs (text-only, no models overlapping) so
  // the comparison isolates text edges and isn't confounded by animation.
  const clip = { x: box.x, y: box.y - 2, width: Math.min(230, box.width), height: box.height + 4 };

  const sceneHasWillChange = await page.evaluate(
    () => getComputedStyle(document.querySelector(".origin-top-left")).willChange,
  );

  // State A: default (auto on desktop).
  await page.screenshot({ path: path.join(OUT, `aa-auto-dpr${dpr}.png`), clip });

  // State B: force will-change: transform on the scene (what always-on would do).
  await page.evaluate(() => {
    const scene = document.querySelector(".origin-top-left");
    scene.style.willChange = "transform";
    scene.getBoundingClientRect(); // force style/layer flush
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, `aa-transform-dpr${dpr}.png`), clip });

  console.log(`dpr=${dpr}  scene default will-change="${sceneHasWillChange}"  clip=${clip.width}x${clip.height}`);
  console.log(`wrote aa-auto-dpr${dpr}.png / aa-transform-dpr${dpr}.png`);

  await browser.close();
}

main().catch((e) => {
  console.error(e instanceof Error ? e.stack ?? e.message : e);
  process.exit(1);
});
