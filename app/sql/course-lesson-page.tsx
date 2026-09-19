import type { SqlExample } from "../../cli_examples/types";
import { lessons } from "./lesson-catalog";
import {
  LessonPage,
  Paragraph,
  Section,
  Title2,
  type WhatWeLearnedItem,
} from "./lesson-layout";
import { SqlCodeViewer } from "./sql-editor";
import type { LessonId } from "./types";
import { SqlPlan, SqlResult, useLessonSqlExample } from "./use-lesson-sql-example";

export function CourseLessonPage({
  children,
  exercises,
  lessonId,
  whatWeLearned,
}: {
  children: React.ReactNode;
  exercises: readonly SqlExample[];
  lessonId: LessonId;
  whatWeLearned: readonly WhatWeLearnedItem[];
}) {
  const lesson = lessons.find((candidate) => candidate.id === lessonId);
  const tryExample = exercises[0];

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
      {children}
    </LessonPage>
  );
}

export function ExampleBlock({ example }: { example: SqlExample }) {
  const execution = useLessonSqlExample({
    query: example.query,
    sqlLoad: example.database_init?.query ?? "",
  });

  return (
    <Section>
      <Title2 id={example.id}>{example.name}</Title2>
      <Paragraph>{example.description}</Paragraph>
      <div className="mt-4">
        <SqlCodeViewer code={example.query} databaseInitId={example.database_init?.id} />
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
