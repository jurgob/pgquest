import { ResultAsync } from "neverthrow";
import type { PGliteInterface } from "@electric-sql/pglite";
import type { Client as PgClient } from "pg";
import type { PostgresExampleStep, SqlExample } from "../../cli_examples/types";

import type { ExecutionOutput, ExplainRow, QueryRow, SqlExecutionInput } from "./types";

let timingId = 0;

function isTimingEnabled() {
  return import.meta.env?.DEV && import.meta.env.MODE !== "test";
}

export function runSqlExample(example: SqlExample) {
  return runSqlQuery(
    { query: example.query, sqlLoad: example.database_init?.query ?? "" },
    example.query,
  );
}

export function runSqlQuery(
  input: SqlExecutionInput,
  query: string,
  signal?: AbortSignal,
) {
  return ResultAsync.fromPromise(executeSqlQuery(input, query, signal), (error) =>
    error instanceof Error ? error.message : String(error),
  );
}

export function runSqlQueryOnDatabase(
  db: PGliteInterface,
  query: string,
  runExplain = false,
) {
  return ResultAsync.fromPromise(
    executeSqlQueryOnDatabase(db, query, undefined, runExplain),
    (error) => (error instanceof Error ? error.message : String(error)),
  );
}

export async function createSqlDatabase(sqlLoad: string, signal?: AbortSignal) {
  const timer = `pglite-init-${++timingId}`;
  if (isTimingEnabled()) {
    console.time(timer);
  }

  const db =
    import.meta.env.SSR || import.meta.env.MODE === "test"
      ? new (await import("@electric-sql/pglite")).PGlite()
      : await (async () => {
          const { PGliteWorker } = await import("@electric-sql/pglite/worker");
          const databaseId = crypto.randomUUID();
          return PGliteWorker.create(
            new Worker(new URL("./pglite-worker.ts", import.meta.url), {
              type: "module",
            }),
            {
              dataDir: `memory://pgquest-${databaseId}`,
              id: `pgquest-${databaseId}`,
            },
          );
        })();

  try {
    await db.exec(sqlLoad);
    throwIfAborted(signal);
    return db;
  } catch (error) {
    await db.close();
    throw error;
  } finally {
    if (isTimingEnabled()) {
      console.timeEnd(timer);
    }
  }
}

async function executeSqlQuery(
  input: SqlExecutionInput,
  query: string,
  signal?: AbortSignal,
): Promise<ExecutionOutput> {
  const timer = `lesson-query-${++timingId}`;
  if (isTimingEnabled()) {
    console.time(timer);
  }

  const db = await createSqlDatabase(input.sqlLoad, signal);

  try {
    return await executeSqlQueryOnDatabase(db, query, signal, input.runExplain ?? false);
  } finally {
    await db.close();
    if (isTimingEnabled()) {
      console.timeEnd(timer);
    }
  }
}

async function executeSqlQueryOnDatabase(
  db: PGliteInterface,
  query: string,
  signal?: AbortSignal,
  runExplain = false,
): Promise<ExecutionOutput> {
  throwIfAborted(signal);
  const statements = splitSqlStatements(query);
  const isMultiStatement = statements.length > 1;
  const statementsToExec = isMultiStatement ? statements.slice(0, -1) : [];
  const finalStatement = isMultiStatement
    ? (statements[statements.length - 1] ?? query)
    : query;

  for (const statement of statementsToExec) {
    await db.exec(statement);
    throwIfAborted(signal);
  }

  const result = await db.query<QueryRow>(finalStatement);
  throwIfAborted(signal);
  const plan = await computePlan(db, query, isMultiStatement, runExplain);
  throwIfAborted(signal);

  return {
    rows: result.rows,
    plan,
  };
}

export type PostgresExampleStepOutcome =
  { status: "done"; output: ExecutionOutput } | { status: "error"; message: string };

// `unblockedAfter` is only set on a `blocks: true` step: the position (in transcript
// order — each step, then its observedBy checkpoints) of the statement after which
// it finished waiting, e.g. the other session's COMMIT that released its lock.
export type PostgresExampleStepResult<SessionId extends string> =
  PostgresExampleStep<SessionId> &
    PostgresExampleStepOutcome & { unblockedAfter?: number };

// Plain `Omit` on a discriminated union collapses it to its common keys, dropping
// `output`/`message` entirely (they're each only on one branch of
// PostgresExampleStepOutcome) — distributing over the union first, branch by branch,
// keeps status/output/message correctly correlated.
type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;

// Like PostgresExampleStepResult, but with `observedBy` resolved to real results
// (see runConcurrentSessionSteps) instead of the raw, unexecuted step definitions.
export type PostgresExampleStepResultWithObservers<SessionId extends string> =
  DistributiveOmit<PostgresExampleStepResult<SessionId>, "observedBy"> & {
    observedBy?: readonly PostgresExampleStepResult<SessionId>[];
  };

/**
 * Runs an ordered list of statements, one step at a time, so each step reflects real
 * PostgreSQL output (xmin/xmax included) for exactly the statements up to and
 * including it — e.g. step 3's query is steps 1+2+3's statements replayed in order.
 *
 * Each step gets its OWN fresh connection, seeded from scratch and replayed up to
 * that point, rather than one shared connection carried across steps. PGlite's
 * browser runtime (PGliteWorker) is single-connection with no clone/fork support
 * (verified against the compiled package — only the Node/SSR-only PGlite class has
 * `.clone()`), so there is no way to hold a real second, independent, live session
 * open in the browser. Replaying from a fresh database each time sidesteps that
 * entirely: PGlite's internal transaction-id counter is deterministic for an
 * identical replayed script, so the same statements always land on the same xmin.
 *
 * `pgSessionId` is purely display metadata for narrating which "session" a step
 * belongs to — it has no effect on execution.
 *
 * Shared between the live `useLessonSqlExampleMultipleSession` hook (which passes
 * `onStep` for incremental UI updates) and `scripts/build-postgres-examples.ts`
 * (which just awaits the final array — no `onStep`, no React).
 */
export async function runMultiSessionSteps<SessionId extends string>({
  onStep,
  queries,
  runExplain = false,
  signal,
  sqlLoad,
}: {
  sqlLoad: string;
  queries: readonly PostgresExampleStep<SessionId>[];
  runExplain?: boolean;
  signal?: AbortSignal;
  onStep?: (index: number, outcome: PostgresExampleStepOutcome) => void;
}): Promise<readonly PostgresExampleStepResultWithObservers<SessionId>[]> {
  // Step i's query is steps[0..i]'s statements replayed in order — see this
  // function's doc comment for why each step gets a fresh connection instead of one
  // shared across steps.
  const accumulatedQueries = queries.reduce<string[]>((accumulated, step, index) => {
    const previous = accumulated[index - 1];
    accumulated.push(previous ? `${previous}\n${step.query}` : step.query);
    return accumulated;
  }, []);

  const results: PostgresExampleStepResultWithObservers<SessionId>[] = [];

  for (let index = 0; index < accumulatedQueries.length; index += 1) {
    throwIfAborted(signal);

    const step = queries[index]!;
    let outcome: PostgresExampleStepOutcome;

    try {
      const db = await createSqlDatabase(sqlLoad, signal);
      try {
        const result = await runSqlQueryOnDatabase(
          db,
          accumulatedQueries[index]!,
          runExplain,
        );
        outcome = result.match(
          (output): PostgresExampleStepOutcome => ({ output, status: "done" }),
          (message): PostgresExampleStepOutcome => ({ message, status: "error" }),
        );
      } finally {
        await db.close();
      }
    } catch (error) {
      outcome = {
        message: error instanceof Error ? error.message : String(error),
        status: "error",
      };
    }

    // Deliberately not `{ ...step, ...outcome }` here: `step.observedBy`, if set,
    // holds raw unexecuted step definitions (see the doc comment above), which this
    // function never resolves — dropping it keeps the result honest about that,
    // rather than leaking unresolved data through as if it were a real result.
    results.push({
      ...(step.label !== undefined ? { label: step.label } : {}),
      pgSessionId: step.pgSessionId,
      query: step.query,
      ...outcome,
    });
    onStep?.(index, outcome);
  }

  return results;
}

/**
 * Build-time-only sibling of runMultiSessionSteps: connects to a REAL Postgres
 * server (see scripts/dev-pg.sh) instead of an embedded PGlite instance, so every
 * `pgSessionId` gets its own genuinely separate, concurrently-open connection — real
 * locking and visibility semantics, not a workaround.
 *
 * Two things were tried and rejected before this: PGlite's `.clone()`
 * (dumpDataDir + reload into a fresh instance) silently drops the `xmax` an
 * in-progress UPDATE stamps on the row it's replacing (verified: showed `xmax 0`
 * where a real concurrent session must show the updating transaction's id); a
 * same-connection `ROLLBACK` trick fixed that specific number but still wasn't a
 * real second connection. A genuine second `pg` connection against a real running
 * Postgres sidesteps both — it's not a PGlite/browser limitation to work around.
 *
 * Statements run in transcript order: each step, then its `observedBy` checkpoints,
 * each on its own session's connection, which stays open for the whole transcript.
 * A step marked `blocks: true` is expected to wait for a lock: it's sent without
 * waiting for its result, the runner watches pg_stat_activity until Postgres reports
 * it waiting, then carries on with the next statements. After every statement, it
 * checks whether that released any waiting statement, and records where it finished
 * (see settlePending) — so a blocked UPDATE's result shows the value the blocking
 * transaction committed, and a deadlock shows Postgres's real error.
 *
 * Each call gets a fresh, disposable database (`CREATE DATABASE`, dropped in a
 * `finally`) on the dev Postgres server so concurrent builds/re-runs never collide.
 * Requires `pnpm run dev:pg` running locally — see getDevPgConfig for the
 * connection details and connectWithRetry for how connection timing is handled.
 * Node-only (`pg` is dynamically imported so it's never bundled for the browser);
 * the live, browser-side `useLessonSqlExampleMultipleSession` uses
 * `runMultiSessionSteps` instead, which ignores `observedBy` and `blocks` entirely.
 */
export async function runConcurrentSessionSteps<SessionId extends string>({
  queries,
  runExplain = false,
  sqlLoad,
}: {
  sqlLoad: string;
  queries: readonly PostgresExampleStep<SessionId>[];
  runExplain?: boolean;
}): Promise<readonly PostgresExampleStepResultWithObservers<SessionId>[]> {
  const { Client } = await import("pg");
  const config = getDevPgConfig();
  const databaseName = `pgquest_transcript_${crypto.randomUUID().replaceAll("-", "")}`;

  const admin = await connectWithRetry(
    () => new Client({ ...config, database: "postgres" }),
  );
  try {
    await admin.query(`CREATE DATABASE "${databaseName}";`);
  } finally {
    await admin.end();
  }

  // application_name lets a transcript's own pg_locks / pg_stat_activity queries say
  // which session holds or waits for what, instead of showing per-build random pids.
  const connect = async (applicationName = "pgquest transcript runner") => {
    const client = new Client({
      ...config,
      application_name: applicationName,
      database: databaseName,
    });
    await client.connect();
    return client;
  };

  // Watches the sessions' lock waits; never runs a transcript statement itself.
  const monitor = await connect();
  const sessions = new Map<SessionId, PgSession>();
  const pending: PendingStatement<SessionId>[] = [];
  let position = 0;

  const sessionFor = async (sessionId: SessionId): Promise<PgSession> => {
    const existing = sessions.get(sessionId);
    if (existing) {
      return existing;
    }
    const client = await connect(`Session ${sessionId}`);
    const pidResult = await client.query<{ pid: number }>(
      "SELECT pg_backend_pid() AS pid",
    );
    const session = { client, pid: pidResult.rows[0]!.pid };
    sessions.set(sessionId, session);
    return session;
  };

  const runStep = async (
    step: PostgresExampleStep<SessionId>,
  ): Promise<StepRecord<SessionId>> => {
    const index = position;
    position += 1;
    const session = await sessionFor(step.pgSessionId);
    const busy = pending.find((statement) => statement.session === session);
    if (busy) {
      throw new Error(
        `Transcript statement ${index + 1} runs on session ${step.pgSessionId}, which is still waiting for a lock since statement ${busy.index + 1}.`,
      );
    }

    const record: StepRecord<SessionId> = { step };

    if (!step.blocks) {
      record.outcome = await runPgStatement(session.client, step.query, runExplain);
      await settlePending(monitor, pending, index);
      return record;
    }

    const statement: PendingStatement<SessionId> = { index, record, session };
    void runPgStatement(session.client, step.query, runExplain).then((outcome) => {
      statement.outcome = outcome;
    });
    await pollUntil(
      async () =>
        statement.outcome !== undefined ||
        (await readLockWaits(monitor, [session.pid])).some((wait) => wait.waiting),
      `Transcript statement ${index + 1} (session ${step.pgSessionId}, blocks: true) never started waiting for a lock.`,
    );
    if (statement.outcome !== undefined) {
      throw new Error(
        `Transcript statement ${index + 1} (session ${step.pgSessionId}) is marked blocks: true but finished without waiting for a lock.`,
      );
    }
    pending.push(statement);
    // This statement may have closed a deadlock cycle.
    await settlePending(monitor, pending, index);
    return record;
  };

  try {
    await monitor.query(sqlLoad);

    const records: StepRecord<SessionId>[] = [];
    for (const step of queries) {
      const record = await runStep(step);
      if (step.observedBy && step.observedBy.length > 0) {
        record.observedBy = [];
        for (const observerStep of step.observedBy) {
          record.observedBy.push(await runStep(observerStep));
        }
      }
      records.push(record);
    }

    const stillWaiting = pending[0];
    if (stillWaiting) {
      throw new Error(
        `Transcript statement ${stillWaiting.index + 1} (session ${stillWaiting.record.step.pgSessionId}) was still waiting for a lock when the transcript ended.`,
      );
    }

    return records.map((record) => ({
      ...toStepResult(record),
      ...(record.observedBy ? { observedBy: record.observedBy.map(toStepResult) } : {}),
    }));
  } finally {
    await Promise.allSettled([
      monitor.end(),
      ...[...sessions.values()].map((session) => session.client.end()),
    ]);
    const cleanup = new Client({ ...config, database: "postgres" });
    await cleanup.connect();
    try {
      // FORCE: a failed transcript can leave a session still connected.
      await cleanup.query(`DROP DATABASE IF EXISTS "${databaseName}" WITH (FORCE);`);
    } finally {
      await cleanup.end();
    }
  }
}

type PgSession = { client: PgClient; pid: number };

type StepRecord<SessionId extends string> = {
  step: PostgresExampleStep<SessionId>;
  outcome?: PostgresExampleStepOutcome;
  unblockedAfter?: number;
  observedBy?: StepRecord<SessionId>[];
};

type PendingStatement<SessionId extends string> = {
  index: number;
  outcome?: PostgresExampleStepOutcome;
  record: StepRecord<SessionId>;
  session: PgSession;
};

function toStepResult<SessionId extends string>(
  record: StepRecord<SessionId>,
): DistributiveOmit<PostgresExampleStepResult<SessionId>, "observedBy"> {
  const { step, outcome } = record;
  if (!outcome) {
    throw new Error(`Transcript step never finished: ${step.query}`);
  }
  return {
    ...(step.label !== undefined ? { label: step.label } : {}),
    pgSessionId: step.pgSessionId,
    query: step.query,
    ...(step.blocks ? { blocks: true } : {}),
    ...(record.unblockedAfter !== undefined
      ? { unblockedAfter: record.unblockedAfter }
      : {}),
    ...outcome,
  };
}

type LockWait = { blockers: number[]; pid: number; waiting: boolean };

async function readLockWaits(monitor: PgClient, pids: readonly number[]) {
  const result = await monitor.query<LockWait>(
    `SELECT pid, wait_event_type IS NOT DISTINCT FROM 'Lock' AS waiting,
       pg_blocking_pids(pid) AS blockers
     FROM pg_stat_activity
     WHERE pid = ANY($1::int[])`,
    [pids],
  );
  return result.rows;
}

// Called after statement `afterIndex` returns: waits until every still-pending
// statement has either finished (recording `afterIndex` as where it was released) or
// is stably waiting — Postgres reports it waiting AND it has a blocker. A statement
// whose lock was just granted can still show a Lock wait for a moment, but its
// blocker list is already empty; checking both keeps the result deterministic.
// Statements that only wait on each other are a deadlock: keep polling until
// Postgres's deadlock detector (after deadlock_timeout) cancels one of them.
async function settlePending<SessionId extends string>(
  monitor: PgClient,
  pending: PendingStatement<SessionId>[],
  afterIndex: number,
) {
  await pollUntil(
    async () => {
      for (let index = pending.length - 1; index >= 0; index -= 1) {
        const statement = pending[index]!;
        if (statement.outcome !== undefined) {
          statement.record.outcome = statement.outcome;
          statement.record.unblockedAfter = afterIndex;
          pending.splice(index, 1);
        }
      }
      if (pending.length === 0) {
        return true;
      }

      const waits = await readLockWaits(
        monitor,
        pending.map((statement) => statement.session.pid),
      );
      const stablyWaiting =
        waits.length === pending.length &&
        waits.every((wait) => wait.waiting && wait.blockers.length > 0);
      return stablyWaiting && !hasDeadlock(waits);
    },
    `Statements pending after transcript statement ${afterIndex + 1} never finished or settled into a lock wait.`,
  );
}

// A set of waiting statements none of which can progress: each is blocked only by
// others in the set. Repeatedly drop any statement with a blocker outside the set
// (that blocker can still finish and release it); whatever is left is a cycle.
function hasDeadlock(waits: readonly LockWait[]): boolean {
  let stuck = new Set(waits.map((wait) => wait.pid));
  for (;;) {
    const next = new Set(
      waits
        .filter((wait) => stuck.has(wait.pid))
        .filter((wait) => wait.blockers.every((blocker) => stuck.has(blocker)))
        .map((wait) => wait.pid),
    );
    if (next.size === stuck.size) {
      return next.size > 0;
    }
    stuck = next;
  }
}

async function pollUntil(
  check: () => Promise<boolean>,
  timeoutMessage: string,
  timeoutMs = 10_000,
) {
  const deadline = Date.now() + timeoutMs;
  while (!(await check())) {
    if (Date.now() > deadline) {
      throw new Error(timeoutMessage);
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

function getDevPgConfig(): { host: string; port: number; user: string } {
  return {
    host: process.env.PGQUEST_DEV_PG_HOST ?? "localhost",
    port: Number(process.env.PGQUEST_DEV_PG_PORT ?? 9998),
    user: process.env.PGQUEST_DEV_PG_USER ?? "postgres",
  };
}

// The dev Postgres server (scripts/dev-pg.sh) may still be starting up (initdb +
// boot takes a couple of seconds) when this first connects, especially right after
// `pnpm run dev` starts both concurrently — retry instead of failing on the first
// attempt. A fresh Client per attempt: pg's Client throws "Client has already been
// connected" if you call .connect() again on one that already tried (and failed).
async function connectWithRetry(
  createClient: () => PgClient,
  attempts = 20,
  delayMs = 250,
): Promise<PgClient> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const client = createClient();
    try {
      await client.connect();
      return client;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error(
    `Could not connect to the dev Postgres server after ${attempts} attempts. Run \`pnpm run dev:pg\` in another terminal first.\n${lastError instanceof Error ? lastError.message : String(lastError)}`,
  );
}

// pg's simple query protocol runs a multi-statement string (e.g. "BEGIN;\nUPDATE
// ... RETURNING ...;") as one call and returns one result per statement — take the
// last one, same as PGlite's "exec all but the last statement, query the last"
// pattern in executeSqlQueryOnDatabase above, just without needing to split the
// string ourselves.
async function runPgStatement(
  client: PgClient,
  query: string,
  runExplain: boolean,
): Promise<PostgresExampleStepOutcome> {
  try {
    const rawResult = await client.query(query);
    const statementResults = Array.isArray(rawResult) ? rawResult : [rawResult];
    const isMultiStatement = statementResults.length > 1;
    const rows = (statementResults[statementResults.length - 1]?.rows ??
      []) as QueryRow[];
    const plan = await computePgPlan(client, query, isMultiStatement, runExplain);
    return { output: { plan, rows }, status: "done" };
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : String(error),
      status: "error",
    };
  }
}

async function computePgPlan(
  client: PgClient,
  query: string,
  isMultiStatement: boolean,
  runExplain: boolean,
): Promise<string> {
  if (isMultiStatement) {
    return "Unavailable for a multi-statement SQL example.";
  }
  if (!runExplain) {
    return "Unavailable: plan not requested.";
  }
  if (!isExplainableStatement(query)) {
    return "Unavailable: EXPLAIN doesn't support this statement.";
  }
  try {
    const rawResult = await client.query(`EXPLAIN ${query}`);
    const result = Array.isArray(rawResult)
      ? rawResult[rawResult.length - 1]!
      : rawResult;
    return (result.rows as ExplainRow[]).map((row) => row["QUERY PLAN"]).join("\n");
  } catch (error) {
    return `Unavailable: ${error instanceof Error ? error.message : String(error)}`;
  }
}

function computePlan(
  db: PGliteInterface,
  query: string,
  isMultiStatement: boolean,
  runExplain: boolean,
): Promise<string> | string {
  if (isMultiStatement) {
    return "Unavailable for a multi-statement SQL example.";
  }
  if (!runExplain) {
    return "Unavailable: plan not requested.";
  }
  if (!isExplainableStatement(query)) {
    return "Unavailable: EXPLAIN doesn't support this statement.";
  }
  return explainQuery(db, query);
}

// EXPLAIN only accepts these statement types. Anything else — BEGIN, COMMIT, ROLLBACK,
// SET, and other transaction/session control statements — makes EXPLAIN itself throw a
// syntax error. That's normally harmless (explainQuery catches it), but if it happens
// while an explicit transaction is open, Postgres aborts the whole transaction and every
// later statement in it fails with "current transaction is aborted" — even though the
// plan was never shown to anyone. Skip EXPLAIN entirely for anything not on this list.
const EXPLAINABLE_STATEMENT_KEYWORDS = new Set([
  "SELECT",
  "INSERT",
  "UPDATE",
  "DELETE",
  "MERGE",
  "WITH",
  "VALUES",
  "TABLE",
  "EXECUTE",
]);

function isExplainableStatement(query: string): boolean {
  const firstWord = query.trim().split(/\s+/, 1)[0];
  return (
    firstWord !== undefined && EXPLAINABLE_STATEMENT_KEYWORDS.has(firstWord.toUpperCase())
  );
}

async function explainQuery(db: PGliteInterface, query: string) {
  try {
    const explainResult = await db.query<ExplainRow>(`EXPLAIN ${query}`);
    return explainResult.rows.map((row) => row["QUERY PLAN"]).join("\n");
  } catch (error) {
    return `Unavailable: ${error instanceof Error ? error.message : String(error)}`;
  }
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new DOMException("SQL execution was cancelled.", "AbortError");
  }
}

function splitSqlStatements(sql: string) {
  return sql
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
}
