import mdx from "@mdx-js/rollup";
import { defineConfig } from "vite";

export default defineConfig({
  appType: "custom",
  clearScreen: false,
  logLevel: "error",
  // Scripts such as build-static-preview.tsx render routes that import
  // Markdown (CHANGELOG.md), so they need the same MDX compilation as the app.
  plugins: [{ enforce: "pre", ...mdx() }],
  server: {
    hmr: false,
    watch: null,
    ws: false,
  },
});
