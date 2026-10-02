import { SQL_EXAMPLE_IDS, type PostgresTranscript, type SqlExample } from "./types";

export const migration = `
CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  customer TEXT NOT NULL,
  total_cents INTEGER NOT NULL
);

CREATE TABLE jobs (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kind TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'done', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  run_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_until TIMESTAMPTZ,
  last_error TEXT
);

-- Workers only ever look for pending jobs that are due, oldest first.
CREATE INDEX jobs_pending_idx ON jobs (run_at, id) WHERE status = 'pending';

CREATE TABLE invoices (
  order_id INTEGER PRIMARY KEY REFERENCES orders (id),
  total_cents INTEGER NOT NULL
);
`;

export const seed = `
INSERT INTO orders (id, customer, total_cents)
VALUES
  (1, 'alice', 4200),
  (2, 'bob', 1500),
  (3, 'carol', 9900);

-- Three jobs waiting to run.
INSERT INTO jobs (kind, payload)
VALUES
  ('send_receipt', '{"order_id": 1}'),
  ('send_receipt', '{"order_id": 2}'),
  ('create_invoice', '{"order_id": 3}');

-- Two jobs whose workers died ten minutes ago, so their leases have expired.
INSERT INTO jobs (kind, payload, status, attempts, run_at, locked_until)
VALUES
  ('send_receipt', '{"order_id": 3}', 'running', 1,
   now() - interval '10 minutes', now() - interval '5 minutes'),
  ('sync_crm', '{"customer": "carol"}', 'running', 3,
   now() - interval '10 minutes', now() - interval '5 minutes');
`;

export const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.postgresJobQueueDatabaseInit,
  name: "Lesson 27 database",
  description:
    "Three orders, a jobs table used as a queue (three pending jobs and two whose workers died), and an invoices table that one kind of job writes to.",
  query: `${migration}\n${seed}`,
};

export const database_inits = [databaseInit] as const;

// ---- Claim queries ----

// "Hold the transaction" style: the row lock *is* the claim. Only attempts changes,
// and it's rolled back together with everything else if the worker dies.
const claimInTransaction = (kindFilter = "") => `UPDATE jobs
SET attempts = attempts + 1
WHERE id = (
  SELECT id
  FROM jobs
  WHERE status = 'pending'
    AND run_at <= now()${kindFilter}
  ORDER BY run_at, id
  LIMIT 1
  FOR UPDATE SKIP LOCKED
)
RETURNING id, kind, payload, attempts;`;

// "Lease" style: the claim commits right away, and the job belongs to the worker
// until locked_until. This is SQS's visibility timeout.
export const claimWithLeaseQuery = `UPDATE jobs
SET status = 'running',
    attempts = attempts + 1,
    locked_until = now() + interval '5 minutes'
WHERE id = (
  SELECT id
  FROM jobs
  WHERE status = 'pending'
    AND run_at <= now()
  ORDER BY run_at, id
  LIMIT 1
  FOR UPDATE SKIP LOCKED
)
RETURNING id, kind, payload, attempts;`;

export const reclaimExpiredLeasesQuery = `UPDATE jobs
SET status = CASE WHEN attempts >= max_attempts THEN 'failed' ELSE 'pending' END,
    locked_until = NULL,
    last_error = 'lease expired'
WHERE status = 'running'
  AND locked_until < now()
RETURNING id, kind, status, attempts;`;

export const retryWithBackoffScript = `-- Worker A's attempt at job 1 failed. Try again later, waiting
-- 2, 4, 8... seconds, or give up once attempts reaches max_attempts.
UPDATE jobs
SET status = CASE WHEN attempts >= max_attempts THEN 'failed' ELSE 'pending' END,
    run_at = now() + interval '1 second' * power(2, attempts),
    locked_until = NULL,
    last_error = 'SMTP timeout'
WHERE id = 1
  AND attempts = 1;
`;

export const transactionalEnqueueScript = `BEGIN;

INSERT INTO orders (id, customer, total_cents)
VALUES (4, 'dave', 2500);

INSERT INTO jobs (kind, payload)
VALUES ('send_receipt', '{"order_id": 4}');

COMMIT;
`;

export const listenNotifyScript = `-- Each worker, once, on its own connection:
LISTEN new_job;

-- The producer, in the same transaction as the INSERT:
BEGIN;

INSERT INTO jobs (kind, payload)
VALUES ('send_receipt', '{"order_id": 4}');

NOTIFY new_job;

COMMIT; -- listeners are woken up now, and only if it commits
`;

export const fanOutScript = `-- One event, one job per consumer. Each copy is claimed,
-- retried, and failed independently of the others.
INSERT INTO jobs (kind, payload)
SELECT kind, '{"order_id": 4}'
FROM unnest(ARRAY['send_receipt', 'create_invoice', 'sync_crm']) AS kind;
`;

export const examples: SqlExample[] = [];

export const exercises: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.postgresJobQueueExerciseClaimJob,
    name: "Exercise 1",
    description:
      "Claim the next job with a lease: using a subquery with FOR UPDATE SKIP LOCKED that picks the oldest due pending job (by run_at, then id), set its status to 'running', add 1 to attempts, and set locked_until to 5 minutes from now. Return id, kind, and attempts.",
    database_init: databaseInit,
    query: `
UPDATE jobs
SET status = 'running',
    attempts = attempts + 1,
    locked_until = now() + interval '5 minutes'
WHERE id = (
  SELECT id
  FROM jobs
  WHERE status = 'pending'
    AND run_at <= now()
  ORDER BY run_at, id
  LIMIT 1
  FOR UPDATE SKIP LOCKED
)
RETURNING id, kind, attempts;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.postgresJobQueueExerciseEnqueueOrder,
    name: "Exercise 2",
    description:
      "In a single statement, insert order 4 for dave with total_cents 2500 and enqueue a 'send_receipt' job whose payload is {\"order_id\": 4}. Use a data-modifying CTE so both rows are written or neither is, and return the job's id, kind, and payload.",
    database_init: databaseInit,
    query: `
WITH new_order AS (
  INSERT INTO orders (id, customer, total_cents)
  VALUES (4, 'dave', 2500)
  RETURNING id
)
INSERT INTO jobs (kind, payload)
SELECT 'send_receipt', jsonb_build_object('order_id', id)
FROM new_order
RETURNING id, kind, payload;
`,
  },
];

// ---- Real multi-session transcripts ----
//
// Each session (A, B, C, D) is a worker: its own real connection to one real
// Postgres server, open for the whole transcript (see runConcurrentSessionSteps in
// app/sql/run-example.ts). A crashing worker is shown as a ROLLBACK, which is what
// Postgres does to an open transaction when its connection drops.

export const SESSION_IDS = ["A", "B", "C", "D"] as const;

type SessionId = (typeof SESSION_IDS)[number];

type PostgresTranscriptStep = PostgresTranscript<SessionId>["queries"][number];

const naivePeekQuery = `SELECT id, kind, payload
FROM jobs
WHERE status = 'pending'
ORDER BY id
LIMIT 1;`;

const naiveClaimQuery = `UPDATE jobs SET status = 'running' WHERE id = 1
RETURNING id, status;`;

export const naiveTranscript = [
  {
    label: "Worker A looks for the next job",
    pgSessionId: "A",
    query: naivePeekQuery,
  },
  {
    label: "Worker B looks for the next job",
    pgSessionId: "B",
    query: naivePeekQuery,
  },
  {
    label: "Worker A claims job 1",
    pgSessionId: "A",
    query: naiveClaimQuery,
  },
  {
    label: "Worker B claims job 1 too",
    pgSessionId: "B",
    query: naiveClaimQuery,
  },
] as const satisfies readonly PostgresTranscriptStep[];

export const skipLockedTranscript = [
  {
    label: "Worker A claims a job",
    pgSessionId: "A",
    query: `BEGIN;

${claimInTransaction()}`,
  },
  {
    label: "Worker B claims a job",
    pgSessionId: "B",
    query: `BEGIN;

${claimInTransaction()}`,
  },
  {
    label: "Worker C claims a job",
    pgSessionId: "C",
    query: `BEGIN;

${claimInTransaction()}`,
  },
  {
    label: "Worker D claims a job",
    pgSessionId: "D",
    query: `BEGIN;

${claimInTransaction()}`,
  },
  {
    label: "Worker A finishes job 1",
    pgSessionId: "A",
    query: `UPDATE jobs SET status = 'done' WHERE id = 1;

COMMIT;`,
  },
  {
    label: "Worker B crashes",
    pgSessionId: "B",
    query: `ROLLBACK;`,
  },
  {
    label: "Worker D tries again",
    pgSessionId: "D",
    query: claimInTransaction(),
  },
] as const satisfies readonly PostgresTranscriptStep[];

export const leaseTranscript = [
  {
    label: "Worker A claims a job with a 5-minute lease",
    pgSessionId: "A",
    query: claimWithLeaseQuery,
  },
  {
    label: "Which running jobs have an expired lease?",
    pgSessionId: "B",
    query: `SELECT id, kind, attempts, locked_until < now() AS lease_expired
FROM jobs
WHERE status = 'running'
ORDER BY id;`,
  },
  {
    label: "Reclaim the expired leases",
    pgSessionId: "B",
    query: reclaimExpiredLeasesQuery,
  },
  {
    label: "Worker C claims a job",
    pgSessionId: "C",
    query: claimWithLeaseQuery,
  },
  {
    label: "Job 4's original worker wakes up and reports it done",
    pgSessionId: "D",
    query: `UPDATE jobs SET status = 'done', locked_until = NULL
WHERE id = 4
  AND attempts = 1
RETURNING id, status;`,
  },
  {
    label: "Worker A reports job 1 done",
    pgSessionId: "A",
    query: `UPDATE jobs SET status = 'done', locked_until = NULL
WHERE id = 1
  AND attempts = 1
RETURNING id, status;`,
  },
] as const satisfies readonly PostgresTranscriptStep[];

const createInvoiceQuery = `INSERT INTO invoices (order_id, total_cents)
SELECT id, total_cents FROM orders WHERE id = 3
RETURNING order_id, total_cents;`;

export const exactlyOnceTranscript = [
  {
    label: "Worker A claims the invoice job",
    pgSessionId: "A",
    query: `BEGIN;

${claimInTransaction("\n    AND kind = 'create_invoice'")}`,
  },
  {
    label: "Worker A writes the invoice",
    pgSessionId: "A",
    query: createInvoiceQuery,
  },
  {
    label: "Worker A crashes before committing",
    pgSessionId: "A",
    query: `ROLLBACK;`,
  },
  {
    label: "Worker B claims the invoice job",
    pgSessionId: "B",
    query: `BEGIN;

${claimInTransaction("\n    AND kind = 'create_invoice'")}`,
  },
  {
    label: "Worker B writes the invoice",
    pgSessionId: "B",
    query: createInvoiceQuery,
  },
  {
    label: "Worker B marks the job done and commits",
    pgSessionId: "B",
    query: `UPDATE jobs SET status = 'done' WHERE id = 3;

COMMIT;`,
  },
  {
    label: "How many invoices for order 3?",
    pgSessionId: "C",
    query: `SELECT invoices.order_id, invoices.total_cents, jobs.status AS job_status
FROM invoices
JOIN jobs ON jobs.id = 3
WHERE invoices.order_id = 3;`,
  },
] as const satisfies readonly PostgresTranscriptStep[];

// Picked up by scripts/build-postgres-examples.ts and precomputed against a real
// Postgres into app/generated/postgres-examples.json.
export const postgresTranscripts: readonly PostgresTranscript<SessionId>[] = [
  {
    id: SQL_EXAMPLE_IDS.postgresJobQueueNaiveTranscript,
    pgSessionIds: SESSION_IDS,
    queries: naiveTranscript,
    sqlLoad: databaseInit.query,
  },
  {
    id: SQL_EXAMPLE_IDS.postgresJobQueueSkipLockedTranscript,
    pgSessionIds: SESSION_IDS,
    queries: skipLockedTranscript,
    sqlLoad: databaseInit.query,
  },
  {
    id: SQL_EXAMPLE_IDS.postgresJobQueueLeaseTranscript,
    pgSessionIds: SESSION_IDS,
    queries: leaseTranscript,
    sqlLoad: databaseInit.query,
  },
  {
    id: SQL_EXAMPLE_IDS.postgresJobQueueExactlyOnceTranscript,
    pgSessionIds: SESSION_IDS,
    queries: exactlyOnceTranscript,
    sqlLoad: databaseInit.query,
  },
];
