import type * as Ort from "onnxruntime-web";
import { supportsWebGpu } from "../config";

type OrtModule = typeof import("onnxruntime-web");

let ortModule: OrtModule | null = null;

/**
 * Load the ORT entry bundle that matches the wasm binary the worker downloaded
 * (see `selectOrtRuntime`). The default entry ships the JSEP/WebGPU glue and
 * only accepts the `.jsep` binary; `onnxruntime-web/wasm` is the CPU-only build
 * that pairs with the plain binary. Importing the wrong one fails at session
 * creation, so this must use the same predicate as the download.
 */
async function loadOrt(): Promise<OrtModule> {
  if (ortModule) return ortModule;
  ortModule = supportsWebGpu()
    ? await import("onnxruntime-web")
    : ((await import("onnxruntime-web/wasm")) as unknown as OrtModule);
  return ortModule;
}

let session: Ort.InferenceSession | null = null;
let inputName = "/input/planes";
let outputNames: string[] = [];

export async function initModel(
  modelData: ArrayBuffer,
  runtimeBinary: ArrayBuffer,
): Promise<void> {
  const ort = await loadOrt();

  // Keep WASM configured as the universal fallback for browsers without WebGPU.
  ort.env.wasm.wasmPaths = "/";
  ort.env.wasm.wasmBinary = runtimeBinary;
  ort.env.wasm.numThreads = navigator.hardwareConcurrency ?? 4;

  // A single ordered provider list lets ONNX Runtime partition unsupported
  // WebGPU operators onto WASM without trying to initialize the runtime twice.
  const providers: Ort.InferenceSession.ExecutionProviderConfig[] =
    supportsWebGpu() ? ["webgpu", "wasm"] : ["wasm"];

  session = await ort.InferenceSession.create(new Uint8Array(modelData), {
    executionProviders: providers,
  });

  // Discover tensor names dynamically
  inputName = session.inputNames[0] || inputName;
  outputNames = [...session.outputNames];
}

export interface InferenceResult {
  policy: Float32Array;
  wdl: [number, number, number];
  value: number;
}

export async function runInference(
  inputTensor: Float32Array,
): Promise<InferenceResult> {
  if (!session || !ortModule) throw new Error("Model not initialized");

  const feeds: Record<string, Ort.Tensor> = {
    [inputName]: new ortModule.Tensor("float32", inputTensor, [1, 112, 8, 8]),
  };

  const results = await session.run(feeds);

  // Extract policy output
  let policy = new Float32Array(1858);
  for (const name of outputNames) {
    if (name.toLowerCase().includes("policy")) {
      policy = new Float32Array(results[name]!.data as ArrayLike<number>);
      break;
    }
  }

  // Extract WDL (win/draw/loss) output
  let wdl: [number, number, number] = [0.5, 0, 0.5];
  for (const name of outputNames) {
    if (name.toLowerCase().includes("wdl")) {
      const data = results[name]!.data as Float32Array;
      wdl = [data[0]!, data[1]!, data[2]!];
      break;
    }
  }

  // Extract value output (fallback if no WDL)
  let value = 0;
  for (const name of outputNames) {
    if (
      name.toLowerCase().includes("value") &&
      !name.toLowerCase().includes("wdl")
    ) {
      const data = results[name]!.data as Float32Array;
      value = data[0]!;
      // Convert tanh value [-1, 1] to win probability [0, 1]
      if (wdl[0] === 0.5 && wdl[2] === 0.5) {
        // No WDL output; synthesize from value
        wdl = [(value + 1) / 2, 0, (1 - value) / 2];
      }
      break;
    }
  }

  return { policy, wdl, value };
}
