import type { Route } from "./+types/example-2";
import { exampleTwoIndexed } from "../sql/example-definitions";
import { SqlExamplePage } from "../sql/sql-example-page";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "pgquest | Lesson 2" },
    { name: "description", content: "Compare a query plan with and without an index." },
  ];
}

export default function ExampleTwo() {
  return <SqlExamplePage activeLesson="lesson2" lesson={exampleTwoIndexed} />;
}
