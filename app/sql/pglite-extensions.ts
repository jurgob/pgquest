import { pg_stat_statements } from "@electric-sql/pglite/contrib/pg_stat_statements";

// Extensions preloaded into every PGlite database, the equivalent of a server's
// shared_preload_libraries. A lesson still has to CREATE EXTENSION one to use it.
// pg_stat_statements must be preloaded to record anything (see the slow queries
// lesson); loading it costs a few KB and no measurable startup time.
export const pgliteExtensions = { pg_stat_statements };
