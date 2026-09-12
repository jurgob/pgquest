import { lessons } from "./lesson-catalog";
import { LessonPage, Paragraph, Paragraphs, Section, Title2 } from "./lesson-layout";
import type { LessonId } from "./types";

export function DraftLessonPage({ lessonId }: { lessonId: LessonId }) {
  const lesson = lessons.find((candidate) => candidate.id === lessonId);

  if (!lesson) {
    throw new Error(`Missing lesson: ${lessonId}`);
  }

  return (
    <LessonPage activeLesson={lesson.id} title={lesson.title}>
      <Paragraphs>
        <p>{lesson.summary}</p>
      </Paragraphs>

      <Section>
        <Title2>Draft</Title2>
        <Paragraph>
          This lesson is part of the course catalogue, but the full walkthrough and
          exercises are not written yet.
        </Paragraph>
      </Section>
    </LessonPage>
  );
}
