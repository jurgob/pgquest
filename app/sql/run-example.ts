import { ResultAsync } from "neverthrow";

import type {
  ExecutionOutput,
  ExplainRow,
  QueryRow,
  SqlExampleDefinition,
} from "./types";

export function runSqlExample(example: SqlExampleDefinition) {
  return ResultAsync.fromPromise(executeSqlExample(example), (error) =>
    error instanceof Error ? error.message : String(error),
  );
}

async function executeSqlExample(
  example: SqlExampleDefinition,
): Promise<ExecutionOutput> {
  const { PGlite } = await import("@electric-sql/pglite");
  const db = new PGlite();

  try {
    await db.exec(example.migration);
    await db.exec(example.seed);

    const result = await db.query<QueryRow>(example.query);
    const explainResult = await db.query<ExplainRow>(`EXPLAIN ${example.query}`);

    return {
      rows: result.rows,
      plan: explainResult.rows.map((row) => row["QUERY PLAN"]).join("\n"),
    };
  } finally {
    await db.close();
  }
}
