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
