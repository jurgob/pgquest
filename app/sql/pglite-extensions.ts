import { pg_stat_statements } from "@electric-sql/pglite/contrib/pg_stat_statements";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";

// Extensions available in every PGlite database, the equivalent of the extensions
// installed on a server. A lesson still has to CREATE EXTENSION one to use it.
// pg_stat_statements also has to be preloaded, like shared_preload_libraries, to
// record anything (see the slow queries lesson). Each costs a few KB and no
// measurable startup time.
export const pgliteExtensions = { pg_stat_statements, pg_trgm };
