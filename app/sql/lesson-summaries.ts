export const lessonSummaries = [
  {
    id: "lesson1",
    number: "1",
    title: "My first query",
    href: "/lesson-1",
  },
  {
    id: "lesson2",
    number: "2",
    title: "Using an index",
    href: "/lesson-2",
  },
] as const;

export type LessonSummary = (typeof lessonSummaries)[number];
