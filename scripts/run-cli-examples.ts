import { PGlite } from "@electric-sql/pglite";
import { err, ok, type Result } from "neverthrow";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { match, P } from "ts-pattern";

const root = process.cwd();
const examplesDir = path.join(root, "cli_examples");

const files = (await readdir(examplesDir))
  .filter((file) => file.endsWith(".sql.ts"))
  .sort((a, b) => a.localeCompare(b));

if (files.length === 0) {
  console.log("No CLI examples found in cli_examples/.");
  process.exitCode = 1;
}

for (const file of files) {
  const filePath = path.join(examplesDir, file);
  const mod: SqlExampleModule = await import(pathToFileURL(filePath).href);
  const exampleResult = normalizeExample(mod, file);

  if (exampleResult.isErr()) {
    printExampleError(file, exampleResult.error);
    continue;
  }

  const example = exampleResult.value;
  const db = new PGlite();

  try {
    if (example.migration) {
      await db.exec(example.migration);
    }

    if (example.seed) {
      await db.exec(example.seed);
    }

    const result = await db.query<QueryRow>(example.query);
    const explainResult = await db.query<ExplainRow>(`EXPLAIN ${example.query}`);

    printExample(file, example, {
      result: formatQueryResult(result),
      explain: formatExplainResult(explainResult),
    });
  } finally {
    await db.close();
  }
}

type SqlExample = {
  migration?: string;
  seed?: string;
  query: string;
};

type SqlExampleModule = {
  default?: SqlExportCandidate;
  migration?: SqlExportCandidate;
  seed?: SqlExportCandidate;
};

type SqlExportCandidate =
  string | undefined | null | number | boolean | symbol | bigint | object;

type SqlValue = string | number | boolean | null;

type QueryRow = Record<string, SqlValue>;

type ExplainRow = {
  "QUERY PLAN": string;
};

function normalizeExample(
  mod: SqlExampleModule,
  file: string,
): Result<SqlExample, string> {
  const migrationResult = normalizeOptionalSql(mod.migration, "migration", file);
  const seedResult = normalizeOptionalSql(mod.seed, "seed", file);
  const queryResult = normalizeRequiredSql(mod.default, "default", file);

  if (migrationResult.isErr()) {
    return err(migrationResult.error);
  }

  if (seedResult.isErr()) {
    return err(seedResult.error);
  }

  if (queryResult.isErr()) {
    return err(queryResult.error);
  }

  return ok({
    ...(migrationResult.value ? { migration: migrationResult.value } : {}),
    ...(seedResult.value ? { seed: seedResult.value } : {}),
    query: queryResult.value,
  });
}

function normalizeRequiredSql(
  value: SqlExportCandidate,
  exportName: string,
  file: string,
): Result<string, string> {
  return normalizeOptionalSql(value, exportName, file).andThen((sql) =>
    sql ? ok(sql) : err(`${file} must export ${exportName} as a non-empty SQL string.`),
  );
}

function normalizeOptionalSql(
  value: SqlExportCandidate,
  exportName: string,
  file: string,
): Result<string | undefined, string> {
  return match(value)
    .with(P.nullish, () => ok(undefined))
    .with(P.string, (sql) => {
      const trimmedSql = sql.trim();
      return ok(trimmedSql.length > 0 ? trimmedSql : undefined);
    })
    .otherwise(() => err(`${file} must export ${exportName} as a SQL string.`));
}

type PrintExampleOutput = {
  explain?: string;
  result?: string;
};

type QueryResult = {
  rows: QueryRow[];
};

type ExplainResult = {
  rows: ExplainRow[];
};

function printExample(file: string, example: SqlExample, output: PrintExampleOutput) {
  console.log(`\n${"=".repeat(80)}`);
  console.log(file);
  console.log("=".repeat(80));

  printSqlBlock("Migration", example.migration);
  printSqlBlock("Seed", example.seed);
  printSqlBlock("Query", example.query);

  console.log("Result");
  console.log("-".repeat(80));
  console.log(output.result);
  console.log();

  console.log("Explain");
  console.log("-".repeat(80));
  console.log(output.explain);
  console.log();
}

function printExampleError(file: string, message: string) {
  console.log(`\n${"=".repeat(80)}`);
  console.log(file);
  console.log("=".repeat(80));
  console.log("Error");
  console.log("-".repeat(80));
  console.log(message);
  console.log();
}

function printSqlBlock(label: string, sql?: string) {
  if (!sql) {
    return;
  }

  console.log(label);
  console.log("-".repeat(80));
  console.log(sql);
  console.log();
}

function formatQueryResult(result: QueryResult) {
  if (result.rows.length === 0) {
    return "(no rows)";
  }

  return formatTable(result.rows);
}

function formatExplainResult(result: ExplainResult) {
  return result.rows.map((row) => String(row["QUERY PLAN"])).join("\n");
}

function formatTable(rows: QueryRow[]) {
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
  if (value == null) {
    return "";
  }

  return String(value);
}
