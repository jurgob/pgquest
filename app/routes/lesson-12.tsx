import { examples, exercises } from "../../cli_examples/example12.sql";
import { CourseLessonPage } from "../sql/course-lesson-page";

export default function Lesson12() {
  return (
    <CourseLessonPage
      examples={examples}
      exercises={exercises}
      intro={
        <p>
          jsonb lets PostgreSQL store structured documents while still querying fields
          inside them. It is useful, but it is still data inside a table.
        </p>
      }
      lessonId="lesson12"
      whatWeLearned={[
        {
          concept: "jsonb",
          description: "stores JSON in a binary form PostgreSQL can query.",
          url: "https://www.postgresql.org/docs/current/datatype-json.html",
        },
        {
          concept: "->",
          description: "extracts a JSON value.",
          url: "https://www.postgresql.org/docs/current/functions-json.html",
        },
        {
          concept: "->>",
          description: "extracts a JSON value as text.",
          url: "https://www.postgresql.org/docs/current/functions-json.html",
        },
        {
          concept: "@>",
          description: "checks whether one jsonb value contains another.",
          url: "https://www.postgresql.org/docs/current/functions-json.html",
        },
      ]}
    />
  );
}
