import type { WorkerRequest, WorkerResponse } from "../types";
import { encodeFenHistory } from "./encoding";
import { decodePolicyOutput } from "./decoding";
import { initModel, runInference } from "./inference";
import { getCachedModel, cacheModel, decompressGzip } from "./modelCache";
import { mctsSearch } from "./mcts";
import { Chess } from "chess.js";

function post(msg: WorkerResponse) {
  self.postMessage(msg);
}

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const msg = e.data;

  switch (msg.type) {
    case "init": {
      try {
        post({
          type: "initProgress",
          progress: 0,
          message: "Checking cache...",
        });

        let modelData = await getCachedModel(msg.modelUrl);

        if (!modelData) {
          post({
            type: "initProgress",
            progress: 0.1,
            message: "Downloading model...",
          });

          let response = await fetch(msg.modelUrl);
          if (!response.ok) {
            response = await fetch(msg.modelUrl + ".bin");
          }
          if (!response.ok) {
            throw new Error(
              `Failed to fetch model: ${response.status} (${msg.modelUrl})`,
            );
          }

          const contentLength = response.headers.get("Content-Length");
          const total = contentLength ? parseInt(contentLength) : 0;

          let compressed: ArrayBuffer;
          if (total > 0 && response.body) {
            const reader = response.body.getReader();
            const chunks: Uint8Array[] = [];
            let received = 0;

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              chunks.push(value);
              received += value.length;
              const dlProgress = 0.1 + (received / total) * 0.6;
              post({
                type: "initProgress",
                progress: dlProgress,
                message: `Downloading... ${Math.round((received / total) * 100)}%`,
              });
            }

            const buffer = new Uint8Array(received);
            let pos = 0;
            for (const chunk of chunks) {
              buffer.set(chunk, pos);
              pos += chunk.length;
            }
            compressed = buffer.buffer;
          } else {
            compressed = await response.arrayBuffer();
          }

          post({
            type: "initProgress",
            progress: 0.7,
            message: "Decompressing...",
          });
          try {
            modelData = await decompressGzip(compressed);
          } catch {
            modelData = compressed;
          }

          post({
            type: "initProgress",
            progress: 0.75,
            message: "Caching model...",
          });
          await cacheModel(msg.modelUrl, modelData);
        } else {
          post({
            type: "initProgress",
            progress: 0.7,
            message: "Loaded from cache",
          });
        }

        post({
          type: "initProgress",
          progress: 0.8,
          message: "Initializing neural network...",
        });
        await initModel(modelData);

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
