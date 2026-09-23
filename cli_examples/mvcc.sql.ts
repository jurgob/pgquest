import { SQL_EXAMPLE_IDS, type PostgresTranscript, type SqlExample } from "./types";

export const migration = `
CREATE TABLE accounts (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  balance INTEGER NOT NULL
);
`;

export const seed = `
INSERT INTO accounts (name, balance)
VALUES
  ('checking', 1000),
  ('savings', 5000);
`;

export const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.mvccDatabaseInit,
  name: "Lesson 6 database",
  description: "Two accounts, checking and savings, used to watch row versions change.",
  query: `${migration}\n${seed}`,
};

export const database_inits = [databaseInit] as const;

export const plainSelectQuery = `
SELECT id, name, balance
FROM accounts
ORDER BY id;
`;

export const hiddenColumnsQuery = `
SELECT xmin, xmax, ctid, id, name, balance
FROM accounts
ORDER BY id;
`;

export const twoInsertsOneTransactionQuery = `
BEGIN;

INSERT INTO accounts (name, balance) VALUES ('payroll', 2000);
INSERT INTO accounts (name, balance) VALUES ('reserve', 3000);

COMMIT;

SELECT xmin, xmax, name, balance
FROM accounts
WHERE name IN ('payroll', 'reserve')
ORDER BY name;
`;

export const updateChangesXminQuery = `
UPDATE accounts
SET balance = balance - 100
WHERE name = 'checking'
RETURNING xmin, xmax, name, balance;
`;

export const examples: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.mvccPlainSelect,
    name: "A normal SELECT",
    description: "Nothing unusual here — just id, name, and balance.",
    database_init: databaseInit,
    query: plainSelectQuery,
  },
  {
    id: SQL_EXAMPLE_IDS.mvccHiddenColumns,
    name: "Select the hidden columns",
    description:
      "Every row secretly carries xmin (the id of the transaction that created it) and xmax (the id of the transaction that ended it, 0 while the row is still live). ctid is its physical location on disk.",
    database_init: databaseInit,
    query: hiddenColumnsQuery,
  },
  {
    id: SQL_EXAMPLE_IDS.mvccTwoInsertsOneTransaction,
    name: "Two inserts, one transaction",
    description:
      "Two separate INSERT statements, but one transaction — both new rows get stamped with the same xmin, because xmin is the id of the transaction, not the statement.",
    database_init: databaseInit,
    query: twoInsertsOneTransactionQuery,
  },
  {
    id: SQL_EXAMPLE_IDS.mvccUpdateChangesXmin,
    name: "xmin changes on UPDATE",
    description:
      "UPDATE never overwrites a row in place. It writes a brand new row version stamped with the current transaction's id as xmin — compare it to checking's xmin in the query above.",
    database_init: databaseInit,
    query: updateChangesXminQuery,
  },
];

export const exercises: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.mvccExerciseSelectXmin,
    name: "Exercise 1",
    description:
      "Return id, name, balance, and xmin for every account, ordered by id, so you can see each row's creating transaction.",
    database_init: databaseInit,
    ignoreColumns: ["xmin"],
    query: `
SELECT id, name, balance, xmin
FROM accounts
ORDER BY id;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.mvccExerciseDepositReturning,
    name: "Exercise 2",
    description:
      "Deposit 250 into the savings account (balance = balance + 250) and return the updated row, including xmin and xmax.",
    database_init: databaseInit,
    ignoreColumns: ["xmin", "xmax"],
    query: `
UPDATE accounts
SET balance = balance + 250
WHERE name = 'savings'
RETURNING xmin, xmax, name, balance;
`,
  },
];

// ---- The live "Session A" transcript, with real Session B checkpoints ----
//
// Session A's steps run in order against one persistent connection — a real BEGIN, a
// real uncommitted UPDATE, a real COMMIT — so the xmin/xmax values shown are genuine
// PostgreSQL output, not hand-typed numbers. Session B's checkpoints (`observedBy`)
// are ALSO real: scripts/build-postgres-examples.ts's runConcurrentSessionSteps opens
// a genuinely separate, concurrently-open connection to the same real Postgres
// database (see scripts/dev-pg.sh) and runs them there while Session A's transaction
// is still open — a real second session, not narration. This only works at build time
// (see PostgresExampleStep.observedBy in cli_examples/types.ts for why) — precomputed
// by scripts/build-postgres-examples.ts (see `postgresTranscripts` below) rather than
// attempted live in the browser.

export const SESSION_IDS = ["A", "B"] as const;

export const sessionATranscript = [
  {
    label: "Before either session does anything — the committed baseline",
    observedBy: [
      {
        label: "Same baseline, from Session B",
        pgSessionId: "B",
        query: `SELECT xmin, xmax, name, balance FROM accounts WHERE name = 'checking';`,
      },
    ],
    pgSessionId: "A",
    query: `SELECT xmin, xmax, name, balance FROM accounts WHERE name = 'checking';`,
  },
  {
    label: "Open a transaction, update the row — not committed yet",
    observedBy: [
      {
        label: "Meanwhile — checks the same row",
        pgSessionId: "B",
        query: `SELECT xmin, xmax, name, balance FROM accounts WHERE name = 'checking';`,
      },
    ],
    pgSessionId: "A",
    query: `
BEGIN;

UPDATE accounts
SET balance = balance - 100
WHERE name = 'checking'
RETURNING xmin, xmax, name, balance;

-- No COMMIT here — the transaction stays open (uncommitted) so Session B can see it
-- mid-flight in the next step.
`,
  },
  {
    label: "Still inside the same open transaction",
    pgSessionId: "A",
    query: `SELECT xmin, xmax, name, balance FROM accounts WHERE name = 'checking';`,
  },
  {
    label: "Commit",
    pgSessionId: "A",
    query: `COMMIT;`,
  },
  {
    label: "A fresh read, now that it's committed",
    observedBy: [
      {
        label: "Checks again, after the commit",
        pgSessionId: "B",
        query: `SELECT xmin, xmax, name, balance FROM accounts WHERE name = 'checking';`,
      },
    ],
    pgSessionId: "A",
    query: `SELECT xmin, xmax, name, balance FROM accounts WHERE name = 'checking';`,
  },
] as const;

// Picked up by scripts/build-postgres-examples.ts, which iterates every lesson's
// cli_examples module looking for this export — add more entries here (or to other
// lessons' *.sql.ts modules) to precompute additional session transcripts.
export const postgresTranscripts: readonly PostgresTranscript<
  (typeof SESSION_IDS)[number]
>[] = [
  {
    id: SQL_EXAMPLE_IDS.mvccSessionATranscript,
    pgSessionIds: SESSION_IDS,
    queries: sessionATranscript,
    sqlLoad: databaseInit.query,
  },
];
