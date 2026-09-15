import { SQL_EXAMPLE_IDS, type SqlExample } from "./types";

const migration = `
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true
);
`;

const seed = `
INSERT INTO users (name, email, active)
VALUES
  ('Ada Lovelace', 'ada@example.com', true),
  ('Grace Hopper', 'grace@example.com', true),
  ('Alan Turing', 'alan@example.com', true);
`;

export const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.insertUpdateDeleteDatabaseInit,
  name: "Lesson 3 database",
  description: "Creates and seeds users for write examples.",
  query: `${migration}\n${seed}`,
};

export const database_inits = [databaseInit] as const;

export const examples: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.insertUpdateDeleteInsertReturning,
    name: "Insert a row",
    description: "INSERT adds a row. RETURNING shows the row PostgreSQL stored.",
    database_init: databaseInit,
    query: `
INSERT INTO users (name, email)
VALUES ('Edsger Dijkstra', 'edsger@example.com')
RETURNING *;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.insertUpdateDeleteUpdateReturning,
    name: "Update a row",
    description:
      "UPDATE changes matching rows. The WHERE clause keeps the change focused.",
    database_init: databaseInit,
    query: `
UPDATE users
SET active = false
WHERE email = 'alan@example.com'
RETURNING *;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.insertUpdateDeleteDeleteReturning,
    name: "Delete a row",
    description:
      "DELETE removes matching rows. RETURNING is useful when you want to inspect what was removed.",
    database_init: databaseInit,
    query: `
DELETE FROM users
WHERE email = 'grace@example.com'
RETURNING *;
`,
  },
];

export const exercises: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.insertUpdateDeleteExerciseInsert,
    name: "Exercise 1",
    description:
      "Insert Katherine Johnson with email katherine@nasa.gov and return the inserted row.",
    database_init: databaseInit,
    query: `
INSERT INTO users (name, email)
VALUES ('Katherine Johnson', 'katherine@nasa.gov')
RETURNING *;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.insertUpdateDeleteExerciseUpdate,
    name: "Exercise 2",
    description: "Set Ada Lovelace to inactive and return the updated row.",
    database_init: databaseInit,
    query: `
UPDATE users
SET active = false
WHERE email = 'ada@example.com'
RETURNING *;
`,
  },
];
