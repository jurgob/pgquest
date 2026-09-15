import { examples, exercises } from "../../cli_examples/relationships.sql";
import { CourseLessonPage } from "../sql/course-lesson-page";

export default function Lesson9() {
  return (
    <CourseLessonPage
      examples={examples}
      exercises={exercises}
      intro={
        <p>
          Relationships are how table design expresses real structure: ownership,
          membership, references, and many-to-many connections.
        </p>
      }
      lessonId="relationships"
      whatWeLearned={[
        {
          concept: "Foreign key",
          description: "requires a value to reference an existing row.",
          url: "https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-FK",
        },
        {
          concept: "One-to-many",
          description: "stores the parent id on the many side.",
        },
        {
          concept: "Many-to-many",
          description: "uses a join table between both sides.",
        },
        {
          concept: "Relationship indexes",
          description: "help joins and foreign-key lookups stay fast.",
        },
      ]}
    />
  );
}
