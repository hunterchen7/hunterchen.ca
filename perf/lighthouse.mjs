#!/usr/bin/env node
// Lighthouse median-of-N runner (the noisy-but-real layer).
//
// Lighthouse's score wanders run-to-run because it simulates CPU/network. We
// tame that two ways: (1) pin the throttling model so it never drifts, and
// (2) run N times and report the MEDIAN plus the min-max spread, so the noise
// is visible instead of hidden. Deterministic byte metrics live in analyze.mjs;
// this is only for the derived scores (FCP/LCP/TBT/CLS/score).
//
// Runs against a production `vite preview` build (NOT the dev server) so the
// numbers reflect what ships. Requires Chrome and the `lighthouse` CLI
// (resolved via local node_modules or `npx -y lighthouse`).
//
// Usage:
//   node perf/lighthouse.mjs                 build, preview, 5 mobile runs, median
//   node perf/lighthouse.mjs --skip-build    reuse existing dist/
//   node perf/lighthouse.mjs --runs 3        change the run count
//   node perf/lighthouse.mjs --desktop       desktop form factor (default: mobile)

import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function parseArgs(argv) {
  const o = { skipBuild: false, runs: 5, desktop: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--skip-build") o.skipBuild = true;
    else if (a === "--runs") o.runs = Number(argv[++i]);
    else if (a === "--desktop") o.desktop = true;
    else throw new Error(`Unknown argument: ${a}`);
  }
  return o;
}

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

function startPreview() {
  return new Promise((resolve, reject) => {
    const proc = spawn("npm", ["run", "preview"], { cwd: ROOT });
    let out = "";
    const onData = (buf) => {
      out += buf.toString();
      const m = out.match(/https?:\/\/(localhost|127\.0\.0\.1):(\d+)\/?/);
      if (m) {
        proc.stdout.off("data", onData);
        resolve({ proc, url: m[0].replace(/\/$/, "") });
      }
    };
    proc.stdout.on("data", onData);
    proc.stderr.on("data", onData);
    proc.on("error", reject);
    setTimeout(() => reject(new Error("vite preview did not report a URL in 30s")), 30000);
  });
}

function lighthouseBin() {
  const local = path.join(ROOT, "node_modules", ".bin", "lighthouse");
  return existsSync(local) ? [local] : ["npx", "-y", "lighthouse"];
}

function runLighthouse(url, outFile, desktop) {
  const [bin, ...pre] = lighthouseBin();
  // Pinned throttling so runs stay comparable across commits (LH mobile "Slow 4G").
  const args = [
    ...pre,
    url,
    "--only-categories=performance",
    "--output=json",
    `--output-path=${outFile}`,
    "--quiet",
    `--form-factor=${desktop ? "desktop" : "mobile"}`,
    "--throttling-method=simulate",
    "--throttling.cpuSlowdownMultiplier=4",
    "--throttling.rttMs=150",
    "--throttling.throughputKbps=1638.4",
    `--screenEmulation.${desktop ? "disabled" : "mobile"}`,
    '--chrome-flags=--headless=new --no-sandbox',
  ];
  execFileSync(bin, args, {
    cwd: ROOT,
    stdio: ["ignore", "ignore", "inherit"],
    env: { ...process.env, ...(existsSync(CHROME) ? { CHROME_PATH: CHROME } : {}) },
  });
  return JSON.parse(readFileSync(outFile, "utf8"));
}

function metricsFrom(lhr) {
  const a = lhr.audits;
  return {
    score: Math.round(lhr.categories.performance.score * 100),
    fcp: a["first-contentful-paint"].numericValue,
    lcp: a["largest-contentful-paint"].numericValue,
    tbt: a["total-blocking-time"].numericValue,
    cls: a["cumulative-layout-shift"].numericValue,
    si: a["speed-index"].numericValue,
  };
}

async function main() {
  const o = parseArgs(process.argv.slice(2));
  if (!o.skipBuild) {
    console.log("Building (npm run build)...");
    execFileSync("npm", ["run", "build"], { cwd: ROOT, stdio: "inherit" });
  }

  console.log("Starting vite preview...");
  const { proc, url } = await startPreview();
  const tmp = mkdtempSync(path.join(tmpdir(), "lh-"));
  const results = [];
  try {
    console.log(`Running Lighthouse ${o.runs}x (${o.desktop ? "desktop" : "mobile"}) against ${url}\n`);
    for (let i = 0; i < o.runs; i++) {
      const lhr = runLighthouse(url, path.join(tmp, `run-${i}.json`), o.desktop);
      const m = metricsFrom(lhr);
      results.push(m);
      console.log(`  run ${i + 1}/${o.runs}: score ${m.score}  FCP ${(m.fcp / 1000).toFixed(2)}s  LCP ${(m.lcp / 1000).toFixed(2)}s  TBT ${Math.round(m.tbt)}ms  CLS ${m.cls.toFixed(3)}`);
    }
  } finally {
    proc.kill("SIGTERM");
    rmSync(tmp, { recursive: true, force: true });
  }

  const agg = (key, unit, div = 1, dp = 0) => {
    const vals = results.map((r) => r[key]);
    const mn = Math.min(...vals) / div, mx = Math.max(...vals) / div, md = median(vals) / div;
    return `  ${key.toUpperCase().padEnd(6)} median ${md.toFixed(dp)}${unit}   (range ${mn.toFixed(dp)}–${mx.toFixed(dp)}${unit})`;
  };
  console.log("\n=== Lighthouse median-of-" + o.runs + " ===\n");
  console.log(agg("score", "", 1, 0));
  console.log(agg("fcp", "s", 1000, 2));
  console.log(agg("lcp", "s", 1000, 2));
  console.log(agg("tbt", "ms", 1, 0));
  console.log(agg("cls", "", 1, 3));
  console.log(agg("si", "s", 1000, 2));
  console.log("");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
