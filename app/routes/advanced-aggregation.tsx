import { examples, exercises } from "../../cli_examples/advanced-aggregation.sql";
import { CourseLessonPage } from "../sql/course-lesson-page";

export default function Lesson14() {
  return (
    <CourseLessonPage
      examples={examples}
      exercises={exercises}
      intro={
        <p>
          Advanced aggregation is still the same idea: shape many rows into fewer rows,
          but with sharper tools for filters and time buckets.
        </p>
      }
      lessonId="advanced-aggregation"
      whatWeLearned={[
        {
          concept: "HAVING",
          description: "filters groups after GROUP BY.",
          url: "https://www.postgresql.org/docs/current/sql-select.html#SQL-HAVING",
        },
        {
          concept: "FILTER",
          description: "applies a condition to one aggregate call.",
          url: "https://www.postgresql.org/docs/current/sql-expressions.html#SYNTAX-AGGREGATES",
        },
        {
          concept: "date_trunc",
          description: "rounds timestamps down to a time bucket.",
          url: "https://www.postgresql.org/docs/current/functions-datetime.html",
        },
      ]}
    />
  );
}
