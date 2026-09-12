import {
  SQL_EXAMPLE_IDS,
  sqlExampleDescription,
  sqlExampleTitle,
  sqlStatement,
  type SqlExample,
} from "./types";

const migration = sqlStatement(`
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  status TEXT NOT NULL,
  city TEXT NOT NULL,
  total_cents INTEGER NOT NULL
);
`);

const seed = sqlStatement(`
INSERT INTO orders (status, city, total_cents)
VALUES
  ('paid', 'London', 4200),
  ('paid', 'London', 1800),
  ('paid', 'Paris', 2400),
  ('pending', 'Berlin', 900),
  ('refunded', 'Paris', 2400);
`);

export const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.example6DatabaseInit,
  name: sqlExampleTitle("Lesson 6 database"),
  description: sqlExampleDescription("Creates a small orders table."),
  query: sqlStatement(`${migration}\n${seed}`),
};

export const database_inits = [databaseInit] as const;

export const examples: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.example6Totals,
    name: sqlExampleTitle("Count and sum"),
    description: sqlExampleDescription(
      "Aggregate functions collapse many rows into one summary row.",
    ),
    database_init: databaseInit,
    query: sqlStatement(`
SELECT COUNT(*) AS orders, SUM(total_cents) AS revenue_cents
FROM orders;
`),
  },
  {
    id: SQL_EXAMPLE_IDS.example6GroupBy,
    name: sqlExampleTitle("Group by city"),
    description: sqlExampleDescription(
      "GROUP BY returns one summary row for each distinct city.",
    ),
    database_init: databaseInit,
    query: sqlStatement(`
SELECT city, COUNT(*) AS orders, SUM(total_cents) AS revenue_cents
FROM orders
GROUP BY city
ORDER BY city;
`),
  },
  {
    id: SQL_EXAMPLE_IDS.example6Having,
    name: sqlExampleTitle("Filter groups"),
    description: sqlExampleDescription(
      "HAVING filters grouped rows after the aggregate has been computed.",
    ),
    database_init: databaseInit,
    query: sqlStatement(`
SELECT status, COUNT(*) AS orders
FROM orders
GROUP BY status
HAVING COUNT(*) > 1
ORDER BY status;
`),
  },
];

export const exercises: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.example6ExerciseCountPaid,
    name: sqlExampleTitle("Exercise 1"),
    description: sqlExampleDescription("Count only the orders whose status is paid."),
    database_init: databaseInit,
    query: sqlStatement(`
SELECT COUNT(*) AS paid_orders
FROM orders
WHERE status = 'paid';
`),
  },
  {
    id: SQL_EXAMPLE_IDS.example6ExerciseGroupByStatus,
    name: sqlExampleTitle("Exercise 2"),
    description: sqlExampleDescription(
      "Group orders by status and return the total revenue for each status.",
    ),
    database_init: databaseInit,
    query: sqlStatement(`
SELECT status, SUM(total_cents) AS revenue_cents
FROM orders
GROUP BY status
ORDER BY status;
`),
  },
];
