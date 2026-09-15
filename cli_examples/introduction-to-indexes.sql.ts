import { SQL_EXAMPLE_IDS, type SqlExample } from "./types";

const migration = `
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  city TEXT NOT NULL
);
`;

const seed = `
INSERT INTO users (name, email, city)
SELECT
  'User ' || value,
  'user' || value || '@example.com',
  CASE value % 4
    WHEN 0 THEN 'London'
    WHEN 1 THEN 'Paris'
    WHEN 2 THEN 'Berlin'
    ELSE 'Madrid'
  END
FROM generate_series(1, 10000) AS value;

ANALYZE users;
`;

const sequentialQuery = `
SELECT id, name, email, city
FROM users
WHERE email = 'user9000@example.com';
`;

const indexedMigration = `
${migration}

-- Add an index so PostgreSQL can find rows by email
-- without scanning the whole table.
CREATE INDEX users_email_idx ON users (email);
`;

const migrationInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.introductionToIndexesMigrationInit,
  name: "Example 2 schema",
  description: "Creates the users table without an index.",
  query: migration,
};

const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.introductionToIndexesDatabaseInit,
  name: "Example 2 database",
  description: "Creates and seeds the users table without an index.",
  query: `${migration}\n${seed}`,
};

const indexedDatabaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.introductionToIndexesIndexedDatabaseInit,
  name: "Example 2 indexed database",
  description: "Creates, indexes, and seeds the users table.",
  query: `${indexedMigration}\n${seed}`,
};

export const database_inits = [migrationInit, databaseInit, indexedDatabaseInit] as const;

export const examples: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.introductionToIndexesMigration,
    name: "Migration",
    description: "Create the users table without an index.",
    query: migration,
  },
  {
    id: SQL_EXAMPLE_IDS.introductionToIndexesSeed,
    name: "Seed",
    description: "Populate the users table with generated rows.",
    database_init: migrationInit,
    query: seed,
  },
  {
    id: SQL_EXAMPLE_IDS.introductionToIndexesIndexedMigration,
    name: "Migration with an index",
    description: "Create the users table and add an email index.",
    query: indexedMigration,
  },
  {
    id: SQL_EXAMPLE_IDS.introductionToIndexesSequentialScan,
    name: "An introduction to indexes",
    description: "Look up one email in a larger users table without a supporting index.",
    database_init: databaseInit,
    query: sequentialQuery,
  },
  {
    id: SQL_EXAMPLE_IDS.introductionToIndexesIndexScan,
    name: "Email lookup with an index",
    description: "Run the same email lookup after adding an index on users.email.",
    database_init: indexedDatabaseInit,
    query: sequentialQuery,
  },
];

export const exercises: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.introductionToIndexesExerciseFindUser2048,
    name: "Exercise 1",
    description:
      "Select the user whose email is user2048@example.com from the indexed users table.",
    database_init: indexedDatabaseInit,
    query: `
SELECT id, name, email, city
FROM users
WHERE email = 'user2048@example.com';
`,
  },
  {
    id: SQL_EXAMPLE_IDS.introductionToIndexesExerciseFindUser2048WithoutIndex,
    name: "Exercise 2",
    description:
      "Select the same user, but this time from the users table without the email index.",
    database_init: databaseInit,
    query: `
SELECT id, name, email, city
FROM users
WHERE email = 'user2048@example.com';
`,
  },
];
