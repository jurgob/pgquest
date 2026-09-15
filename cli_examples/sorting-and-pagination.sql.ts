import {
  SQL_EXAMPLE_IDS,
  sqlExampleDescription,
  sqlExampleTitle,
  sqlStatement,
  type SqlExample,
} from "./types";

const migration = sqlStatement(`
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  starts_at TIMESTAMP NOT NULL
);

CREATE INDEX events_starts_at_idx ON events (starts_at DESC);
`);

const seed = sqlStatement(`
INSERT INTO events (name, starts_at)
VALUES
  ('Kickoff', TIMESTAMP '2026-01-01 09:00'),
  ('Schema review', TIMESTAMP '2026-01-02 09:00'),
  ('Index workshop', TIMESTAMP '2026-01-03 09:00'),
  ('Aggregation lab', TIMESTAMP '2026-01-04 09:00'),
  ('Join clinic', TIMESTAMP '2026-01-05 09:00');

ANALYZE events;
`);

export const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.example10DatabaseInit,
  name: sqlExampleTitle("Lesson 10 database"),
  description: sqlExampleDescription("Creates events with an index on start time."),
  query: sqlStatement(`${migration}\n${seed}`),
};

export const database_inits = [databaseInit] as const;

export const examples: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.example10OrderedEvents,
    name: sqlExampleTitle("Sort rows"),
    description: sqlExampleDescription(
      "ORDER BY makes result order explicit instead of trusting table storage order.",
    ),
    database_init: databaseInit,
    query: sqlStatement(`
SELECT name, starts_at
FROM events
ORDER BY starts_at DESC;
`),
  },
  {
    id: SQL_EXAMPLE_IDS.example10PageEvents,
    name: sqlExampleTitle("Limit and offset"),
    description: sqlExampleDescription(
      "LIMIT and OFFSET can fetch one page from a larger ordered result.",
    ),
    database_init: databaseInit,
    query: sqlStatement(`
SELECT name, starts_at
FROM events
ORDER BY starts_at DESC
LIMIT 2 OFFSET 2;
`),
  },
  {
    id: SQL_EXAMPLE_IDS.example10IndexBackedOrder,
    name: sqlExampleTitle("Sort with an index"),
    description: sqlExampleDescription(
      "An index with the same order can let PostgreSQL avoid a separate sort step.",
    ),
    database_init: databaseInit,
    query: sqlStatement(`
SELECT name, starts_at
FROM events
ORDER BY starts_at DESC
LIMIT 1;
`),
  },
];

export const exercises: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.example10ExerciseNewestThree,
    name: sqlExampleTitle("Exercise 1"),
    description: sqlExampleDescription("Select the three newest events."),
    database_init: databaseInit,
    query: sqlStatement(`
SELECT name, starts_at
FROM events
ORDER BY starts_at DESC
LIMIT 3;
`),
  },
  {
    id: SQL_EXAMPLE_IDS.example10ExerciseSecondPage,
    name: sqlExampleTitle("Exercise 2"),
    description: sqlExampleDescription(
      "Select the second page of two oldest events using LIMIT and OFFSET.",
    ),
    database_init: databaseInit,
    query: sqlStatement(`
SELECT name, starts_at
FROM events
ORDER BY starts_at ASC
LIMIT 2 OFFSET 2;
`),
  },
];
