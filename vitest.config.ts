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
    // exceed Vitest's 5s default on slower machines and CI runners. Concurrent
    // tests share one thread, so a test's wall time includes its neighbours'
    // work: next to the 100,000-row slow-queries databases, even small lessons
    // took over 30s on a 4-CPU machine.
    testTimeout: 120000,
    watch: false,
  },
});
