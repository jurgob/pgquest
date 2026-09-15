import type { SqlExample } from "../../cli_examples/types";
import { lessons } from "./lesson-catalog";
import {
  LessonPage,
  Paragraph,
  Paragraphs,
  Section,
  Title2,
  type WhatWeLearnedItem,
} from "./lesson-layout";
import { CodeViewer } from "./sql-editor";
import type { LessonId } from "./types";
import { SqlPlan, SqlResult, useLessonSqlExample } from "./use-lesson-sql-example";

export function CourseLessonPage({
  examples,
  exercises,
  intro,
  lessonId,
  whatWeLearned,
}: {
  examples: readonly SqlExample[];
  exercises: readonly SqlExample[];
  intro: React.ReactNode;
  lessonId: LessonId;
  whatWeLearned: readonly WhatWeLearnedItem[];
}) {
  const lesson = lessons.find((candidate) => candidate.id === lessonId);
  const tryExample = exercises[0] ?? examples[0];

  if (!lesson) {
    throw new Error(`Missing lesson: ${lessonId}`);
  }

  return (
    <LessonPage
      activeLesson={lessonId}
      defaultQuery={tryExample?.query}
      exercises={exercises}
      preloadId={tryExample?.database_init?.id}
      sqlLoad={tryExample?.database_init?.query}
      title={lesson.title}
      whatWeLearned={whatWeLearned}
    >
      <Paragraphs>{intro}</Paragraphs>
      {examples.map((example) => (
        <CourseExampleBlock example={example} key={example.id} />
      ))}
    </LessonPage>
  );
}

function CourseExampleBlock({ example }: { example: SqlExample }) {
  const execution = useLessonSqlExample({
    query: example.query,
    sqlLoad: example.database_init?.query ?? "",
  });

  return (
    <Section>
      <Title2>{example.name}</Title2>
      <Paragraph>{example.description}</Paragraph>
      <div className="mt-4">
        <CodeViewer code={example.query} />
      </div>
      <div className="mt-4">
        <SqlResult execution={execution} />
      </div>
      <div className="mt-4">
        <SqlPlan execution={execution} />
      </div>
    </Section>
  );
}
