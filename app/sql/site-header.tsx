import { NavLink } from "react-router";

import { lessonSummaries } from "./lesson-summaries";

type SiteHeaderProps = {
  activeLesson?: "lesson1" | "lesson2";
};

export function SiteHeader({ activeLesson }: SiteHeaderProps) {
  return (
    <header className="bg-[#222222] text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 py-4">
        <NavLink className="text-3xl font-bold text-white no-underline" to="/">
          PgQuest
        </NavLink>

        <nav className="flex items-center gap-2 text-sm text-zinc-300">
          <span>Lessons:</span>
          {lessonSummaries.map((lesson) => (
            <NavLink
              className={[
                "inline-flex h-7 min-w-7 items-center justify-center rounded-sm border border-zinc-500 px-2 text-white no-underline transition hover:border-white hover:bg-white hover:text-zinc-950",
                activeLesson === lesson.id ? "border-white bg-white text-zinc-950" : "",
              ].join(" ")}
              key={lesson.id}
              title={lesson.title}
              to={lesson.href}
            >
              {lesson.number}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
