import type { Route } from "./+types/home";
import { Link, useSearchParams } from "react-router";
import {
  useAllExercisesComplete,
  useLessonExerciseStats,
} from "../sql/exercise-progress-context";
import { CompletionCelebration } from "../sql/completion-celebration";
import { lessons } from "../sql/lesson-catalog";
import { DraftBadge } from "../sql/lesson-layout";
import { SiteHeader } from "../sql/site-header";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "pgquest | Curriculum" },
    { name: "description", content: "PostgreSQL playground lessons." },
  ];
}

export default function Home() {
  const allExercisesComplete = useAllExercisesComplete();
  const [searchParams] = useSearchParams();
  const showCompletion =
    allExercisesComplete || searchParams.get("showComplete") === "true";

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-zinc-950">
      <SiteHeader />
      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        {showCompletion ? (
          <div className="mb-20 max-w-4xl">
            <section className="border-2 border-zinc-950 bg-zinc-50 p-6 sm:p-8">
              <div className="flex flex-col gap-2 border-b border-zinc-300 pb-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="font-mono text-sm font-semibold uppercase tracking-wide text-emerald-700">
                    Achievement unlocked
                  </p>
                  <h1 className="mt-3 text-4xl font-bold tracking-tight text-zinc-950">
                    PostgreSQL Quest Complete
                  </h1>
                </div>
                <p className="font-mono text-sm text-zinc-500">ALL EXERCISES PASSED</p>
              </div>
              <p className="mt-6 max-w-2xl text-xl leading-9 text-zinc-700">
                You completed every exercise currently available in PgQuest. The database
                is no longer mysterious: you can create it, query it, and read the plan.
              </p>
            </section>

            <section className="mt-6 border border-zinc-300 bg-zinc-950 p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-white">Victory</h2>
                <span className="font-mono text-sm text-emerald-300">QUEST COMPLETE</span>
              </div>
              <CompletionCelebration />
            </section>
          </div>
        ) : null}
        <section className="mb-20 max-w-3xl border-b border-zinc-200 pb-14">
          <h1 className="text-5xl font-bold tracking-tight text-zinc-950">
            What this is
          </h1>
          <p className="mt-6 text-2xl font-semibold leading-10 text-zinc-700">
            In my career, I have met a surprisingly large number of very talented
            engineers who are not comfortable with PostgreSQL and SQL fundamentals.
          </p>
          <p className="mt-5 text-xl leading-9 text-zinc-700">
            PgQuest is a concise, interactive introduction to the basics of PostgreSQL.
            The code and the examples do most of the explaining, so you can learn by
            reading queries and seeing what PostgreSQL does with them.
          </p>
          <p className="mt-10 text-xl leading-9 text-zinc-700">
            It is written for experienced developers who want a practical grounding in SQL
            and PostgreSQL, without starting with a long textbook or a large application.
          </p>
          <Link
            className="mt-10 block border-y border-zinc-200 py-6 text-zinc-950 no-underline transition hover:bg-zinc-50"
            to="/playground"
          >
            <p className="font-mono text-sm font-semibold text-sky-700">Playground</p>
            <h2 className="mt-3 text-2xl font-bold leading-tight">
              Load any lesson database
            </h2>
            <p className="mt-3 text-xl leading-9 text-zinc-700">
              Use the same browser SQL editor without following a lesson. Load any
              database used in the lessons, edit the query, and run it directly in PGlite.
            </p>
            <p className="mt-5 font-mono text-sm font-semibold text-sky-700">Open</p>
          </Link>
        </section>

        <header className="flex flex-col gap-3 border-b border-zinc-200 pb-12 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="text-5xl font-bold tracking-tight text-zinc-950">Curriculum</h1>
          <p className="text-xl font-semibold text-zinc-500">
            {lessons.length} lessons · roughly 4 hours
          </p>
        </header>

        <section>
          {lessons.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} />
          ))}
        </section>

        <footer className="mt-16 border-t border-zinc-200 pt-8 text-sm text-zinc-500">
          <p>
            Lesson content is licensed{" "}
            <Link
              className="text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900"
              to="/license"
            >
              CC BY 4.0
            </Link>
            . Code is{" "}
            <a
              className="text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900"
              href="https://github.com/jurgob/pgquest/blob/main/LICENSE.md"
              rel="noreferrer"
              target="_blank"
            >
              MIT
            </a>
            .
          </p>
        </footer>
      </div>
    </main>
  );
}

function LessonCard({ lesson }: { lesson: (typeof lessons)[number] }) {
  const progress = useLessonExerciseStats(lesson.id);

  return (
    <Link
      className="grid gap-6 border-b border-zinc-200 py-10 text-zinc-950 no-underline transition hover:bg-zinc-50 md:grid-cols-[220px_minmax(0,1fr)_140px]"
      to={lesson.href}
    >
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-mono text-sm font-semibold text-sky-700">{lesson.label}</p>
          {lesson.draft ? <DraftBadge /> : null}
        </div>
        <h2 className="mt-3 text-2xl font-bold leading-tight">{lesson.title}</h2>
        {progress.isComplete ? (
          <p className="mt-4 font-mono text-sm font-semibold text-emerald-700">
            ✓ Complete
          </p>
        ) : null}
      </div>

      <div>
        <p className="text-2xl font-semibold leading-10 text-zinc-700">
          {lesson.summary}
        </p>
        <p className="mt-5 font-mono text-sm text-zinc-500">{lesson.meta}</p>
      </div>

      <div className="flex flex-col gap-2 font-mono text-sm text-zinc-500 md:text-right">
        <p>{lesson.time}</p>
        <p>
          {progress.completed}/{progress.total} exercises
        </p>
      </div>
    </Link>
  );
}
