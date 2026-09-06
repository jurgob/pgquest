import { defineConfig } from "vite";

export default defineConfig({
  appType: "custom",
  clearScreen: false,
  logLevel: "error",
  server: {
    hmr: false,
    watch: null,
    ws: false,
  },
});
