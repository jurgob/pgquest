import { SQL_EXAMPLE_IDS, type SqlExample } from "./types";

export const migration = `
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price_cents INTEGER NOT NULL
);
`;

export const seed = `
-- 100,000 products like 'blue lamp 41', in 10 categories.
INSERT INTO products (name, category, price_cents)
SELECT
  (ARRAY['red', 'blue', 'green', 'black', 'white',
         'small', 'large', 'vintage', 'modern', 'wooden'])[n % 10 + 1]
  || ' ' ||
  (ARRAY['lamp', 'chair', 'table', 'sofa', 'desk', 'shelf', 'rug',
         'mirror', 'clock', 'vase', 'bed', 'stool', 'bench', 'cabinet',
         'frame', 'pillow', 'blanket', 'curtain', 'basket', 'candle'])[n % 20 + 1]
  || ' ' || n,
  (ARRAY['living', 'bedroom', 'kitchen', 'office', 'garden',
         'kids', 'bath', 'outdoor', 'decor', 'storage'])[n / 10 % 10 + 1],
  500 + n * 7919 % 50000
FROM generate_series(1, 100000) AS n;

-- ANALYZE samples 300 rows per statistics target: 400 covers every row,
-- so the planner's estimates are the same on every run.
SET default_statistics_target = 400;
ANALYZE products;
`;

// pg_stat_statements is preloaded into every PGlite database (see
// app/sql/pglite-extensions.ts); on a real server it also needs
// shared_preload_libraries.
export const tracking = `
CREATE EXTENSION pg_stat_statements;

-- Also track statements run inside functions: the app's queries run in timed().
SET pg_stat_statements.track = 'all';

-- Every request is logged with its real query and duration,
-- like an APM tool or log_min_duration_statement would.
CREATE TABLE request_log (
  id SERIAL PRIMARY KEY,
  endpoint TEXT NOT NULL,
  query TEXT NOT NULL,
  duration_ms NUMERIC NOT NULL
);

-- Runs a query, returns how long it took in milliseconds.
CREATE FUNCTION timed(query TEXT) RETURNS NUMERIC AS $$
DECLARE
  started TIMESTAMPTZ := clock_timestamp();
BEGIN
  EXECUTE query;
  RETURN round(extract(epoch FROM clock_timestamp() - started)::numeric * 1000, 2);
END;
$$ LANGUAGE plpgsql;

SELECT pg_stat_statements_reset();
`;

const offsetListQuery = `format(
    'SELECT id, name, price_cents FROM products WHERE category = %L ORDER BY id LIMIT 20 OFFSET %s',
    'kitchen', page * 20)`;

// Kitchen products are 10 in every 100 ids, so a page of 20 spans 200 ids.
const keysetListQuery = `format(
    'SELECT id, name, price_cents FROM products WHERE category = %L AND id > %s ORDER BY id LIMIT 20',
    'kitchen', page * 200)`;

function trafficSql(listQuery: string) {
  return `
-- POST /products, 200 times
INSERT INTO request_log (endpoint, query, duration_ms)
SELECT 'create', q, timed(q)
FROM generate_series(1, 200) AS n,
  format(
    'INSERT INTO products (name, category, price_cents) VALUES (%L, %L, %s)',
    'new lamp ' || n, 'garden', 1000 + n) AS q;

-- GET /products?category=kitchen&page=..., 200 times, pages 0 to 99
INSERT INTO request_log (endpoint, query, duration_ms)
SELECT 'list', q, timed(q)
FROM generate_series(1, 200) AS n,
  LATERAL (SELECT n % 100 AS page) AS p,
  ${listQuery} AS q;

-- DELETE /products/:id, 100 times
INSERT INTO request_log (endpoint, query, duration_ms)
SELECT 'delete', q, timed(q)
FROM generate_series(1, 100) AS n,
  format('DELETE FROM products WHERE id = %s', n * 97) AS q;

-- GET /products/search?q=..., 10 search terms, 5 times each
INSERT INTO request_log (endpoint, query, duration_ms)
SELECT 'search', q, timed(q)
FROM unnest(ARRAY['lamp', 'oak', 'blue sofa', 'mirror 42', 'candle',
                  'rug', 'velvet', 'desk 7', 'wooden bench', 'clock']) AS term,
  generate_series(1, 5),
  format(
    'SELECT id, name FROM products WHERE name ILIKE %L ORDER BY name LIMIT 20',
    '%' || term || '%') AS q;
`;
}

export const traffic = trafficSql(offsetListQuery);

export const trigramIndex = `-- pg_trgm splits text into 3-letter chunks: 'lamp' -> ' la', 'lam', 'amp'...
-- A GIN index on them can answer ILIKE '%...%', which a B-tree can't.
CREATE EXTENSION pg_trgm;
CREATE INDEX products_name_trgm_idx ON products USING gin (name gin_trgm_ops);
`;

export const keysetPagination = `-- Before: skip 1,980 rows to show page 99.
SELECT id, name, price_cents FROM products
WHERE category = 'kitchen' ORDER BY id LIMIT 20 OFFSET 1980;

-- After: the app remembers the last id it showed and continues from there.
SELECT id, name, price_cents FROM products
WHERE category = 'kitchen' AND id > 19800 ORDER BY id LIMIT 20;
`;

export const fixedTraffic = trafficSql(keysetListQuery);

export const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.slowQueriesDatabaseInit,
  name: "Lesson 22 database",
  description:
    "100,000 products, after 550 requests to the app's four endpoints, tracked by pg_stat_statements and a request log.",
  query: [migration, seed, tracking, traffic].join("\n"),
};

export const fixedDatabaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.slowQueriesFixedDatabaseInit,
  name: "Lesson 22 database, fixed",
  description:
    "The same products and requests, with a trigram index for search and keyset pagination for list.",
  query: [migration, seed, trigramIndex, tracking, fixedTraffic].join("\n"),
};

export const database_inits = [databaseInit, fixedDatabaseInit] as const;

export const topByTypeQuery = `
-- One row per query shape: constants become $1, $2...
-- NOT toplevel: only the app's queries, the ones run inside timed().
SELECT
  query,
  calls,
  round(total_exec_time::numeric, 1) AS total_ms,
  round(mean_exec_time::numeric, 2) AS mean_ms,
  shared_blks_hit + shared_blks_read AS blocks
FROM pg_stat_statements
WHERE NOT toplevel
ORDER BY total_exec_time DESC;
`;

export const slowestCallsQuery = `
-- The actual calls, with their real values.
SELECT endpoint, query, duration_ms
FROM request_log
ORDER BY duration_ms DESC
LIMIT 5;
`;

export const slowestListCallsQuery = `
-- Same query shape, very different cost: it depends on the page.
SELECT query, duration_ms
FROM request_log
WHERE endpoint = 'list'
ORDER BY duration_ms DESC
LIMIT 3;
`;

export const explainSearchQuery = `
-- ANALYZE runs the query for real. BUFFERS counts the 8 kB blocks it touched.
--
-- Seq Scan: every row is read and tested.
-- Rows Removed by Filter: ~100,000 rows thrown away to keep a handful.
-- A B-tree index on name wouldn't help: '%mirror 42%' can start anywhere.

EXPLAIN (ANALYZE, BUFFERS)
SELECT id, name FROM products WHERE name ILIKE '%mirror 42%' ORDER BY name LIMIT 20;
`;

export const explainSearchFixedQuery = `
-- Bitmap Index Scan on products_name_trgm_idx: the index knows which rows
-- contain 'mir', 'irr', 'rro'..., so only those are read.
-- Compare Buffers and Execution Time with the plan above.

EXPLAIN (ANALYZE, BUFFERS)
SELECT id, name FROM products WHERE name ILIKE '%mirror 42%' ORDER BY name LIMIT 20;
`;

export const explainListQuery = `
-- Page 99. Postgres walks the primary key in id order, drops the other
-- categories (Rows Removed by Filter), produces 2,000 kitchen rows,
-- then throws the first 1,980 away. OFFSET never skips work.

EXPLAIN (ANALYZE, BUFFERS)
SELECT id, name, price_cents FROM products
WHERE category = 'kitchen' ORDER BY id LIMIT 20 OFFSET 1980;
`;

export const explainListFixedQuery = `
-- Index Cond: (id > 19800): the primary key index starts right after the
-- last id seen. About 130 rows read instead of 20,000, on any page.

EXPLAIN (ANALYZE, BUFFERS)
SELECT id, name, price_cents FROM products
WHERE category = 'kitchen' AND id > 19800 ORDER BY id LIMIT 20;
`;

export const examples: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.slowQueriesTopByType,
    name: "Slowest query types",
    description: "The app's query shapes, by total execution time.",
    database_init: databaseInit,
    query: topByTypeQuery,
  },
  {
    id: SQL_EXAMPLE_IDS.slowQueriesSlowestCalls,
    name: "Slowest actual calls",
    description: "The slowest individual requests, with their real values.",
    database_init: databaseInit,
    query: slowestCallsQuery,
  },
  {
    id: SQL_EXAMPLE_IDS.slowQueriesSlowestListCalls,
    name: "Slowest list calls",
    description: "The slowest pages of the list endpoint.",
    database_init: databaseInit,
    query: slowestListCallsQuery,
  },
  {
    id: SQL_EXAMPLE_IDS.slowQueriesExplainSearch,
    name: "EXPLAIN the search",
    description: "Why search is slow.",
    database_init: databaseInit,
    query: explainSearchQuery,
  },
  {
    id: SQL_EXAMPLE_IDS.slowQueriesExplainSearchFixed,
    name: "EXPLAIN the search, with a trigram index",
    description: "The same search, with a trigram index.",
    database_init: fixedDatabaseInit,
    query: explainSearchFixedQuery,
  },
  {
    id: SQL_EXAMPLE_IDS.slowQueriesExplainList,
    name: "EXPLAIN a deep page",
    description: "Why deep pages are slow.",
    database_init: databaseInit,
    query: explainListQuery,
  },
  {
    id: SQL_EXAMPLE_IDS.slowQueriesExplainListFixed,
    name: "EXPLAIN a deep page, with keyset pagination",
    description: "The same page, with keyset pagination.",
    database_init: fixedDatabaseInit,
    query: explainListFixedQuery,
  },
  {
    id: SQL_EXAMPLE_IDS.slowQueriesTopByTypeFixed,
    name: "Slowest query types, after the fixes",
    description: "The same traffic, after both fixes.",
    database_init: fixedDatabaseInit,
    query: topByTypeQuery,
  },
];

export const exercises: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.slowQueriesExerciseBlocksByType,
    name: "Exercise 1",
    description:
      "Timings vary between runs, buffer blocks don't. From pg_stat_statements, return query, calls, and shared_blks_hit + shared_blks_read AS blocks for the app's queries (NOT toplevel), most blocks first.",
    database_init: databaseInit,
    query: `
SELECT query, calls, shared_blks_hit + shared_blks_read AS blocks
FROM pg_stat_statements
WHERE NOT toplevel
ORDER BY blocks DESC;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.slowQueriesExerciseKeysetPage,
    name: "Exercise 2",
    description:
      "With keyset pagination, return id, name, and price_cents of the 20 'office' products after id 50000, in id order.",
    database_init: fixedDatabaseInit,
    query: `
SELECT id, name, price_cents
FROM products
WHERE category = 'office' AND id > 50000
ORDER BY id
LIMIT 20;
`,
  },
];
