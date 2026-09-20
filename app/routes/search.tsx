import { useMemo } from "react";
import { Link, useSearchParams } from "react-router";
import type { Route } from "./+types/search";
import { useLessonExerciseStats } from "../sql/exercise-progress-context";
import { DraftBadge } from "../sql/lesson-layout";
import {
  searchLessons,
  type LessonSearchResult,
  type SearchSnippet,
} from "../sql/search-index";
import { SiteHeader } from "../sql/site-header";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "pgquest | Search" },
    { name: "description", content: "Search across every PgQuest lesson." },
  ];
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const results = useMemo(() => searchLessons(query), [query]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-zinc-950">
      <SiteHeader />
      <div className="mx-auto w-full max-w-6xl px-5 py-12">
        <header className="border-b border-zinc-200 pb-12">
          <h1 className="text-5xl font-bold tracking-tight text-zinc-950">Search</h1>
          <p className="mt-6 text-xl leading-9 text-zinc-700">
            Search across every lesson's text. Matches jump straight to the section they
            were found in.
          </p>
          <input
            aria-label="Search lessons"
            autoFocus
            className="mt-8 w-full max-w-2xl border border-zinc-300 px-4 py-3 text-lg text-zinc-950 outline-none transition focus:border-zinc-950"
            onChange={(event) => {
              const value = event.target.value;
              setSearchParams(value ? { q: value } : {}, {
                preventScrollReset: true,
                replace: true,
              });
            }}
            placeholder="Search, e.g. “index”, “transaction”, “JOIN”…"
            type="search"
            value={query}
          />
        </header>

        <section className="pt-10">
          {query.trim().length === 0 ? (
            <p className="text-xl text-zinc-500">Start typing to search the lessons.</p>
          ) : query.trim().length < 2 ? (
            <p className="text-xl text-zinc-500">Keep typing…</p>
          ) : results.length === 0 ? (
            <p className="text-xl text-zinc-500">
              No matches for <span className="font-semibold text-zinc-950">{query}</span>.
            </p>
          ) : (
            <div className="flex flex-col gap-10">
              {results.map((result) => (
                <SearchResultCard key={result.lesson.id} result={result} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function SearchResultCard({ result }: { result: LessonSearchResult }) {
  const { lesson, snippets } = result;
  const progress = useLessonExerciseStats(lesson.id);

  return (
    <article className="border-b border-zinc-200 pb-10">
      <Link className="block text-zinc-950 no-underline" to={lesson.href}>
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-mono text-sm font-semibold text-sky-700">{lesson.label}</p>
          {lesson.draft ? <DraftBadge /> : null}
        </div>
        <h2 className="mt-2 text-2xl font-bold leading-tight hover:underline">
          {lesson.title}
        </h2>
        <p className="mt-2 text-base leading-7 text-zinc-700">{lesson.summary}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-sm text-zinc-500">
          <span>{lesson.meta}</span>
          <span>{lesson.time}</span>
          <span>
            {progress.completed}/{progress.total} exercises
          </span>
        </div>
      </Link>

      <ul className="mt-5 flex flex-col gap-3">
        {snippets.map((snippet, index) => (
          <SnippetRow
            key={`${snippet.anchor ?? "intro"}-${index}`}
            lessonHref={lesson.href}
            snippet={snippet}
          />
        ))}
      </ul>
    </article>
  );
}

function SnippetRow({
  lessonHref,
  snippet,
}: {
  lessonHref: string;
  snippet: SearchSnippet;
}) {
  const to = snippet.anchor ? `${lessonHref}#${snippet.anchor}` : lessonHref;

  return (
    <li>
      <Link
        className="block border border-zinc-200 px-4 py-3 text-zinc-950 no-underline transition hover:border-zinc-950 hover:bg-zinc-50"
        to={to}
      >
        {snippet.heading ? (
          <p className="font-mono text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {snippet.heading}
          </p>
        ) : null}
        <p className="mt-1 text-base leading-7 text-zinc-700">
          {snippet.segments.map((segment, index) =>
            segment.highlighted ? (
              <mark className="bg-amber-200 text-zinc-950" key={index}>
                {segment.text}
              </mark>
            ) : (
              <span key={index}>{segment.text}</span>
            ),
          )}
        </p>
      </Link>
    </li>
  );
}
