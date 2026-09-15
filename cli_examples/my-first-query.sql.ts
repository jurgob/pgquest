import {
  SQL_EXAMPLE_IDS,
  sqlExampleDescription,
  sqlExampleTitle,
  sqlStatement,
  type SqlExample,
} from "./types";

export const migration = sqlStatement(`
CREATE TABLE "User" (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL
);
`);

export const seed = sqlStatement(`
INSERT INTO "User" (name, email)
VALUES
  ('Ada Lovelace', 'ada@example.com'),
  ('Grace Hopper', 'grace@example.com');

-- Collect table statistics so EXPLAIN can estimate this tiny table accurately.
ANALYZE "User";
`);

export const selectAll = sqlStatement(`
SELECT * FROM "User";
`);

export const selectByEmail = sqlStatement(`
SELECT * FROM "User"
WHERE email = 'ada@example.com';
`);

export const insertUser = sqlStatement(`
INSERT INTO "User" (name, email)
VALUES ('Linus Torvalds', 'linus@example.com')
RETURNING *;
`);

const migrationInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.myFirstQueryMigrationInit,
  name: sqlExampleTitle("Example 1 schema"),
  description: sqlExampleDescription("Creates the User table."),
  query: migration,
};

export const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.myFirstQueryDatabaseInit,
  name: sqlExampleTitle("Example 1 database"),
  description: sqlExampleDescription("Creates and seeds the User table."),
  query: sqlStatement(`${migration}\n${seed}`),
};

export const database_inits = [migrationInit, databaseInit] as const;

export const examples: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.myFirstQueryMigration,
    name: sqlExampleTitle("Migration"),
    description: sqlExampleDescription("Create the User table."),
    query: migration,
  },
  {
    id: SQL_EXAMPLE_IDS.myFirstQuerySeed,
    name: sqlExampleTitle("Seed"),
    description: sqlExampleDescription("Populate the User table with initial rows."),
    database_init: migrationInit,
    query: seed,
  },
  {
    id: SQL_EXAMPLE_IDS.myFirstQueryBasicSelect,
    name: sqlExampleTitle("My first query"),
    description: sqlExampleDescription("Read every user from the table."),
    database_init: databaseInit,
    query: selectAll,
  },
  {
    id: SQL_EXAMPLE_IDS.myFirstQuerySpecificSelect,
    name: sqlExampleTitle("Let's select a specific user by email"),
    description: sqlExampleDescription("Find Ada Lovelace by email."),
    database_init: databaseInit,
    query: selectByEmail,
  },
  {
    id: SQL_EXAMPLE_IDS.myFirstQueryInsert,
    name: sqlExampleTitle("Insert a new user"),
    description: sqlExampleDescription("Insert Linus Torvalds and return the new row."),
    database_init: databaseInit,
    query: insertUser,
  },
];

export const exercises: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.myFirstQueryExerciseInsertEdger,
    name: sqlExampleTitle("Exercise 1"),
    description: sqlExampleDescription(
      "Add the user Edger W. Dijkstra with email edger@cs.com, and return the inserted row from the INSERT.",
    ),
    database_init: databaseInit,
    query: sqlStatement(`
INSERT INTO "User" (name, email)
VALUES ('Edger W. Dijkstra', 'edger@cs.com')
RETURNING *;
`),
  },
  {
    id: SQL_EXAMPLE_IDS.myFirstQueryExerciseInsertBarbara,
    name: sqlExampleTitle("Exercise 2"),
    description: sqlExampleDescription(
      "Add the user Barbara Liskov with email barbara@mit.edu, also returning the inserted row.",
    ),
    database_init: databaseInit,
    query: sqlStatement(`
INSERT INTO "User" (name, email)
VALUES ('Barbara Liskov', 'barbara@mit.edu')
RETURNING *;
`),
  },
  {
    id: SQL_EXAMPLE_IDS.myFirstQueryExerciseSelectGrace,
    name: sqlExampleTitle("Exercise 3"),
    description: sqlExampleDescription(
      "Select only the user whose email is grace@example.com.",
    ),
    database_init: databaseInit,
    query: sqlStatement(`
SELECT * FROM "User"
WHERE email = 'grace@example.com';
`),
  },
];
