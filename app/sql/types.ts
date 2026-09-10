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

export type LessonId = "lesson1" | "lesson2";
