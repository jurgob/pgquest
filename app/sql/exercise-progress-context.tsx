import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  exerciseCounts,
  loadExerciseProgress,
  saveExerciseProgress,
  type ExerciseProgress,
} from "./exercise-progress";

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

export function useExerciseProgress(lessonId: keyof typeof exerciseCounts) {
  const context = useContext(ExerciseProgressContext);

  if (!context) {
    throw new Error("useExerciseProgress must be used inside ExerciseProgressProvider");
  }

  const { progressMap, setProgressMap } = context;
  const progress = progressMap[lessonId] ?? emptyProgress;

  return useMemo(
    () => ({
      isComplete:
        exerciseCounts[lessonId] > 0 &&
        progress.completed.length >= exerciseCounts[lessonId],
      progress,
      save: (nextProgress: ExerciseProgress) => {
        saveExerciseProgress(lessonId, nextProgress);
        setProgressMap((current) => ({ ...current, [lessonId]: nextProgress }));
      },
    }),
    [lessonId, progress, setProgressMap],
  );
}
