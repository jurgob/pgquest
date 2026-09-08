import exampleOneQuery, {
  migration as exampleOneMigration,
  seed as exampleOneSeed,
} from "../../cli_examples/example1.sql";
import exampleOneSpecificQuery, {
  migration as exampleOneSpecificMigration,
  seed as exampleOneSpecificSeed,
} from "../../cli_examples/example1b.sql";
import exampleOneInsertQuery, {
  migration as exampleOneInsertMigration,
  seed as exampleOneInsertSeed,
} from "../../cli_examples/example1c.sql";
import exampleTwoQuery, {
  migration as exampleTwoMigration,
  seed as exampleTwoSeed,
} from "../../cli_examples/example2a.sql";
import exampleTwoIndexedQuery, {
  migration as exampleTwoIndexedMigration,
  seed as exampleTwoIndexedSeed,
} from "../../cli_examples/example2b.sql";

import type { SqlExampleDefinition } from "./types";

export const exampleOne: SqlExampleDefinition = {
  id: "example1-basic-select",
  title: "My first query",
  description: [
    "In SQL, you cannot start by writing users: the database needs a table schema first.",
    "We create the schema with a migration, add example rows with a seed, then run a query.",
  ],
  codeDescriptions: {
    migration:
      "A migration defines the table schema before the application uses the database. It is SQL usually run during deployment or setup; CREATE TABLE creates the table.",
    seed: "A seed inserts initial or example data after the schema exists. It is also SQL, but it runs after migrations so there is a table to insert into.",
    query:
      "Once the table and rows exist, this SELECT reads every user back without a filter.",
  },
  migration: exampleOneMigration,
  seed: exampleOneSeed,
  query: exampleOneQuery,
};

export const exampleOneSpecific: SqlExampleDefinition = {
  id: "example1-specific-select",
  title: "Let's select a specific user by email",
  description: [
    "Instead of reading every user, we can filter the table by a known email address.",
    "The result contains only Ada Lovelace's row.",
  ],
  codeDescriptions: {
    migration: "",
    seed: "",
    query:
      "This SELECT looks for one user whose email matches the value in the WHERE clause.",
  },
  migration: exampleOneSpecificMigration,
  seed: exampleOneSpecificSeed,
  query: exampleOneSpecificQuery,
};

export const exampleOneInsert: SqlExampleDefinition = {
  id: "example1-insert",
  title: "Here is how you can add a new user:",
  description: [
    "INSERT adds a new row to a table that already exists.",
    "RETURNING sends the inserted row back as the query result.",
  ],
  codeDescriptions: {
    migration: "",
    seed: "",
    query: "This INSERT creates a new user and returns the row PostgreSQL added.",
  },
  migration: exampleOneInsertMigration,
  seed: exampleOneInsertSeed,
  query: exampleOneInsertQuery,
};

export const exampleTwoSequential: SqlExampleDefinition = {
  id: "example2-sequential-scan",
  title: "Email lookup without an index",
  description: [
    "Look up one email in a larger users table without a supporting index.",
    "The query works, but the planner has to scan the table.",
  ],
  codeDescriptions: {
    migration: "Create a users table without an index on email.",
    seed: "Insert enough rows and analyze the table so the planner has statistics.",
    query: "Find one user by email and inspect the plan PostgreSQL chooses.",
  },
  migration: exampleTwoMigration,
  seed: exampleTwoSeed,
  query: exampleTwoQuery,
};

export const exampleTwoIndexed: SqlExampleDefinition = {
  id: "example2-index-scan",
  title: "Email lookup with an index",
  description: [
    "Run the same email lookup after adding an index on users.email.",
    "The plan should switch to users_email_idx.",
  ],
  codeDescriptions: {
    migration: "Create the same table, then add an index on the email column.",
    seed: "Use the same data, then analyze it so the index can be considered.",
    query: "Run the same email lookup and compare the plan.",
  },
  migration: exampleTwoIndexedMigration,
  seed: exampleTwoIndexedSeed,
  query: exampleTwoIndexedQuery,
};

export const sqlExamples = [
  exampleOne,
  exampleOneSpecific,
  exampleOneInsert,
  exampleTwoSequential,
  exampleTwoIndexed,
] as const;
