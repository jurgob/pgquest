import { examples, exercises } from "../../cli_examples/example13.sql";
import { CourseLessonPage } from "../sql/course-lesson-page";

export default function Lesson13() {
  return (
    <CourseLessonPage
      examples={examples}
      exercises={exercises}
      intro={
        <p>
          A transaction groups statements into one unit of work. You either commit the
          whole change or roll it back.
        </p>
      }
      lessonId="lesson14"
      whatWeLearned={[
        {
          concept: "BEGIN",
          description: "starts a transaction.",
          url: "https://www.postgresql.org/docs/current/sql-begin.html",
        },
        {
          concept: "COMMIT",
          description: "keeps the transaction's changes.",
          url: "https://www.postgresql.org/docs/current/sql-commit.html",
        },
        {
          concept: "ROLLBACK",
          description: "discards the transaction's changes.",
          url: "https://www.postgresql.org/docs/current/sql-rollback.html",
        },
        {
          concept: "Atomicity",
          description: "means related changes succeed or fail as a unit.",
        },
      ]}
    />
  );
}
