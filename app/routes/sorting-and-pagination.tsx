import { examples, exercises } from "../../cli_examples/sorting-and-pagination.sql";
import { CourseLessonPage } from "../sql/course-lesson-page";

export default function Lesson10() {
  return (
    <CourseLessonPage
      examples={examples}
      exercises={exercises}
      intro={
        <p>
          SQL tables do not promise a natural order. Use ORDER BY when order matters, then
          LIMIT and OFFSET when you want a page.
        </p>
      }
      lessonId="sorting-and-pagination"
      whatWeLearned={[
        {
          concept: "ORDER BY",
          description: "defines the order of result rows.",
          url: "https://www.postgresql.org/docs/current/queries-order.html",
        },
        {
          concept: "LIMIT",
          description: "caps how many rows are returned.",
          url: "https://www.postgresql.org/docs/current/queries-limit.html",
        },
        {
          concept: "OFFSET",
          description: "skips rows before returning a page.",
          url: "https://www.postgresql.org/docs/current/queries-limit.html",
        },
        {
          concept: "Index-backed order",
          description: "can avoid a separate sort when the index matches the order.",
        },
      ]}
    />
  );
}
