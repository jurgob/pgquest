import {
  SQL_EXAMPLE_IDS,
  sqlExampleDescription,
  sqlExampleTitle,
  sqlStatement,
  type SqlExample,
} from "./types";

const migration = sqlStatement(`
CREATE TABLE accounts (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  profile JSONB NOT NULL
);
`);

const seed = sqlStatement(`
INSERT INTO accounts (email, profile)
VALUES
  ('ada@example.com', '{"plan": "pro", "settings": {"email": true}, "tags": ["sql", "math"]}'),
  ('grace@example.com', '{"plan": "free", "settings": {"email": false}, "tags": ["compiler"]}'),
  ('linus@example.com', '{"plan": "pro", "settings": {"email": false}, "tags": ["kernel", "c"]}');
`);

export const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.jsonInPostgresqlDatabaseInit,
  name: sqlExampleTitle("Lesson 12 database"),
  description: sqlExampleDescription("Creates accounts with jsonb profiles."),
  query: sqlStatement(`${migration}\n${seed}`),
};

export const database_inits = [databaseInit] as const;

export const examples: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.jsonInPostgresqlExtractJson,
    name: sqlExampleTitle("Extract fields"),
    description: sqlExampleDescription("The ->> operator extracts a JSON value as text."),
    database_init: databaseInit,
    query: sqlStatement(`
SELECT email, profile ->> 'plan' AS plan
FROM accounts
ORDER BY email;
`),
  },
  {
    id: SQL_EXAMPLE_IDS.jsonInPostgresqlFilterJson,
    name: sqlExampleTitle("Filter nested JSON"),
    description: sqlExampleDescription(
      "JSON operators can reach nested values inside a jsonb column.",
    ),
    database_init: databaseInit,
    query: sqlStatement(`
SELECT email
FROM accounts
WHERE profile -> 'settings' ->> 'email' = 'true';
`),
  },
  {
    id: SQL_EXAMPLE_IDS.jsonInPostgresqlContainJson,
    name: sqlExampleTitle("Containment"),
    description: sqlExampleDescription(
      "The @> operator asks whether jsonb contains another jsonb document.",
    ),
    database_init: databaseInit,
    query: sqlStatement(`
SELECT email
FROM accounts
WHERE profile @> '{"plan": "pro"}';
`),
  },
];

export const exercises: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.jsonInPostgresqlExerciseFindProPlan,
    name: sqlExampleTitle("Exercise 1"),
    description: sqlExampleDescription("Select emails for accounts on the pro plan."),
    database_init: databaseInit,
    query: sqlStatement(`
SELECT email
FROM accounts
WHERE profile ->> 'plan' = 'pro'
ORDER BY email;
`),
  },
  {
    id: SQL_EXAMPLE_IDS.jsonInPostgresqlExerciseFindEmailOptIn,
    name: sqlExampleTitle("Exercise 2"),
    description: sqlExampleDescription(
      "Select emails for accounts whose JSON settings.email value is true.",
    ),
    database_init: databaseInit,
    query: sqlStatement(`
SELECT email
FROM accounts
WHERE profile -> 'settings' ->> 'email' = 'true';
`),
  },
];
