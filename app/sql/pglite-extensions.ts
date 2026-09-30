import { pg_stat_statements } from "@electric-sql/pglite/contrib/pg_stat_statements";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { vector } from "@electric-sql/pglite-pgvector";

// PGlite extensions a lesson can use. A database only loads the ones its SQL creates
// (see pgliteExtensionsFor), so lessons that don't use them never download them.
const availableExtensions = { pg_stat_statements, pg_trgm, vector };

export type PgliteExtensionName = keyof typeof availableExtensions;

const createExtensionPattern =
  /\bCREATE\s+EXTENSION\s+(?:IF\s+NOT\s+EXISTS\s+)?"?(\w+)"?/gi;

function isPgliteExtensionName(name: string): name is PgliteExtensionName {
  return Object.hasOwn(availableExtensions, name);
}

// The extensions a database needs, from the CREATE EXTENSION statements in the SQL
// that sets it up. PGlite has to be given them when it starts: pg_stat_statements
// in particular only records anything when preloaded, like shared_preload_libraries.
export function pgliteExtensionNamesFor(sql: string): PgliteExtensionName[] {
  const names = [...sql.matchAll(createExtensionPattern)].map((match) =>
    (match[1] ?? "").toLowerCase(),
  );
  return [...new Set(names)].filter(isPgliteExtensionName);
}

export function pgliteExtensions(names: readonly string[]) {
  return Object.fromEntries(
    names.filter(isPgliteExtensionName).map((name) => [name, availableExtensions[name]]),
  );
}

export function pgliteExtensionsFor(sql: string) {
  return pgliteExtensions(pgliteExtensionNamesFor(sql));
}

// Passed to the browser worker (pglite-worker.ts) through PGliteWorker's `meta`.
export type PgliteWorkerMeta = { extensionNames: PgliteExtensionName[] };
