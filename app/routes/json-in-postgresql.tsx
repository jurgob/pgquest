import { examples, exercises } from "../../cli_examples/json-in-postgresql.sql";
import { CourseLessonPage, ExampleBlock } from "../sql/course-lesson-page";
import { Paragraphs } from "../sql/lesson-layout";

export default function Lesson12() {
  return (
    <CourseLessonPage
      exercises={exercises}
      lessonId="json-in-postgresql"
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
    >
      <Paragraphs>
        <p>
          jsonb lets PostgreSQL store structured documents while still querying fields
          inside them. It is useful, but it is still data inside a table.
        </p>
      </Paragraphs>
      {examples.map((example) => (
        <ExampleBlock example={example} key={example.id} />
      ))}
    </CourseLessonPage>
  );
}
