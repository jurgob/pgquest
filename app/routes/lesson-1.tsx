import type { Route } from "./+types/lesson-1";
import { exampleOneSpecific } from "../sql/example-definitions";
import { SqlExamplePage } from "../sql/sql-example-page";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "pgquest | Lesson 1" },
    { name: "description", content: "Run a basic PGlite SQL lesson." },
  ];
}

export default function LessonOne() {
  return <SqlExamplePage activeLesson="lesson1" lesson={exampleOneSpecific} />;
}
