import { PGlite } from "@electric-sql/pglite";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { SqlExample } from "../cli_examples/types";

const root = process.cwd();
const examplesDir = path.join(root, "cli_examples");
const files = (await readdir(examplesDir))
  .filter((file) => file.endsWith(".sql.ts"))
  .sort((a, b) => a.localeCompare(b));

for (const file of files) {
  const filePath = path.join(examplesDir, file);
  const mod: SqlExampleModule = await import(pathToFileURL(filePath).href);
  const examples = [...(mod.examples ?? []), ...(mod.exercises ?? [])];

  if (examples.length === 0) {
    printError(file, "must export at least one example or exercise.");
    continue;
  }

  for (const example of examples) {
    await runExample(file, example);
  }
}

type SqlExampleModule = {
  database_inits?: readonly SqlExample[];
  examples?: readonly SqlExample[];
  exercises?: readonly SqlExample[];
};

type SqlValue = string | number | boolean | null;
type QueryRow = Record<string, SqlValue>;
type ExplainRow = { "QUERY PLAN": string };

async function runExample(file: string, example: SqlExample) {
  const db = new PGlite();

  try {
    if (example.database_init) {
      await db.exec(example.database_init.query);
    }

    const result = isMultiStatement(example.query)
      ? { rows: await runMultiStatement(db, example.query) }
      : await db.query<QueryRow>(example.query);
    let explain: string;

    if (isMultiStatement(example.query)) {
      explain = "Unavailable for a multi-statement SQL example.";
    } else {
      try {
        const explainResult = await db.query<ExplainRow>(`EXPLAIN ${example.query}`);
        explain = explainResult.rows.map((row) => row["QUERY PLAN"]).join("\n");
      } catch (error) {
        explain = `Unavailable: ${error instanceof Error ? error.message : String(error)}`;
      }
    }

    printExample(file, example, formatTable(result.rows), explain);
  } catch (error) {
    printError(
      `${file} / ${example.name}`,
      error instanceof Error ? error.message : String(error),
    );
  } finally {
    await db.close();
  }
}

function isMultiStatement(sql: string) {
  return (sql.match(/;/g) ?? []).length > 1;
}

async function runMultiStatement(db: PGlite, sql: string): Promise<QueryRow[]> {
  await db.exec(sql);
  return [];
}

function printExample(
  file: string,
  example: SqlExample,
  result: string,
  explain: string,
) {
  console.log(`\n${"=".repeat(80)}`);
  console.log(`${file} / ${example.name}`);
  console.log("=".repeat(80));
  console.log(example.description);
  console.log("\nQuery");
  console.log("-".repeat(80));
  console.log(example.query);
  console.log("\nResult");
  console.log("-".repeat(80));
  console.log(result);
  console.log("\nExplain");
  console.log("-".repeat(80));
  console.log(explain);
}

function printError(label: string, message: string) {
  console.log(`\n${"=".repeat(80)}`);
  console.log(label);
  console.log("=".repeat(80));
  console.log(`Error: ${message}`);
}

function formatTable(rows: QueryRow[]) {
  if (rows.length === 0) {
    return "(no rows)";
  }

  const columns = Object.keys(rows[0] ?? {});
  const widths = columns.map((column) =>
    Math.max(column.length, ...rows.map((row) => formatCell(row[column]).length)),
  );
  const header = formatTableRow(columns, widths);
  const separator = widths.map((width) => "-".repeat(width)).join("-+-");
  const body = rows.map((row) =>
    formatTableRow(
      columns.map((column) => formatCell(row[column])),
      widths,
    ),
  );

  return [header, separator, ...body].join("\n");
}

function formatTableRow(values: string[], widths: number[]) {
  return values
    .map((value, index) => value.padEnd(widths[index] ?? value.length))
    .join(" | ");
}

function formatCell(value: SqlValue | undefined) {
  return value == null ? "" : String(value);
}
