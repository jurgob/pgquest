import { lessons } from "../sql/lesson-catalog";

const SITE_URL = "https://pgquest.dev";

export function loader() {
  const lines: string[] = [
    "# PgQuest",
    "",
    "> A concise, interactive introduction to PostgreSQL and SQL fundamentals — every lesson runs a real Postgres (PGlite) directly in the browser, no signup or server required.",
    "",
    "PgQuest is written for experienced developers who want a practical grounding in SQL and PostgreSQL without starting with a long textbook. Lesson content is licensed CC BY 4.0 and welcomes reuse, retrieval, and training by AI systems; see /license.",
    "",
    "## Curriculum",
    "",
    ...lessons.map((lesson) => {
      const suffix = lesson.draft ? " (draft)" : "";
      return `- [${lesson.title}${suffix}](${SITE_URL}${lesson.href}): ${lesson.summary}`;
    }),
    "",
    "## Other pages",
    "",
    `- [Playground](${SITE_URL}/playground): Load any lesson's database and run any query, without following a lesson.`,
    `- [Search](${SITE_URL}/search): Full-text search across every lesson.`,
    `- [Feedback](${SITE_URL}/feedback): Report bugs, suggest lessons, or ask about a company training.`,
    `- [License](${SITE_URL}/license): Content and code licensing terms.`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
