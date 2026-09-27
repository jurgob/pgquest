import rawResults from "../generated/lesson-sql-results.json";
import type { ExecutionOutput, SqlExecutionInput } from "./types";

export type PrecomputedLessonSqlResult =
  { status: "done"; output: ExecutionOutput } | { status: "error"; message: string };

const results = rawResults as Record<string, PrecomputedLessonSqlResult>;

let inputCollector: ((input: SqlExecutionInput) => void) | undefined;

// Looks up the result of a single-query lesson example precomputed by
// scripts/build-lesson-sql-results.ts, so lesson pages render it (server-side
// too) without booting PGlite in the browser. Undefined means the input isn't
// registered yet — e.g. while authoring a lesson, before rerunning
// `pnpm run build-assets:lesson-sql-results` — and useLessonSqlExample falls
// back to running it live.
export function getPrecomputedLessonSqlResult(
  input: SqlExecutionInput,
): PrecomputedLessonSqlResult | undefined {
  inputCollector?.(input);
  return results[lessonSqlResultKey(input)];
}

// Lets scripts/build-lesson-sql-results.ts discover every input by rendering
// each lesson once: the queries are built inside the route components, so
// rendering them is the only complete way to enumerate them.
export function setLessonSqlInputCollector(
  collector: ((input: SqlExecutionInput) => void) | undefined,
) {
  inputCollector = collector;
}

export function lessonSqlResultKey(input: SqlExecutionInput): string {
  return hashString(
    JSON.stringify([input.sqlLoad, input.query, input.runExplain ?? false]),
  );
}

// cyrb53 — a small synchronous, non-cryptographic hash; it runs in the browser
// during render, where crypto.subtle (async) can't be used.
function hashString(value: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;

  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 2654435761);
    h2 = Math.imul(h2 ^ code, 1597334677);
  }

  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, "0");
}
