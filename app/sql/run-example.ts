import { ResultAsync } from "neverthrow";
import type { PGlite } from "@electric-sql/pglite";

import type {
  ExecutionOutput,
  ExplainRow,
  QueryRow,
  SqlExampleDefinition,
  SqlExecutionInput,
} from "./types";

export function runSqlExample(example: SqlExampleDefinition) {
  return runSqlQuery(
    { query: example.query, sqlLoad: `${example.migration}\n${example.seed}` },
    example.query,
  );
}

export function runSqlQuery(input: SqlExecutionInput, query: string) {
  return ResultAsync.fromPromise(executeSqlQuery(input, query), (error) =>
    error instanceof Error ? error.message : String(error),
  );
}

export function runSqlQueryOnDatabase(db: PGlite, query: string) {
  return ResultAsync.fromPromise(executeSqlQueryOnDatabase(db, query), (error) =>
    error instanceof Error ? error.message : String(error),
  );
}

export async function createSqlDatabase(sqlLoad: string) {
  const { PGlite } = await import("@electric-sql/pglite");
  const db = new PGlite();

  try {
    await db.exec(sqlLoad);
    return db;
  } catch (error) {
    await db.close();
    throw error;
  }
}

async function executeSqlQuery(
  input: SqlExecutionInput,
  query: string,
): Promise<ExecutionOutput> {
  const db = await createSqlDatabase(input.sqlLoad);

  try {
    return await executeSqlQueryOnDatabase(db, query);
  } finally {
    await db.close();
  }
}

async function executeSqlQueryOnDatabase(
  db: PGlite,
  query: string,
): Promise<ExecutionOutput> {
  const result = await db.query<QueryRow>(query);
  const explainResult = await db.query<ExplainRow>(`EXPLAIN ${query}`);

  return {
    rows: result.rows,
    plan: explainResult.rows.map((row) => row["QUERY PLAN"]).join("\n"),
  };
}
