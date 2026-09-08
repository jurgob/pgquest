import { useEffect, useState } from "react";

import { runSqlExample } from "./run-example";
import {
  CodeWindow,
  SqlEditor,
  SqlExecutionResult,
  type SqlExecutionState,
} from "./sql-editor";
import { SiteHeader } from "./site-header";
import type { LessonId, SqlExampleDefinition } from "./types";

type SqlExamplePageProps = {
  activeLesson: LessonId;
  editorExample?: SqlExampleDefinition | undefined;
  followUps?: readonly SqlExampleDefinition[];
  lesson: SqlExampleDefinition;
};

export function SqlExamplePage({
  activeLesson,
  editorExample,
  followUps = [],
  lesson,
}: SqlExamplePageProps) {
  const playgroundExample = editorExample ?? lesson;

  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <SiteHeader activeLesson={activeLesson} />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-8">
        <article className="flex min-w-0 flex-col gap-6">
          <div>
            <h1 className="text-3xl font-bold text-zinc-950">{lesson.title}</h1>
            <div className="mt-3 text-base leading-7 text-zinc-800">
              {lesson.description.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-7">
            <CodeSection
              code={lesson.migration}
              text={lesson.codeDescriptions.migration}
              title="Migration"
            />
            <CodeSection
              code={lesson.seed}
              text={lesson.codeDescriptions.seed}
              title="Seed"
            />
            <CodeSection
              code={lesson.query}
              text={lesson.codeDescriptions.query}
              title="Query"
            />
          </div>

          <LessonExecution lesson={lesson} />
          {followUps.map((followUp) => (
            <FollowUpPanel key={followUp.id} lesson={followUp} />
          ))}
          <SqlEditor
            className="mt-6 bg-zinc-50 px-5 py-6"
            description={`Experiment with the ${playgroundExample.title} database yourself. Change the query and run it directly in your browser.`}
            example={playgroundExample}
            title="Try Yourself"
          />
        </article>
      </div>
    </main>
  );
}

function FollowUpPanel({ lesson }: { lesson: SqlExampleDefinition }) {
  return (
    <section className="mt-6 flex min-w-0 flex-col gap-6 border-t border-zinc-200 pt-8">
      <div>
        <h2 className="text-2xl font-bold text-zinc-950">{lesson.title}</h2>
        <div className="mt-3 text-base leading-7 text-zinc-800">
          {lesson.description.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </div>

      <CodeSection
        code={lesson.query}
        text={lesson.codeDescriptions.query}
        title="Query"
      />
      <LessonExecution lesson={lesson} />
    </section>
  );
}

function LessonExecution({ lesson }: { lesson: SqlExampleDefinition }) {
  const execution = useLessonExecution(lesson);

  return (
    <SqlExecutionResult execution={execution} lessonId={lesson.id} query={lesson.query} />
  );
}

function useLessonExecution(lesson: SqlExampleDefinition): SqlExecutionState {
  const [execution, setExecution] = useState<SqlExecutionState>({ status: "loading" });

  useEffect(() => {
    let isCurrent = true;

    setExecution({ status: "loading" });

    void runSqlExample(lesson).then((result) => {
      if (!isCurrent) {
        return;
      }

      setExecution(
        result.match<SqlExecutionState>(
          (output) => ({ status: "done", output }),
          (message) => ({ status: "error", message }),
        ),
      );
    });

    return () => {
      isCurrent = false;
    };
  }, [lesson]);

  return execution;
}

function CodeSection({
  code,
  text,
  title,
}: {
  code: string;
  text: string;
  title: string;
}) {
  return (
    <section className="min-w-0">
      <h2 className="text-xl font-bold text-zinc-950">{title}</h2>
      {text ? <p className="mt-1 text-base leading-7 text-zinc-800">{text}</p> : null}
      <CodeWindow code={code} />
    </section>
  );
}
