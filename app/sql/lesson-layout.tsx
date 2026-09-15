import { useEffect, useState } from "react";
import posthog from "posthog-js";
import type { SqlExample } from "../../cli_examples/types";
import { exerciseCheck } from "./exercise-checker";
import { getOrComputeExerciseExpectedOutput } from "./exercise-expected-output-cache";
import { useExerciseProgress } from "./exercise-progress-context";
import { SiteHeader } from "./site-header";
import type { LessonId } from "./types";
import { SqlEditor, type SqlEditorExecutionResult } from "./sql-editor";

export type WhatWeLearnedItem = {
  concept: string;
  description: React.ReactNode;
  url?: string | undefined;
};

export function LessonPage({
  activeLesson,
  children,
  defaultQuery,
  exercises,
  preloadId,
  sqlLoad,
  title,
  whatWeLearned,
}: {
  activeLesson: LessonId;
  children: React.ReactNode;
  defaultQuery?: string | undefined;
  exercises?: readonly SqlExample[] | undefined;
  preloadId?: string | undefined;
  sqlLoad?: string | undefined;
  title: string;
  whatWeLearned?: readonly WhatWeLearnedItem[] | undefined;
}) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-zinc-950">
      <SiteHeader activeLesson={activeLesson} />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8">
        <article className="flex min-w-0 flex-col gap-6">
          <Title>{title}</Title>
          <div className="flex min-w-0 flex-col gap-6">{children}</div>
          <TryYourself
            defaultQuery={defaultQuery}
            exercises={exercises}
            preloadId={preloadId}
            sqlLoad={sqlLoad}
            storageKey={activeLesson}
          />
          <WhatWeLearned items={whatWeLearned} />
        </article>
      </div>
    </main>
  );
}

export function WhatWeLearned({
  items,
}: {
  items?: readonly WhatWeLearnedItem[] | undefined;
}) {
  if (!items?.length) {
    return null;
  }

  return (
    <section className="mt-6 border-t border-zinc-200 pt-8">
      <Title2>What We Learned</Title2>
      <ul className="mt-5 flex flex-col gap-5">
        {items.map((item) => (
          <li className="text-base leading-7 text-zinc-800" key={item.concept}>
            {item.url ? (
              <a
                className="font-semibold text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900"
                href={item.url}
                rel="noreferrer"
                target="_blank"
              >
                {item.concept}
              </a>
            ) : (
              <span className="font-semibold text-zinc-950">{item.concept}</span>
            )}
            <span className="ml-2">{item.description}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Section({ children }: { children: React.ReactNode }) {
  return <section className="min-w-0">{children}</section>;
}

export function LessonSection({ children }: { children: React.ReactNode }) {
  return (
    <section className="mt-6 flex min-w-0 flex-col gap-6 border-t border-zinc-200 pt-8">
      {children}
    </section>
  );
}

export function Title({ children }: { children: React.ReactNode }) {
  return <h1 className="text-3xl font-bold text-zinc-950">{children}</h1>;
}

export function Title2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-2xl font-bold text-zinc-950">{children}</h2>;
}

export function Paragraph({ children }: { children: React.ReactNode }) {
  return <p className="text-base leading-7 text-zinc-800">{children}</p>;
}

export function Paragraphs({ children }: { children: React.ReactNode }) {
  return <div className="mt-3 text-base leading-7 text-zinc-800">{children}</div>;
}

export function InlineCode({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string | undefined;
}) {
  return (
    <code
      className={[
        "rounded-sm border border-zinc-200 bg-zinc-100 px-1 py-0.5 font-mono text-sm font-medium text-zinc-950",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </code>
  );
}

export function TryYourself({
  defaultQuery,
  exercises,
  preloadId,
  sqlLoad,
  storageKey,
}: {
  defaultQuery?: string | undefined;
  exercises?: readonly SqlExample[] | undefined;
  preloadId?: string | undefined;
  sqlLoad?: string | undefined;
  storageKey: LessonId;
}) {
  const [activeExerciseId, setActiveExerciseId] = useState<string | undefined>();
  const [checkMessage, setCheckMessage] = useState<CheckMessage | undefined>();
  const { progress: exerciseState, save: saveExerciseProgress } =
    useExerciseProgress(storageKey);

  useEffect(() => {
    setCheckMessage(undefined);
  }, [activeExerciseId]);

  if (!sqlLoad || !defaultQuery) {
    return null;
  }

  const activeExercise = exercises?.find((exercise) => exercise.id === activeExerciseId);
  const activeDatabasePreload = activeExercise?.database_init?.query ?? sqlLoad;
  const activePreloadId = activeExercise?.database_init?.id ?? preloadId;

  const editorQuery = activeExercise
    ? (exerciseState.queries[activeExercise.id] ?? "")
    : defaultQuery;
  const exerciseDescription = activeExercise
    ? activeExercise.description
    : "The database for this lesson is already loaded. Write any query you want and run it directly in your browser.";
  const completedCount =
    exercises?.filter((exercise) => exerciseState.completed.includes(exercise.id))
      .length ?? 0;
  const allExercisesCompleted = Boolean(
    exercises?.length && completedCount === exercises.length,
  );

  return (
    <footer className="mt-6 bg-zinc-50 px-5 py-6">
      <SqlEditor
        className="border-0 bg-transparent p-0"
        description={exerciseDescription}
        databaseInit={activeDatabasePreload}
        headerAction={
          activeExercise ? (
            <button
              className="shrink-0 rounded-sm border border-zinc-300 px-4 py-2 font-mono text-sm text-zinc-700 transition hover:border-zinc-950 hover:text-zinc-950"
              onClick={() => setActiveExerciseId(undefined)}
              type="button"
            >
              Back to Try Yourself
            </button>
          ) : null
        }
        onExecution={(result) => {
          if (!activeExercise) {
            return;
          }

          if (result.status === "succeeded") {
            return;
          }

          captureExerciseExecution({
            exercise: activeExercise,
            lessonId: storageKey,
            result,
          });
        }}
        onSuccess={(query) => {
          if (!activeExercise) {
            return;
          }

          setCheckMessage({ message: "Checking answer...", tone: "neutral" });

          void getOrComputeExerciseExpectedOutput({
            databasePreload: activeDatabasePreload,
            exerciseCode: activeExercise.query,
            exerciseId: activeExercise.id,
            lessonId: storageKey,
          }).then((expectedOutputResult) => {
            if (expectedOutputResult.isErr()) {
              const message = expectedOutputResult.error;

              setCheckMessage({ message, tone: "error" });
              captureExerciseExecution({
                exercise: activeExercise,
                lessonId: storageKey,
                result: {
                  message,
                  query,
                  status: "failed",
                  view: "result",
                },
              });
              return;
            }

            void exerciseCheck({
              databasePreload: activeDatabasePreload,
              expectedOutput: expectedOutputResult.value,
              userCode: query,
            }).then((checkResult) => {
              checkResult.match(
                (check) => {
                  captureExerciseExecution({
                    exercise: activeExercise,
                    lessonId: storageKey,
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
                    completed: exerciseState.completed.includes(activeExercise.id)
                      ? exerciseState.completed
                      : [...exerciseState.completed, activeExercise.id],
                    queries: { ...exerciseState.queries, [activeExercise.id]: query },
                  });
                },
                (message) => {
                  setCheckMessage({ message, tone: "error" });
                  captureExerciseExecution({
                    exercise: activeExercise,
                    lessonId: storageKey,
                    result: {
                      message,
                      query,
                      status: "failed",
                      view: "result",
                    },
                  });
                },
              );
            });
          });
        }}
        preloadId={activePreloadId}
        query={editorQuery}
        status={activeExercise ? "In progress" : undefined}
        title={activeExercise?.name ?? "Try Yourself"}
      />
      {activeExercise && checkMessage ? (
        <ExerciseCheckMessage message={checkMessage} />
      ) : null}
      {exercises?.length ? (
        <section className="mt-8 border-t border-zinc-200 pt-6">
          <div className="flex items-baseline gap-4">
            <Title2>Exercises</Title2>
            <span className="font-mono text-sm uppercase tracking-wide text-zinc-500">
              {completedCount} OF {exercises.length} DONE
            </span>
            {allExercisesCompleted ? <CompletionIcon /> : null}
          </div>
          <div className="mt-4 flex flex-col gap-2">
            {exercises.map((exercise, index) => (
              <div
                className={[
                  "flex items-center justify-between gap-4 border px-5 py-4 text-left transition",
                  exerciseState.completed.includes(exercise.id)
                    ? "border-emerald-200 bg-emerald-50"
                    : activeExercise?.id === exercise.id
                      ? "border-zinc-950"
                      : "border-zinc-200 hover:border-zinc-950",
                ].join(" ")}
                key={exercise.id}
              >
                <span className="flex min-w-0 items-start gap-4">
                  <span className="font-mono text-lg text-zinc-400">{index + 1}.</span>
                  <span className="select-text text-base leading-7 text-zinc-800">
                    {exercise.description}
                  </span>
                </span>
                <button
                  className={[
                    "shrink-0 border px-4 py-2 font-mono text-sm",
                    exerciseState.completed.includes(exercise.id)
                      ? "border-zinc-300 text-zinc-700"
                      : activeExercise?.id === exercise.id
                        ? "border-zinc-950 bg-zinc-950 text-white"
                        : "border-zinc-300 text-zinc-700",
                  ].join(" ")}
                  onClick={() => {
                    setActiveExerciseId(exercise.id);
                    void getOrComputeExerciseExpectedOutput({
                      databasePreload: exercise.database_init?.query ?? sqlLoad,
                      exerciseCode: exercise.query,
                      exerciseId: exercise.id,
                      lessonId: storageKey,
                    });
                    captureExerciseSelected({
                      exercise,
                      index,
                      lessonId: storageKey,
                    });
                  }}
                  type="button"
                >
                  {exerciseState.completed.includes(exercise.id)
                    ? "Done · redo"
                    : activeExercise?.id === exercise.id
                      ? "In progress"
                      : "Do it"}
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </footer>
  );
}

type CheckMessage = {
  message: string;
  tone: "error" | "neutral" | "success";
};

function ExerciseCheckMessage({ message }: { message: CheckMessage }) {
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

function captureExerciseSelected({
  exercise,
  index,
  lessonId,
}: {
  exercise: SqlExample;
  index: number;
  lessonId: LessonId;
}) {
  posthog.capture("pgquest_exercise_selected", {
    exercise_id: exercise.id,
    exercise_index: index + 1,
    exercise_name: exercise.name,
    lesson_id: lessonId,
  });
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

function CompletionIcon() {
  return (
    <span
      aria-label="All exercises completed"
      className="text-emerald-600"
      title="All exercises completed"
    >
      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
        <path
          d="m8 12 2.5 2.5L16 9"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    </span>
  );
}
