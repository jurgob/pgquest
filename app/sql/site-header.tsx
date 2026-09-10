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
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 py-4">
        <NavLink className="flex w-fit items-center gap-3 text-white no-underline" to="/">
          <img alt="" className="h-10 w-10" src="/favicon.svg" />
          <span className="text-3xl font-bold">PgQuest</span>
        </NavLink>

        <nav className="flex items-center gap-2 text-sm text-zinc-300">
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
