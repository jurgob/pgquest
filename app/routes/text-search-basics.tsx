import { examples, exercises } from "../../cli_examples/text-search-basics.sql";
import { CourseLessonPage, ExampleBlock } from "../sql/course-lesson-page";
import {
  LessonLink,
  LessonSection,
  Paragraph,
  Paragraphs,
  Title2,
} from "../sql/lesson-layout";

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
      <LessonSection>
        <Title2 id="beyond-patterns">Beyond patterns</Title2>
        <Paragraph>
          Patterns need the exact characters. For word forms, see{" "}
          <LessonLink to="/lessons/full-text-search">full-text search</LessonLink>; for
          typos, <LessonLink to="/lessons/fuzzy-search">fuzzy search</LessonLink>; for
          meaning, <LessonLink to="/lessons/vectors">vectors</LessonLink>.{" "}
          <LessonLink to="/lessons/text-search-in-postgres">
            Text search in Postgres
          </LessonLink>{" "}
          compares them all.
        </Paragraph>
      </LessonSection>
    </CourseLessonPage>
  );
}
