import { SQL_EXAMPLE_IDS, type SqlExample } from "./types";

export const migration = `
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers (id),
  status TEXT NOT NULL,
  total_cents INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL
);
`;

export const seed = `
INSERT INTO customers (name, email)
SELECT 'Customer ' || n, 'customer' || n || '@example.com'
FROM generate_series(1, 5000) AS n;

INSERT INTO orders (customer_id, status, total_cents, created_at)
SELECT
  n % 5000 + 1,
  CASE
    WHEN n % 10 < 7 THEN 'paid'
    WHEN n % 10 < 9 THEN 'pending'
    ELSE 'refunded'
  END,
  500 + (n * 7919) % 20000,
  TIMESTAMP '2026-01-01' + n * INTERVAL '7 minutes'
FROM generate_series(1, 60000) AS n;

ANALYZE;
`;

// The two fixes the lesson arrives at, one per slow query.
export const recentOrdersIndex = `CREATE INDEX orders_customer_id_created_at_idx
  ON orders (customer_id, created_at DESC);`;

export const lowerEmailIndex = `CREATE INDEX customers_lower_email_idx
  ON customers (lower(email));`;

// Loaded into every PGlite database (see app/sql/pglite-extensions.ts), so all this
// lesson's databases need is CREATE EXTENSION. On a real server it also needs
// shared_preload_libraries; see trackingSetupScript below.
const enableTracking = `CREATE EXTENSION pg_stat_statements;`;

// Forget the migration and seed, so pg_stat_statements only describes the application
// traffic that follows. (pg_stat_reset() can't do the same for pg_stat_user_tables
// here: the whole database init runs as one query string, and a backend only flushes
// its table counters to the shared statistics once it goes idle, after the reset.)
const resetStatistics = `SELECT pg_stat_statements_reset();`;

export type TrafficQuery = {
  calls: number;
  endpoint: string;
  sql: (call: number) => string;
};

// What the application sends to the database, one entry per kind of request.
// `sql` gets the call's index (0, 1, 2, ...) and bakes a different constant into each
// call, the way an application with bound parameters would.
export const trafficQueries: readonly TrafficQuery[] = [
  {
    calls: 200,
    endpoint: "Order page",
    sql: (call) =>
      `SELECT id, customer_id, status, total_cents FROM orders WHERE id = ${((call * 293) % 60000) + 1};`,
  },
  {
    calls: 40,
    endpoint: "Customer's recent orders",
    sql: (call) =>
      `SELECT id, status, total_cents, created_at FROM orders WHERE customer_id = ${((call * 37) % 5000) + 1} ORDER BY created_at DESC LIMIT 10;`,
  },
  {
    calls: 40,
    endpoint: "Log in",
    sql: (call) =>
      `SELECT id, name FROM customers WHERE lower(email) = lower('Customer${((call * 53 + 17) % 5000) + 1}@Example.com');`,
  },
  {
    calls: 2,
    endpoint: "Monthly revenue report",
    sql: () =>
      `SELECT date_trunc('month', created_at) AS month, count(*) AS orders, sum(total_cents) AS revenue_cents FROM orders WHERE status = 'paid' GROUP BY 1 ORDER BY 1;`,
  },
];

// Interleaves the requests over TRAFFIC_STEPS steps: a query with N calls runs every
// TRAFFIC_STEPS / N steps, so the order page runs on every step and the report twice.
const TRAFFIC_STEPS = 200;

export const traffic = Array.from({ length: TRAFFIC_STEPS }, (_, step) =>
  trafficQueries.flatMap((trafficQuery) => {
    const every = TRAFFIC_STEPS / trafficQuery.calls;
    return step % every === 0 ? [trafficQuery.sql(step / every)] : [];
  }),
)
  .flat()
  .join("\n");

function databaseSql(indexes: readonly string[]) {
  return [migration, ...indexes, seed, enableTracking, resetStatistics, traffic].join(
    "\n",
  );
}

export const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.slowQueriesDatabaseInit,
  name: "Lesson 22 database",
  description:
    "Customers and 60,000 orders, with pg_stat_statements enabled and a burst of application traffic already run against it.",
  query: databaseSql([]),
};

export const fixedDatabaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.slowQueriesFixedDatabaseInit,
  name: "Lesson 22 database, with both fixes",
  description:
    "The same database and the same traffic, but with the two indexes that fix the slowest queries.",
  query: databaseSql([recentOrdersIndex, lowerEmailIndex]),
};

export const database_inits = [databaseInit, fixedDatabaseInit] as const;

// Monitoring queries on pg_stat_statements show up in pg_stat_statements too, so
// every query below filters them (and the reset call) out.
export const topByTotalTimeQuery = `
SELECT
  query,
  calls,
  round(total_exec_time::numeric, 1) AS total_ms,
  round((100 * total_exec_time / sum(total_exec_time) OVER ())::numeric, 1) AS percent,
  round(mean_exec_time::numeric, 2) AS mean_ms
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat%'
ORDER BY total_exec_time DESC
LIMIT 5;
`;

export const topByMeanTimeQuery = `
SELECT
  query,
  calls,
  round(mean_exec_time::numeric, 2) AS mean_ms,
  rows / calls AS rows_per_call,
  (shared_blks_hit + shared_blks_read) / calls AS blocks_per_call
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat%'
ORDER BY mean_exec_time DESC
LIMIT 5;
`;

export const tableScansQuery = `
SELECT relname, seq_scan, seq_tup_read, seq_tup_read / seq_scan AS rows_per_scan
FROM pg_stat_user_tables
ORDER BY seq_tup_read DESC;
`;

export const recentOrdersQuery = `SELECT id, status, total_cents, created_at
FROM orders
WHERE customer_id = 42
ORDER BY created_at DESC
LIMIT 10;`;

export const loginQuery = `SELECT id, name
FROM customers
WHERE lower(email) = lower('Customer42@Example.com');`;

export const explainRecentOrdersQuery = `EXPLAIN (ANALYZE, BUFFERS)
${recentOrdersQuery}`;

export const explainLoginQuery = `EXPLAIN (ANALYZE, BUFFERS)
${loginQuery}`;

export const explainWriteScript = `BEGIN;

-- EXPLAIN ANALYZE really runs the statement, so this UPDATE really
-- changes rows. Rolling back undoes it and keeps the measurement.
EXPLAIN (ANALYZE, BUFFERS)
UPDATE orders SET status = 'paid' WHERE customer_id = 42 AND status = 'pending';

ROLLBACK;
`;

export const trackingSetupScript = `-- pg_stat_statements has to be loaded when the server starts:
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
-- ...then restart Postgres, and in each database you want to query it from:
CREATE EXTENSION pg_stat_statements;

-- Log every statement slower than 250 ms, with its real parameter values:
ALTER SYSTEM SET log_min_duration_statement = '250ms';
SELECT pg_reload_conf();

-- Start a fresh measurement window, e.g. right after a deploy:
SELECT pg_stat_statements_reset();
`;

export const runningNowQuery = `SELECT pid, now() - query_start AS running_for, state, query
FROM pg_stat_activity
WHERE state <> 'idle'
  AND pid <> pg_backend_pid()
ORDER BY running_for DESC;`;

export const examples: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.slowQueriesTopByTotalTime,
    name: "Top queries by total time",
    description:
      "Rank every statement pg_stat_statements has seen by the total time Postgres spent running it.",
    database_init: databaseInit,
    query: topByTotalTimeQuery,
  },
  {
    id: SQL_EXAMPLE_IDS.slowQueriesTopByMeanTime,
    name: "Top queries by mean time",
    description:
      "Rank the same statements by how long one call takes on average, with the rows and buffer blocks each call handles.",
    database_init: databaseInit,
    query: topByMeanTimeQuery,
  },
  {
    id: SQL_EXAMPLE_IDS.slowQueriesTableScans,
    name: "Sequential scans per table",
    description:
      "See how often each table was read end to end, and how many rows those scans went through.",
    database_init: databaseInit,
    query: tableScansQuery,
  },
  {
    id: SQL_EXAMPLE_IDS.slowQueriesExplainRecentOrders,
    name: "EXPLAIN ANALYZE the recent orders query",
    description:
      "Run the slowest query for one real customer and see what the plan actually did.",
    database_init: databaseInit,
    query: explainRecentOrdersQuery,
  },
  {
    id: SQL_EXAMPLE_IDS.slowQueriesExplainRecentOrdersFixed,
    name: "EXPLAIN ANALYZE the recent orders query, with an index",
    description: "The same query once an index on (customer_id, created_at DESC) exists.",
    database_init: fixedDatabaseInit,
    query: explainRecentOrdersQuery,
  },
  {
    id: SQL_EXAMPLE_IDS.slowQueriesExplainLogin,
    name: "EXPLAIN ANALYZE the login query",
    description:
      "The login lookup scans every customer, even though email has a unique index.",
    database_init: databaseInit,
    query: explainLoginQuery,
  },
  {
    id: SQL_EXAMPLE_IDS.slowQueriesExplainLoginFixed,
    name: "EXPLAIN ANALYZE the login query, with an expression index",
    description: "The same lookup once an index on lower(email) exists.",
    database_init: fixedDatabaseInit,
    query: explainLoginQuery,
  },
  {
    id: SQL_EXAMPLE_IDS.slowQueriesTopByTotalTimeFixed,
    name: "Top queries by total time, after the fixes",
    description: "The same traffic, replayed against the database with both indexes.",
    database_init: fixedDatabaseInit,
    query: topByTotalTimeQuery,
  },
];

export const exercises: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.slowQueriesExerciseTopByBlocks,
    name: "Exercise 1",
    description:
      "Timings change from run to run, but the amount of data a query touches doesn't. From pg_stat_statements, return query, calls, and the total number of buffer blocks each statement touched (shared_blks_hit + shared_blks_read) as blocks, for the 3 statements with the most blocks, most first.",
    database_init: databaseInit,
    query: `
SELECT query, calls, shared_blks_hit + shared_blks_read AS blocks
FROM pg_stat_statements
ORDER BY blocks DESC
LIMIT 3;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.slowQueriesExerciseLoginWithIndex,
    name: "Exercise 2",
    description:
      "This database has the customers_lower_email_idx index on lower(email). Find the id and name of the customer who types their email as 'CUSTOMER2048@example.com', ignoring case, with a query that uses that index.",
    database_init: fixedDatabaseInit,
    query: `
SELECT id, name
FROM customers
WHERE lower(email) = lower('CUSTOMER2048@example.com');
`,
  },
];
