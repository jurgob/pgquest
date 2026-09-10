import {
  database_inits as exampleOneDatabaseInits,
  exercises as exampleOneExercises,
} from "../../cli_examples/example1.sql";
import {
  database_inits as exampleTwoDatabaseInits,
  exercises as exampleTwoExercises,
} from "../../cli_examples/example2a.sql";
import type { SqlExample } from "../../cli_examples/types";
import type { LessonId } from "./types";

export type LessonExercise = SqlExample & {
  lessonId: LessonId;
};

export const lessonIds: readonly LessonId[] = ["lesson1", "lesson2"];

export const allExercises: readonly LessonExercise[] = [
  ...exampleOneExercises.map((exercise) => ({
    ...exercise,
    lessonId: "lesson1" as const,
  })),
  ...exampleTwoExercises.map((exercise) => ({
    ...exercise,
    lessonId: "lesson2" as const,
  })),
];

export const allDatabaseInits: readonly SqlExample[] = [
  ...exampleOneDatabaseInits,
  ...exampleTwoDatabaseInits,
];
