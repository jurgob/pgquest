import { PGlite } from "@electric-sql/pglite";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

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
  const mod = await import(pathToFileURL(filePath).href);
  const example = normalizeExample(mod, file);
  const db = new PGlite();

  try {
    if (example.migration) {
      await db.exec(example.migration);
    }

    if (example.seed) {
      await db.exec(example.seed);
    }

    const result = await db.query(example.query);
    const explainResult = await db.query(`EXPLAIN ${example.query}`);

    printSection("filename", file);
    printSection("migration", example.migration ?? "");
    printSection("seed", example.seed ?? "");
    printSection("query", example.query);
    printSection("result", JSON.stringify(result, null, 2));
    printSection("query explain", JSON.stringify(explainResult, null, 2));
  } catch (error) {
    printSection("filename", file);
    printSection("migration", example.migration ?? "");
    printSection("seed", example.seed ?? "");
    printSection("query", example.query);
    printSection("error", error instanceof Error ? error.message : String(error));
  } finally {
    await db.close();
  }
}

type SqlExample = {
  migration?: string;
  seed?: string;
  query: string;
};

function normalizeExample(mod: Record<string, unknown>, file: string): SqlExample {
  const migration = normalizeOptionalSql(mod.migration, "migration", file);
  const seed = normalizeOptionalSql(mod.seed, "seed", file);
  const query = normalizeRequiredSql(mod.default, "default", file);

  return {
    migration,
    seed,
    query,
  };
}

function normalizeRequiredSql(value: unknown, exportName: string, file: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`${file} must default-export a SQL string.`);
  }

  return value.trim();
}

function normalizeOptionalSql(value: unknown, exportName: string, file: string) {
  if (value == null) {
    return undefined;
  }

  if (typeof value !== "string") {
    throw new TypeError(`${file} must export ${exportName} as a SQL string.`);
  }

  const sql = value.trim();
  return sql.length > 0 ? sql : undefined;
}

function printSection(label: string, value: string) {
  console.log(`[${label}]`);
  console.log(value);
  console.log();
}
