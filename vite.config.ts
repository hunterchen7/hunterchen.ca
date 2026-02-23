import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";
import path from "path";
import fs from "fs";

// Serve onnxruntime WASM/MJS files from node_modules during dev.
// viteStaticCopy only runs at build time, and placing files in public/
// causes Vite to block dynamic imports. This plugin intercepts requests
// for ort-wasm-* files and serves them directly from node_modules.
function serveOrtWasmDev(): Plugin {
  const ortDistDir = path.resolve(
    __dirname,
    "node_modules/onnxruntime-web/dist",
  );
  return {
    name: "serve-ort-wasm-dev",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.match(/^\/ort-wasm-.*\.(wasm|mjs)$/)) {
          const filename = req.url.slice(1);
          const filePath = path.join(ortDistDir, filename);
          if (fs.existsSync(filePath)) {
            const ext = path.extname(filename);
            res.setHeader(
              "Content-Type",
              ext === ".wasm"
                ? "application/wasm"
                : "application/javascript",
            );
            res.setHeader("Access-Control-Allow-Origin", "*");
            fs.createReadStream(filePath).pipe(res);
            return;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    serveOrtWasmDev(),
    viteStaticCopy({
      targets: [
        {
          src: "node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm",
          dest: ".",
        },
        {
          src: "node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.mjs",
          dest: ".",
        },
        {
          src: "node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.wasm",
          dest: ".",
        },
        {
          src: "node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.mjs",
          dest: ".",
        },
      ],
    }),
  ],
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
      "onnxruntime-web": "onnxruntime-web/wasm",
    },
    conditions: ["onnxruntime-web-use-extern-wasm"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "onnx-runtime": ["onnxruntime-web"],
        },
      },
    },
  },
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "credentialless",
    },
  },
  worker: {
    format: "es",
  },
});
