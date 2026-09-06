import exampleOneQuery, {
  migration as exampleOneMigration,
  seed as exampleOneSeed,
} from "../../cli_examples/example1.sql";
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
    "Create a small user table, seed two rows, and read them back.",
    "The plan is a sequential scan because the query reads the full table.",
  ],
  codeDescriptions: {
    migration:
      "Before you can store rows, you define the table schema in a migration. A migration is SQL run before the app uses the database; CREATE TABLE adds the table.",
    seed: "Seed data inserts a couple of rows so the query has something to read.",
    query: "This SELECT reads every row from the User table.",
  },
  migration: exampleOneMigration,
  seed: exampleOneSeed,
  query: exampleOneQuery,
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
