import { lessonSummaries } from "./lesson-catalog";

export { lessonSummaries };

export type LessonSummary = (typeof lessonSummaries)[number];
