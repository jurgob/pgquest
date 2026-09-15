import { ResultAsync } from "neverthrow";
import { runSqlQuery } from "./run-example";
import type { ExecutionOutput } from "./types";

const unavailablePlan = "Unavailable for a multi-statement SQL example.";

type ExerciseCheckBaseInput = {
  databasePreload: string;
  userCode: string;
};

export type ExerciseCheckInput = ExerciseCheckBaseInput &
  (
    | {
        exerciseCode: string;
        expectedOutput?: undefined;
      }
    | {
        exerciseCode?: string | undefined;
        expectedOutput: ExecutionOutput;
      }
  );

export type ExerciseCheckSuccess = {
  expectedOutput: ExecutionOutput;
  userOutput: ExecutionOutput;
} & (
  | { status: "correct" }
  | {
      reason: "result-mismatch" | "plan-mismatch";
      status: "incorrect";
    }
);

export function exerciseCheck(input: ExerciseCheckInput) {
  return ResultAsync.fromPromise(runExerciseCheck(input), (error) =>
    error instanceof Error ? error.message : String(error),
  );
}

export function computeExerciseExpectedOutput({
  databasePreload,
  exerciseCode,
}: {
  databasePreload: string;
  exerciseCode: string;
}) {
  return runSqlQuery({ query: exerciseCode, sqlLoad: databasePreload }, exerciseCode);
}

async function runExerciseCheck({
  databasePreload,
  exerciseCode,
  expectedOutput: precomputedExpectedOutput,
  userCode,
}: ExerciseCheckInput): Promise<ExerciseCheckSuccess> {
  const userResultPromise = runSqlQuery(
    { query: userCode, sqlLoad: databasePreload },
    userCode,
  );
  const expectedResultPromise = precomputedExpectedOutput
    ? undefined
    : computeExerciseExpectedOutput({
        databasePreload,
        exerciseCode,
      });

  const [userResult, expectedResult] = await Promise.all([
    userResultPromise,
    expectedResultPromise,
  ]);

  const userOutput = unwrapExecutionOutput(userResult);
  const expectedOutput =
    precomputedExpectedOutput ?? unwrapExpectedResult(expectedResult);

  if (!sameRows(userOutput.rows, expectedOutput.rows)) {
    return {
      expectedOutput,
      reason: "result-mismatch",
      status: "incorrect",
      userOutput,
    };
  }

  if (
    expectedOutput.plan !== unavailablePlan &&
    userOutput.plan !== expectedOutput.plan
  ) {
    return {
      expectedOutput,
      reason: "plan-mismatch",
      status: "incorrect",
      userOutput,
    };
  }

  return {
    expectedOutput,
    status: "correct",
    userOutput,
  };
}

function unwrapExecutionOutput(
  result: Awaited<ReturnType<typeof runSqlQuery>>,
): ExecutionOutput {
  if (result.isErr()) {
    throw new Error(result.error);
  }

  return result.value;
}

function unwrapExpectedResult(
  result: Awaited<ReturnType<typeof runSqlQuery>> | undefined,
): ExecutionOutput {
  if (!result) {
    throw new Error("Exercise check needs either exerciseCode or expectedOutput.");
  }

  return unwrapExecutionOutput(result);
}

function sameRows(left: ExecutionOutput["rows"], right: ExecutionOutput["rows"]) {
  return JSON.stringify(left) === JSON.stringify(right);
}
