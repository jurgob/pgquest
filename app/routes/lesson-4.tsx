import { examples, exercises } from "../../cli_examples/example4.sql";
import { CourseLessonPage } from "../sql/course-lesson-page";

export default function Lesson4() {
  return (
    <CourseLessonPage
      examples={examples}
      exercises={exercises}
      intro={
        <p>
          Constraints move basic data rules into PostgreSQL. They make invalid states
          harder to store, no matter which application sends the SQL.
        </p>
      }
      lessonId="lesson4"
      whatWeLearned={[
        {
          concept: "PRIMARY KEY",
          description: "identifies each row and prevents duplicate ids.",
          url: "https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-PRIMARY-KEYS",
        },
        {
          concept: "UNIQUE",
          description: "prevents duplicate values in selected columns.",
          url: "https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-UNIQUE-CONSTRAINTS",
        },
        {
          concept: "CHECK",
          description: "requires each row to satisfy a boolean expression.",
          url: "https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-CHECK-CONSTRAINTS",
        },
        {
          concept: "pg_constraint",
          description: "is a PostgreSQL catalog containing table constraints.",
          url: "https://www.postgresql.org/docs/current/catalog-pg-constraint.html",
        },
      ]}
    />
  );
}
