import {
  SQL_EXAMPLE_IDS,
  sqlExampleDescription,
  sqlExampleTitle,
  sqlStatement,
  type SqlExample,
} from "./types";

const migration = sqlStatement(`
CREATE SCHEMA library;
CREATE SCHEMA analytics;

CREATE TABLE library.authors (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL
);

CREATE TABLE library.books (
  id SERIAL PRIMARY KEY,
  author_id INTEGER NOT NULL REFERENCES library.authors (id),
  title TEXT NOT NULL,
  published_year INTEGER NOT NULL
);

CREATE TABLE analytics.page_views (
  id SERIAL PRIMARY KEY,
  path TEXT NOT NULL,
  viewed_at TIMESTAMP NOT NULL
);
`);

const seed = sqlStatement(`
INSERT INTO library.authors (name, country)
VALUES
  ('Octavia Butler', 'US'),
  ('Italo Calvino', 'IT');

INSERT INTO library.books (author_id, title, published_year)
VALUES
  (1, 'Kindred', 1979),
  (2, 'Invisible Cities', 1972);

INSERT INTO analytics.page_views (path, viewed_at)
VALUES
  ('/lessons/lesson-1', '2026-09-10 10:00:00'),
  ('/playground', '2026-09-10 10:05:00');
`);

export const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.example2SchemaDatabaseInit,
  name: sqlExampleTitle("Lesson 2 database"),
  description: sqlExampleDescription(
    "Creates library and analytics schemas with a few tables.",
  ),
  query: sqlStatement(`${migration}\n${seed}`),
};

export const database_inits = [databaseInit] as const;

export const examples: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.example2ListSchemas,
    name: sqlExampleTitle("List schemas"),
    description: sqlExampleDescription(
      "A schema groups database objects such as tables inside one database.",
    ),
    database_init: databaseInit,
    query: sqlStatement(`
SELECT schema_name
FROM information_schema.schemata
WHERE schema_name NOT LIKE 'pg_%'
ORDER BY schema_name;
`),
  },
  {
    id: SQL_EXAMPLE_IDS.example2ListTables,
    name: sqlExampleTitle("List tables"),
    description: sqlExampleDescription(
      "information_schema.tables shows the tables visible in each schema.",
    ),
    database_init: databaseInit,
    query: sqlStatement(`
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema IN ('library', 'analytics')
  AND table_type = 'BASE TABLE'
ORDER BY table_schema, table_name;
`),
  },
  {
    id: SQL_EXAMPLE_IDS.example2InspectColumns,
    name: sqlExampleTitle("Inspect table shape"),
    description: sqlExampleDescription(
      "information_schema.columns shows each column name, type, and nullability.",
    ),
    database_init: databaseInit,
    query: sqlStatement(`
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'library'
  AND table_name = 'books'
ORDER BY ordinal_position;
`),
  },
];

export const exercises: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.example2ExerciseListLibraryTables,
    name: sqlExampleTitle("Exercise 1"),
    description: sqlExampleDescription("List every table in the library schema."),
    database_init: databaseInit,
    query: sqlStatement(`
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'library'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
`),
  },
  {
    id: SQL_EXAMPLE_IDS.example2ExerciseInspectPageViews,
    name: sqlExampleTitle("Exercise 2"),
    description: sqlExampleDescription(
      "Inspect the columns of the analytics.page_views table.",
    ),
    database_init: databaseInit,
    query: sqlStatement(`
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'analytics'
  AND table_name = 'page_views'
ORDER BY ordinal_position;
`),
  },
];
