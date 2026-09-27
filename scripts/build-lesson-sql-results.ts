import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { ExerciseProgressProvider } from "../app/sql/exercise-progress-context";
import { lessons } from "../app/sql/lesson-catalog";
import {
  lessonSqlResultKey,
  setLessonSqlInputCollector,
  type PrecomputedLessonSqlResult,
} from "../app/sql/lesson-sql-results";
import { runSqlQuery } from "../app/sql/run-example";
import type { SqlExecutionInput } from "../app/sql/types";

// Precomputes every single-query lesson example (useLessonSqlExample) so lesson
// pages show results without running PGlite in the browser. The inputs are
// built inside the route components, so they're discovered by rendering each
// lesson once with a collector installed — the same render
// scripts/build-search-index.tsx does. Keyed by a hash of the full input, so an
// unchanged example reuses its previous result and a removed one drops out.

const root = process.cwd();
const outPath = path.join(root, "app", "generated", "lesson-sql-results.json");

const previous: Record<string, PrecomputedLessonSqlResult> = fs.existsSync(outPath)
  ? JSON.parse(fs.readFileSync(outPath, "utf8"))
  : {};

const inputs = new Map<string, SqlExecutionInput>();
setLessonSqlInputCollector((input) => {
  inputs.set(lessonSqlResultKey(input), input);
});

for (const lesson of lessons) {
  const modulePath = path.join(root, "app", lesson.routeModule);
  const mod: { default: React.ComponentType } = await import(
    pathToFileURL(modulePath).href
  );

  renderToStaticMarkup(
    React.createElement(
      MemoryRouter,
      { initialEntries: [lesson.href] },
      React.createElement(
        ExerciseProgressProvider,
        null,
        React.createElement(mod.default),
      ),
    ),
  );
}

setLessonSqlInputCollector(undefined);

const result: Record<string, PrecomputedLessonSqlResult> = {};
let computed = 0;
let reused = 0;

for (const key of [...inputs.keys()].sort()) {
  const cached = previous[key];

  if (cached) {
    result[key] = cached;
    reused += 1;
    continue;
  }

  const input = inputs.get(key)!;
  result[key] = (await runSqlQuery(input, input.query)).match(
    (output): PrecomputedLessonSqlResult => ({ output, status: "done" }),
    (message): PrecomputedLessonSqlResult => ({ message, status: "error" }),
  );
  computed += 1;
}

fs.writeFileSync(outPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(
  `Wrote ${inputs.size} lesson SQL result(s) to ${outPath} (${computed} computed, ${reused} reused from cache).`,
);
