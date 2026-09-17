import { examples, exercises } from "../../cli_examples/introduction-to-join.sql";
import { CourseLessonPage, ExampleBlock } from "../sql/course-lesson-page";
import { Paragraphs } from "../sql/lesson-layout";

export default function IntroductionToJoin() {
  return (
    <CourseLessonPage
      exercises={exercises}
      lessonId="introduction-to-join"
      whatWeLearned={[
        {
          concept: "JOIN",
          description: "combines rows from two relations by matching column values.",
          url: "https://www.postgresql.org/docs/current/tutorial-join.html",
        },
        {
          concept: "Foreign key",
          description: "a column referencing another table's primary key.",
          url: "https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-FK",
        },
        {
          concept: "ON clause",
          description: "tells PostgreSQL which columns from each side must match.",
          url: "https://www.postgresql.org/docs/current/queries-table-expressions.html#QUERIES-JOIN",
        },
      ]}
    >
      <Paragraphs>
        <p>
          Order only stores a user_id, not the user's name or email. That keeps user data
          in one place.
        </p>
        <p>JOIN reunites split tables by matching a foreign key back to its row.</p>
      </Paragraphs>
      {examples.map((example) => (
        <ExampleBlock example={example} key={example.id} />
      ))}
    </CourseLessonPage>
  );
}
