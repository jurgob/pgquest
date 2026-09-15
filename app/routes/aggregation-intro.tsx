import { examples, exercises } from "../../cli_examples/aggregation-intro.sql";
import { CourseLessonPage, ExampleBlock } from "../sql/course-lesson-page";
import { Paragraphs } from "../sql/lesson-layout";

export default function Lesson6() {
  return (
    <CourseLessonPage
      exercises={exercises}
      lessonId="aggregation-intro"
      whatWeLearned={[
        {
          concept: "COUNT",
          description: "counts rows or non-NULL values.",
          url: "https://www.postgresql.org/docs/current/functions-aggregate.html",
        },
        {
          concept: "SUM",
          description: "adds numeric values across a group.",
          url: "https://www.postgresql.org/docs/current/functions-aggregate.html",
        },
        {
          concept: "GROUP BY",
          description: "creates one aggregate result per distinct grouping key.",
          url: "https://www.postgresql.org/docs/current/sql-select.html#SQL-GROUPBY",
        },
        {
          concept: "HAVING",
          description: "filters groups after aggregation.",
          url: "https://www.postgresql.org/docs/current/sql-select.html#SQL-HAVING",
        },
      ]}
    >
      <Paragraphs>
        <p>
          Aggregates reduce many rows into summaries. GROUP BY decides the level of
          detail: one row for the whole table, or one row per group.
        </p>
      </Paragraphs>
      {examples.map((example) => (
        <ExampleBlock example={example} key={example.id} />
      ))}
    </CourseLessonPage>
  );
}
