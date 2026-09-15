import { examples, exercises } from "../../cli_examples/text-search-basics.sql";
import { CourseLessonPage, ExampleBlock } from "../sql/course-lesson-page";
import { Paragraphs } from "../sql/lesson-layout";

export default function Lesson11() {
  return (
    <CourseLessonPage
      exercises={exercises}
      lessonId="text-search-basics"
      whatWeLearned={[
        {
          concept: "LIKE",
          description: "matches text with wildcard patterns.",
          url: "https://www.postgresql.org/docs/current/functions-matching.html",
        },
        {
          concept: "ILIKE",
          description: "matches text while ignoring case.",
          url: "https://www.postgresql.org/docs/current/functions-matching.html",
        },
        {
          concept: "%",
          description: "matches any sequence of characters in a pattern.",
        },
        {
          concept: "LOWER",
          description: "normalizes text before comparison.",
          url: "https://www.postgresql.org/docs/current/functions-string.html",
        },
      ]}
    >
      <Paragraphs>
        <p>
          Text search starts with patterns. LIKE and ILIKE are simple tools for prefix,
          suffix, and contains-style matching.
        </p>
      </Paragraphs>
      {examples.map((example) => (
        <ExampleBlock example={example} key={example.id} />
      ))}
    </CourseLessonPage>
  );
}
