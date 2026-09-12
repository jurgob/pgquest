import {
  SQL_EXAMPLE_IDS,
  sqlExampleDescription,
  sqlExampleTitle,
  sqlStatement,
  type SqlExample,
} from "./types";

const migration = sqlStatement(`
CREATE TABLE tickets (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  assignee TEXT,
  closed_at DATE
);
`);

const seed = sqlStatement(`
INSERT INTO tickets (title, assignee, closed_at)
VALUES
  ('Fix signup', 'Ada', NULL),
  ('Write docs', NULL, NULL),
  ('Close billing bug', 'Grace', DATE '2026-01-10');
`);

export const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.example7DatabaseInit,
  name: sqlExampleTitle("Lesson 7 database"),
  description: sqlExampleDescription("Creates tickets with missing values."),
  query: sqlStatement(`${migration}\n${seed}`),
};

export const database_inits = [databaseInit] as const;

export const examples: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.example7FindNull,
    name: sqlExampleTitle("Find missing values"),
    description: sqlExampleDescription(
      "Use IS NULL because NULL means unknown, not equal to a value.",
    ),
    database_init: databaseInit,
    query: sqlStatement(`
SELECT id, title
FROM tickets
WHERE assignee IS NULL;
`),
  },
  {
    id: SQL_EXAMPLE_IDS.example7Coalesce,
    name: sqlExampleTitle("Replace NULL for display"),
    description: sqlExampleDescription(
      "COALESCE returns the first non-NULL value from its arguments.",
    ),
    database_init: databaseInit,
    query: sqlStatement(`
SELECT title, COALESCE(assignee, 'Unassigned') AS owner
FROM tickets
ORDER BY id;
`),
  },
  {
    id: SQL_EXAMPLE_IDS.example7NullComparison,
    name: sqlExampleTitle("NULL is not equal"),
    description: sqlExampleDescription(
      "A comparison with NULL does not return true, so this query finds nothing.",
    ),
    database_init: databaseInit,
    query: sqlStatement(`
SELECT id, title
FROM tickets
WHERE assignee = NULL;
`),
  },
];

export const exercises: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.example7ExerciseFindOpen,
    name: sqlExampleTitle("Exercise 1"),
    description: sqlExampleDescription("Select tickets that have not been closed."),
    database_init: databaseInit,
    query: sqlStatement(`
SELECT id, title
FROM tickets
WHERE closed_at IS NULL
ORDER BY id;
`),
  },
  {
    id: SQL_EXAMPLE_IDS.example7ExerciseCoalesceClosedAt,
    name: sqlExampleTitle("Exercise 2"),
    description: sqlExampleDescription(
      "Select each title and show missing closed_at values as Still open.",
    ),
    database_init: databaseInit,
    query: sqlStatement(`
SELECT title, COALESCE(closed_at::text, 'Still open') AS closed
FROM tickets
ORDER BY id;
`),
  },
];
