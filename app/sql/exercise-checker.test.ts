import { describe, expect, test } from "vitest";
import { databaseInit, exercises } from "../../cli_examples/my-first-query.sql";
import { computeExerciseExpectedOutput, exerciseCheck } from "./exercise-checker";

const firstExercise = exercises[0]!;

describe("exerciseCheck", () => {
  test("passes when user SQL matches the first my-first-query exercise", async () => {
    const result = await exerciseCheck({
      databasePreload: databaseInit.query,
      exerciseCode: firstExercise.query,
      userCode: firstExercise.query,
    });

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap().status).toBe("correct");
  });

  test("passes with a precomputed expected output", async () => {
    const expectedOutputResult = await computeExerciseExpectedOutput({
      databasePreload: databaseInit.query,
      exerciseCode: firstExercise.query,
    });
    const expectedOutput = expectedOutputResult._unsafeUnwrap();
    const result = await exerciseCheck({
      databasePreload: databaseInit.query,
      expectedOutput,
      userCode: firstExercise.query,
    });

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toMatchObject({
      expectedOutput,
      status: "correct",
    });
  });

  test("fails when user SQL returns a different result", async () => {
    const result = await exerciseCheck({
      databasePreload: databaseInit.query,
      exerciseCode: firstExercise.query,
      userCode: `
INSERT INTO "User" (name, email)
VALUES ('Barbara Liskov', 'barbara@mit.edu')
RETURNING *;
`,
    });

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toMatchObject({
      reason: "result-mismatch",
      status: "incorrect",
    });
  });

  test("fails when result matches but explain plan differs", async () => {
    const result = await exerciseCheck({
      databasePreload: databaseInit.query,
      exerciseCode: firstExercise.query,
      userCode: `
WITH inserted AS (
  INSERT INTO "User" (name, email)
  VALUES ('Edger W. Dijkstra', 'edger@cs.com')
  RETURNING *
)
SELECT * FROM inserted;
`,
    });

    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toMatchObject({
      reason: "plan-mismatch",
      status: "incorrect",
    });
  });
});
