import { defineConfig } from "vitest/config";

export default defineConfig({
  appType: "custom",
  clearScreen: false,
  logLevel: "error",
  server: {
    hmr: false,
    watch: null,
    ws: false,
  },
  test: {
    passWithNoTests: true,
    // PGlite spins up a fresh in-memory Postgres per test; cold starts can
    // exceed Vitest's 5s default on slower machines and CI runners.
    testTimeout: 30000,
    watch: false,
  },
});
