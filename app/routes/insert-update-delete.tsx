import { examples, exercises } from "../../cli_examples/insert-update-delete.sql";
import { CourseLessonPage, ExampleBlock } from "../sql/course-lesson-page";
import { Paragraphs } from "../sql/lesson-layout";

export default function Lesson3() {
  return (
    <CourseLessonPage
      exercises={exercises}
      lessonId="insert-update-delete"
      whatWeLearned={[
        {
          concept: "INSERT",
          description: "adds new rows to a table.",
          url: "https://www.postgresql.org/docs/current/sql-insert.html",
        },
        {
          concept: "UPDATE",
          description: "changes rows that match a WHERE clause.",
          url: "https://www.postgresql.org/docs/current/sql-update.html",
        },
        {
          concept: "DELETE",
          description: "removes rows that match a WHERE clause.",
          url: "https://www.postgresql.org/docs/current/sql-delete.html",
        },
        {
          concept: "RETURNING",
          description: "turns writes into visible result rows.",
          url: "https://www.postgresql.org/docs/current/dml-returning.html",
        },
      ]}
    >
      <Paragraphs>
        <p>
          Reading rows is only half of SQL. This lesson changes data with INSERT, UPDATE,
          and DELETE, always using RETURNING so the result is visible.
        </p>
      </Paragraphs>
      {examples.map((example) => (
        <ExampleBlock example={example} key={example.id} />
      ))}
    </CourseLessonPage>
  );
}
