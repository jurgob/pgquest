import type { LessonId } from "./types";

export type LessonCatalogItem = {
  id: LessonId;
  label: string;
  number: string;
  title: string;
  href: string;
  summary: string;
  meta: string;
  time: string;
  draft: boolean;
};

export const lessons = [
  {
    id: "lesson1",
    label: "Lesson 01",
    number: "1",
    title: "My first query",
    href: "/lessons/lesson-1",
    summary:
      "Create a small table, seed two rows, SELECT them back, and inspect the plan Postgres uses.",
    meta: "SELECT · EXPLAIN",
    time: "10 min",
    draft: false,
  },
  {
    id: "lesson2",
    label: "Lesson 02",
    number: "2",
    title: "Using an index",
    href: "/lessons/lesson-2",
    summary:
      "Indexes and EXPLAIN plans, comparing a sequential scan with an index scan on the same query.",
    meta: "INDEX · EXPLAIN",
    time: "15 min",
    draft: true,
  },
  {
    id: "lesson3",
    label: "Lesson 03",
    number: "3",
    title: "Insert, update, delete",
    href: "/lessons/lesson-3",
    summary: "Change stored rows with INSERT, UPDATE, DELETE, and RETURNING.",
    meta: "INSERT · UPDATE · DELETE",
    time: "15 min",
    draft: true,
  },
  {
    id: "lesson4",
    label: "Lesson 04",
    number: "4",
    title: "Constraints",
    href: "/lessons/lesson-4",
    summary:
      "Use NOT NULL, UNIQUE, CHECK, primary keys, and foreign keys to protect data.",
    meta: "CONSTRAINTS · KEYS",
    time: "15 min",
    draft: true,
  },
  {
    id: "lesson5",
    label: "Lesson 05",
    number: "5",
    title: "Introduction to indexes",
    href: "/lessons/lesson-5",
    summary: "Compare sequential scans with index scans and see why query plans change.",
    meta: "INDEX · ANALYZE · EXPLAIN",
    time: "20 min",
    draft: true,
  },
  {
    id: "lesson6",
    label: "Lesson 06",
    number: "6",
    title: "Aggregation intro",
    href: "/lessons/lesson-6",
    summary: "Summarize rows with COUNT, SUM, AVG, MIN, MAX, and GROUP BY.",
    meta: "COUNT · GROUP BY",
    time: "15 min",
    draft: true,
  },
  {
    id: "lesson7",
    label: "Lesson 07",
    number: "7",
    title: "NULL",
    href: "/lessons/lesson-7",
    summary: "Understand missing values, IS NULL, three-valued logic, and COALESCE.",
    meta: "NULL · COALESCE",
    time: "15 min",
    draft: true,
  },
  {
    id: "lesson8",
    label: "Lesson 08",
    number: "8",
    title: "JOINs",
    href: "/lessons/lesson-8",
    summary:
      "Combine relations with INNER JOIN and LEFT JOIN, including missing matches.",
    meta: "JOIN · LEFT JOIN",
    time: "20 min",
    draft: true,
  },
  {
    id: "lesson9",
    label: "Lesson 09",
    number: "9",
    title: "Relationships",
    href: "/lessons/lesson-9",
    summary: "Model one-to-many and many-to-many data with foreign keys and join tables.",
    meta: "FOREIGN KEY · RELATIONSHIPS",
    time: "20 min",
    draft: true,
  },
  {
    id: "lesson10",
    label: "Lesson 10",
    number: "10",
    title: "Sorting and pagination",
    href: "/lessons/lesson-10",
    summary: "Sort rows deterministically with ORDER BY, LIMIT, OFFSET, and indexes.",
    meta: "ORDER BY · LIMIT",
    time: "15 min",
    draft: true,
  },
  {
    id: "lesson11",
    label: "Lesson 11",
    number: "11",
    title: "Text search basics",
    href: "/lessons/lesson-11",
    summary: "Search text with LIKE, ILIKE, wildcards, and case-insensitive patterns.",
    meta: "LIKE · ILIKE",
    time: "15 min",
    draft: true,
  },
  {
    id: "lesson12",
    label: "Lesson 12",
    number: "12",
    title: "JSON in PostgreSQL",
    href: "/lessons/lesson-12",
    summary: "Store jsonb, extract fields, query nested values, and use containment.",
    meta: "JSONB",
    time: "20 min",
    draft: true,
  },
  {
    id: "lesson13",
    label: "Lesson 13",
    number: "13",
    title: "Transactions",
    href: "/lessons/lesson-13",
    summary: "Group changes with BEGIN, COMMIT, and ROLLBACK so work is atomic.",
    meta: "BEGIN · COMMIT · ROLLBACK",
    time: "15 min",
    draft: true,
  },
  {
    id: "lesson14",
    label: "Lesson 14",
    number: "14",
    title: "Advanced aggregation",
    href: "/lessons/lesson-14",
    summary: "Use HAVING, FILTER, date_trunc, and time-based grouping.",
    meta: "HAVING · FILTER · DATE_TRUNC",
    time: "20 min",
    draft: true,
  },
  {
    id: "lesson15",
    label: "Lesson 15",
    number: "15",
    title: "Vectors",
    href: "/lessons/lesson-15",
    summary:
      "Use pgvector-style similarity search and see how vectors fit into PostgreSQL.",
    meta: "VECTOR · SIMILARITY",
    time: "20 min",
    draft: true,
  },
] as const satisfies readonly LessonCatalogItem[];

export const lessonSummaries = lessons.map(({ id, number, title, href }) => ({
  id,
  number,
  title,
  href,
}));
