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
  myFirstQueryDatabaseInit: sqlExampleId("my-first-query.database-init"),
  myFirstQueryMigrationInit: sqlExampleId("my-first-query.migration-init"),
  myFirstQueryMigration: sqlExampleId("my-first-query.migration"),
  myFirstQuerySeed: sqlExampleId("my-first-query.seed"),
  myFirstQueryBasicSelect: sqlExampleId("my-first-query.basic-select"),
  myFirstQuerySpecificSelect: sqlExampleId("my-first-query.specific-select"),
  myFirstQueryInsert: sqlExampleId("my-first-query.insert"),
  myFirstQueryExerciseInsertEdger: sqlExampleId("my-first-query.insert-edger"),
  myFirstQueryExerciseInsertBarbara: sqlExampleId("my-first-query.insert-barbara"),
  myFirstQueryExerciseSelectGrace: sqlExampleId("my-first-query.select-grace"),
  schemasTablesAndTypesDatabaseInit: sqlExampleId(
    "schemas-tables-and-types.database-init",
  ),
  schemasTablesAndTypesListSchemas: sqlExampleId("schemas-tables-and-types.list-schemas"),
  schemasTablesAndTypesListTables: sqlExampleId("schemas-tables-and-types.list-tables"),
  schemasTablesAndTypesInspectColumns: sqlExampleId(
    "schemas-tables-and-types.inspect-columns",
  ),
  schemasTablesAndTypesExerciseListLibraryTables: sqlExampleId(
    "schemas-tables-and-types.list-library-tables",
  ),
  schemasTablesAndTypesExerciseInspectPageViews: sqlExampleId(
    "schemas-tables-and-types.inspect-page-views",
  ),
  introductionToIndexesMigrationInit: sqlExampleId(
    "introduction-to-indexes.migration-init",
  ),
  introductionToIndexesMigration: sqlExampleId("introduction-to-indexes.migration"),
  introductionToIndexesSeed: sqlExampleId("introduction-to-indexes.seed"),
  introductionToIndexesIndexedMigration: sqlExampleId(
    "introduction-to-indexes.indexed-migration",
  ),
  introductionToIndexesDatabaseInit: sqlExampleId(
    "introduction-to-indexes.database-init",
  ),
  introductionToIndexesIndexedDatabaseInit: sqlExampleId(
    "introduction-to-indexes.indexed-database-init",
  ),
  introductionToIndexesSequentialScan: sqlExampleId(
    "introduction-to-indexes.sequential-scan",
  ),
  introductionToIndexesIndexScan: sqlExampleId("introduction-to-indexes.index-scan"),
  introductionToIndexesExerciseFindUser2048: sqlExampleId(
    "introduction-to-indexes.find-user-2048",
  ),
  introductionToIndexesExerciseFindUser2048WithoutIndex: sqlExampleId(
    "introduction-to-indexes.find-user-2048-without-index",
  ),
  insertUpdateDeleteDatabaseInit: sqlExampleId("insert-update-delete.database-init"),
  insertUpdateDeleteInsertReturning: sqlExampleId(
    "insert-update-delete.insert-returning",
  ),
  insertUpdateDeleteUpdateReturning: sqlExampleId(
    "insert-update-delete.update-returning",
  ),
  insertUpdateDeleteDeleteReturning: sqlExampleId(
    "insert-update-delete.delete-returning",
  ),
  insertUpdateDeleteExerciseInsert: sqlExampleId("insert-update-delete.insert-user"),
  insertUpdateDeleteExerciseUpdate: sqlExampleId("insert-update-delete.update-user"),
  constraintsDatabaseInit: sqlExampleId("constraints.database-init"),
  constraintsInsertValidProduct: sqlExampleId("constraints.insert-valid-product"),
  constraintsListConstraints: sqlExampleId("constraints.list-constraints"),
  constraintsExerciseInsertProduct: sqlExampleId("constraints.insert-product"),
  constraintsExerciseFindConstraints: sqlExampleId("constraints.find-constraints"),
  advancedIndexesDatabaseInit: sqlExampleId("advanced-indexes.database-init"),
  advancedIndexesLowSelectivity: sqlExampleId("advanced-indexes.low-selectivity"),
  advancedIndexesCompositeIndex: sqlExampleId("advanced-indexes.composite-index"),
  advancedIndexesPartialIndex: sqlExampleId("advanced-indexes.partial-index"),
  advancedIndexesExerciseRecentPaidOrders: sqlExampleId(
    "advanced-indexes.recent-paid-orders",
  ),
  advancedIndexesExerciseFailedOrder: sqlExampleId("advanced-indexes.failed-order"),
  aggregationIntroDatabaseInit: sqlExampleId("aggregation-intro.database-init"),
  aggregationIntroTotals: sqlExampleId("aggregation-intro.totals"),
  aggregationIntroGroupBy: sqlExampleId("aggregation-intro.group-by"),
  aggregationIntroHaving: sqlExampleId("aggregation-intro.having"),
  aggregationIntroExerciseCountPaid: sqlExampleId("aggregation-intro.count-paid"),
  aggregationIntroExerciseGroupByStatus: sqlExampleId(
    "aggregation-intro.group-by-status",
  ),
  nullDatabaseInit: sqlExampleId("null.database-init"),
  nullFindNull: sqlExampleId("null.find-null"),
  nullCoalesce: sqlExampleId("null.coalesce"),
  nullComparison: sqlExampleId("null.comparison"),
  nullExerciseFindOpen: sqlExampleId("null.find-open"),
  nullExerciseCoalesceClosedAt: sqlExampleId("null.coalesce-closed-at"),
  joinsDatabaseInit: sqlExampleId("joins.database-init"),
  joinsInnerJoin: sqlExampleId("joins.inner-join"),
  joinsLeftJoin: sqlExampleId("joins.left-join"),
  joinsJoinAggregate: sqlExampleId("joins.join-aggregate"),
  joinsExerciseAuthorBooks: sqlExampleId("joins.author-books"),
  joinsExerciseBooksWithoutReviews: sqlExampleId("joins.books-without-reviews"),
  relationshipsDatabaseInit: sqlExampleId("relationships.database-init"),
  relationshipsOneToMany: sqlExampleId("relationships.one-to-many"),
  relationshipsManyToMany: sqlExampleId("relationships.many-to-many"),
  relationshipsForeignKeyIndexes: sqlExampleId("relationships.foreign-key-indexes"),
  relationshipsExerciseProjectMembers: sqlExampleId("relationships.project-members"),
  relationshipsExerciseMemberCount: sqlExampleId("relationships.member-count"),
  sortingAndPaginationDatabaseInit: sqlExampleId("sorting-and-pagination.database-init"),
  sortingAndPaginationOrderedEvents: sqlExampleId(
    "sorting-and-pagination.ordered-events",
  ),
  sortingAndPaginationPageEvents: sqlExampleId("sorting-and-pagination.page-events"),
  sortingAndPaginationIndexBackedOrder: sqlExampleId(
    "sorting-and-pagination.index-backed-order",
  ),
  sortingAndPaginationExerciseNewestThree: sqlExampleId(
    "sorting-and-pagination.newest-three",
  ),
  sortingAndPaginationExerciseSecondPage: sqlExampleId(
    "sorting-and-pagination.second-page",
  ),
  textSearchBasicsDatabaseInit: sqlExampleId("text-search-basics.database-init"),
  textSearchBasicsLikePrefix: sqlExampleId("text-search-basics.like-prefix"),
  textSearchBasicsIlikeContains: sqlExampleId("text-search-basics.ilike-contains"),
  textSearchBasicsLowerSearch: sqlExampleId("text-search-basics.lower-search"),
  textSearchBasicsExerciseFindPostgres: sqlExampleId("text-search-basics.find-postgres"),
  textSearchBasicsExerciseFindGuide: sqlExampleId("text-search-basics.find-guide"),
  jsonInPostgresqlDatabaseInit: sqlExampleId("json-in-postgresql.database-init"),
  jsonInPostgresqlExtractJson: sqlExampleId("json-in-postgresql.extract-json"),
  jsonInPostgresqlFilterJson: sqlExampleId("json-in-postgresql.filter-json"),
  jsonInPostgresqlContainJson: sqlExampleId("json-in-postgresql.contain-json"),
  jsonInPostgresqlExerciseFindProPlan: sqlExampleId("json-in-postgresql.find-pro-plan"),
  jsonInPostgresqlExerciseFindEmailOptIn: sqlExampleId(
    "json-in-postgresql.find-email-opt-in",
  ),
  transactionsDatabaseInit: sqlExampleId("transactions.database-init"),
  transactionsCommitTransfer: sqlExampleId("transactions.commit-transfer"),
  transactionsRollbackTransfer: sqlExampleId("transactions.rollback-transfer"),
  transactionsExerciseCommitBonus: sqlExampleId("transactions.commit-bonus"),
  advancedAggregationDatabaseInit: sqlExampleId("advanced-aggregation.database-init"),
  advancedAggregationHaving: sqlExampleId("advanced-aggregation.having"),
  advancedAggregationFilter: sqlExampleId("advanced-aggregation.filter"),
  advancedAggregationDateTrunc: sqlExampleId("advanced-aggregation.date-trunc"),
  advancedAggregationExerciseDailyRevenue: sqlExampleId(
    "advanced-aggregation.daily-revenue",
  ),
  advancedAggregationExercisePaidFilter: sqlExampleId("advanced-aggregation.paid-filter"),
  vectorsDatabaseInit: sqlExampleId("vectors.database-init"),
  vectorsNearestVector: sqlExampleId("vectors.nearest-vector"),
  vectorsDistanceScore: sqlExampleId("vectors.distance-score"),
  vectorsExerciseFindSqlVector: sqlExampleId("vectors.find-sql-vector"),
  vectorsExerciseFindIndexVector: sqlExampleId("vectors.find-index-vector"),
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
