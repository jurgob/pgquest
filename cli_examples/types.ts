type Brand<Value, Name extends string> = Value & {
  readonly __brand: Name;
};

export type SqlExampleId = Brand<string, "SqlExampleId">;

function brand<Value extends string, Name extends string>(value: Value) {
  return value as Brand<Value, Name>;
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
  schemasTablesAndTypesListSchemasEmpty: sqlExampleId(
    "schemas-tables-and-types.list-schemas-empty",
  ),
  schemasTablesAndTypesMigration: sqlExampleId("schemas-tables-and-types.migration"),
  schemasTablesAndTypesMigrationAppliedTwiceInit: sqlExampleId(
    "schemas-tables-and-types.migration-applied-twice-init",
  ),
  schemasTablesAndTypesListSchemasAfterMigration: sqlExampleId(
    "schemas-tables-and-types.list-schemas-after-migration",
  ),
  schemasTablesAndTypesSearchPath: sqlExampleId("schemas-tables-and-types.search-path"),
  schemasTablesAndTypesCrossSchemaJoin: sqlExampleId(
    "schemas-tables-and-types.cross-schema-join",
  ),
  schemasTablesAndTypesListTables: sqlExampleId("schemas-tables-and-types.list-tables"),
  schemasTablesAndTypesInspectColumns: sqlExampleId(
    "schemas-tables-and-types.inspect-columns",
  ),
  schemasTablesAndTypesInformationSchemaOverview: sqlExampleId(
    "schemas-tables-and-types.information-schema-overview",
  ),
  schemasTablesAndTypesPrimaryKeyViaInformationSchema: sqlExampleId(
    "schemas-tables-and-types.primary-key-via-information-schema",
  ),
  schemasTablesAndTypesPrimaryKeyViaPgConstraint: sqlExampleId(
    "schemas-tables-and-types.primary-key-via-pg-constraint",
  ),
  schemasTablesAndTypesPrimaryKeyViaPgIndex: sqlExampleId(
    "schemas-tables-and-types.primary-key-via-pg-index",
  ),
  schemasTablesAndTypesExerciseListLibraryTables: sqlExampleId(
    "schemas-tables-and-types.list-library-tables",
  ),
  schemasTablesAndTypesExerciseInspectLoans: sqlExampleId(
    "schemas-tables-and-types.inspect-loans",
  ),
  introductionToJoinDatabaseInit: sqlExampleId("introduction-to-join.database-init"),
  introductionToJoinWithoutJoin: sqlExampleId("introduction-to-join.without-join"),
  introductionToJoinWithJoin: sqlExampleId("introduction-to-join.with-join"),
  introductionToJoinExerciseOrderEmails: sqlExampleId(
    "introduction-to-join.order-emails",
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
  insertUpdateDeleteUpsert: sqlExampleId("insert-update-delete.upsert"),
  insertUpdateDeleteDeactivateMales: sqlExampleId(
    "insert-update-delete.deactivate-males",
  ),
  insertUpdateDeleteRefreshAfterDeleteInit: sqlExampleId(
    "insert-update-delete.refresh-after-delete-init",
  ),
  insertUpdateDeleteRefreshDelete: sqlExampleId("insert-update-delete.refresh-delete"),
  insertUpdateDeleteRefreshInsert: sqlExampleId("insert-update-delete.refresh-insert"),
  insertUpdateDeleteRefreshUpsert: sqlExampleId("insert-update-delete.refresh-upsert"),
  insertUpdateDeleteExerciseInsert: sqlExampleId("insert-update-delete.insert-user"),
  insertUpdateDeleteExerciseUpdate: sqlExampleId("insert-update-delete.update-user"),
  insertUpdateDeleteExerciseBulkDelete: sqlExampleId(
    "insert-update-delete.exercise-bulk-delete",
  ),
  insertUpdateDeleteExerciseUpsert: sqlExampleId("insert-update-delete.exercise-upsert"),
  mvccDatabaseInit: sqlExampleId("mvcc.database-init"),
  mvccPlainSelect: sqlExampleId("mvcc.plain-select"),
  mvccHiddenColumns: sqlExampleId("mvcc.hidden-columns"),
  mvccTwoInsertsOneTransaction: sqlExampleId("mvcc.two-inserts-one-transaction"),
  mvccUpdateChangesXmin: sqlExampleId("mvcc.update-changes-xmin"),
  mvccExerciseSelectXmin: sqlExampleId("mvcc.exercise-select-xmin"),
  mvccExerciseDepositReturning: sqlExampleId("mvcc.exercise-deposit-returning"),
  mvccSessionATranscript: sqlExampleId("mvcc.session-a-transcript"),
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
  joinsPreviewAuthors: sqlExampleId("joins.preview-authors"),
  joinsPreviewBooks: sqlExampleId("joins.preview-books"),
  joinsInnerJoin: sqlExampleId("joins.inner-join"),
  joinsLeftJoin: sqlExampleId("joins.left-join"),
  joinsRightJoin: sqlExampleId("joins.right-join"),
  joinsFullOuterJoin: sqlExampleId("joins.full-outer-join"),
  joinsCrossJoin: sqlExampleId("joins.cross-join"),
  joinsExerciseBookAuthors: sqlExampleId("joins.book-authors"),
  joinsExerciseAuthorsWithoutBooks: sqlExampleId("joins.authors-without-books"),
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
  concurrencyReservationSystemDatabaseInit: sqlExampleId(
    "concurrency-reservation-system.database-init",
  ),
  concurrencyReservationSystemDatabaseInitLiveHold: sqlExampleId(
    "concurrency-reservation-system.database-init-live-hold",
  ),
  concurrencyReservationSystemDatabaseInitExpiredHold: sqlExampleId(
    "concurrency-reservation-system.database-init-expired-hold",
  ),
  concurrencyReservationSystemDatabaseInitGraceHold: sqlExampleId(
    "concurrency-reservation-system.database-init-grace-hold",
  ),
  concurrencyReservationSystemHold: sqlExampleId("concurrency-reservation-system.hold"),
  concurrencyReservationSystemHoldRejected: sqlExampleId(
    "concurrency-reservation-system.hold-rejected",
  ),
  concurrencyReservationSystemHoldTakeover: sqlExampleId(
    "concurrency-reservation-system.hold-takeover",
  ),
  concurrencyReservationSystemReserve: sqlExampleId(
    "concurrency-reservation-system.reserve",
  ),
  concurrencyReservationSystemReserveRejected: sqlExampleId(
    "concurrency-reservation-system.reserve-rejected",
  ),
  concurrencyReservationSystemListAvailable: sqlExampleId(
    "concurrency-reservation-system.list-available",
  ),
  concurrencyReservationSystemHoldLimit: sqlExampleId(
    "concurrency-reservation-system.hold-limit",
  ),
  concurrencyReservationSystemExerciseListAvailable: sqlExampleId(
    "concurrency-reservation-system.exercise-list-available",
  ),
  concurrencyReservationSystemExerciseRefresh: sqlExampleId(
    "concurrency-reservation-system.exercise-refresh",
  ),
  transactionIsolationLevelsDatabaseInit: sqlExampleId(
    "transaction-isolation-levels.database-init",
  ),
  transactionIsolationLevelsAliceAlone: sqlExampleId(
    "transaction-isolation-levels.alice-alone",
  ),
  transactionIsolationLevelsExerciseOnCallNames: sqlExampleId(
    "transaction-isolation-levels.on-call-names",
  ),
  transactionIsolationLevelsExerciseSerializableShow: sqlExampleId(
    "transaction-isolation-levels.serializable-show",
  ),
  emptyDatabase: sqlExampleId("empty-database.database-init"),
} as const;

export type SqlExample = {
  name: string;
  id: SqlExampleId;
  description: string;
  database_init?: SqlExample;
  // Columns to drop from rows before comparing an exercise answer (e.g. a now()-set column).
  ignoreColumns?: readonly string[];
  query: string;
};

// A single statement within an ordered, multi-step "session" transcript — e.g. the
// live BEGIN/UPDATE/COMMIT steps in the MVCC lesson. `pgSessionId` is display/narrative
// metadata in the browser (see runMultiSessionSteps); at build time each session gets its
// own real connection (see runConcurrentSessionSteps).
export type PostgresExampleStep<SessionId extends string = string> = {
  pgSessionId: SessionId;
  query: string;
  label?: string;
  // Build-time only: after this step runs, run these against a genuinely separate,
  // concurrently-open connection to the same real Postgres database (see
  // runConcurrentSessionSteps in app/sql/run-example.ts) — a real second session's
  // xmin/xmax, not a narrated or simulated one. Only
  // scripts/build-postgres-examples.ts's runConcurrentSessionSteps acts on this field;
  // the browser-side useLessonSqlExampleMultipleSession/runMultiSessionSteps ignore it.
  observedBy?: readonly PostgresExampleStep<SessionId>[];
  // Build-time only: this statement is expected to wait for a lock held by another
  // session. runConcurrentSessionSteps sends it, confirms Postgres reports it waiting,
  // and moves on; its result is recorded once a later statement releases it. The build
  // fails if it never waits, or is still waiting when the transcript ends.
  blocks?: boolean;
};

// A registration of one such transcript, precomputed at build time by
// scripts/build-postgres-examples.ts into app/generated/postgres-examples.json.
export type PostgresTranscript<SessionId extends string = string> = {
  id: SqlExampleId;
  sqlLoad: string;
  pgSessionIds: readonly SessionId[];
  queries: readonly PostgresExampleStep<SessionId>[];
  runExplain?: boolean;
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
