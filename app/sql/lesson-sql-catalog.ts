import {
  database_inits as exampleOneDatabaseInits,
  exercises as exampleOneExercises,
} from "../../cli_examples/example1.sql";
import {
  database_inits as exampleTwoDatabaseInits,
  exercises as exampleTwoExercises,
} from "../../cli_examples/example2a.sql";
import {
  database_inits as exampleThreeDatabaseInits,
  exercises as exampleThreeExercises,
} from "../../cli_examples/example3.sql";
import {
  database_inits as exampleFourDatabaseInits,
  exercises as exampleFourExercises,
} from "../../cli_examples/example4.sql";
import {
  database_inits as exampleFiveDatabaseInits,
  exercises as exampleFiveExercises,
} from "../../cli_examples/example5.sql";
import {
  database_inits as exampleSixDatabaseInits,
  exercises as exampleSixExercises,
} from "../../cli_examples/example6.sql";
import {
  database_inits as exampleSevenDatabaseInits,
  exercises as exampleSevenExercises,
} from "../../cli_examples/example7.sql";
import {
  database_inits as exampleEightDatabaseInits,
  exercises as exampleEightExercises,
} from "../../cli_examples/example8.sql";
import {
  database_inits as exampleNineDatabaseInits,
  exercises as exampleNineExercises,
} from "../../cli_examples/example9.sql";
import {
  database_inits as exampleTenDatabaseInits,
  exercises as exampleTenExercises,
} from "../../cli_examples/example10.sql";
import {
  database_inits as exampleElevenDatabaseInits,
  exercises as exampleElevenExercises,
} from "../../cli_examples/example11.sql";
import {
  database_inits as exampleTwelveDatabaseInits,
  exercises as exampleTwelveExercises,
} from "../../cli_examples/example12.sql";
import {
  database_inits as exampleThirteenDatabaseInits,
  exercises as exampleThirteenExercises,
} from "../../cli_examples/example13.sql";
import {
  database_inits as exampleFourteenDatabaseInits,
  exercises as exampleFourteenExercises,
} from "../../cli_examples/example14.sql";
import {
  database_inits as exampleFifteenDatabaseInits,
  exercises as exampleFifteenExercises,
} from "../../cli_examples/example15.sql";
import type { SqlExample } from "../../cli_examples/types";
import { LESSON_IDS, type LessonId } from "./types";

export type LessonExercise = SqlExample & {
  lessonId: LessonId;
};

export const lessonIds: readonly LessonId[] = LESSON_IDS;

export const allExercises: readonly LessonExercise[] = [
  ...exampleOneExercises.map((exercise) => ({
    ...exercise,
    lessonId: "lesson1" as const,
  })),
  ...exampleTwoExercises.map((exercise) => ({
    ...exercise,
    lessonId: "lesson2" as const,
  })),
  ...exampleThreeExercises.map((exercise) => ({
    ...exercise,
    lessonId: "lesson3" as const,
  })),
  ...exampleFourExercises.map((exercise) => ({
    ...exercise,
    lessonId: "lesson4" as const,
  })),
  ...exampleFiveExercises.map((exercise) => ({
    ...exercise,
    lessonId: "lesson5" as const,
  })),
  ...exampleSixExercises.map((exercise) => ({
    ...exercise,
    lessonId: "lesson6" as const,
  })),
  ...exampleSevenExercises.map((exercise) => ({
    ...exercise,
    lessonId: "lesson7" as const,
  })),
  ...exampleEightExercises.map((exercise) => ({
    ...exercise,
    lessonId: "lesson8" as const,
  })),
  ...exampleNineExercises.map((exercise) => ({
    ...exercise,
    lessonId: "lesson9" as const,
  })),
  ...exampleTenExercises.map((exercise) => ({
    ...exercise,
    lessonId: "lesson10" as const,
  })),
  ...exampleElevenExercises.map((exercise) => ({
    ...exercise,
    lessonId: "lesson11" as const,
  })),
  ...exampleTwelveExercises.map((exercise) => ({
    ...exercise,
    lessonId: "lesson12" as const,
  })),
  ...exampleThirteenExercises.map((exercise) => ({
    ...exercise,
    lessonId: "lesson13" as const,
  })),
  ...exampleFourteenExercises.map((exercise) => ({
    ...exercise,
    lessonId: "lesson14" as const,
  })),
  ...exampleFifteenExercises.map((exercise) => ({
    ...exercise,
    lessonId: "lesson15" as const,
  })),
];

export const allDatabaseInits: readonly SqlExample[] = [
  ...exampleOneDatabaseInits,
  ...exampleTwoDatabaseInits,
  ...exampleThreeDatabaseInits,
  ...exampleFourDatabaseInits,
  ...exampleFiveDatabaseInits,
  ...exampleSixDatabaseInits,
  ...exampleSevenDatabaseInits,
  ...exampleEightDatabaseInits,
  ...exampleNineDatabaseInits,
  ...exampleTenDatabaseInits,
  ...exampleElevenDatabaseInits,
  ...exampleTwelveDatabaseInits,
  ...exampleThirteenDatabaseInits,
  ...exampleFourteenDatabaseInits,
  ...exampleFifteenDatabaseInits,
];

export function getLessonExerciseStats(lessonId: LessonId, completed: readonly string[]) {
  const exercises = allExercises.filter((exercise) => exercise.lessonId === lessonId);

  return {
    completed: exercises.filter((exercise) => completed.includes(exercise.id)).length,
    total: exercises.length,
  };
}
