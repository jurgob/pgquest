import { examples, exercises } from "../../cli_examples/vectors.sql";
import { CourseLessonPage, ExampleBlock } from "../sql/course-lesson-page";
import { Paragraphs } from "../sql/lesson-layout";

export default function Lesson15() {
  return (
    <CourseLessonPage
      exercises={exercises}
      lessonId="vectors"
      whatWeLearned={[
        {
          concept: "Embedding",
          description: "is a numeric representation of meaning.",
        },
        {
          concept: "Distance",
          description: "scores how far two vectors are from each other.",
        },
        {
          concept: "Similarity search",
          description: "orders rows by nearest vector distance.",
        },
        {
          concept: "pgvector",
          description: "is the common PostgreSQL extension for vector columns.",
          url: "https://github.com/pgvector/pgvector",
        },
      ]}
    >
      <Paragraphs>
        <p>
          Vector search stores meaning as numbers and ranks rows by distance. Real apps
          often use pgvector; this lesson uses arrays to show the core idea.
        </p>
      </Paragraphs>
      {examples.map((example) => (
        <ExampleBlock example={example} key={example.id} />
      ))}
    </CourseLessonPage>
  );
}
