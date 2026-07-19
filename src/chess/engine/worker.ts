import type { WorkerRequest, WorkerResponse } from "../types";
import { encodeFenHistory } from "./encoding";
import { decodePolicyOutput } from "./decoding";
import { initModel, runInference } from "./inference";
import { getCachedModel, cacheModel, decompressGzip } from "./modelCache";
import { mctsSearch } from "./mcts";
import { Chess } from "chess.js";
import { RUNTIME_URL } from "../config";

const MODEL_DOWNLOAD_BYTES = 2_300_000;
const RUNTIME_DOWNLOAD_BYTES = 24_925_138;
const TOTAL_DOWNLOAD_BYTES = MODEL_DOWNLOAD_BYTES + RUNTIME_DOWNLOAD_BYTES;

function post(msg: WorkerResponse) {
  self.postMessage(msg);
}

async function downloadBuffer(
  url: string,
  expectedBytes: number,
  onProgress: (progress: number) => void,
): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  const total = Number(response.headers.get("Content-Length")) || expectedBytes;
  if (!response.body) {
    const buffer = await response.arrayBuffer();
    onProgress(1);
    return buffer;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    onProgress(Math.min(received / total, 0.99));
  }

  const buffer = new Uint8Array(received);
  let position = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, position);
    position += chunk.length;
  }
  onProgress(1);
  return buffer.buffer;
}

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const msg = e.data;

  switch (msg.type) {
    case "init": {
      try {
        const runtimeBinary = await downloadBuffer(
          RUNTIME_URL,
          RUNTIME_DOWNLOAD_BYTES,
          (progress) =>
            post({
              type: "initProgress",
              progress:
                (progress * RUNTIME_DOWNLOAD_BYTES) / TOTAL_DOWNLOAD_BYTES,
              message: "downloading engine runtime...",
            }),
        );

        post({
          type: "initProgress",
          progress: RUNTIME_DOWNLOAD_BYTES / TOTAL_DOWNLOAD_BYTES,
          message: "checking model cache...",
        });

        let modelData = await getCachedModel(msg.modelUrl);

        if (!modelData) {
          post({
            type: "initProgress",
            progress: RUNTIME_DOWNLOAD_BYTES / TOTAL_DOWNLOAD_BYTES,
            message: "downloading chess model...",
          });

          const compressed = await downloadBuffer(
            msg.modelUrl,
            MODEL_DOWNLOAD_BYTES,
            (progress) =>
              post({
                type: "initProgress",
                progress:
                  (RUNTIME_DOWNLOAD_BYTES + progress * MODEL_DOWNLOAD_BYTES) /
                  TOTAL_DOWNLOAD_BYTES,
                message: "downloading chess model...",
              }),
          );

          post({
            type: "initProgress",
            progress: 1,
            message: "decompressing model...",
          });
          try {
            modelData = await decompressGzip(compressed);
          } catch {
            modelData = compressed;
          }

          post({
            type: "initProgress",
            progress: 1,
            message: "caching model...",
          });
          await cacheModel(msg.modelUrl, modelData);
        } else {
          post({
            type: "initProgress",
            progress: 1,
            message: "model loaded from cache",
          });
        }

        post({
          type: "initProgress",
          progress: 1,
          message: "initializing neural network...",
        });
        await initModel(modelData, runtimeBinary);

        post({ type: "ready" });
      } catch (error) {
        post({
          type: "initError",
          error: error instanceof Error ? error.message : String(error),
        });
      }
      break;
    }

    case "getBestMove": {
      try {
        const { fen, history, legalMoves, temperature } = msg;
        const isBlack = fen.split(" ")[1] === "b";

        const inputTensor = encodeFenHistory(history);
        const { policy, wdl } = await runInference(inputTensor);
        const result = decodePolicyOutput(
          policy,
          legalMoves,
          isBlack,
          temperature,
        );

        post({
          type: "bestMove",
          move: result.best.move,
          confidence: result.best.confidence,
          wdl: wdl,
        });
      } catch (error) {
        post({
          type: "error",
          error: error instanceof Error ? error.message : String(error),
        });
      }
      break;
    }

    case "mctsSearch": {
      try {
        const { fen, history, nodeLimit, temperature } = msg;
        const t0 = performance.now();
        const result = await mctsSearch(fen, history, nodeLimit, temperature);
        const elapsed = performance.now() - t0;

        const tmp = new Chess(fen);
        const sanMap = new Map<string, string>();
        for (const m of tmp.moves({ verbose: true })) {
          let uci = m.from + m.to;
          if (m.promotion) uci += m.promotion;
          sanMap.set(uci, m.san);
        }
        const moveNum = Math.ceil(history.length / 2);
        const side = fen.split(" ")[1] === "w" ? "white" : "black";
        console.log(`\n--- Move ${moveNum} (${side}) ---`);
        const [stmWin, draw, stmLoss] = result.wdl;
        const whiteWin = side === "white" ? stmWin : stmLoss;
        const blackWin = side === "white" ? stmLoss : stmWin;
        console.log(`MCTS: ${nodeLimit} nodes in ${Math.round(elapsed)}ms`);
        console.log(
          `WDL: white: ${Math.round(whiteWin * 100)}%, draw: ${Math.round(draw * 100)}%, black: ${Math.round(blackWin * 100)}%`,
        );
        console.log(
          "Top moves:",
          result.topMoves
            .map(
              (m) =>
                `${m.move} (${sanMap.get(m.move) ?? "?"}) ${Math.round(m.probability * 100)}%`,
            )
            .join(", "),
        );

        post({
          type: "bestMove",
          move: result.bestMove,
          confidence: result.visits,
          wdl: result.wdl,
          topMoves: result.topMoves,
        });
      } catch (error) {
        post({
          type: "error",
          error: error instanceof Error ? error.message : String(error),
        });
      }
      break;
    }
  }
};
