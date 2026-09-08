import { CodeWindow, SqlEditor } from "./sql-editor";
import { SiteHeader } from "./site-header";
import type { LessonId, SqlExampleDefinition } from "./types";

type SqlExamplePageProps = {
  activeLesson: LessonId;
  lesson: SqlExampleDefinition;
};

export function SqlExamplePage({ activeLesson, lesson }: SqlExamplePageProps) {
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
          </div>

          <SqlEditor example={lesson} />
        </article>
      </div>
    </main>
  );
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
