import mdx from "@mdx-js/rollup";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  // MDX compiles Markdown files (CHANGELOG.md) into React components at build
  // time; it must run before the React Router plugin sees the imports.
  plugins: [{ enforce: "pre", ...mdx() }, tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    watch: {
      interval: 1000,
      ignored: [
        "**/.git/**",
        "**/.pnpm-store/**",
        "**/.react-router/**",
        "**/build/**",
        "**/node_modules/**",
      ],
      usePolling: true,
    },
  },
});
