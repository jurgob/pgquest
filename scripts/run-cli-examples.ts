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
  const query = normalizeQuery(mod.default, file);
  const db = new PGlite();

  try {
    const result = await db.exec(query);
    const explainResult = await explainLastStatement(db, query);

    printSection("filename", file);
    printSection("query", query);
    printSection("result", JSON.stringify(result, null, 2));
    printSection("query explain", JSON.stringify(explainResult, null, 2));
  } catch (error) {
    printSection("filename", file);
    printSection("query", query);
    printSection("error", error instanceof Error ? error.message : String(error));
  } finally {
    await db.close();
  }
}

function normalizeQuery(value: unknown, file: string) {
  if (typeof value !== "string") {
    throw new TypeError(`${file} must default-export a SQL string.`);
  }

  return value.trim();
}

async function explainLastStatement(db: PGlite, query: string) {
  const statement = getLastStatement(query);

  if (!statement) {
    return [];
  }

  return db.query(`EXPLAIN ${statement}`);
}

function getLastStatement(query: string) {
  return query
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean)
    .at(-1);
}

function printSection(label: string, value: string) {
  console.log(`[${label}]`);
  console.log(value);
  console.log();
}
