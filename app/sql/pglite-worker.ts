import { PGlite } from "@electric-sql/pglite";
import { worker } from "@electric-sql/pglite/worker";
import { pgliteExtensions } from "./pglite-extensions";

worker({
  async init(options) {
    return new PGlite(options.dataDir, { extensions: pgliteExtensions });
  },
});
