type Brand<Value, Name extends string> = Value & {
  readonly __brand: Name;
};

export type SqlStatement = Brand<string, "SqlStatement">;
export type SqlExampleTitle = Brand<string, "SqlExampleTitle">;
export type SqlExampleDescription = Brand<string, "SqlExampleDescription">;
export type SqlExampleId = Brand<string, "SqlExampleId">;

function brand<Value extends string, Name extends string>(value: Value) {
  return value as Brand<Value, Name>;
}

export function sqlStatement(value: string): SqlStatement {
  return brand<string, "SqlStatement">(value);
}

export function sqlExampleTitle(value: string): SqlExampleTitle {
  return brand<string, "SqlExampleTitle">(value);
}

export function sqlExampleDescription(value: string): SqlExampleDescription {
  return brand<string, "SqlExampleDescription">(value);
}

const sqlExampleId = <Value extends string>(value: Value) =>
  brand<Value, "SqlExampleId">(value);

export const SQL_EXAMPLE_IDS = {
  example1DatabaseInit: sqlExampleId("example1DatabaseInit"),
  example1MigrationInit: sqlExampleId("example1MigrationInit"),
  example1Migration: sqlExampleId("example1Migration"),
  example1Seed: sqlExampleId("example1Seed"),
  example1BasicSelect: sqlExampleId("example1BasicSelect"),
  example1SpecificSelect: sqlExampleId("example1SpecificSelect"),
  example1Insert: sqlExampleId("example1Insert"),
  example1ExerciseInsertEdger: sqlExampleId("example1ExerciseInsertEdger"),
  example1ExerciseInsertBarbara: sqlExampleId("example1ExerciseInsertBarbara"),
  example1ExerciseSelectGrace: sqlExampleId("example1ExerciseSelectGrace"),
  example2MigrationInit: sqlExampleId("example2MigrationInit"),
  example2Migration: sqlExampleId("example2Migration"),
  example2Seed: sqlExampleId("example2Seed"),
  example2IndexedMigration: sqlExampleId("example2IndexedMigration"),
  example2DatabaseInit: sqlExampleId("example2DatabaseInit"),
  example2IndexedDatabaseInit: sqlExampleId("example2IndexedDatabaseInit"),
  example2SequentialScan: sqlExampleId("example2SequentialScan"),
  example2IndexScan: sqlExampleId("example2IndexScan"),
  example2ExerciseFindUser2048: sqlExampleId("example2ExerciseFindUser2048"),
  example3DatabaseInit: sqlExampleId("example3DatabaseInit"),
  example3DraftQuery: sqlExampleId("example3DraftQuery"),
  example4DatabaseInit: sqlExampleId("example4DatabaseInit"),
  example4DraftQuery: sqlExampleId("example4DraftQuery"),
  example5DatabaseInit: sqlExampleId("example5DatabaseInit"),
  example5DraftQuery: sqlExampleId("example5DraftQuery"),
  example6DatabaseInit: sqlExampleId("example6DatabaseInit"),
  example6DraftQuery: sqlExampleId("example6DraftQuery"),
  example7DatabaseInit: sqlExampleId("example7DatabaseInit"),
  example7DraftQuery: sqlExampleId("example7DraftQuery"),
  example8DatabaseInit: sqlExampleId("example8DatabaseInit"),
  example8DraftQuery: sqlExampleId("example8DraftQuery"),
  example9DatabaseInit: sqlExampleId("example9DatabaseInit"),
  example9DraftQuery: sqlExampleId("example9DraftQuery"),
  example10DatabaseInit: sqlExampleId("example10DatabaseInit"),
  example10DraftQuery: sqlExampleId("example10DraftQuery"),
  example11DatabaseInit: sqlExampleId("example11DatabaseInit"),
  example11DraftQuery: sqlExampleId("example11DraftQuery"),
  example12DatabaseInit: sqlExampleId("example12DatabaseInit"),
  example12DraftQuery: sqlExampleId("example12DraftQuery"),
  example13DatabaseInit: sqlExampleId("example13DatabaseInit"),
  example13DraftQuery: sqlExampleId("example13DraftQuery"),
  example14DatabaseInit: sqlExampleId("example14DatabaseInit"),
  example14DraftQuery: sqlExampleId("example14DraftQuery"),
  example15DatabaseInit: sqlExampleId("example15DatabaseInit"),
  example15DraftQuery: sqlExampleId("example15DraftQuery"),
} as const;

export type SqlExample = {
  name: SqlExampleTitle;
  id: SqlExampleId;
  description: SqlExampleDescription;
  database_init?: SqlExample;
  query: SqlStatement;
};

export function getSqlExample(
  examples: readonly SqlExample[],
  id: SqlExampleId,
): SqlExample {
  const example = examples.find((candidate) => candidate.id === id);

  if (!example) {
    throw new Error(`Missing SQL example: ${id}`);
  }

  return example;
}
