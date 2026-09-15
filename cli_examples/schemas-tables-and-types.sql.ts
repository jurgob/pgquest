import { SQL_EXAMPLE_IDS, type SqlExample } from "./types";

export const migration = `
CREATE SCHEMA IF NOT EXISTS library;
CREATE SCHEMA IF NOT EXISTS lending;

CREATE TABLE IF NOT EXISTS library.authors (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS library.books (
  id SERIAL PRIMARY KEY,
  author_id INTEGER NOT NULL REFERENCES library.authors (id),
  title TEXT NOT NULL,
  published_year INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS lending.loans (
  id SERIAL PRIMARY KEY,
  book_id INTEGER NOT NULL REFERENCES library.books (id),
  borrower_name TEXT NOT NULL,
  borrowed_at TIMESTAMP NOT NULL,
  returned_at TIMESTAMP
);
`;

export const listSchemasQuery = `
-- pg_% schemas (pg_catalog, pg_toast, ...) are Postgres' own internals, not
-- anything a migration created, so we filter them out to see only real schemas.
SELECT schema_name
FROM information_schema.schemata
WHERE schema_name NOT LIKE 'pg_%'
ORDER BY schema_name;
`;

const seed = `
INSERT INTO library.authors (name, country)
VALUES
  ('Octavia Butler', 'US'),
  ('Italo Calvino', 'IT');

INSERT INTO library.books (author_id, title, published_year)
VALUES
  (1, 'Kindred', 1979),
  (2, 'Invisible Cities', 1972);

INSERT INTO lending.loans (book_id, borrower_name, borrowed_at, returned_at)
VALUES
  (1, 'Nnedi Okorafor', '2026-09-01 09:00:00', NULL),
  (2, 'Ursula K. Le Guin', '2026-09-05 14:30:00', '2026-09-12 11:00:00');
`;

export const searchPathQuery = `
SET search_path TO lending, public;

SELECT * FROM loans;
`;

export const crossSchemaJoinQuery = `
SELECT b.title, l.borrower_name, l.borrowed_at, l.returned_at
FROM library.books b
JOIN lending.loans l ON l.book_id = b.id
ORDER BY l.borrowed_at;
`;

export const listTablesQuery = `
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema IN ('library', 'lending')
  AND table_type = 'BASE TABLE'
ORDER BY table_schema, table_name;
`;

export const inspectColumnsQuery = `
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'library'
  AND table_name = 'books'
ORDER BY ordinal_position;
`;

export const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.schemasTablesAndTypesDatabaseInit,
  name: "Lesson 2 database",
  description: "Creates library and lending schemas with a few tables.",
  query: `${migration}\n${seed}`,
};

const migrationAppliedTwiceInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.schemasTablesAndTypesMigrationAppliedTwiceInit,
  name: "Lesson 2 schemas, migrated twice",
  description: "Runs the migration twice back to back, to prove it's safe to repeat.",
  query: `${migration}\n${migration}`,
};

export const database_inits = [databaseInit] as const;

export const examples: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.schemasTablesAndTypesListSchemasEmpty,
    name: "List schemas (empty database)",
    description:
      "A schema groups database objects such as tables inside one database. Given a " +
      "fresh Postgres database where no migration has run yet, information_schema " +
      "lets you discover what schemas already exist.",
    query: listSchemasQuery,
  },
  {
    id: SQL_EXAMPLE_IDS.schemasTablesAndTypesMigration,
    name: "Create the schemas (migration)",
    description: "Creates the library and lending schemas and their tables.",
    query: migration,
  },
  {
    id: SQL_EXAMPLE_IDS.schemasTablesAndTypesListSchemasAfterMigration,
    name: "List schemas (after migration)",
    description: "Same query as before, now against a migrated database.",
    database_init: migrationAppliedTwiceInit,
    query: listSchemasQuery,
  },
  {
    id: SQL_EXAMPLE_IDS.schemasTablesAndTypesSearchPath,
    name: "Setting the default schema",
    description:
      "SET search_path picks which schema unqualified names resolve to, here lending.",
    database_init: databaseInit,
    query: searchPathQuery,
  },
  {
    id: SQL_EXAMPLE_IDS.schemasTablesAndTypesCrossSchemaJoin,
    name: "A cross-schema join",
    description: "Finds which book each loan is for, joining across two schemas.",
    database_init: databaseInit,
    query: crossSchemaJoinQuery,
  },
  {
    id: SQL_EXAMPLE_IDS.schemasTablesAndTypesListTables,
    name: "List tables",
    description: "information_schema.tables shows the tables visible in each schema.",
    database_init: databaseInit,
    query: listTablesQuery,
  },
  {
    id: SQL_EXAMPLE_IDS.schemasTablesAndTypesInspectColumns,
    name: "Inspect table shape",
    description:
      "information_schema.columns shows each column name, type, and nullability.",
    database_init: databaseInit,
    query: inspectColumnsQuery,
  },
];

export const exercises: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.schemasTablesAndTypesExerciseListLibraryTables,
    name: "Exercise 1",
    description: "List every table in the library schema.",
    database_init: databaseInit,
    query: `
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'library'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.schemasTablesAndTypesExerciseInspectLoans,
    name: "Exercise 2",
    description: "Inspect the columns of the lending.loans table.",
    database_init: databaseInit,
    query: `
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'lending'
  AND table_name = 'loans'
ORDER BY ordinal_position;
`,
  },
];
