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

// ---- Real multi-session transcripts ----
//
// Each session (A, B, C, D) is its own real connection to one real Postgres server,
// open for the whole transcript (see runConcurrentSessionSteps in
// app/sql/run-example.ts). Steps run in order; a `blocks: true` step genuinely waits
// for a lock, and its result is recorded once a later step releases it. Every
// connection's application_name is "Session <id>", so queries on pg_locks and
// pg_stat_activity can say which session holds or waits for what.

export const SESSION_IDS = ["A", "B", "C", "D"] as const;

type SessionId = (typeof SESSION_IDS)[number];

type PostgresTranscriptStep = PostgresTranscript<SessionId>["queries"][number];

// Who holds or waits for a table lock on accounts, by session.
const accountsTableLocks = `SELECT activity.application_name AS session, lock.mode, lock.granted
FROM pg_locks AS lock
JOIN pg_stat_activity AS activity USING (pid)
WHERE lock.locktype = 'relation'
  AND lock.relation = 'accounts'::regclass
  AND activity.pid <> pg_backend_pid()
ORDER BY session, lock.mode;`;

// The standard "who is blocking whom" query.
export const blockingQuery = `SELECT
  waiting.application_name AS waiting_session,
  blocker.application_name AS blocked_by,
  waiting.query AS waiting_query
FROM pg_stat_activity AS waiting
JOIN pg_stat_activity AS blocker
  ON blocker.pid = ANY (pg_blocking_pids(waiting.pid))
ORDER BY waiting_session, blocked_by;`;

export const tableLockTranscript = [
  {
    label: "Open a transaction and read accounts",
    pgSessionId: "A",
    query: `BEGIN;

SELECT owner, balance FROM accounts ORDER BY id;`,
  },
  {
    label: "Update a row in the same table",
    pgSessionId: "B",
    query: `UPDATE accounts SET balance = balance + 10 WHERE owner = 'bob'
RETURNING owner, balance;`,
  },
  {
    blocks: true,
    label: "Run a migration on the same table",
    pgSessionId: "B",
    query: `ALTER TABLE accounts ADD COLUMN note TEXT;`,
  },
  {
    blocks: true,
    label: "Just read the table",
    pgSessionId: "C",
    query: `SELECT owner, balance FROM accounts ORDER BY id;`,
  },
  {
    label: "Look at the table locks",
    pgSessionId: "D",
    query: accountsTableLocks,
  },
  {
    label: "Who is blocking whom?",
    pgSessionId: "D",
    query: blockingQuery,
  },
  {
    label: "Commit",
    pgSessionId: "A",
    query: `COMMIT;`,
  },
] as const satisfies readonly PostgresTranscriptStep[];

export const rowLockTranscript = [
  {
    label: "Update alice's row, not committed yet",
    pgSessionId: "A",
    query: `BEGIN;

UPDATE accounts SET balance = balance - 100 WHERE owner = 'alice'
RETURNING owner, balance;`,
  },
  {
    label: "Read both rows",
    pgSessionId: "B",
    query: `SELECT owner, balance FROM accounts ORDER BY id;`,
  },
  {
    label: "Update bob's row",
    pgSessionId: "B",
    query: `UPDATE accounts SET balance = balance + 50 WHERE owner = 'bob'
RETURNING owner, balance;`,
  },
  {
    blocks: true,
    label: "Update alice's row",
    pgSessionId: "B",
    query: `UPDATE accounts SET balance = balance + 50 WHERE owner = 'alice'
RETURNING owner, balance;`,
  },
  {
    label: "What is Session B waiting for?",
    pgSessionId: "C",
    query: `SELECT activity.application_name AS session, lock.locktype, lock.mode, lock.granted
FROM pg_locks AS lock
JOIN pg_stat_activity AS activity USING (pid)
WHERE lock.locktype IN ('transactionid', 'tuple')
  AND activity.pid <> pg_backend_pid()
ORDER BY session, lock.locktype, lock.granted DESC, lock.mode;`,
  },
  {
    label: "Commit",
    pgSessionId: "A",
    query: `COMMIT;`,
  },
] as const satisfies readonly PostgresTranscriptStep[];

const insertAliceTransfer = `INSERT INTO transfers (account_id, amount) VALUES (1, 40)
RETURNING id, account_id, amount;`;

export const rowLockStrengthTranscript = [
  {
    label: "Lock alice's row FOR UPDATE",
    pgSessionId: "A",
    query: `BEGIN;

SELECT owner, balance FROM accounts WHERE owner = 'alice' FOR UPDATE;`,
  },
  {
    blocks: true,
    label: "Queue a new transfer for alice",
    pgSessionId: "B",
    query: insertAliceTransfer,
  },
  {
    label: "Commit",
    pgSessionId: "A",
    query: `COMMIT;`,
  },
  {
    label: "Lock alice's row FOR NO KEY UPDATE instead",
    pgSessionId: "A",
    query: `BEGIN;

SELECT owner, balance FROM accounts WHERE owner = 'alice' FOR NO KEY UPDATE;`,
  },
  {
    label: "Queue another transfer for alice",
    pgSessionId: "B",
    query: insertAliceTransfer,
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
    pgSessionId: "A",
    query: `BEGIN;

${claimQuery("FOR UPDATE SKIP LOCKED")}`,
  },
  {
    label: "Worker B, FOR UPDATE SKIP LOCKED",
    pgSessionId: "B",
    query: claimQuery("FOR UPDATE SKIP LOCKED"),
  },
  {
    blocks: true,
    label: "Worker C, plain FOR UPDATE",
    pgSessionId: "C",
    query: claimQuery("FOR UPDATE"),
  },
  {
    label: "Worker D, FOR UPDATE NOWAIT",
    pgSessionId: "D",
    query: claimQuery("FOR UPDATE NOWAIT"),
  },
  {
    label: "Worker A finishes the job and commits",
    pgSessionId: "A",
    query: `UPDATE transfers SET status = 'done' WHERE id = 1;

COMMIT;`,
  },
] as const satisfies readonly PostgresTranscriptStep[];

export const deadlockTranscript = [
  {
    label: "Transfer alice → bob: take 10 from alice",
    pgSessionId: "A",
    query: `BEGIN;

UPDATE accounts SET balance = balance - 10 WHERE owner = 'alice';`,
  },
  {
    label: "Transfer bob → alice: take 10 from bob",
    pgSessionId: "B",
    query: `BEGIN;

UPDATE accounts SET balance = balance - 10 WHERE owner = 'bob';`,
  },
  {
    blocks: true,
    label: "Give 10 to bob",
    pgSessionId: "A",
    query: `UPDATE accounts SET balance = balance + 10 WHERE owner = 'bob';`,
  },
  {
    blocks: true,
    label: "Give 10 to alice",
    pgSessionId: "B",
    query: `UPDATE accounts SET balance = balance + 10 WHERE owner = 'alice';`,
  },
  {
    label: "Session A's transaction is aborted",
    pgSessionId: "A",
    query: `ROLLBACK;`,
  },
  {
    label: "Session B's transfer goes through",
    pgSessionId: "B",
    query: `COMMIT;

SELECT owner, balance FROM accounts ORDER BY id;`,
  },
] as const satisfies readonly PostgresTranscriptStep[];

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
  {
    id: SQL_EXAMPLE_IDS.postgresLocksDeadlockTranscript,
    pgSessionIds: SESSION_IDS,
    queries: deadlockTranscript,
    sqlLoad: databaseInit.query,
  },
];
