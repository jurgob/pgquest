import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  loadExerciseProgress,
  saveExerciseProgress,
  type ExerciseProgress,
} from "./exercise-progress";
import { allExercises, lessonIds } from "./lesson-sql-catalog";
import type { LessonId } from "./types";

type ProgressMap = Record<string, ExerciseProgress>;
type ExerciseProgressContextValue = {
  progressMap: ProgressMap;
  setProgressMap: React.Dispatch<React.SetStateAction<ProgressMap>>;
};

const emptyProgress: ExerciseProgress = { completed: [], queries: {} };
const ExerciseProgressContext = createContext<ExerciseProgressContextValue | undefined>(
  undefined,
);

export function ExerciseProgressProvider({ children }: { children: React.ReactNode }) {
  const [progressMap, setProgressMap] = useState<ProgressMap>({});

  useEffect(() => {
    setProgressMap({
      lesson1: loadExerciseProgress("lesson1"),
      lesson2: loadExerciseProgress("lesson2"),
    });
  }, []);

  return (
    <ExerciseProgressContext.Provider value={{ progressMap, setProgressMap }}>
      {children}
    </ExerciseProgressContext.Provider>
  );
}

export function useExerciseProgress(lessonId: LessonId) {
  const context = useContext(ExerciseProgressContext);

  if (!context) {
    throw new Error("useExerciseProgress must be used inside ExerciseProgressProvider");
  }

  const { progressMap, setProgressMap } = context;
  const progress = progressMap[lessonId] ?? emptyProgress;

  return useMemo(
    () => ({
      isComplete:
        allExercises.some((exercise) => exercise.lessonId === lessonId) &&
        allExercises
          .filter((exercise) => exercise.lessonId === lessonId)
          .every((exercise) => progress.completed.includes(exercise.id)),
      progress,
      save: (nextProgress: ExerciseProgress) => {
        saveExerciseProgress(lessonId, nextProgress);
        setProgressMap((current) => ({ ...current, [lessonId]: nextProgress }));
      },
    }),
    [lessonId, progress, setProgressMap],
  );
}

export function useAllExercisesComplete() {
  const context = useContext(ExerciseProgressContext);

  if (!context) {
    throw new Error(
      "useAllExercisesComplete must be used inside ExerciseProgressProvider",
    );
  }

  return lessonIds.every((lessonId) => {
    const exercises = allExercises.filter((exercise) => exercise.lessonId === lessonId);
    const progress = context.progressMap[lessonId];

    return (
      exercises.length > 0 &&
      exercises.every((exercise) => progress?.completed.includes(exercise.id))
    );
  });
}
