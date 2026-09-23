export type SqlExecutionInput = {
  query: string;
  sqlLoad: string;
  // Whether to also run EXPLAIN <query> and populate ExecutionOutput.plan. Defaults to
  // false — pass true only when the caller actually renders the plan (e.g. <SqlPlan>),
  // since EXPLAIN is a second, real query against the connection.
  runExplain?: boolean;
};

export type SqlValue = string | number | boolean | null;

export type QueryRow = Record<string, SqlValue>;

export type ExplainRow = {
  "QUERY PLAN": string;
};

export type ExecutionOutput = {
  rows: QueryRow[];
  plan: string;
};

export type LessonId =
  | "my-first-query"
  | "introduction-to-join"
  | "schemas-tables-and-types"
  | "introduction-to-indexes"
  | "insert-update-delete"
  | "mvcc"
  | "constraints"
  | "advanced-indexes"
  | "aggregation-intro"
  | "null"
  | "joins"
  | "relationships"
  | "sorting-and-pagination"
  | "text-search-basics"
  | "json-in-postgresql"
  | "transactions"
  | "advanced-aggregation"
  | "vectors"
  | "concurrency-reservation-system"
  | "transaction-isolation-levels";
