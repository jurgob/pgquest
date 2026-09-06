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
    watch: false,
  },
});
