import { useEffect, useState } from "react";
import posthog from "posthog-js";
import type { SqlExample } from "../../cli_examples/types";
import { exerciseCheck } from "./exercise-checker";
import { getOrComputeExerciseExpectedOutput } from "./exercise-expected-output-cache";
import { useExerciseProgress } from "./exercise-progress-context";
import type { SqlEditorExecutionResult } from "./sql-editor";
import type { LessonId } from "./types";

export type ExerciseCheckMessageValue = {
  message: string;
  tone: "error" | "neutral" | "success";
};

export function useExerciseSubmission({
  databasePreload,
  exercise,
  lessonId,
}: {
  databasePreload: string;
  exercise: SqlExample | undefined;
  lessonId: LessonId;
}) {
  const [checkMessage, setCheckMessage] = useState<
    ExerciseCheckMessageValue | undefined
  >();
  const { progress: exerciseState, save: saveExerciseProgress } =
    useExerciseProgress(lessonId);

  useEffect(() => {
    setCheckMessage(undefined);
  }, [exercise?.id]);

  function handleExecution(result: SqlEditorExecutionResult) {
    if (!exercise || result.status === "succeeded") {
      return;
    }

    captureExerciseExecution({ exercise, lessonId, result });
  }

  function handleSuccess(query: string) {
    if (!exercise) {
      return;
    }

    setCheckMessage({ message: "Checking answer...", tone: "neutral" });

    void getOrComputeExerciseExpectedOutput({
      databasePreload,
      exerciseCode: exercise.query,
      exerciseId: exercise.id,
      lessonId,
    }).then((expectedOutputResult) => {
      if (expectedOutputResult.isErr()) {
        const message = expectedOutputResult.error;

        setCheckMessage({ message, tone: "error" });
        captureExerciseExecution({
          exercise,
          lessonId,
          result: { message, query, status: "failed", view: "result" },
        });
        return;
      }

      void exerciseCheck({
        databasePreload,
        expectedOutput: expectedOutputResult.value,
        userCode: query,
      }).then((checkResult) => {
        checkResult.match(
          (check) => {
            captureExerciseExecution({
              exercise,
              lessonId,
              result:
                check.status === "correct"
                  ? { query, status: "succeeded", view: "result" }
                  : {
                      message:
                        check.reason === "result-mismatch"
                          ? "Exercise result mismatch."
                          : "Exercise explain plan mismatch.",
                      query,
                      status: "failed",
                      view: "result",
                    },
            });

            if (check.status === "incorrect") {
              setCheckMessage({
                message:
                  check.reason === "result-mismatch"
                    ? "The query ran, but the result does not match the expected answer."
                    : "The result matches, but the query plan does not match the expected answer.",
                tone: "error",
              });
              return;
            }

            setCheckMessage({ message: "Correct.", tone: "success" });
            saveExerciseProgress({
              completed: exerciseState.completed.includes(exercise.id)
                ? exerciseState.completed
                : [...exerciseState.completed, exercise.id],
              queries: { ...exerciseState.queries, [exercise.id]: query },
            });
          },
          (message) => {
            setCheckMessage({ message, tone: "error" });
            captureExerciseExecution({
              exercise,
              lessonId,
              result: { message, query, status: "failed", view: "result" },
            });
          },
        );
      });
    });
  }

  return { checkMessage, exerciseState, handleExecution, handleSuccess };
}

export function ExerciseCheckMessage({
  message,
}: {
  message: ExerciseCheckMessageValue;
}) {
  const isError = message.tone === "error";

  return (
    <p
      className={[
        "mt-4 flex items-center gap-2 font-mono text-sm",
        isError
          ? "font-semibold text-red-700"
          : message.tone === "success"
            ? "text-emerald-700"
            : "text-zinc-600",
      ].join(" ")}
    >
      {isError ? (
        <span
          aria-hidden="true"
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs text-red-700"
        >
          !
        </span>
      ) : null}
      <span>{message.message}</span>
    </p>
  );
}

function captureExerciseExecution({
  exercise,
  lessonId,
  result,
}: {
  exercise: SqlExample;
  lessonId: LessonId;
  result: SqlEditorExecutionResult;
}) {
  posthog.capture("pgquest_exercise_executed", {
    exercise_id: exercise.id,
    exercise_name: exercise.name,
    lesson_id: lessonId,
    query_length: result.query.length,
    status: result.status,
    view: result.view,
  });
}
