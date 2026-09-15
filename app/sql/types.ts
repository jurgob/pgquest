export type SqlExecutionInput = {
  query: string;
  sqlLoad: string;
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
  | "schemas-tables-and-types"
  | "introduction-to-indexes"
  | "insert-update-delete"
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
  | "vectors";
