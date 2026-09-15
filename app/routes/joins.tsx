import { examples, exercises } from "../../cli_examples/joins.sql";
import { CourseLessonPage, ExampleBlock } from "../sql/course-lesson-page";
import { Paragraphs } from "../sql/lesson-layout";

export default function Lesson8() {
  return (
    <CourseLessonPage
      exercises={exercises}
      lessonId="joins"
      whatWeLearned={[
        {
          concept: "JOIN",
          description: "combines rows from two relations.",
          url: "https://www.postgresql.org/docs/current/tutorial-join.html",
        },
        {
          concept: "INNER JOIN",
          description: "keeps only matching rows from both sides.",
          url: "https://www.postgresql.org/docs/current/queries-table-expressions.html#QUERIES-JOIN",
        },
        {
          concept: "LEFT JOIN",
          description: "keeps every row from the left side.",
          url: "https://www.postgresql.org/docs/current/queries-table-expressions.html#QUERIES-JOIN",
        },
        {
          concept: "Join condition",
          description: "tells PostgreSQL how rows from both sides match.",
        },
      ]}
    >
      <Paragraphs>
        <p>
          JOIN is the move that makes relational databases click: you combine rows from
          different tables using relationships between columns.
        </p>
      </Paragraphs>
      {examples.map((example) => (
        <ExampleBlock example={example} key={example.id} />
      ))}
    </CourseLessonPage>
  );
}
