import { ResultAsync } from "neverthrow";
import type { PGliteInterface } from "@electric-sql/pglite";
import type { SqlExample } from "../../cli_examples/types";

import type { ExecutionOutput, ExplainRow, QueryRow, SqlExecutionInput } from "./types";

let timingId = 0;

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
  if (import.meta.env?.DEV) {
    console.time(timer);
  }

  const db = import.meta.env.SSR
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
    if (import.meta.env?.DEV) {
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
  if (import.meta.env?.DEV) {
    console.time(timer);
  }

  const db = await createSqlDatabase(input.sqlLoad, signal);

  try {
    return await executeSqlQueryOnDatabase(db, query, signal);
  } finally {
    await db.close();
    if (import.meta.env?.DEV) {
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
  const result = await db.query<QueryRow>(query);
  throwIfAborted(signal);
  const explainResult = await db.query<ExplainRow>(`EXPLAIN ${query}`);
  throwIfAborted(signal);

  return {
    rows: result.rows,
    plan: explainResult.rows.map((row) => row["QUERY PLAN"]).join("\n"),
  };
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new DOMException("SQL execution was cancelled.", "AbortError");
  }
}
