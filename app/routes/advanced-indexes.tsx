import { examples, exercises } from "../../cli_examples/advanced-indexes.sql";
import { CourseLessonPage } from "../sql/course-lesson-page";

export default function Lesson5() {
  return (
    <CourseLessonPage
      examples={examples}
      exercises={exercises}
      intro={
        <p>
          After the first index, the next lesson is shape. Useful indexes depend on how
          selective the filter is and how the query is written.
        </p>
      }
      lessonId="advanced-indexes"
      whatWeLearned={[
        {
          concept: "Selectivity",
          description: "describes how much a filter narrows the table.",
          url: "https://www.postgresql.org/docs/current/row-estimation-examples.html",
        },
        {
          concept: "Composite index",
          description: "indexes multiple columns in a specific order.",
          url: "https://www.postgresql.org/docs/current/indexes-multicolumn.html",
        },
        {
          concept: "Partial index",
          description: "indexes only rows that satisfy a predicate.",
          url: "https://www.postgresql.org/docs/current/indexes-partial.html",
        },
        {
          concept: "Planner cost",
          description: "is why PostgreSQL can ignore an index when a scan is cheaper.",
          url: "https://www.postgresql.org/docs/current/using-explain.html",
        },
      ]}
    />
  );
}
