import { NavLink } from "react-router";

import { useLessonExerciseStats } from "./exercise-progress-context";
import { lessonSummaries } from "./lesson-summaries";
import type { LessonId } from "./types";

type SiteHeaderProps = {
  activeLesson?: LessonId;
};

export function SiteHeader({ activeLesson }: SiteHeaderProps) {
  return (
    <header className="bg-[#222222] text-white">
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 py-4 pr-16 sm:pr-24">
        <NavLink className="flex w-fit items-center text-white no-underline" to="/">
          <span className="text-3xl font-bold">PgQuest</span>
        </NavLink>
        <img
          alt=""
          className="pointer-events-none absolute right-5 top-1/2 h-12 w-12 -translate-y-1/2 sm:h-20 sm:w-20"
          src="/favicon.svg"
        />

        <nav className="flex flex-wrap items-center gap-2 text-sm text-zinc-300">
          <NavLink
            aria-label="Home"
            className="inline-flex h-7 w-7 items-center justify-center rounded-sm border border-zinc-500 text-white no-underline transition hover:border-white hover:bg-white hover:text-zinc-950"
            title="Home"
            to="/"
          >
            <HomeIcon />
          </NavLink>
          <NavLink
            aria-label="Playground"
            className="inline-flex h-7 w-7 items-center justify-center rounded-sm border border-zinc-500 text-white no-underline transition hover:border-white hover:bg-white hover:text-zinc-950"
            title="Playground"
            to="/playground"
          >
            <PlaygroundIcon />
          </NavLink>
          <NavLink
            aria-label="Search"
            className="inline-flex h-7 w-7 items-center justify-center rounded-sm border border-zinc-500 text-white no-underline transition hover:border-white hover:bg-white hover:text-zinc-950"
            title="Search"
            to="/search"
          >
            <SearchIcon />
          </NavLink>
          {lessonSummaries.map((lesson) => (
            <LessonNavLink
              active={activeLesson === lesson.id}
              key={lesson.id}
              lesson={lesson}
            />
          ))}
          <NavLink
            aria-label="Feedback"
            className="ml-auto inline-flex h-7 items-center justify-center rounded-sm border border-zinc-500 px-2 text-white no-underline transition hover:border-white hover:bg-white hover:text-zinc-950"
            title="Feedback"
            to="/feedback"
          >
            <FeedbackIcon />
            <span className="ml-1.5 hidden sm:inline">Feedback</span>
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

function LessonNavLink({
  active,
  lesson,
}: {
  active: boolean;
  lesson: (typeof lessonSummaries)[number];
}) {
  const progress = useLessonExerciseStats(lesson.id);

  return (
    <NavLink
      className={[
        "inline-flex h-7 min-w-7 items-center justify-center rounded-sm border border-zinc-500 px-2 text-white no-underline transition hover:border-white hover:bg-white hover:text-zinc-950",
        progress.isComplete
          ? "relative border-emerald-400 bg-emerald-950 text-emerald-100 hover:border-emerald-300 hover:bg-emerald-900 hover:text-white"
          : "",
        active ? "border-white bg-white text-zinc-950" : "",
      ].join(" ")}
      title={lesson.title}
      to={lesson.href}
    >
      {lesson.number}
      {progress.isComplete ? <CompletionMark /> : null}
    </NavLink>
  );
}

function HomeIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function PlaygroundIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M7 4h10M9 4v5l-4 7a2 2 0 0 0 1.7 3h10.6A2 2 0 0 0 19 16l-4-7V4M8 14h8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="m20 20-3.5-3.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function FeedbackIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M4 5h16v11H8l-4 4V5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function CompletionMark() {
  return (
    <span
      aria-label="Lesson complete"
      className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-400 text-[9px] font-bold leading-none text-zinc-950"
      title="Lesson complete"
    >
      ✓
    </span>
  );
}
