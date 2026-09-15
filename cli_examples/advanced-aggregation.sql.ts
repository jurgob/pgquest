import {
  SQL_EXAMPLE_IDS,
  sqlExampleDescription,
  sqlExampleTitle,
  sqlStatement,
  type SqlExample,
} from "./types";

const migration = sqlStatement(`
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  status TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL
);
`);

const seed = sqlStatement(`
INSERT INTO payments (status, amount_cents, created_at)
VALUES
  ('paid', 1000, TIMESTAMP '2026-01-01 10:00'),
  ('paid', 2500, TIMESTAMP '2026-01-01 11:00'),
  ('failed', 2500, TIMESTAMP '2026-01-01 12:00'),
  ('paid', 3000, TIMESTAMP '2026-01-02 10:00'),
  ('refunded', 1000, TIMESTAMP '2026-01-02 11:00');
`);

export const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.advancedAggregationDatabaseInit,
  name: sqlExampleTitle("Lesson 14 database"),
  description: sqlExampleDescription("Creates payments for advanced aggregation."),
  query: sqlStatement(`${migration}\n${seed}`),
};

export const database_inits = [databaseInit] as const;

export const examples: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.advancedAggregationHaving,
    name: sqlExampleTitle("HAVING"),
    description: sqlExampleDescription(
      "HAVING filters groups, while WHERE filters rows before grouping.",
    ),
    database_init: databaseInit,
    query: sqlStatement(`
SELECT status, COUNT(*) AS payments
FROM payments
GROUP BY status
HAVING COUNT(*) > 1
ORDER BY status;
`),
  },
  {
    id: SQL_EXAMPLE_IDS.advancedAggregationFilter,
    name: sqlExampleTitle("FILTER"),
    description: sqlExampleDescription(
      "FILTER lets different aggregates count different subsets in one query.",
    ),
    database_init: databaseInit,
    query: sqlStatement(`
SELECT
  COUNT(*) FILTER (WHERE status = 'paid') AS paid,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed
FROM payments;
`),
  },
  {
    id: SQL_EXAMPLE_IDS.advancedAggregationDateTrunc,
    name: sqlExampleTitle("Group by time"),
    description: sqlExampleDescription(
      "date_trunc turns timestamps into buckets such as day, month, or year.",
    ),
    database_init: databaseInit,
    query: sqlStatement(`
SELECT date_trunc('day', created_at) AS day, SUM(amount_cents) AS total_cents
FROM payments
WHERE status = 'paid'
GROUP BY day
ORDER BY day;
`),
  },
];

export const exercises: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.advancedAggregationExerciseDailyRevenue,
    name: sqlExampleTitle("Exercise 1"),
    description: sqlExampleDescription("Return paid revenue grouped by day."),
    database_init: databaseInit,
    query: sqlStatement(`
SELECT date_trunc('day', created_at) AS day, SUM(amount_cents) AS paid_cents
FROM payments
WHERE status = 'paid'
GROUP BY day
ORDER BY day;
`),
  },
  {
    id: SQL_EXAMPLE_IDS.advancedAggregationExercisePaidFilter,
    name: sqlExampleTitle("Exercise 2"),
    description: sqlExampleDescription(
      "Return total rows and paid rows using COUNT with FILTER.",
    ),
    database_init: databaseInit,
    query: sqlStatement(`
SELECT
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE status = 'paid') AS paid
FROM payments;
`),
  },
];
