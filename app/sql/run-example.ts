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

export type PostgresExampleStepResult<SessionId extends string> =
  PostgresExampleStep<SessionId> & PostgresExampleStepOutcome;

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
 * server (see scripts/dev-pg.sh) instead of an embedded PGlite instance, so
 * `observedBy` checkpoints can use a genuinely separate, concurrently-open second
 * connection — real dirty-read-prevention semantics, not a workaround.
 *
 * Two things were tried and rejected before this: PGlite's `.clone()`
 * (dumpDataDir + reload into a fresh instance) silently drops the `xmax` an
 * in-progress UPDATE stamps on the row it's replacing (verified: showed `xmax 0`
 * where a real concurrent session must show the updating transaction's id); a
 * same-connection `ROLLBACK` trick fixed that specific number but still wasn't a
 * real second connection. A genuine second `pg` connection against a real running
 * Postgres sidesteps both — it's not a PGlite/browser limitation to work around.
 *
 * Each call gets a fresh, disposable database (`CREATE DATABASE`, dropped in a
 * `finally`) on the dev Postgres server so concurrent builds/re-runs never collide.
 * Requires `pnpm run dev:pg` running locally — see getDevPgConfig for the
 * connection details and connectWithRetry for how connection timing is handled.
 * Node-only (`pg` is dynamically imported so it's never bundled for the browser);
 * the live, browser-side `useLessonSqlExampleMultipleSession` uses
 * `runMultiSessionSteps` instead, which ignores `observedBy` entirely.
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

  const primary = new Client({ ...config, database: databaseName });
  await primary.connect();

  try {
    await primary.query(sqlLoad);

    const results: PostgresExampleStepResultWithObservers<SessionId>[] = [];

    for (const step of queries) {
      const outcome = await runPgStatement(primary, step.query, runExplain);
      const result: PostgresExampleStepResultWithObservers<SessionId> = {
        ...(step.label !== undefined ? { label: step.label } : {}),
        pgSessionId: step.pgSessionId,
        query: step.query,
        ...outcome,
      };

      if (step.observedBy && step.observedBy.length > 0) {
        // A real second connection to the same database — genuinely concurrent
        // with `primary`'s still-open transaction, not a simulation of one.
        const observer = new Client({ ...config, database: databaseName });
        await observer.connect();
        try {
          const observed: PostgresExampleStepResult<SessionId>[] = [];
          for (const observerStep of step.observedBy) {
            const observerOutcome = await runPgStatement(
              observer,
              observerStep.query,
              runExplain,
            );
            observed.push({
              ...(observerStep.label !== undefined ? { label: observerStep.label } : {}),
              pgSessionId: observerStep.pgSessionId,
              query: observerStep.query,
              ...observerOutcome,
            });
          }
          result.observedBy = observed;
        } finally {
          await observer.end();
        }
      }

      results.push(result);
    }

    return results;
  } finally {
    await primary.end();
    const cleanup = new Client({ ...config, database: "postgres" });
    await cleanup.connect();
    try {
      await cleanup.query(`DROP DATABASE IF EXISTS "${databaseName}";`);
    } finally {
      await cleanup.end();
    }
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
