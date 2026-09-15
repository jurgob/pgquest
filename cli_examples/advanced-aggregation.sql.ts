import { SQL_EXAMPLE_IDS, type SqlExample } from "./types";

const migration = `
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  status TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL
);
`;

const seed = `
INSERT INTO payments (status, amount_cents, created_at)
VALUES
  ('paid', 1000, TIMESTAMP '2026-01-01 10:00'),
  ('paid', 2500, TIMESTAMP '2026-01-01 11:00'),
  ('failed', 2500, TIMESTAMP '2026-01-01 12:00'),
  ('paid', 3000, TIMESTAMP '2026-01-02 10:00'),
  ('refunded', 1000, TIMESTAMP '2026-01-02 11:00');
`;

export const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.advancedAggregationDatabaseInit,
  name: "Lesson 14 database",
  description: "Creates payments for advanced aggregation.",
  query: `${migration}\n${seed}`,
};

export const database_inits = [databaseInit] as const;

export const examples: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.advancedAggregationHaving,
    name: "HAVING",
    description: "HAVING filters groups, while WHERE filters rows before grouping.",
    database_init: databaseInit,
    query: `
SELECT status, COUNT(*) AS payments
FROM payments
GROUP BY status
HAVING COUNT(*) > 1
ORDER BY status;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.advancedAggregationFilter,
    name: "FILTER",
    description: "FILTER lets different aggregates count different subsets in one query.",
    database_init: databaseInit,
    query: `
SELECT
  COUNT(*) FILTER (WHERE status = 'paid') AS paid,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed
FROM payments;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.advancedAggregationDateTrunc,
    name: "Group by time",
    description: "date_trunc turns timestamps into buckets such as day, month, or year.",
    database_init: databaseInit,
    query: `
SELECT date_trunc('day', created_at) AS day, SUM(amount_cents) AS total_cents
FROM payments
WHERE status = 'paid'
GROUP BY day
ORDER BY day;
`,
  },
];

export const exercises: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.advancedAggregationExerciseDailyRevenue,
    name: "Exercise 1",
    description: "Return paid revenue grouped by day.",
    database_init: databaseInit,
    query: `
SELECT date_trunc('day', created_at) AS day, SUM(amount_cents) AS paid_cents
FROM payments
WHERE status = 'paid'
GROUP BY day
ORDER BY day;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.advancedAggregationExercisePaidFilter,
    name: "Exercise 2",
    description: "Return total rows and paid rows using COUNT with FILTER.",
    database_init: databaseInit,
    query: `
SELECT
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE status = 'paid') AS paid
FROM payments;
`,
  },
];
