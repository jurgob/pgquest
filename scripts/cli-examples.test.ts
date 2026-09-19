import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, test } from "vitest";
import { lessons } from "../app/sql/lesson-catalog";
import { exerciseCheck } from "../app/sql/exercise-checker";
import { runSqlExample } from "../app/sql/run-example";
import type { SqlExample } from "../cli_examples/types";

type SqlExampleModule = {
  database_inits?: readonly SqlExample[];
  examples?: readonly SqlExample[];
  exercises?: readonly SqlExample[];
};

const examplesDir = path.join(process.cwd(), "cli_examples");

const modules = await Promise.all(
  lessons.map(async (lesson) => {
    const filePath = path.join(examplesDir, lesson.cliExampleModule);
    const mod: SqlExampleModule = await import(pathToFileURL(filePath).href);
    return { cliExampleModule: lesson.cliExampleModule, mod };
  }),
);

const allExamples = modules.flatMap(({ cliExampleModule, mod }) =>
  (mod.examples ?? []).map((example) => ({ cliExampleModule, example })),
);

const allExercises = modules.flatMap(({ cliExampleModule, mod }) =>
  (mod.exercises ?? []).map((exercise) => ({ cliExampleModule, exercise })),
);

describe("examples run without error", () => {
  test.concurrent.each(allExamples)(
    "$cliExampleModule / $example.name",
    async ({ example }) => {
      const result = await runSqlExample(example);

      if (result.isErr()) {
        throw new Error(result.error);
      }
    },
  );
});

describe("exercises accept their own reference answer", () => {
  test.concurrent.each(allExercises)(
    "$cliExampleModule / $exercise.name",
    async ({ exercise }) => {
      const result = await exerciseCheck({
        databasePreload: exercise.database_init?.query ?? "",
        exerciseCode: exercise.query,
        ignoreColumns: exercise.ignoreColumns,
        userCode: exercise.query,
      });

      if (result.isErr()) {
        throw new Error(result.error);
      }

      expect(result.value.status).toBe("correct");
    },
  );
});
