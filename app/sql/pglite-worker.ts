import { PGlite } from "@electric-sql/pglite";
import { worker } from "@electric-sql/pglite/worker";
import { pgliteExtensions, type PgliteWorkerMeta } from "./pglite-extensions";

worker({
  async init(options) {
    const meta = options.meta as PgliteWorkerMeta | undefined;
    return new PGlite(options.dataDir, {
      extensions: pgliteExtensions(meta?.extensionNames ?? []),
    });
  },
});
