#!/usr/bin/env node
// Deterministic build-weight analyzer for the personal website.
//
// Unlike Lighthouse (which varies run-to-run with CPU/network simulation), this
// measures only facts that are identical for a given build: the exact bytes the
// browser must download and execute on first paint. Same source -> same numbers,
// so it catches regressions with zero noise and is the source of truth we diff
// against on every change. Lighthouse (perf/lighthouse.mjs) covers the noisy,
// derived scores separately.
//
// What "initial" means here: we parse dist/index.html and take exactly what the
// browser fetches before any interaction/scroll -- the entry <script>, any
// <link rel="modulepreload">, the stylesheet(s), and <link rel="preload"> media.
// Everything else in dist/assets is code-split (async) and excluded from the
// initial-transfer number.
//
// Usage:
//   node perf/analyze.mjs                     build, then print the scorecard + diff vs baseline
//   node perf/analyze.mjs --skip-build        reuse the existing dist/
//   node perf/analyze.mjs --write-baseline    save current metrics as perf/baseline.json
//   node perf/analyze.mjs --markdown <file>   also write a Markdown report (for PR comments)
//   node perf/analyze.mjs --baseline <file>   compare against a specific baseline JSON

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { gzipSync, brotliCompressSync, constants as zlibConstants } from "node:zlib";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const PERF_DIR = path.join(ROOT, "perf");

// Byte deltas below this (gzip) are immaterial (minifier/hash jitter) and hidden.
const MATERIAL_BYTES = 512;

function parseArgs(argv) {
  const options = {
    skipBuild: false,
    writeBaseline: false,
    markdown: null,
    baseline: path.join(PERF_DIR, "baseline.json"),
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--skip-build") options.skipBuild = true;
    else if (arg === "--write-baseline") options.writeBaseline = true;
    else if (arg === "--markdown") options.markdown = argv[++i];
    else if (arg === "--baseline") options.baseline = path.resolve(argv[++i]);
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

function sizes(buffer) {
  return {
    raw: buffer.length,
    gzip: gzipSync(buffer, { level: 9 }).length,
    brotli: brotliCompressSync(buffer, {
      params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 11 },
    }).length,
  };
}

// Resolve an href from index.html (e.g. "/assets/index-abc.js") to a dist path.
function distPathFor(href) {
  if (!href || /^https?:\/\//.test(href)) return null; // external (fonts) -> not a local asset
  const clean = href.split("?")[0].replace(/^\//, "");
  const full = path.join(DIST, clean);
  return existsSync(full) ? full : null;
}

function parseInitialSet(html) {
  const scripts = [...html.matchAll(/<script[^>]*type="module"[^>]*src="([^"]+)"/g)].map((m) => m[1]);
  const modulepreloads = [...html.matchAll(/<link[^>]*rel="modulepreload"[^>]*href="([^"]+)"/g)].map((m) => m[1]);
  const stylesheets = [...html.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)].map((m) => m[1]);
  const preloadImages = [...html.matchAll(/<link[^>]*rel="preload"[^>]*as="image"[^>]*href="([^"]+)"/g)].map((m) => m[1]);
  return { scripts, modulepreloads, stylesheets, preloadImages };
}

function collect() {
  const html = readFileSync(path.join(DIST, "index.html"));
  const initial = parseInitialSet(html.toString());

  const assetDir = path.join(DIST, "assets");
  const allAssets = existsSync(assetDir)
    ? readdirSync(assetDir).filter((f) => /\.(js|css)$/.test(f))
    : [];

  // Which JS files are part of the initial (eager) load per index.html?
  const initialJsHrefs = new Set(
    [...initial.scripts, ...initial.modulepreloads]
      .map((h) => h.split("?")[0].replace(/^\/?assets\//, ""))
      .filter(Boolean),
  );

  const jsAssets = [];
  const cssAssets = [];
  for (const name of allAssets) {
    const buf = readFileSync(path.join(assetDir, name));
    const entry = { name, ...sizes(buf), initial: false };
    if (name.endsWith(".css")) cssAssets.push(entry);
    else {
      entry.initial = initialJsHrefs.has(name);
      jsAssets.push(entry);
    }
  }

  const sum = (arr, key) => arr.reduce((n, a) => n + a[key], 0);
  const initialJs = jsAssets.filter((a) => a.initial);
  const asyncJs = jsAssets.filter((a) => !a.initial);

  // Preloaded media (images) count toward first-paint transfer as raw bytes.
  const preloadMedia = initial.preloadImages
    .map((href) => distPathFor(href))
    .filter(Boolean)
    .map((p) => ({ name: path.relative(DIST, p), raw: readFileSync(p).length }));

  const htmlSize = sizes(html);
  const initialJsBytes = { raw: sum(initialJs, "raw"), gzip: sum(initialJs, "gzip"), brotli: sum(initialJs, "brotli") };
  const cssBytes = { raw: sum(cssAssets, "raw"), gzip: sum(cssAssets, "gzip"), brotli: sum(cssAssets, "brotli") };

  return {
    schemaVersion: 1,
    html: { raw: htmlSize.raw, gzip: htmlSize.gzip, brotli: htmlSize.brotli },
    initialJs: initialJsBytes,
    asyncJs: { raw: sum(asyncJs, "raw"), gzip: sum(asyncJs, "gzip"), brotli: sum(asyncJs, "brotli"), count: asyncJs.length },
    css: cssBytes,
    totalJs: { raw: sum(jsAssets, "raw"), gzip: sum(jsAssets, "gzip"), chunkCount: jsAssets.length },
    // Critical-path transfer: compressed HTML + CSS + eager JS (brotli, what
    // Cloudflare serves) — the render-blocking / execution-critical bytes.
    // Preloaded media is tracked separately below: a preload *hint* reorders
    // bytes rather than adding them, so counting it here would misreport adding
    // a hint as a regression.
    criticalPathBrotli: htmlSize.brotli + cssBytes.brotli + initialJsBytes.brotli,
    preloadMedia,
    // Per-chunk detail (sorted by gzip desc) for the human-readable table.
    chunks: [...jsAssets, ...cssAssets].sort((a, b) => b.gzip - a.gzip),
  };
}

// ---- reporting -------------------------------------------------------------

const kb = (bytes) => `${(bytes / 1024).toFixed(2)} KB`;

function delta(before, after) {
  if (before == null) return "";
  const diff = after - before;
  if (Math.abs(diff) < MATERIAL_BYTES) return "  ·";
  const mag = kb(Math.abs(diff));
  return diff > 0 ? `  🔴 +${mag}` : `  🟢 -${mag}`;
}

function printScorecard(m, baseline) {
  const b = baseline || {};
  const line = (label, cur, base) => `  ${label.padEnd(26)} ${kb(cur).padStart(11)}${delta(base, cur)}`;
  console.log("\n=== Deterministic build scorecard (brotli unless noted) ===\n");
  console.log(line("Initial JS (eager)   gzip", m.initialJs.gzip, b.initialJs?.gzip));
  console.log(line("Initial JS (eager) brotli", m.initialJs.brotli, b.initialJs?.brotli));
  console.log(line("CSS                  gzip", m.css.gzip, b.css?.gzip));
  console.log(line("Critical path (br)", m.criticalPathBrotli, b.criticalPathBrotli));
  console.log("  " + "-".repeat(44));
  console.log(line("Async JS (lazy)      gzip", m.asyncJs.gzip, b.asyncJs?.gzip)
    + `   (${m.asyncJs.count} chunks)`);
  console.log(line("Total JS             gzip", m.totalJs.gzip, b.totalJs?.gzip)
    + `   (${m.totalJs.chunkCount} chunks)`);

  console.log("\n  Chunks (gzip, ★ = eager/initial):");
  for (const c of m.chunks) {
    const star = c.initial ? "★" : " ";
    console.log(`    ${star} ${c.name.padEnd(42)} ${kb(c.gzip).padStart(11)}  (raw ${kb(c.raw)})`);
  }
  if (m.preloadMedia.length) {
    console.log("\n  Preloaded media (raw):");
    for (const p of m.preloadMedia) console.log(`      ${p.name.padEnd(42)} ${kb(p.raw).padStart(11)}`);
  }
  console.log("");
}

function markdownReport(m, baseline) {
  const b = baseline || {};
  const row = (label, cur, base) => {
    const d = base == null ? "—" : (Math.abs(cur - base) < MATERIAL_BYTES ? "·" : (cur > base ? `🔴 +${kb(cur - base)}` : `🟢 -${kb(base - cur)}`));
    return `| ${label} | ${base == null ? "—" : kb(base)} | ${kb(cur)} | ${d} |`;
  };
  const lines = [
    "### 📉 Build weight (deterministic)",
    "",
    "| Metric | Before | After | Δ |",
    "| :-- | --: | --: | :-- |",
    row("Initial JS (eager) gzip", m.initialJs.gzip, b.initialJs?.gzip),
    row("Initial JS (eager) brotli", m.initialJs.brotli, b.initialJs?.brotli),
    row("CSS gzip", m.css.gzip, b.css?.gzip),
    row("Critical path (HTML+CSS+eager JS, brotli)", m.criticalPathBrotli, b.criticalPathBrotli),
    row("Async JS gzip", m.asyncJs.gzip, b.asyncJs?.gzip),
    row("Total JS gzip", m.totalJs.gzip, b.totalJs?.gzip),
    "",
    "<details><summary>Chunks</summary>",
    "",
    "| Chunk | Eager | gzip | raw |",
    "| :-- | :-: | --: | --: |",
    ...m.chunks.map((c) => `| ${c.name} | ${c.initial ? "★" : ""} | ${kb(c.gzip)} | ${kb(c.raw)} |`),
    "</details>",
    "",
  ];
  return lines.join("\n");
}

// ---- main ------------------------------------------------------------------

function main() {
  const options = parseArgs(process.argv.slice(2));

  if (!options.skipBuild) {
    console.log("Building (npm run build)...");
    execFileSync("npm", ["run", "build"], { cwd: ROOT, stdio: "inherit" });
  }

  const metrics = collect();

  const baseline =
    !options.writeBaseline && existsSync(options.baseline)
      ? JSON.parse(readFileSync(options.baseline, "utf8"))
      : null;

  printScorecard(metrics, baseline);

  if (options.writeBaseline) {
    mkdirSync(path.dirname(options.baseline), { recursive: true });
    writeFileSync(options.baseline, JSON.stringify(metrics, null, 2) + "\n");
    console.log(`Wrote baseline -> ${path.relative(ROOT, options.baseline)}`);
  }

  if (options.markdown) {
    mkdirSync(path.dirname(path.resolve(options.markdown)), { recursive: true });
    writeFileSync(options.markdown, markdownReport(metrics, baseline) + "\n");
    console.log(`Wrote markdown -> ${options.markdown}`);
  }
}

main();
