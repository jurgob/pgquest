import type { Route } from "./+types/home";
import { Link } from "react-router";
import { SiteHeader } from "../sql/site-header";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "pgquest | Curriculum" },
    { name: "description", content: "PostgreSQL playground lessons." },
  ];
}

const tracks = [
  {
    id: "Track 01",
    title: "My first query",
    href: "/lesson-1",
    summary:
      "Create a small table, seed two rows, SELECT them back, and inspect the plan Postgres uses.",
    meta: "1 lesson · SELECT · EXPLAIN",
    time: "10 min",
  },
  {
    id: "Track 02",
    title: "Using an index",
    href: "/lesson-2",
    summary:
      "Indexes and EXPLAIN plans, comparing a sequential scan with an index scan on the same query.",
    meta: "2 lessons · INDEX · EXPLAIN",
    time: "15 min",
  },
] as const;

export default function Home() {
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
        </section>

        <header className="flex flex-col gap-3 border-b border-zinc-200 pb-12 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="text-5xl font-bold tracking-tight text-zinc-950">Curriculum</h1>
          <p className="text-xl font-semibold text-zinc-500">
            Two tracks · 3 lessons · roughly 25 minutes
          </p>
        </header>

        <section>
          {tracks.map((track) => (
            <Link
              className="grid gap-6 border-b border-zinc-200 py-10 text-zinc-950 no-underline transition hover:bg-zinc-50 md:grid-cols-[220px_minmax(0,1fr)_90px]"
              key={track.id}
              to={track.href}
            >
              <div>
                <p className="font-mono text-sm font-semibold text-sky-700">{track.id}</p>
                <h2 className="mt-3 text-2xl font-bold leading-tight">{track.title}</h2>
              </div>

              <div>
                <p className="text-2xl font-semibold leading-10 text-zinc-700">
                  {track.summary}
                </p>
                <p className="mt-5 font-mono text-sm text-zinc-500">{track.meta}</p>
              </div>

              <p className="font-mono text-sm text-zinc-500 md:text-right">
                {track.time}
              </p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
