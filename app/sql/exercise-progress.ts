export const exerciseCounts = {
  lesson1: 3,
  lesson2: 0,
} as const;

export type ExerciseProgress = {
  completed: string[];
  queries: Record<string, string>;
};

export function loadExerciseProgress(storageKey: string): ExerciseProgress {
  if (typeof window === "undefined") {
    return { completed: [], queries: {} };
  }

  try {
    const stored = window.localStorage.getItem(`pgquest:exercises:${storageKey}`);
    const parsed = stored ? (JSON.parse(stored) as Partial<ExerciseProgress>) : {};

    return {
      completed: Array.isArray(parsed.completed)
        ? parsed.completed.filter((id): id is string => typeof id === "string")
        : [],
      queries:
        parsed.queries && typeof parsed.queries === "object"
          ? Object.fromEntries(
              Object.entries(parsed.queries).filter(
                ([, query]) => typeof query === "string",
              ),
            )
          : {},
    };
  } catch {
    return { completed: [], queries: {} };
  }
}

export function saveExerciseProgress(storageKey: string, progress: ExerciseProgress) {
  window.localStorage.setItem(
    `pgquest:exercises:${storageKey}`,
    JSON.stringify(progress),
  );
}
