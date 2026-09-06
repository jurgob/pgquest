export type SqlExampleId =
  "example1-basic-select" | "example2-sequential-scan" | "example2-index-scan";

export type SqlExampleDefinition = {
  id: SqlExampleId;
  title: string;
  description: readonly [string, string];
  codeDescriptions: {
    migration: string;
    seed: string;
    query: string;
  };
  migration: string;
  seed: string;
  query: string;
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
