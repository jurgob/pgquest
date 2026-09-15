import { SQL_EXAMPLE_IDS, type SqlExample } from "./types";

const migration = `
CREATE TABLE tickets (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  assignee TEXT,
  closed_at DATE
);
`;

const seed = `
INSERT INTO tickets (title, assignee, closed_at)
VALUES
  ('Fix signup', 'Ada', NULL),
  ('Write docs', NULL, NULL),
  ('Close billing bug', 'Grace', DATE '2026-01-10');
`;

export const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.nullDatabaseInit,
  name: "Lesson 7 database",
  description: "Creates tickets with missing values.",
  query: `${migration}\n${seed}`,
};

export const database_inits = [databaseInit] as const;

export const examples: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.nullFindNull,
    name: "Find missing values",
    description: "Use IS NULL because NULL means unknown, not equal to a value.",
    database_init: databaseInit,
    query: `
SELECT id, title
FROM tickets
WHERE assignee IS NULL;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.nullCoalesce,
    name: "Replace NULL for display",
    description: "COALESCE returns the first non-NULL value from its arguments.",
    database_init: databaseInit,
    query: `
SELECT title, COALESCE(assignee, 'Unassigned') AS owner
FROM tickets
ORDER BY id;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.nullComparison,
    name: "NULL is not equal",
    description:
      "A comparison with NULL does not return true, so this query finds nothing.",
    database_init: databaseInit,
    query: `
SELECT id, title
FROM tickets
WHERE assignee = NULL;
`,
  },
];

export const exercises: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.nullExerciseFindOpen,
    name: "Exercise 1",
    description: "Select tickets that have not been closed.",
    database_init: databaseInit,
    query: `
SELECT id, title
FROM tickets
WHERE closed_at IS NULL
ORDER BY id;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.nullExerciseCoalesceClosedAt,
    name: "Exercise 2",
    description: "Select each title and show missing closed_at values as Still open.",
    database_init: databaseInit,
    query: `
SELECT title, COALESCE(closed_at::text, 'Still open') AS closed
FROM tickets
ORDER BY id;
`,
  },
];
