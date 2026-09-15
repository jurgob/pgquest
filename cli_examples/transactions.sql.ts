import { SQL_EXAMPLE_IDS, type SqlExample } from "./types";

const migration = `
CREATE TABLE accounts (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  balance_cents INTEGER NOT NULL
);
`;

const seed = `
INSERT INTO accounts (name, balance_cents)
VALUES ('Ada', 5000), ('Grace', 3000);
`;

export const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.transactionsDatabaseInit,
  name: "Lesson 13 database",
  description: "Creates accounts for transaction examples.",
  query: `${migration}\n${seed}`,
};

export const database_inits = [databaseInit] as const;

export const examples: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.transactionsCommitTransfer,
    name: "Commit a transfer",
    description: "COMMIT makes every statement in the transaction durable together.",
    database_init: databaseInit,
    query: `
BEGIN;
UPDATE accounts SET balance_cents = balance_cents - 1000 WHERE name = 'Ada';
UPDATE accounts SET balance_cents = balance_cents + 1000 WHERE name = 'Grace';
COMMIT;
SELECT name, balance_cents FROM accounts ORDER BY name;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.transactionsRollbackTransfer,
    name: "Rollback a transfer",
    description: "ROLLBACK throws away the changes made inside the transaction.",
    database_init: databaseInit,
    query: `
BEGIN;
UPDATE accounts SET balance_cents = balance_cents - 1000 WHERE name = 'Ada';
UPDATE accounts SET balance_cents = balance_cents + 1000 WHERE name = 'Grace';
ROLLBACK;
SELECT name, balance_cents FROM accounts ORDER BY name;
`,
  },
];

export const exercises: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.transactionsExerciseCommitBonus,
    name: "Exercise 1",
    description:
      "In a transaction, add 500 cents to both accounts, commit, then select balances.",
    database_init: databaseInit,
    query: `
BEGIN;
UPDATE accounts SET balance_cents = balance_cents + 500;
COMMIT;
SELECT name, balance_cents FROM accounts ORDER BY name;
`,
  },
];
