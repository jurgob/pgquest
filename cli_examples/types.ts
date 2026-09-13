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
  example2SchemaDatabaseInit: sqlExampleId("example2SchemaDatabaseInit"),
  example2ListSchemas: sqlExampleId("example2ListSchemas"),
  example2ListTables: sqlExampleId("example2ListTables"),
  example2InspectColumns: sqlExampleId("example2InspectColumns"),
  example2ExerciseListLibraryTables: sqlExampleId("example2ExerciseListLibraryTables"),
  example2ExerciseInspectPageViews: sqlExampleId("example2ExerciseInspectPageViews"),
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
  example3InsertReturning: sqlExampleId("example3InsertReturning"),
  example3UpdateReturning: sqlExampleId("example3UpdateReturning"),
  example3DeleteReturning: sqlExampleId("example3DeleteReturning"),
  example3ExerciseInsert: sqlExampleId("example3ExerciseInsert"),
  example3ExerciseUpdate: sqlExampleId("example3ExerciseUpdate"),
  example4DatabaseInit: sqlExampleId("example4DatabaseInit"),
  example4InsertValidProduct: sqlExampleId("example4InsertValidProduct"),
  example4ListConstraints: sqlExampleId("example4ListConstraints"),
  example4ExerciseInsertProduct: sqlExampleId("example4ExerciseInsertProduct"),
  example4ExerciseFindConstraints: sqlExampleId("example4ExerciseFindConstraints"),
  example5DatabaseInit: sqlExampleId("example5DatabaseInit"),
  example5LowSelectivity: sqlExampleId("example5LowSelectivity"),
  example5CompositeIndex: sqlExampleId("example5CompositeIndex"),
  example5PartialIndex: sqlExampleId("example5PartialIndex"),
  example5ExerciseRecentPaidOrders: sqlExampleId("example5ExerciseRecentPaidOrders"),
  example5ExerciseFailedOrder: sqlExampleId("example5ExerciseFailedOrder"),
  example6DatabaseInit: sqlExampleId("example6DatabaseInit"),
  example6Totals: sqlExampleId("example6Totals"),
  example6GroupBy: sqlExampleId("example6GroupBy"),
  example6Having: sqlExampleId("example6Having"),
  example6ExerciseCountPaid: sqlExampleId("example6ExerciseCountPaid"),
  example6ExerciseGroupByStatus: sqlExampleId("example6ExerciseGroupByStatus"),
  example7DatabaseInit: sqlExampleId("example7DatabaseInit"),
  example7FindNull: sqlExampleId("example7FindNull"),
  example7Coalesce: sqlExampleId("example7Coalesce"),
  example7NullComparison: sqlExampleId("example7NullComparison"),
  example7ExerciseFindOpen: sqlExampleId("example7ExerciseFindOpen"),
  example7ExerciseCoalesceClosedAt: sqlExampleId("example7ExerciseCoalesceClosedAt"),
  example8DatabaseInit: sqlExampleId("example8DatabaseInit"),
  example8InnerJoin: sqlExampleId("example8InnerJoin"),
  example8LeftJoin: sqlExampleId("example8LeftJoin"),
  example8JoinAggregate: sqlExampleId("example8JoinAggregate"),
  example8ExerciseAuthorBooks: sqlExampleId("example8ExerciseAuthorBooks"),
  example8ExerciseBooksWithoutReviews: sqlExampleId(
    "example8ExerciseBooksWithoutReviews",
  ),
  example9DatabaseInit: sqlExampleId("example9DatabaseInit"),
  example9OneToMany: sqlExampleId("example9OneToMany"),
  example9ManyToMany: sqlExampleId("example9ManyToMany"),
  example9ForeignKeyIndexes: sqlExampleId("example9ForeignKeyIndexes"),
  example9ExerciseProjectMembers: sqlExampleId("example9ExerciseProjectMembers"),
  example9ExerciseMemberCount: sqlExampleId("example9ExerciseMemberCount"),
  example10DatabaseInit: sqlExampleId("example10DatabaseInit"),
  example10OrderedEvents: sqlExampleId("example10OrderedEvents"),
  example10PageEvents: sqlExampleId("example10PageEvents"),
  example10IndexBackedOrder: sqlExampleId("example10IndexBackedOrder"),
  example10ExerciseNewestThree: sqlExampleId("example10ExerciseNewestThree"),
  example10ExerciseSecondPage: sqlExampleId("example10ExerciseSecondPage"),
  example11DatabaseInit: sqlExampleId("example11DatabaseInit"),
  example11LikePrefix: sqlExampleId("example11LikePrefix"),
  example11IlikeContains: sqlExampleId("example11IlikeContains"),
  example11LowerSearch: sqlExampleId("example11LowerSearch"),
  example11ExerciseFindPostgres: sqlExampleId("example11ExerciseFindPostgres"),
  example11ExerciseFindGuide: sqlExampleId("example11ExerciseFindGuide"),
  example12DatabaseInit: sqlExampleId("example12DatabaseInit"),
  example12ExtractJson: sqlExampleId("example12ExtractJson"),
  example12FilterJson: sqlExampleId("example12FilterJson"),
  example12ContainJson: sqlExampleId("example12ContainJson"),
  example12ExerciseFindProPlan: sqlExampleId("example12ExerciseFindProPlan"),
  example12ExerciseFindEmailOptIn: sqlExampleId("example12ExerciseFindEmailOptIn"),
  example13DatabaseInit: sqlExampleId("example13DatabaseInit"),
  example13CommitTransfer: sqlExampleId("example13CommitTransfer"),
  example13RollbackTransfer: sqlExampleId("example13RollbackTransfer"),
  example13ExerciseCommitBonus: sqlExampleId("example13ExerciseCommitBonus"),
  example14DatabaseInit: sqlExampleId("example14DatabaseInit"),
  example14Having: sqlExampleId("example14Having"),
  example14Filter: sqlExampleId("example14Filter"),
  example14DateTrunc: sqlExampleId("example14DateTrunc"),
  example14ExerciseDailyRevenue: sqlExampleId("example14ExerciseDailyRevenue"),
  example14ExercisePaidFilter: sqlExampleId("example14ExercisePaidFilter"),
  example15DatabaseInit: sqlExampleId("example15DatabaseInit"),
  example15NearestVector: sqlExampleId("example15NearestVector"),
  example15DistanceScore: sqlExampleId("example15DistanceScore"),
  example15ExerciseFindSqlVector: sqlExampleId("example15ExerciseFindSqlVector"),
  example15ExerciseFindIndexVector: sqlExampleId("example15ExerciseFindIndexVector"),
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
