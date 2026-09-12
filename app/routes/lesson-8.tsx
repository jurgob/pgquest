import { examples, exercises } from "../../cli_examples/example8.sql";
import { CourseLessonPage } from "../sql/course-lesson-page";

export default function Lesson8() {
  return (
    <CourseLessonPage
      examples={examples}
      exercises={exercises}
      intro={
        <p>
          JOIN is the move that makes relational databases click: you combine rows from
          different tables using relationships between columns.
        </p>
      }
      lessonId="lesson8"
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
    />
  );
}
