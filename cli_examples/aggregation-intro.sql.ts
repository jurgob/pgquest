import { SQL_EXAMPLE_IDS, type SqlExample } from "./types";

const migration = `
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  status TEXT NOT NULL,
  city TEXT NOT NULL,
  total_cents INTEGER NOT NULL
);
`;

const seed = `
INSERT INTO orders (status, city, total_cents)
VALUES
  ('paid', 'London', 4200),
  ('paid', 'London', 1800),
  ('paid', 'Paris', 2400),
  ('pending', 'Berlin', 900),
  ('refunded', 'Paris', 2400);
`;

export const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.aggregationIntroDatabaseInit,
  name: "Lesson 6 database",
  description: "Creates a small orders table.",
  query: `${migration}\n${seed}`,
};

export const database_inits = [databaseInit] as const;

export const examples: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.aggregationIntroTotals,
    name: "Count and sum",
    description: "Aggregate functions collapse many rows into one summary row.",
    database_init: databaseInit,
    query: `
SELECT COUNT(*) AS orders, SUM(total_cents) AS revenue_cents
FROM orders;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.aggregationIntroGroupBy,
    name: "Group by city",
    description: "GROUP BY returns one summary row for each distinct city.",
    database_init: databaseInit,
    query: `
SELECT city, COUNT(*) AS orders, SUM(total_cents) AS revenue_cents
FROM orders
GROUP BY city
ORDER BY city;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.aggregationIntroHaving,
    name: "Filter groups",
    description: "HAVING filters grouped rows after the aggregate has been computed.",
    database_init: databaseInit,
    query: `
SELECT status, COUNT(*) AS orders
FROM orders
GROUP BY status
HAVING COUNT(*) > 1
ORDER BY status;
`,
  },
];

export const exercises: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.aggregationIntroExerciseCountPaid,
    name: "Exercise 1",
    description: "Count only the orders whose status is paid.",
    database_init: databaseInit,
    query: `
SELECT COUNT(*) AS paid_orders
FROM orders
WHERE status = 'paid';
`,
  },
  {
    id: SQL_EXAMPLE_IDS.aggregationIntroExerciseGroupByStatus,
    name: "Exercise 2",
    description: "Group orders by status and return the total revenue for each status.",
    database_init: databaseInit,
    query: `
SELECT status, SUM(total_cents) AS revenue_cents
FROM orders
GROUP BY status
ORDER BY status;
`,
  },
];
