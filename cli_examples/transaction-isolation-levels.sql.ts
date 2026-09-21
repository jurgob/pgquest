import { SQL_EXAMPLE_IDS, type SqlExample } from "./types";

const migration = `
CREATE TABLE engineer (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  on_call BOOLEAN NOT NULL
);
`;

const seed = `
INSERT INTO engineer (name, on_call)
VALUES ('Alice', true), ('Bob', true);
`;

export const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.transactionIsolationLevelsDatabaseInit,
  name: "Lesson 19 database",
  description: "Two on-call engineers, Alice and Bob, both currently on call.",
  query: `${migration}\n${seed}`,
};

export const database_inits = [databaseInit] as const;

// Alice checks whether someone else is covering, then takes herself off
// call. Safe to run for real: nothing concurrent is happening here.
export const aliceAloneQuery = `
BEGIN;

-- Step 1: Check
SELECT count(*) AS other_on_call
FROM engineer
WHERE on_call = true AND name <> 'Alice';

-- Step 2: Update — nothing re-checks that count before writing. This just
-- trusts the Step 1 result and never looks at anyone else's row again.
UPDATE engineer SET on_call = false WHERE name = 'Alice';

COMMIT;

SELECT name, on_call FROM engineer ORDER BY name;
`;

export const examples: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.transactionIsolationLevelsAliceAlone,
    name: "Check, then act",
    description:
      "Alice checks that someone else is on call, then takes herself off. Run alone, this is completely safe.",
    database_init: databaseInit,
    query: aliceAloneQuery,
  },
];

export const exercises: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.transactionIsolationLevelsExerciseOnCallNames,
    name: "Exercise 1",
    description: "Return the names of the engineers currently on call, alphabetically.",
    database_init: databaseInit,
    query: `SELECT name FROM engineer WHERE on_call = true ORDER BY name;`,
  },
  {
    id: SQL_EXAMPLE_IDS.transactionIsolationLevelsExerciseSerializableShow,
    name: "Exercise 2",
    description:
      "Start a transaction at the SERIALIZABLE isolation level and confirm it with SHOW.",
    database_init: databaseInit,
    query: `
BEGIN ISOLATION LEVEL SERIALIZABLE;
SHOW transaction_isolation;
`,
  },
];

// ---- Narrated two-session scripts (display-only, not executed) ----
//
// PGlite — the Postgres build this playground runs in the browser — is a
// single-connection engine, so it can't actually run two overlapping
// transactions the way two real `psql` sessions could. These scripts show
// what a second, concurrent session would do, exactly the way the
// PostgreSQL docs themselves present two-session examples: as text to
// read, not code to run.

function sessionScript(isolationLevel: string, isFrozenSnapshot: boolean) {
  const selectComment = isFrozenSnapshot
    ? "-- Step 1: Check — takes the transaction's ONE snapshot, frozen from this\n-- moment on; every later statement in this transaction reuses it."
    : "-- Step 1: Check — gets its own fresh snapshot, taken right now (READ\n-- COMMITTED's per-statement guarantee).";
  const updateComment = isFrozenSnapshot
    ? "-- Step 2: Update — reuses the frozen snapshot from Step 1, but that\n-- makes no difference here: it only writes Alice's row and never reads\n-- on_call for anyone else."
    : "-- Step 2: Update — gets its own fresh snapshot too, same as Step 1 — but\n-- it only writes Alice's row and never reads on_call for anyone else, so\n-- Bob's already-committed change is invisible to it anyway.";

  return `-- SESSION A (Alice)
BEGIN ISOLATION LEVEL ${isolationLevel};

${selectComment}
SELECT count(*) AS other_on_call
FROM engineer
WHERE on_call = true AND name <> 'Alice';
-- => 1  (Bob is on call, looks safe to go off call)

-- Meanwhile, SESSION B (Bob) runs the identical two steps for himself and
-- commits FIRST:
--
--   SESSION B (Bob):
--   BEGIN ISOLATION LEVEL ${isolationLevel};
--   -- Step 1: Check
--   SELECT count(*) AS other_on_call
--   FROM engineer
--   WHERE on_call = true AND name <> 'Bob';
--   -- => 1  (Alice is on call, looks safe to go off call)
--   -- Step 2: Update
--   UPDATE engineer SET on_call = false WHERE name = 'Bob';
--   COMMIT;

${updateComment}
UPDATE engineer SET on_call = false WHERE name = 'Alice';
COMMIT;

-- Both commits succeed. Final state:
SELECT name, on_call FROM engineer ORDER BY name;
-- Alice    | false
-- Bob      | false
--
-- Nobody is on call. The bug isn't about visibility — Step 2 never looked
-- at Bob's row, fresh snapshot or frozen. It's about acting on a decision
-- (Step 1's result) that nothing re-verified before commit.
`;
}

export const readUncommittedScript = sessionScript("READ UNCOMMITTED", false);
export const readCommittedScript = sessionScript("READ COMMITTED", false);
export const repeatableReadScript = sessionScript("REPEATABLE READ", true);

export const serializableScript = `-- SESSION A (Alice)
BEGIN ISOLATION LEVEL SERIALIZABLE;

-- Step 1: Check — same frozen snapshot as REPEATABLE READ, but Postgres
-- also starts tracking which rows this transaction's reads depended on.
SELECT count(*) AS other_on_call
FROM engineer
WHERE on_call = true AND name <> 'Alice';
-- => 1  (Bob is on call, looks safe to go off call)

-- Meanwhile, SESSION B (Bob) runs the identical two steps for himself and
-- commits FIRST:
--
--   SESSION B (Bob):
--   BEGIN ISOLATION LEVEL SERIALIZABLE;
--   -- Step 1: Check
--   SELECT count(*) AS other_on_call
--   FROM engineer
--   WHERE on_call = true AND name <> 'Bob';
--   -- => 1  (Alice is on call, looks safe to go off call)
--   -- Step 2: Update
--   UPDATE engineer SET on_call = false WHERE name = 'Bob';
--   COMMIT;  -- succeeds, Bob is now off call

-- Step 2: Update — still never reads Bob's row directly. SERIALIZABLE
-- isn't relying on that: it tracks that Step 1 depended on rows Bob just
-- wrote to, and checks that dependency at commit time.
UPDATE engineer SET on_call = false WHERE name = 'Alice';
COMMIT;
-- ERROR:  could not serialize access due to read/write dependencies
--         among transactions
-- SQLSTATE: 40001
--
-- Postgres refused this commit — not because Step 2 read something
-- stale, but because it detected the read/write conflict between the two
-- transactions as a whole. The app is expected to catch 40001 and retry —
-- on retry, Alice's Step 1 would see Bob is already off call and correctly
-- refuse to go off call herself.
`;
