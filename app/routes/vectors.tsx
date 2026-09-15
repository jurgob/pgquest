import { examples, exercises } from "../../cli_examples/vectors.sql";
import { CourseLessonPage } from "../sql/course-lesson-page";

export default function Lesson15() {
  return (
    <CourseLessonPage
      examples={examples}
      exercises={exercises}
      intro={
        <p>
          Vector search stores meaning as numbers and ranks rows by distance. Real apps
          often use pgvector; this lesson uses arrays to show the core idea.
        </p>
      }
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
    />
  );
}
