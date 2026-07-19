# Performance harness

Measurement infrastructure for the site's performance work. Built **deterministic-first**:
Lighthouse scores wander run-to-run and swing wildly with measurement *context*, so we lean on
byte-exact metrics as the source of truth and treat Lighthouse as a secondary, noisy signal.

## Two layers

### 1. `analyze.mjs` — deterministic build weight (the source of truth)

Measures only facts that are **identical for a given build**: the exact bytes the browser must
download and execute on first paint. Same source → same numbers, so it catches regressions with
zero noise. It parses `dist/index.html` to find the true initial-load set (entry `<script>`,
`<link rel="modulepreload">`, stylesheets, `<link rel="preload">` media) and gzip/brotli-compresses
every asset with Node's `zlib` (no external deps).

```bash
npm run perf                 # build, then print the scorecard + diff vs perf/baseline.json
npm run perf -- --skip-build # reuse the existing dist/
npm run perf:baseline        # save current metrics as perf/baseline.json
npm run perf -- --markdown out.md   # also emit a Markdown report (for a future PR comment)
```

Key metrics: **initial JS (eager) gzip/brotli**, CSS, async (lazy) JS, total JS, estimated
first-paint transfer, and a per-chunk table (★ = eager). Deltas vs the baseline render as
🔴 grew / 🟢 shrank (byte deltas under 512 B are hidden as jitter).

`perf/baseline.json` is committed. Re-run `npm run perf:baseline` and commit it whenever you
intentionally change the initial payload (e.g. after the `@hunterchen/canvas` 0.12.2 bump — the
lucide split should drop the eager `index-*.js` chunk noticeably).

### 2. `lighthouse.mjs` — median-of-N scores (noisy but real)

Runs Lighthouse against a production `vite preview` build (never the dev server) N times with a
**pinned** throttling model, and reports the **median plus the min–max spread** so the noise is
visible instead of hidden. Requires Chrome and the `lighthouse` CLI (resolved from local
`node_modules` or `npx -y lighthouse`).

```bash
npm run perf:lighthouse                 # build, preview, 5 mobile runs, median
npm run perf:lighthouse -- --skip-build --runs 3
npm run perf:lighthouse -- --desktop
```

## Methodology notes — read before trusting a number

- **Compare like with like.** A local-preview + Lantern-simulate run and a live-site + real-network
  run are *different measurements* and are not comparable. As of this writing local-simulate reads
  ~78 while the live site read 47 — that gap is context (undeployed fixes on the working tree, real
  network latency to Cloudflare, the onnx auto-start on live), not a real regression/win. Pick one
  context and hold it fixed across a change; use the deterministic bytes to confirm the direction.
- **The deterministic bytes are the regression gate.** If `initial JS gzip` didn't move, the JS
  payload didn't change, whatever Lighthouse says that run.
- **Production build only.** The dev server has no minification/splitting; its numbers are
  meaningless for perf.

## Planned: artificial constructions (isolated component harnesses)

Next addition: standalone routes/entries that mount a single subsystem (e.g. just the chessboard,
just the hero models) so we can measure one component's JS + asset cost and interaction blocking in
isolation, deterministically, without the rest of the page as noise. Tracked as a follow-up.
