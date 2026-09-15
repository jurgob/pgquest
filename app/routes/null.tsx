import { examples, exercises } from "../../cli_examples/null.sql";
import { CourseLessonPage, ExampleBlock } from "../sql/course-lesson-page";
import { Paragraphs } from "../sql/lesson-layout";

export default function Lesson7() {
  return (
    <CourseLessonPage
      exercises={exercises}
      lessonId="null"
      whatWeLearned={[
        {
          concept: "NULL",
          description: "represents an unknown or missing value.",
          url: "https://www.postgresql.org/docs/current/datatype.html",
        },
        {
          concept: "IS NULL",
          description: "checks whether a value is NULL.",
          url: "https://www.postgresql.org/docs/current/functions-comparison.html",
        },
        {
          concept: "COALESCE",
          description: "returns the first non-NULL value.",
          url: "https://www.postgresql.org/docs/current/functions-conditional.html",
        },
      ]}
    >
      <Paragraphs>
        <p>
          NULL means missing or unknown. That makes it different from an empty string,
          zero, or false, and it changes how comparisons work.
        </p>
      </Paragraphs>
      {examples.map((example) => (
        <ExampleBlock example={example} key={example.id} />
      ))}
    </CourseLessonPage>
  );
}
