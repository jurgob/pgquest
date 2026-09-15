import { examples, exercises } from "../../cli_examples/transactions.sql";
import { CourseLessonPage, ExampleBlock } from "../sql/course-lesson-page";
import { Paragraphs } from "../sql/lesson-layout";

export default function Lesson13() {
  return (
    <CourseLessonPage
      exercises={exercises}
      lessonId="transactions"
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
    >
      <Paragraphs>
        <p>
          A transaction groups statements into one unit of work. You either commit the
          whole change or roll it back.
        </p>
      </Paragraphs>
      {examples.map((example) => (
        <ExampleBlock example={example} key={example.id} />
      ))}
    </CourseLessonPage>
  );
}
