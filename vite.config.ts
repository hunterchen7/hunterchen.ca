import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
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
    },
    conditions: ["onnxruntime-web-use-extern-wasm"],
  },
  optimizeDeps: {
    exclude: ["onnxruntime-web"],
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
