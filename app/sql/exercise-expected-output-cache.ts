import { okAsync } from "neverthrow";
import type { SqlExampleId } from "../../cli_examples/types";
import { computeExerciseExpectedOutput } from "./exercise-checker";
import type { ExecutionOutput, LessonId } from "./types";

const cacheVersion = 1;

type ExerciseExpectedOutputCacheInput = {
  databasePreload: string;
  exerciseCode: string;
  exerciseId: SqlExampleId;
  lessonId: LessonId;
};

type CachedExpectedOutput = {
  output: ExecutionOutput;
  version: typeof cacheVersion;
};

export function getOrComputeExerciseExpectedOutput(
  input: ExerciseExpectedOutputCacheInput,
) {
  const cachedOutput = loadCachedExerciseExpectedOutput(input);

  if (cachedOutput) {
    return okAsync(cachedOutput);
  }

  return computeExerciseExpectedOutput(input).andTee((output) => {
    saveCachedExerciseExpectedOutput(input, output);
  });
}

function loadCachedExerciseExpectedOutput({
  databasePreload,
  exerciseCode,
  exerciseId,
  lessonId,
}: ExerciseExpectedOutputCacheInput): ExecutionOutput | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    const stored = window.localStorage.getItem(
      getExerciseExpectedOutputCacheKey({
        databasePreload,
        exerciseCode,
        exerciseId,
        lessonId,
      }),
    );
    const parsed = stored ? (JSON.parse(stored) as Partial<CachedExpectedOutput>) : {};

    return parsed.version === cacheVersion && isExecutionOutput(parsed.output)
      ? parsed.output
      : undefined;
  } catch {
    return undefined;
  }
}

function saveCachedExerciseExpectedOutput(
  input: ExerciseExpectedOutputCacheInput,
  output: ExecutionOutput,
) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    getExerciseExpectedOutputCacheKey(input),
    JSON.stringify({ output, version: cacheVersion } satisfies CachedExpectedOutput),
  );
}

function getExerciseExpectedOutputCacheKey({
  databasePreload,
  exerciseCode,
  exerciseId,
  lessonId,
}: ExerciseExpectedOutputCacheInput) {
  return [
    "pgquest:exercise-expected-output",
    lessonId,
    exerciseId,
    hashString(`${databasePreload}\n${exerciseCode}`),
  ].join(":");
}

function isExecutionOutput(value: unknown): value is ExecutionOutput {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<ExecutionOutput>;

  return Array.isArray(candidate.rows) && typeof candidate.plan === "string";
}

function hashString(value: string) {
  return [...value]
    .reduce((hash, char) => {
      const nextHash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
      return nextHash >>> 0;
    }, 2166136261)
    .toString(36);
}
