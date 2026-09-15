import {
  SQL_EXAMPLE_IDS,
  sqlExampleDescription,
  sqlExampleTitle,
  sqlStatement,
  type SqlExample,
} from "./types";

const migration = sqlStatement(`
CREATE TABLE articles (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL
);
`);

const seed = sqlStatement(`
INSERT INTO articles (title, body)
VALUES
  ('PostgreSQL indexing guide', 'Indexes help PostgreSQL find rows.'),
  ('SQL join guide', 'Joins combine rows from different tables.'),
  ('JSON in Postgres', 'jsonb stores structured documents.'),
  ('Vector search notes', 'Similarity search compares embeddings.');
`);

export const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.textSearchBasicsDatabaseInit,
  name: sqlExampleTitle("Lesson 11 database"),
  description: sqlExampleDescription("Creates searchable articles."),
  query: sqlStatement(`${migration}\n${seed}`),
};

export const database_inits = [databaseInit] as const;

export const examples: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.textSearchBasicsLikePrefix,
    name: sqlExampleTitle("Prefix search"),
    description: sqlExampleDescription(
      "LIKE uses % as a wildcard. This pattern matches titles starting with SQL.",
    ),
    database_init: databaseInit,
    query: sqlStatement(`
SELECT title
FROM articles
WHERE title LIKE 'SQL%';
`),
  },
  {
    id: SQL_EXAMPLE_IDS.textSearchBasicsIlikeContains,
    name: sqlExampleTitle("Case-insensitive search"),
    description: sqlExampleDescription("ILIKE works like LIKE, but ignores letter case."),
    database_init: databaseInit,
    query: sqlStatement(`
SELECT title
FROM articles
WHERE title ILIKE '%postgres%';
`),
  },
  {
    id: SQL_EXAMPLE_IDS.textSearchBasicsLowerSearch,
    name: sqlExampleTitle("Normalize then search"),
    description: sqlExampleDescription(
      "LOWER can make a regular LIKE comparison case-insensitive.",
    ),
    database_init: databaseInit,
    query: sqlStatement(`
SELECT title
FROM articles
WHERE LOWER(body) LIKE '%search%';
`),
  },
];

export const exercises: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.textSearchBasicsExerciseFindPostgres,
    name: sqlExampleTitle("Exercise 1"),
    description: sqlExampleDescription("Find articles whose title mentions Postgres."),
    database_init: databaseInit,
    query: sqlStatement(`
SELECT title
FROM articles
WHERE title ILIKE '%postgres%';
`),
  },
  {
    id: SQL_EXAMPLE_IDS.textSearchBasicsExerciseFindGuide,
    name: sqlExampleTitle("Exercise 2"),
    description: sqlExampleDescription("Find articles whose title ends with guide."),
    database_init: databaseInit,
    query: sqlStatement(`
SELECT title
FROM articles
WHERE title ILIKE '%guide';
`),
  },
];
