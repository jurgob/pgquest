import { NavLink } from "react-router";

import { useExerciseProgress } from "./exercise-progress-context";
import { lessonSummaries } from "./lesson-summaries";

type SiteHeaderProps = {
  activeLesson?: "lesson1" | "lesson2";
};

export function SiteHeader({ activeLesson }: SiteHeaderProps) {
  const lessonOneProgress = useExerciseProgress("lesson1");
  const lessonTwoProgress = useExerciseProgress("lesson2");
  const completedLessons = {
    lesson1: lessonOneProgress.isComplete,
    lesson2: lessonTwoProgress.isComplete,
  };

  return (
    <header className="bg-[#222222] text-white">
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 py-4">
        <NavLink className="flex w-fit items-center text-white no-underline" to="/">
          <span className="text-3xl font-bold">PgQuest</span>
        </NavLink>
        <img
          alt=""
          className="pointer-events-none absolute right-5 top-1/2 h-20 w-20 -translate-y-1/2"
          src="/favicon.svg"
        />

        <nav className="flex items-center gap-2 text-sm text-zinc-300">
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
          <span>Lessons:</span>
          {lessonSummaries.map((lesson) => (
            <NavLink
              className={[
                "inline-flex h-7 min-w-7 items-center justify-center rounded-sm border border-zinc-500 px-2 text-white no-underline transition hover:border-white hover:bg-white hover:text-zinc-950",
                completedLessons[lesson.id]
                  ? "relative border-emerald-400 bg-emerald-950 text-emerald-100 hover:border-emerald-300 hover:bg-emerald-900 hover:text-white"
                  : "",
                activeLesson === lesson.id ? "border-white bg-white text-zinc-950" : "",
              ].join(" ")}
              key={lesson.id}
              title={lesson.title}
              to={lesson.href}
            >
              {lesson.number}
              {completedLessons[lesson.id] ? <CompletionMark /> : null}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
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
