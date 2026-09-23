import { SQL_EXAMPLE_IDS, type SqlExample } from "./types";

export const migration = `
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  gender TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true
);
`;

export const seed = `
INSERT INTO users (name, email, gender, active)
VALUES
  ('Ada Lovelace', 'ada@example.com', 'female', true),
  ('Grace Hopper', 'grace@example.com', 'female', true),
  ('Alan Turing', 'alan@example.com', 'male', true),
  ('Katherine Johnson', 'katherine@example.com', 'female', true),
  ('Barbara Liskov', 'barbara@example.com', 'female', true),
  ('Donald Knuth', 'donald@example.com', 'male', true),
  ('John McCarthy', 'john@example.com', 'male', true),
  ('Edsger Dijkstra', 'edsger@example.com', 'male', true);
`;

export const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.insertUpdateDeleteDatabaseInit,
  name: "Lesson 3 database",
  description: "Creates and seeds users for write examples.",
  query: `${migration}\n${seed}`,
};

export const afterKatherineDeletedInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.insertUpdateDeleteRefreshAfterDeleteInit,
  name: "Lesson 3 database (Katherine already deleted)",
  description:
    "Same seed, but Katherine Johnson's row is already gone — the state right before the INSERT step of the DELETE + INSERT comparison runs.",
  query: `${databaseInit.query}\nDELETE FROM users WHERE email = 'katherine@example.com';`,
};

export const database_inits = [databaseInit, afterKatherineDeletedInit] as const;

export const examples: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.insertUpdateDeleteInsertReturning,
    name: "Insert a row",
    description: "INSERT adds a row. RETURNING shows the row PostgreSQL stored.",
    database_init: databaseInit,
    query: `
INSERT INTO users (name, email, gender)
VALUES ('Radia Perlman', 'radia@example.com', 'female')
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
  {
    id: SQL_EXAMPLE_IDS.insertUpdateDeleteUpsert,
    name: "Upsert a row",
    description:
      "INSERT ... ON CONFLICT lets one statement insert a new row or update the existing one, depending on whether it already exists.",
    database_init: databaseInit,
    query: `
INSERT INTO users (name, email, gender, active)
VALUES ('Katherine Johnson', 'katherine@example.com', 'female', false)
ON CONFLICT (email)
DO UPDATE SET active = EXCLUDED.active
RETURNING *;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.insertUpdateDeleteDeactivateMales,
    name: "Deactivate every male user (bulk update)",
    description:
      "A WHERE clause can match more than one row. UPDATE changes every match, and RETURNING hands back all of them.",
    database_init: databaseInit,
    query: `
UPDATE users
SET active = false
WHERE gender = 'male'
RETURNING *;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.insertUpdateDeleteRefreshDelete,
    name: "DELETE step",
    description: "Removing Katherine Johnson's row so it can be reinserted from scratch.",
    database_init: databaseInit,
    query: `
EXPLAIN (ANALYZE, BUFFERS)
DELETE FROM users
WHERE email = 'katherine@example.com';
`,
  },
  {
    id: SQL_EXAMPLE_IDS.insertUpdateDeleteRefreshInsert,
    name: "INSERT step",
    description: "Reinserting her as a brand new row, right after the DELETE above.",
    database_init: afterKatherineDeletedInit,
    query: `
EXPLAIN (ANALYZE, BUFFERS)
INSERT INTO users (name, email, gender, active)
VALUES ('Katherine Johnson', 'katherine@example.com', 'female', false);
`,
  },
  {
    id: SQL_EXAMPLE_IDS.insertUpdateDeleteRefreshUpsert,
    name: "UPSERT",
    description:
      "Same end state, one statement: update her row in place instead of deleting and reinserting it.",
    database_init: databaseInit,
    query: `
EXPLAIN (ANALYZE, BUFFERS)
INSERT INTO users (name, email, gender, active)
VALUES ('Katherine Johnson', 'katherine@example.com', 'female', false)
ON CONFLICT (email)
DO UPDATE SET active = EXCLUDED.active;
`,
  },
];

export const exercises: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.insertUpdateDeleteExerciseInsert,
    name: "Exercise 1",
    description:
      "Insert Margaret Hamilton with email margaret@nasa.gov and gender female, and return the inserted row.",
    database_init: databaseInit,
    query: `
INSERT INTO users (name, email, gender)
VALUES ('Margaret Hamilton', 'margaret@nasa.gov', 'female')
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
  {
    id: SQL_EXAMPLE_IDS.insertUpdateDeleteExerciseBulkDelete,
    name: "Exercise 3",
    description: "Delete every male user and return all the deleted rows.",
    database_init: databaseInit,
    query: `
DELETE FROM users
WHERE gender = 'male'
RETURNING *;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.insertUpdateDeleteExerciseUpsert,
    name: "Exercise 4",
    description:
      "Upsert Barbara Liskov: email barbara@example.com, gender female, active false. Since that email already exists, this should update her row instead of inserting a new one. Return the affected row.",
    database_init: databaseInit,
    query: `
INSERT INTO users (name, email, gender, active)
VALUES ('Barbara Liskov', 'barbara@example.com', 'female', false)
ON CONFLICT (email)
DO UPDATE SET active = EXCLUDED.active
RETURNING *;
`,
  },
];
