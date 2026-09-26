import { SQL_EXAMPLE_IDS, type PostgresTranscript, type SqlExample } from "./types";

export const migration = `
CREATE TABLE accounts (
  id SERIAL PRIMARY KEY,
  owner TEXT NOT NULL,
  balance INTEGER NOT NULL
);

CREATE TABLE transfers (
  id SERIAL PRIMARY KEY,
  account_id INTEGER NOT NULL REFERENCES accounts (id),
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
);
`;

export const seed = `
INSERT INTO accounts (owner, balance)
VALUES
  ('alice', 1000),
  ('bob', 500);

INSERT INTO transfers (account_id, amount)
VALUES
  (1, 100),
  (1, 250),
  (2, 75);
`;

export const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.postgresLocksDatabaseInit,
  name: "Lesson 21 database",
  description:
    "Two accounts and a queue of pending transfers that reference them, used to watch which locks each statement takes and who waits on whom.",
  query: `${migration}\n${seed}`,
};

export const database_inits = [databaseInit] as const;

// Lists the table-level locks held by *this* session on the lesson's two tables.
// Filtered to those two tables because every statement also locks the indexes and
// sequences it touches, and the pg_locks query itself takes a lock on pg_locks.
const ownTableLocks = `SELECT relation::regclass AS relation, mode
FROM pg_locks
WHERE locktype = 'relation'
  AND pid = pg_backend_pid()
  AND relation IN ('accounts'::regclass, 'transfers'::regclass)
ORDER BY relation::regclass::text, mode;`;

// The same view, but from a second session looking at everyone else's locks.
const otherSessionsTableLocks = `SELECT relation::regclass AS relation, mode, granted
FROM pg_locks
WHERE locktype = 'relation'
  AND pid <> pg_backend_pid()
  AND relation IN ('accounts'::regclass, 'transfers'::regclass)
ORDER BY relation::regclass::text, mode;`;

export const selectTakesAccessShareQuery = `
BEGIN;

SELECT owner, balance FROM accounts ORDER BY id;

${ownTableLocks}
`;

export const updateTakesRowExclusiveQuery = `
BEGIN;

SELECT id, amount FROM transfers WHERE status = 'pending' ORDER BY id;

UPDATE accounts SET balance = balance - 100 WHERE owner = 'alice';

${ownTableLocks}
`;

export const alterTakesAccessExclusiveQuery = `
BEGIN;

ALTER TABLE accounts ADD COLUMN note TEXT;

${ownTableLocks}
`;

export const examples: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.postgresLocksSelectTakesAccessShare,
    name: "A SELECT takes ACCESS SHARE",
    description:
      "Open a transaction, read the accounts table, then ask pg_locks which table-level locks this session is holding.",
    database_init: databaseInit,
    query: selectTakesAccessShareQuery,
  },
  {
    id: SQL_EXAMPLE_IDS.postgresLocksUpdateTakesRowExclusive,
    name: "An UPDATE takes ROW EXCLUSIVE",
    description:
      "Read transfers and update accounts in the same transaction: each table gets the lock its statement needs, and both are held until the transaction ends.",
    database_init: databaseInit,
    query: updateTakesRowExclusiveQuery,
  },
  {
    id: SQL_EXAMPLE_IDS.postgresLocksAlterTakesAccessExclusive,
    name: "ALTER TABLE takes ACCESS EXCLUSIVE",
    description:
      "Most schema changes take the strongest lock there is, the one that conflicts with everything, including plain SELECTs.",
    database_init: databaseInit,
    query: alterTakesAccessExclusiveQuery,
  },
];

export const exercises: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.postgresLocksExerciseDeleteLocks,
    name: "Exercise 1",
    description:
      "Open a transaction, delete bob's pending transfer (account_id = 2), then list relation and mode of the table-level locks your session holds on accounts and transfers, ordered by relation and mode.",
    database_init: databaseInit,
    query: `
BEGIN;

DELETE FROM transfers WHERE account_id = 2;

${ownTableLocks}
`,
  },
  {
    id: SQL_EXAMPLE_IDS.postgresLocksExerciseClaimTransfer,
    name: "Exercise 2",
    description:
      "Claim the oldest pending transfer the way a queue worker would: mark it 'processing' using a subquery that picks it with FOR UPDATE SKIP LOCKED, and return its id and status.",
    database_init: databaseInit,
    query: `
UPDATE transfers
SET status = 'processing'
WHERE id = (
  SELECT id
  FROM transfers
  WHERE status = 'pending'
  ORDER BY id
  LIMIT 1
  FOR UPDATE SKIP LOCKED
)
RETURNING id, status;
`,
  },
];

// ---- Real two-session transcripts ----
//
// Session A's steps run in order on one connection; each step's `observedBy` runs on a
// second, concurrently-open connection while Session A's transaction is still open (see
// runConcurrentSessionSteps in app/sql/run-example.ts). Session B never actually waits
// on Session A: the runner executes B's checkpoints only after A's step returns, so a
// statement that would block forever uses lock_timeout or NOWAIT instead, turning
// "would wait" into a real, immediate lock error.

export const SESSION_IDS = ["A", "B"] as const;

type SessionId = (typeof SESSION_IDS)[number];

const LOCK_TIMEOUT = `SET lock_timeout = '200ms';`;

export const tableLockTranscript = [
  {
    label: "Read accounts inside an open transaction",
    observedBy: [
      {
        label: "Which locks is anyone else holding?",
        pgSessionId: "B",
        query: otherSessionsTableLocks,
      },
      {
        label: "Update a row in the same table",
        pgSessionId: "B",
        query: `${LOCK_TIMEOUT}
UPDATE accounts SET balance = balance + 10 WHERE owner = 'bob'
RETURNING owner, balance;`,
      },
    ],
    pgSessionId: "A",
    query: `BEGIN;

SELECT owner, balance FROM accounts ORDER BY id;`,
  },
  {
    label: "Done reading",
    pgSessionId: "A",
    query: `COMMIT;`,
  },
  {
    label: "Change the table's schema inside an open transaction",
    observedBy: [
      {
        label: "Which locks is anyone else holding?",
        pgSessionId: "B",
        query: otherSessionsTableLocks,
      },
      {
        label: "Just read the table",
        pgSessionId: "B",
        query: `${LOCK_TIMEOUT}
SELECT owner, balance FROM accounts ORDER BY id;`,
      },
    ],
    pgSessionId: "A",
    query: `BEGIN;

ALTER TABLE accounts ADD COLUMN note TEXT;`,
  },
  {
    label: "Commit the schema change",
    observedBy: [
      {
        label: "Read the table again",
        pgSessionId: "B",
        query: `${LOCK_TIMEOUT}
SELECT owner, balance, note FROM accounts ORDER BY id;`,
      },
    ],
    pgSessionId: "A",
    query: `COMMIT;`,
  },
] as const satisfies readonly PostgresTranscriptStep[];

export const rowLockTranscript = [
  {
    label: "Update alice's row, not committed yet",
    observedBy: [
      {
        label: "Read both rows",
        pgSessionId: "B",
        query: `SELECT owner, balance FROM accounts ORDER BY id;`,
      },
      {
        label: "Update bob's row",
        pgSessionId: "B",
        query: `${LOCK_TIMEOUT}
UPDATE accounts SET balance = balance + 50 WHERE owner = 'bob'
RETURNING owner, balance;`,
      },
      {
        label: "Update alice's row",
        pgSessionId: "B",
        query: `${LOCK_TIMEOUT}
UPDATE accounts SET balance = balance + 50 WHERE owner = 'alice'
RETURNING owner, balance;`,
      },
    ],
    pgSessionId: "A",
    query: `BEGIN;

UPDATE accounts SET balance = balance - 100 WHERE owner = 'alice'
RETURNING owner, balance;`,
  },
  {
    label: "Commit",
    observedBy: [
      {
        label: "Update alice's row again",
        pgSessionId: "B",
        query: `${LOCK_TIMEOUT}
UPDATE accounts SET balance = balance + 50 WHERE owner = 'alice'
RETURNING owner, balance;`,
      },
    ],
    pgSessionId: "A",
    query: `COMMIT;`,
  },
] as const satisfies readonly PostgresTranscriptStep[];

const insertAliceTransfer = `${LOCK_TIMEOUT}
INSERT INTO transfers (account_id, amount) VALUES (1, 40)
RETURNING id, account_id, amount;`;

export const rowLockStrengthTranscript = [
  {
    label: "Lock alice's row FOR UPDATE",
    observedBy: [
      {
        label: "Queue a new transfer for alice",
        pgSessionId: "B",
        query: insertAliceTransfer,
      },
    ],
    pgSessionId: "A",
    query: `BEGIN;

SELECT owner, balance FROM accounts WHERE owner = 'alice' FOR UPDATE;`,
  },
  {
    label: "Give the lock back",
    pgSessionId: "A",
    query: `ROLLBACK;`,
  },
  {
    label: "Lock alice's row FOR NO KEY UPDATE instead",
    observedBy: [
      {
        label: "Queue the same transfer again",
        pgSessionId: "B",
        query: insertAliceTransfer,
      },
    ],
    pgSessionId: "A",
    query: `BEGIN;

SELECT owner, balance FROM accounts WHERE owner = 'alice' FOR NO KEY UPDATE;`,
  },
  {
    label: "Commit",
    pgSessionId: "A",
    query: `COMMIT;`,
  },
] as const satisfies readonly PostgresTranscriptStep[];

const claimQuery = (lockClause: string) => `SELECT id, account_id, amount
FROM transfers
WHERE status = 'pending'
ORDER BY id
LIMIT 1
${lockClause};`;

export const queueTranscript = [
  {
    label: "Worker A claims the oldest pending transfer",
    observedBy: [
      {
        label: "Worker B, plain FOR UPDATE",
        pgSessionId: "B",
        query: `${LOCK_TIMEOUT}
${claimQuery("FOR UPDATE")}`,
      },
      {
        label: "Worker B, FOR UPDATE NOWAIT",
        pgSessionId: "B",
        query: claimQuery("FOR UPDATE NOWAIT"),
      },
      {
        label: "Worker B, FOR UPDATE SKIP LOCKED",
        pgSessionId: "B",
        query: claimQuery("FOR UPDATE SKIP LOCKED"),
      },
    ],
    pgSessionId: "A",
    query: `BEGIN;

${claimQuery("FOR UPDATE SKIP LOCKED")}`,
  },
  {
    label: "Finish the job and commit",
    pgSessionId: "A",
    query: `UPDATE transfers SET status = 'done' WHERE id = 1;

COMMIT;`,
  },
] as const satisfies readonly PostgresTranscriptStep[];

type PostgresTranscriptStep = PostgresTranscript<SessionId>["queries"][number];

export const deadlockScript = `-- SESSION A                                 -- SESSION B
BEGIN;                                        BEGIN;

UPDATE accounts SET balance = balance - 10
WHERE owner = 'alice';
-- A holds alice's row
                                              UPDATE accounts SET balance = balance - 10
                                              WHERE owner = 'bob';
                                              -- B holds bob's row

UPDATE accounts SET balance = balance + 10
WHERE owner = 'bob';
-- A waits for B...
                                              UPDATE accounts SET balance = balance + 10
                                              WHERE owner = 'alice';
                                              -- ...and B waits for A.
                                              -- After deadlock_timeout (1s by default)
                                              -- Postgres cancels one of them:
                                              -- ERROR: deadlock detected
`;

export const deadlockFixScript = `-- Both transfers lock their rows in the same order (lowest id first),
-- so the second one simply waits for the first instead of deadlocking.
BEGIN;

SELECT id FROM accounts
WHERE owner IN ('alice', 'bob')
ORDER BY id
FOR NO KEY UPDATE;

UPDATE accounts SET balance = balance - 10 WHERE owner = 'bob';
UPDATE accounts SET balance = balance + 10 WHERE owner = 'alice';

COMMIT;
`;

export const migrationWithLockTimeoutScript = `BEGIN;

-- Give up quickly instead of queueing behind a long-running query.
-- While this ALTER waits for its ACCESS EXCLUSIVE lock, every new query
-- on accounts queues behind it, so waiting a long time is the dangerous part.
SET LOCAL lock_timeout = '2s';

ALTER TABLE accounts ADD COLUMN note TEXT;

COMMIT;
`;

// Picked up by scripts/build-postgres-examples.ts and precomputed against a real
// Postgres into app/generated/postgres-examples.json.
export const postgresTranscripts: readonly PostgresTranscript<SessionId>[] = [
  {
    id: SQL_EXAMPLE_IDS.postgresLocksTableLockTranscript,
    pgSessionIds: SESSION_IDS,
    queries: tableLockTranscript,
    sqlLoad: databaseInit.query,
  },
  {
    id: SQL_EXAMPLE_IDS.postgresLocksRowLockTranscript,
    pgSessionIds: SESSION_IDS,
    queries: rowLockTranscript,
    sqlLoad: databaseInit.query,
  },
  {
    id: SQL_EXAMPLE_IDS.postgresLocksRowLockStrengthTranscript,
    pgSessionIds: SESSION_IDS,
    queries: rowLockStrengthTranscript,
    sqlLoad: databaseInit.query,
  },
  {
    id: SQL_EXAMPLE_IDS.postgresLocksQueueTranscript,
    pgSessionIds: SESSION_IDS,
    queries: queueTranscript,
    sqlLoad: databaseInit.query,
  },
];
