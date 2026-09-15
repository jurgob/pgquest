import { SQL_EXAMPLE_IDS, type SqlExample } from "./types";

const migration = `
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  order_number TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  total_cents INTEGER NOT NULL
);

CREATE INDEX orders_status_idx ON orders (status);
CREATE INDEX orders_status_created_at_idx ON orders (status, created_at DESC);
CREATE INDEX orders_failed_order_number_idx ON orders (order_number)
WHERE status = 'failed';
`;

const seed = `
INSERT INTO orders (order_number, status, created_at, total_cents)
SELECT
  'ORD-' || value,
  CASE
    WHEN value % 100 = 0 THEN 'failed'
    WHEN value % 10 = 0 THEN 'pending'
    ELSE 'paid'
  END,
  TIMESTAMP '2026-01-01 00:00:00' + (value || ' minutes')::interval,
  1000 + value
FROM generate_series(1, 12000) AS value;

ANALYZE orders;
`;

export const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.advancedIndexesDatabaseInit,
  name: "Lesson 5 database",
  description: "Creates orders with several index shapes.",
  query: `${migration}\n${seed}`,
};

export const database_inits = [databaseInit] as const;

export const examples: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.advancedIndexesLowSelectivity,
    name: "Low selectivity",
    description:
      "An index on status exists, but paid matches most rows, so a scan can still be cheaper.",
    database_init: databaseInit,
    query: `
SELECT COUNT(*) AS paid_orders
FROM orders
WHERE status = 'paid';
`,
  },
  {
    id: SQL_EXAMPLE_IDS.advancedIndexesCompositeIndex,
    name: "Composite index",
    description:
      "This query matches the status, created_at index shape: filter first, then order.",
    database_init: databaseInit,
    query: `
SELECT order_number, status, created_at
FROM orders
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 5;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.advancedIndexesPartialIndex,
    name: "Partial index",
    description:
      "A partial index stores only failed orders, which keeps a rare lookup small.",
    database_init: databaseInit,
    query: `
SELECT order_number, status, total_cents
FROM orders
WHERE status = 'failed'
  AND order_number = 'ORD-9000';
`,
  },
];

export const exercises: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.advancedIndexesExerciseRecentPaidOrders,
    name: "Exercise 1",
    description:
      "Select the 3 newest paid orders using status, ORDER BY created_at DESC, and LIMIT.",
    database_init: databaseInit,
    query: `
SELECT order_number, status, created_at
FROM orders
WHERE status = 'paid'
ORDER BY created_at DESC
LIMIT 3;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.advancedIndexesExerciseFailedOrder,
    name: "Exercise 2",
    description: "Select failed order ORD-12000 using both status and order_number.",
    database_init: databaseInit,
    query: `
SELECT order_number, status, total_cents
FROM orders
WHERE status = 'failed'
  AND order_number = 'ORD-12000';
`,
  },
];
