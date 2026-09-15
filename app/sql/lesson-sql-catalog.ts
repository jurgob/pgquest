import {
  database_inits as exampleOneDatabaseInits,
  exercises as exampleOneExercises,
} from "../../cli_examples/my-first-query.sql";
import {
  database_inits as exampleTwoDatabaseInits,
  exercises as exampleTwoExercises,
} from "../../cli_examples/schemas-tables-and-types.sql";
import {
  database_inits as exampleThreeDatabaseInits,
  exercises as exampleThreeExercises,
} from "../../cli_examples/introduction-to-indexes.sql";
import {
  database_inits as exampleFourDatabaseInits,
  exercises as exampleFourExercises,
} from "../../cli_examples/insert-update-delete.sql";
import {
  database_inits as exampleFiveDatabaseInits,
  exercises as exampleFiveExercises,
} from "../../cli_examples/constraints.sql";
import {
  database_inits as exampleSixDatabaseInits,
  exercises as exampleSixExercises,
} from "../../cli_examples/advanced-indexes.sql";
import {
  database_inits as exampleSevenDatabaseInits,
  exercises as exampleSevenExercises,
} from "../../cli_examples/aggregation-intro.sql";
import {
  database_inits as exampleEightDatabaseInits,
  exercises as exampleEightExercises,
} from "../../cli_examples/null.sql";
import {
  database_inits as exampleNineDatabaseInits,
  exercises as exampleNineExercises,
} from "../../cli_examples/joins.sql";
import {
  database_inits as exampleTenDatabaseInits,
  exercises as exampleTenExercises,
} from "../../cli_examples/relationships.sql";
import {
  database_inits as exampleElevenDatabaseInits,
  exercises as exampleElevenExercises,
} from "../../cli_examples/sorting-and-pagination.sql";
import {
  database_inits as exampleTwelveDatabaseInits,
  exercises as exampleTwelveExercises,
} from "../../cli_examples/text-search-basics.sql";
import {
  database_inits as exampleThirteenDatabaseInits,
  exercises as exampleThirteenExercises,
} from "../../cli_examples/json-in-postgresql.sql";
import {
  database_inits as exampleFourteenDatabaseInits,
  exercises as exampleFourteenExercises,
} from "../../cli_examples/transactions.sql";
import {
  database_inits as exampleFifteenDatabaseInits,
  exercises as exampleFifteenExercises,
} from "../../cli_examples/advanced-aggregation.sql";
import {
  database_inits as exampleSixteenDatabaseInits,
  exercises as exampleSixteenExercises,
} from "../../cli_examples/vectors.sql";
import type { SqlExample } from "../../cli_examples/types";
import { lessons } from "./lesson-catalog";
import type { LessonId } from "./types";

export type LessonExercise = SqlExample & {
  lessonId: LessonId;
};

export type LessonDatabaseInit = SqlExample & {
  lessonId: LessonId;
};

export const lessonIds: readonly LessonId[] = lessons.map((lesson) => lesson.id);

const lessonSqlById = {
  "my-first-query": {
    databaseInits: exampleOneDatabaseInits,
    exercises: exampleOneExercises,
  },
  "schemas-tables-and-types": {
    databaseInits: exampleTwoDatabaseInits,
    exercises: exampleTwoExercises,
  },
  "introduction-to-indexes": {
    databaseInits: exampleThreeDatabaseInits,
    exercises: exampleThreeExercises,
  },
  "insert-update-delete": {
    databaseInits: exampleFourDatabaseInits,
    exercises: exampleFourExercises,
  },
  constraints: {
    databaseInits: exampleFiveDatabaseInits,
    exercises: exampleFiveExercises,
  },
  "advanced-indexes": {
    databaseInits: exampleSixDatabaseInits,
    exercises: exampleSixExercises,
  },
  "aggregation-intro": {
    databaseInits: exampleSevenDatabaseInits,
    exercises: exampleSevenExercises,
  },
  null: {
    databaseInits: exampleEightDatabaseInits,
    exercises: exampleEightExercises,
  },
  joins: {
    databaseInits: exampleNineDatabaseInits,
    exercises: exampleNineExercises,
  },
  relationships: {
    databaseInits: exampleTenDatabaseInits,
    exercises: exampleTenExercises,
  },
  "sorting-and-pagination": {
    databaseInits: exampleElevenDatabaseInits,
    exercises: exampleElevenExercises,
  },
  "text-search-basics": {
    databaseInits: exampleTwelveDatabaseInits,
    exercises: exampleTwelveExercises,
  },
  "json-in-postgresql": {
    databaseInits: exampleThirteenDatabaseInits,
    exercises: exampleThirteenExercises,
  },
  transactions: {
    databaseInits: exampleFourteenDatabaseInits,
    exercises: exampleFourteenExercises,
  },
  "advanced-aggregation": {
    databaseInits: exampleFifteenDatabaseInits,
    exercises: exampleFifteenExercises,
  },
  vectors: {
    databaseInits: exampleSixteenDatabaseInits,
    exercises: exampleSixteenExercises,
  },
} as const satisfies Record<
  LessonId,
  {
    databaseInits: readonly SqlExample[];
    exercises: readonly SqlExample[];
  }
>;

export const allExercises: readonly LessonExercise[] = lessons.flatMap((lesson) =>
  lessonSqlById[lesson.id].exercises.map((exercise) => ({
    ...exercise,
    lessonId: lesson.id,
  })),
);

export const allDatabaseInits: readonly LessonDatabaseInit[] = lessons.flatMap((lesson) =>
  lessonSqlById[lesson.id].databaseInits.map((databaseInit) => ({
    ...databaseInit,
    lessonId: lesson.id,
  })),
);

export function getLessonExerciseStats(lessonId: LessonId, completed: readonly string[]) {
  const exercises = allExercises.filter((exercise) => exercise.lessonId === lessonId);

  return {
    completed: exercises.filter((exercise) => completed.includes(exercise.id)).length,
    total: exercises.length,
  };
}
