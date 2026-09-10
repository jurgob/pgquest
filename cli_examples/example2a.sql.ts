import {
  SQL_EXAMPLE_IDS,
  sqlExampleDescription,
  sqlExampleTitle,
  sqlStatement,
  type SqlExample,
} from "./types";

const migration = sqlStatement(`
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  city TEXT NOT NULL
);
`);

const seed = sqlStatement(`
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
`);

const sequentialQuery = sqlStatement(`
SELECT id, name, email, city
FROM users
WHERE email = 'user9000@example.com';
`);

const indexedMigration = sqlStatement(`
${migration}

-- Add an index so PostgreSQL can find rows by email without scanning the whole table.
CREATE INDEX users_email_idx ON users (email);
`);

const migrationInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.example2MigrationInit,
  name: sqlExampleTitle("Example 2 schema"),
  description: sqlExampleDescription("Creates the users table without an index."),
  query: migration,
};

const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.example2DatabaseInit,
  name: sqlExampleTitle("Example 2 database"),
  description: sqlExampleDescription(
    "Creates and seeds the users table without an index.",
  ),
  query: sqlStatement(`${migration}\n${seed}`),
};

const indexedDatabaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.example2IndexedDatabaseInit,
  name: sqlExampleTitle("Example 2 indexed database"),
  description: sqlExampleDescription("Creates, indexes, and seeds the users table."),
  query: sqlStatement(`${indexedMigration}\n${seed}`),
};

export const database_inits = [migrationInit, databaseInit, indexedDatabaseInit] as const;

export const examples: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.example2Migration,
    name: sqlExampleTitle("Migration"),
    description: sqlExampleDescription("Create the users table without an index."),
    query: migration,
  },
  {
    id: SQL_EXAMPLE_IDS.example2Seed,
    name: sqlExampleTitle("Seed"),
    description: sqlExampleDescription("Populate the users table with generated rows."),
    database_init: migrationInit,
    query: seed,
  },
  {
    id: SQL_EXAMPLE_IDS.example2IndexedMigration,
    name: sqlExampleTitle("Migration with an index"),
    description: sqlExampleDescription("Create the users table and add an email index."),
    query: indexedMigration,
  },
  {
    id: SQL_EXAMPLE_IDS.example2SequentialScan,
    name: sqlExampleTitle("Email lookup without an index"),
    description: sqlExampleDescription(
      "Look up one email in a larger users table without a supporting index.",
    ),
    database_init: databaseInit,
    query: sequentialQuery,
  },
  {
    id: SQL_EXAMPLE_IDS.example2IndexScan,
    name: sqlExampleTitle("Email lookup with an index"),
    description: sqlExampleDescription(
      "Run the same email lookup after adding an index on users.email.",
    ),
    database_init: indexedDatabaseInit,
    query: sequentialQuery,
  },
];

export const exercises: SqlExample[] = [];
