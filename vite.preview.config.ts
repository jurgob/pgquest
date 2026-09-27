import mdx from "@mdx-js/rollup";
import { defineConfig, mergeConfig } from "vite";

import cliConfig from "./vite.cli.config";

// build-static-preview.tsx renders routes that import Markdown (CHANGELOG.md),
// so it needs the same MDX compilation as the app. Kept out of
// vite.cli.config.ts because the production image runs config:check with that
// config and only has production dependencies, which don't include MDX.
export default mergeConfig(
  cliConfig,
  defineConfig({
    plugins: [{ enforce: "pre", ...mdx() }],
  }),
);
