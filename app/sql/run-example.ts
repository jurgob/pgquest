import { ResultAsync } from "neverthrow";
import type { PGliteInterface } from "@electric-sql/pglite";
import type { SqlExample } from "../../cli_examples/types";

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

export function runSqlQueryOnDatabase(db: PGliteInterface, query: string) {
  return ResultAsync.fromPromise(executeSqlQueryOnDatabase(db, query), (error) =>
    error instanceof Error ? error.message : String(error),
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
    return await executeSqlQueryOnDatabase(db, query, signal);
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
  const plan = isMultiStatement
    ? "Unavailable for a multi-statement SQL example."
    : await explainQuery(db, query);
  throwIfAborted(signal);

  return {
    rows: result.rows,
    plan,
  };
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
