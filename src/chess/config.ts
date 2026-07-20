const MODEL_BASE_URL = "https://pub-0cf3a9ac59314aa1ac3e67a690fc3db5.r2.dev";

export const MODEL_URL = `${MODEL_BASE_URL}/maia2200-64x6-hunter-20000.onnx.bin`;
export const MODEL_DOWNLOAD_BYTES = 2_369_299;

/**
 * WebGPU support.
 *
 * This is the single predicate behind BOTH the ORT entry bundle we import and
 * the wasm binary we download. Those two are coupled: `onnxruntime-web` resolves
 * to ort.min.mjs, which loads the JSEP glue and only accepts the `.jsep` binary,
 * while `onnxruntime-web/wasm` resolves to ort.wasm.min.mjs and pairs with the
 * plain CPU binary. Mixing them fails at session creation, so both decisions
 * must come from here. Available on window and worker navigators alike.
 */
export const supportsWebGpu = (): boolean =>
  typeof navigator !== "undefined" && "gpu" in navigator;

export interface OrtRuntime {
  url: string;
  /** On-disk size of the artifact; drives the progress bar and the size copy. */
  bytes: number;
}

// Both artifacts are emitted by the viteStaticCopy targets in vite.config.ts.
const RUNTIME_WEBGPU: OrtRuntime = {
  url: "/ort-wasm-simd-threaded.jsep.wasm",
  bytes: 24_925_138,
};
const RUNTIME_CPU: OrtRuntime = {
  url: "/ort-wasm-simd-threaded.wasm",
  bytes: 12_303_130,
};

/**
 * Resolved when the user opts in (clicks play). Browsers without WebGPU pull the
 * ~12.3 MB CPU build instead of the ~24.9 MB GPU build — ~12.6 MB less.
 */
export const selectOrtRuntime = (): OrtRuntime =>
  supportsWebGpu() ? RUNTIME_WEBGPU : RUNTIME_CPU;

/** Total one-time download (runtime + model) for the current browser. */
export const totalDownloadBytes = (): number =>
  selectOrtRuntime().bytes + MODEL_DOWNLOAD_BYTES;
