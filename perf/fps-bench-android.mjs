#!/usr/bin/env node
// Model-animation fps benchmark inside an Android emulator.
//
// Boots an AVD headless, points its Chrome at the host's `vite preview`
// (via adb reverse), attaches over CDP, and runs the same rAF/update-rate
// collector as perf/fps-bench.mjs. The device viewport is a phone, so the
// page loads the simplified (mobile) model variants — this measures the
// real thing a phone would run.
//
// Usage:
//   node perf/fps-bench-android.mjs --avd Pixel_9_Pro_XL
//   node perf/fps-bench-android.mjs --avd gimped_low --seconds 10
//   node perf/fps-bench-android.mjs --avd Pixel_9_Pro_XL --keep   # leave emulator running
//
// Assumes the preview server is up on the host (npm run preview, port 4173).

import { createRequire } from "node:module";
import { spawn, execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const SDK = path.join(os.homedir(), "Library", "Android", "sdk");
const EMULATOR = path.join(SDK, "emulator", "emulator");
const ADB = path.join(SDK, "platform-tools", "adb");
const CDP_PORT = 9333;

const PLAYWRIGHT_CANDIDATES = [
  path.resolve(import.meta.dirname, "..", "node_modules", "playwright"),
  path.resolve(import.meta.dirname, "..", "node_modules", "playwright-core"),
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
    avd: "Pixel_9_Pro_XL",
    seconds: 8,
    port: 4173,
    keep: false,
    headless: false,
    bootTimeoutS: 240,
    // Launch-time hardware gimps (emulator CLI overrides). Applying these to a
    // known-good AVD beats a dedicated low-spec AVD: the profile (Chrome
    // first-run, Play setup) stays intact, only the hardware shrinks.
    cores: null,
    gpu: null,
    memory: null,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--avd") options.avd = argv[++i];
    else if (arg === "--seconds") options.seconds = Number(argv[++i]);
    else if (arg === "--port") options.port = Number(argv[++i]);
    else if (arg === "--keep") options.keep = true;
    else if (arg === "--headless") options.headless = true;
    else if (arg === "--cores") options.cores = Number(argv[++i]);
    else if (arg === "--gpu") options.gpu = argv[++i];
    else if (arg === "--memory") options.memory = Number(argv[++i]);
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

function adb(...args) {
  return execFileSync(ADB, args, { encoding: "utf8" }).trim();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForBoot(timeoutS) {
  const deadline = Date.now() + timeoutS * 1000;
  execFileSync(ADB, ["wait-for-device"], { timeout: timeoutS * 1000 });
  while (Date.now() < deadline) {
    try {
      if (adb("shell", "getprop", "sys.boot_completed") === "1") return;
    } catch {
      /* device flapping during boot */
    }
    await sleep(2000);
  }
  throw new Error(`Emulator did not finish booting within ${timeoutS}s`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const chromium = loadPlaywright();

  const alreadyRunning = (() => {
    try {
      return adb("devices").includes("emulator-");
    } catch {
      return false;
    }
  })();

  let emulatorProc = null;
  if (!alreadyRunning) {
    // Windowed by default: on this emulator, windowless mode produces NO
    // frames at all — Chrome's compositor treats the surface as occluded
    // (rAF ~0 while document.visibilityState still reads "visible"), with
    // both host GPU and swiftshader. A visible window is the only mode that
    // measures anything real; --headless remains for experiments.
    console.log(
      `Booting AVD ${options.avd} (${options.headless ? "headless — expect rAF~0" : "windowed"})...`,
    );
    const gimps = [
      ...(options.cores ? ["-cores", String(options.cores)] : []),
      ...(options.gpu ? ["-gpu", options.gpu] : []),
      ...(options.memory ? ["-memory", String(options.memory)] : []),
    ];
    if (gimps.length) console.log(`Hardware overrides: ${gimps.join(" ")}`);
    emulatorProc = spawn(
      EMULATOR,
      [
        "-avd",
        options.avd,
        ...(options.headless ? ["-no-window"] : []),
        "-no-audio",
        "-no-boot-anim",
        "-no-snapshot-save",
        ...gimps,
      ],
      { stdio: "ignore", detached: true },
    );
    emulatorProc.unref();
  } else {
    console.log("Using already-running emulator.");
  }

  try {
    await waitForBoot(options.bootTimeoutS);
    console.log("Boot complete.");

    // A -no-window boot can leave the (virtual) screen off / keyguard up, and
    // Chrome throttles rAF to ~0 for non-visible pages — which would make the
    // whole benchmark measure nothing. Force the screen on and unlocked.
    adb("shell", "input keyevent KEYCODE_WAKEUP");
    adb("shell", "wm dismiss-keyguard");
    adb("shell", "svc power stayon true");

    // Device reaches the host preview server at localhost:<port>.
    adb("reverse", `tcp:${options.port}`, `tcp:${options.port}`);

    // Chrome must exist on this image (Play Store images ship it).
    const hasChrome = adb("shell", "pm", "list", "packages", "com.android.chrome");
    if (!hasChrome.includes("com.android.chrome")) {
      throw new Error(
        "com.android.chrome not on this image (AOSP image?). Use a Play Store AVD.",
      );
    }

    // Best-effort first-run skip (honored on debuggable builds only; Play
    // Store images are `user` builds, so the UI dismissal below is the real
    // fallback).
    adb(
      "shell",
      'echo "chrome --disable-fre --no-default-browser-check --no-first-run" > /data/local/tmp/chrome-command-line',
    );
    adb("shell", "am", "force-stop", "com.android.chrome");
    adb(
      "shell",
      "am",
      "start",
      "-n",
      "com.android.chrome/com.google.android.apps.chrome.Main",
      "-d",
      "about:blank",
    );

    // `adb forward` registers lazily and always succeeds — the real readiness
    // signal is the DevTools HTTP endpoint answering. Chrome cold-start on a
    // freshly booted emulator can take a while.
    adb("forward", `tcp:${CDP_PORT}`, "localabstract:chrome_devtools_remote");
    let devtoolsUp = false;
    // Low-spec AVDs on first boot are glacial (Play services setup competes
    // with Chrome's cold start on 2 cores) — be very patient here.
    for (let i = 0; i < 240 && !devtoolsUp; i++) {
      await sleep(1000);
      try {
        const response = await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`);
        if (response.ok) {
          devtoolsUp = true;
          console.log(
            `DevTools up: ${(await response.json())["Browser"] ?? "unknown"}`,
          );
        }
      } catch {
        /* not up yet */
      }
    }
    if (!devtoolsUp) {
      console.error("Chrome processes on device:");
      try {
        console.error(adb("shell", "ps -A | grep -i chrome || true"));
      } catch {
        /* ignore */
      }
      throw new Error("Chrome DevTools endpoint never came up (240s).");
    }

    // If Chrome is showing its First Run Experience (user builds ignore the
    // command-line file), dismiss it with taps: "Accept & continue" sits
    // bottom-center; a possible follow-up sync screen has "No thanks" at
    // bottom-left. Verify progress via the DevTools target list.
    const pageTargets = async () => {
      const response = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
      const targets = await response.json();
      return targets.filter((t) => t.type === "page");
    };
    const freShowing = async () => {
      const pages = await pageTargets();
      return pages.length === 0
        ? true
        : pages.every((p) =>
            /chrome:\/\/welcome|fre|first_run|signin/i.test(p.url ?? ""),
          );
    };
    if (await freShowing()) {
      const size = adb("shell", "wm", "size"); // e.g. "Physical size: 1344x2992"
      const match = size.match(/(\d+)x(\d+)/);
      const [width, height] = match ? [Number(match[1]), Number(match[2])] : [1080, 2400];
      const taps = [
        [0.5, 0.93],
        [0.5, 0.93],
        [0.28, 0.93],
      ];
      for (const [fx, fy] of taps) {
        adb(
          "shell",
          "input",
          "tap",
          String(Math.round(width * fx)),
          String(Math.round(height * fy)),
        );
        await sleep(2000);
        if (!(await freShowing())) break;
      }
      console.log(
        `Post-FRE page targets: ${(await pageTargets()).map((p) => p.url).join(", ") || "(none)"}`,
      );
    }

    const browser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT}`);
    try {
      const context = browser.contexts()[0];
      const page = context.pages()[0] ?? (await context.waitForEvent("page"));

      const { collectorSource, formatSample, waitForModelsAnimating } =
        await import("./fps-collector.mjs");

      // Seed the revisit flag so the intro (and model freeze) is short.
      await page.goto(`http://localhost:${options.port}/`, {
        waitUntil: "load",
        timeout: 60_000,
      });
      await page.evaluate(`sessionStorage.setItem("hero-intro-seen", "true")`);
      await page.reload({ waitUntil: "load", timeout: 120_000 });
      await waitForModelsAnimating(page, { timeoutMs: 180_000 });

      // Multi-arg adb shell loses quoting; pass remote pipelines as ONE string.
      // Info only — never let trivia kill a run that reached sampling.
      const deviceInfo = { model: "?", cores: "?", viewport: "?" };
      try {
        deviceInfo.model = adb("shell", "getprop ro.product.model");
        deviceInfo.cores = adb("shell", "grep -c ^processor /proc/cpuinfo");
        deviceInfo.viewport = await page.evaluate("innerWidth + 'x' + innerHeight");
      } catch {
        /* keep placeholders */
      }
      console.log(
        `Device: ${deviceInfo.model} (${deviceInfo.cores} cores) viewport ${deviceInfo.viewport}`,
      );

      // If the page is hidden, rAF is throttled to ~0 and the sample is
      // meaningless — re-front Chrome once, then hard-fail rather than emit
      // garbage numbers.
      let visibility = await page.evaluate("document.visibilityState");
      if (visibility !== "visible") {
        adb(
          "shell",
          "am",
          "start",
          "-n",
          "com.android.chrome/com.google.android.apps.chrome.Main",
        );
        await sleep(3000);
        visibility = await page.evaluate("document.visibilityState");
      }
      if (visibility !== "visible") {
        throw new Error(
          "Page never became visible on the device; rAF would be throttled. Aborting sample.",
        );
      }

      const sample = await page.evaluate(collectorSource(options.seconds));
      console.log(formatSample(`android ${options.avd}`, sample));
      console.log(JSON.stringify({ avd: options.avd, ...deviceInfo, ...sample }));
    } finally {
      await browser.close();
    }
  } finally {
    if (!options.keep && !alreadyRunning) {
      try {
        adb("emu", "kill");
        console.log("Emulator shut down.");
      } catch {
        /* already gone */
      }
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exit(1);
});
