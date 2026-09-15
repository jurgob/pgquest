import { examples, exercises } from "../../cli_examples/advanced-aggregation.sql";
import { CourseLessonPage, ExampleBlock } from "../sql/course-lesson-page";
import { Paragraphs } from "../sql/lesson-layout";

export default function Lesson14() {
  return (
    <CourseLessonPage
      exercises={exercises}
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
    >
      <Paragraphs>
        <p>
          Advanced aggregation is still the same idea: shape many rows into fewer rows,
          but with sharper tools for filters and time buckets.
        </p>
      </Paragraphs>
      {examples.map((example) => (
        <ExampleBlock example={example} key={example.id} />
      ))}
    </CourseLessonPage>
  );
}
