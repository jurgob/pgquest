import type { Route } from "./+types/home";
import { Link } from "react-router";
import { useExerciseProgress } from "../sql/exercise-progress-context";
import { SiteHeader } from "../sql/site-header";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "pgquest | Curriculum" },
    { name: "description", content: "PostgreSQL playground lessons." },
  ];
}

const lessons = [
  {
    id: "Lesson 01",
    title: "My first query",
    href: "/lessons/lesson-1",
    summary:
      "Create a small table, seed two rows, SELECT them back, and inspect the plan Postgres uses.",
    meta: "SELECT · EXPLAIN",
    time: "10 min",
  },
  {
    id: "Lesson 02",
    title: "Using an index",
    href: "/lessons/lesson-2",
    summary:
      "Indexes and EXPLAIN plans, comparing a sequential scan with an index scan on the same query.",
    meta: "INDEX · EXPLAIN",
    time: "15 min",
  },
] as const;

export default function Home() {
  const lessonOneProgress = useExerciseProgress("lesson1");
  const lessonTwoProgress = useExerciseProgress("lesson2");
  const completedLessons = {
    lesson1: lessonOneProgress.isComplete,
    lesson2: lessonTwoProgress.isComplete,
  };

  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <SiteHeader />
      <div className="mx-auto w-full max-w-6xl px-5 py-12">
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
            2 lessons · roughly 25 minutes
          </p>
        </header>

        <section>
          {lessons.map((lesson) => (
            <Link
              className="grid gap-6 border-b border-zinc-200 py-10 text-zinc-950 no-underline transition hover:bg-zinc-50 md:grid-cols-[220px_minmax(0,1fr)_90px]"
              key={lesson.id}
              to={lesson.href}
            >
              <div>
                <p className="font-mono text-sm font-semibold text-sky-700">
                  {lesson.id}
                </p>
                <h2 className="mt-3 text-2xl font-bold leading-tight">{lesson.title}</h2>
                {completedLessons[lesson.id === "Lesson 01" ? "lesson1" : "lesson2"] ? (
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

              <p className="font-mono text-sm text-zinc-500 md:text-right">
                {lesson.time}
              </p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
