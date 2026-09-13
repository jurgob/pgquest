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

export const LESSON_IDS = [
  "lesson1",
  "lesson2",
  "lesson3",
  "lesson4",
  "lesson5",
  "lesson6",
  "lesson7",
  "lesson8",
  "lesson9",
  "lesson10",
  "lesson11",
  "lesson12",
  "lesson13",
  "lesson14",
  "lesson15",
  "lesson16",
] as const;

export type LessonId = (typeof LESSON_IDS)[number];
