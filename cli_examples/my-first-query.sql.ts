import { SQL_EXAMPLE_IDS, type SqlExample } from "./types";

export const migration = `
CREATE TABLE "User" (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL
);
`;

export const seed = `
INSERT INTO "User" (name, email)
VALUES
  ('Ada Lovelace', 'ada@example.com'),
  ('Grace Hopper', 'grace@example.com');

-- Collect table statistics so EXPLAIN can estimate this tiny table accurately.
ANALYZE "User";
`;

export const selectAll = `
SELECT * FROM "User";
`;

export const selectByEmail = `
SELECT * FROM "User"
WHERE email = 'ada@example.com';
`;

export const insertUser = `
INSERT INTO "User" (name, email)
VALUES ('Linus Torvalds', 'linus@example.com')
RETURNING *;
`;

const migrationInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.myFirstQueryMigrationInit,
  name: "Example 1 schema",
  description: "Creates the User table.",
  query: migration,
};

export const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.myFirstQueryDatabaseInit,
  name: "Example 1 database",
  description: "Creates and seeds the User table.",
  query: `${migration}\n${seed}`,
};

export const database_inits = [migrationInit, databaseInit] as const;

export const examples: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.myFirstQueryMigration,
    name: "Migration",
    description: "Create the User table.",
    query: migration,
  },
  {
    id: SQL_EXAMPLE_IDS.myFirstQuerySeed,
    name: "Seed",
    description: "Populate the User table with initial rows.",
    database_init: migrationInit,
    query: seed,
  },
  {
    id: SQL_EXAMPLE_IDS.myFirstQueryBasicSelect,
    name: "My first query",
    description: "Read every user from the table.",
    database_init: databaseInit,
    query: selectAll,
  },
  {
    id: SQL_EXAMPLE_IDS.myFirstQuerySpecificSelect,
    name: "Let's select a specific user by email",
    description: "Find Ada Lovelace by email.",
    database_init: databaseInit,
    query: selectByEmail,
  },
  {
    id: SQL_EXAMPLE_IDS.myFirstQueryInsert,
    name: "Insert a new user",
    description: "Insert Linus Torvalds and return the new row.",
    database_init: databaseInit,
    query: insertUser,
  },
];

export const exercises: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.myFirstQueryExerciseInsertEdger,
    name: "Exercise 1",
    description:
      "Add the user Edger W. Dijkstra with email edger@cs.com, and return the inserted row from the INSERT.",
    database_init: databaseInit,
    query: `
INSERT INTO "User" (name, email)
VALUES ('Edger W. Dijkstra', 'edger@cs.com')
RETURNING *;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.myFirstQueryExerciseInsertBarbara,
    name: "Exercise 2",
    description:
      "Add the user Barbara Liskov with email barbara@mit.edu, also returning the inserted row.",
    database_init: databaseInit,
    query: `
INSERT INTO "User" (name, email)
VALUES ('Barbara Liskov', 'barbara@mit.edu')
RETURNING *;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.myFirstQueryExerciseSelectGrace,
    name: "Exercise 3",
    description: "Select only the user whose email is grace@example.com.",
    database_init: databaseInit,
    query: `
SELECT * FROM "User"
WHERE email = 'grace@example.com';
`,
  },
];
