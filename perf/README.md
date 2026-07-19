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

### 3. `fps-bench.mjs` — model animation under CPU throttling

Validates the "always 60fps, simplify effects instead of dropping frame rate" policy. Loads the
production build in headless Chrome (playwright resolved from this repo or `../canvas`), applies
DevTools CPU throttling (`Emulation.setCPUThrottlingRate` — 4x is Lighthouse's mobile default,
6–10x approximates genuinely slow phones), and measures achieved rAF fps, mean/p95/worst frame
times, jank percentages, and per-model DOM update rates at desktop and mobile viewports (mobile
widths load the simplified model variants).

```bash
node perf/fps-bench.mjs                                  # 1,4,6,10x @ desktop+mobile
node perf/fps-bench.mjs --throttle 1,6 --viewports mobile --seconds 6
node perf/fps-bench.mjs --json perf/fps-results/local.json
```

Reference results (M-series Mac, 120Hz, headless software raster — relative numbers are the point):

| Throttle | Desktop (full detail) | Mobile (simplified) |
| --- | --- | --- |
| 1x | 120 rAF / models 60/s | 120 / 60 |
| 4x | 112 / 60 | 120 / 60 |
| 6x | 54 fps, 33% janky | **108 / 59 — still smooth** |
| 10x | 27 fps | 44 fps |

The simplified variants hold 60 updates/s at 6x throttle where full detail collapses — the
"simplify, don't cap" trade is measured, not assumed.

### 4. `fps-bench-android.mjs` — the same probe inside an Android emulator

Boots an AVD headless, bridges its Chrome to the host preview server (`adb reverse`), attaches
over CDP, and runs the same collector. The device viewport is a phone, so this measures the real
simplified-variant path end to end. A deliberately low-spec AVD (`gimped_low`: 2 cores, 1.5 GB
RAM, SwiftShader software GPU) simulates a bad phone.

```bash
npm run preview &                                        # host serves dist on 4173
node perf/fps-bench-android.mjs --avd Pixel_9_Pro_XL
# "bad phone": gimp a known-good AVD at launch instead of making a low-spec AVD
# (a fresh AVD re-runs Chrome first-run + Play setup every boot and gets
# frozen/killed before DevTools appears)
node perf/fps-bench-android.mjs --avd Pixel_9_Pro_XL --cores 2 --gpu swiftshader_indirect
```

Reference results (`perf/fps-results/android.json`; simplified variants active in both):

| Run | rAF fps | model updates/s |
| --- | --- | --- |
| Pixel 9 Pro XL emulator, stock (4 cores, host GPU) | 23.7 | ~20 |
| Same, gimped (2 cores, software GPU) | 6.5 | ~6 |

Read these as a *degradation shape*, not device predictions — the emulator's translated
CPU/graphics stack is far slower than real hardware. The takeaway matches the throttle matrix:
with no fps caps, the models track whatever the device can do (60 → 44 → 20 → 6) instead of
enforcing a fixed choppy cadence, and nothing breaks at the bottom.

Requires the Android SDK at `~/Library/Android/sdk` and a Play-Store system image (Chrome must be
on the device). Chrome's first-run screen is dismissed automatically via input taps when present.

Hard-won operational notes:
- **The emulator must run windowed.** With `-no-window`, Chrome's compositor treats the surface as
  occluded and produces no frames at all — rAF fires ~once per 10 s while `document.visibilityState`
  still reads `"visible"`. Neither host GPU nor swiftshader helps. The script boots windowed by
  default (`--headless` exists but measures nothing).
- The script wakes the screen / dismisses the keyguard after boot and hard-fails rather than
  reporting garbage if the page never reaches `visible`.
- Emulated numbers are a *bad-phone proxy*, not real-device numbers: the translated graphics stack
  is far slower than actual Pixel hardware.
- Don't starve the AVD below 2 GB RAM: Android + Play services thrash and Chrome gets OOM-killed
  before its DevTools socket ever opens. Gimp CPU (`hw.cpu.ncore`) and GPU
  (`hw.gpu.mode=swiftshader_indirect`) instead.

## Planned: artificial constructions (isolated component harnesses)

Next addition: standalone routes/entries that mount a single subsystem (e.g. just the chessboard,
just the hero models) so we can measure one component's JS + asset cost and interaction blocking in
isolation, deterministically, without the rest of the page as noise. Tracked as a follow-up.
