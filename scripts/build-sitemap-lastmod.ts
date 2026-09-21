import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { lessons } from "../app/sql/lesson-catalog";

// Sitemap lastmod dates come from git history, so they need real history —
// a shallow checkout (CI's default) only has the latest commit, in which
// case we just omit lastmod for files that predate it rather than fail.
function lastCommitDate(filePath: string): string | undefined {
  try {
    const output = execFileSync("git", ["log", "-1", "--format=%cI", "--", filePath], {
      cwd: root,
      encoding: "utf8",
    }).trim();

    return output.length > 0 ? output : undefined;
  } catch {
    return undefined;
  }
}

function mostRecent(dates: (string | undefined)[]): string | undefined {
  const present = dates.filter((date): date is string => Boolean(date));

  if (present.length === 0) {
    return undefined;
  }

  return present.reduce((latest, date) => (date > latest ? date : latest));
}

const root = process.cwd();
const outPath = path.join(root, "app", "sql", "sitemap-lastmod.generated.json");

const staticPages: { path: string; routeFile: string }[] = [
  { path: "/", routeFile: "app/routes/home.tsx" },
  { path: "/playground", routeFile: "app/routes/playground.tsx" },
  { path: "/search", routeFile: "app/routes/search.tsx" },
  { path: "/feedback", routeFile: "app/routes/feedback.tsx" },
  { path: "/license", routeFile: "app/routes/license.tsx" },
];

const lastmodByPath: Record<string, string> = {};

for (const page of staticPages) {
  const date = lastCommitDate(page.routeFile);
  if (date) {
    lastmodByPath[page.path] = date;
  }
}

for (const lesson of lessons) {
  const date = mostRecent([
    lastCommitDate(path.join("app", lesson.routeModule)),
    lastCommitDate(path.join("cli_examples", lesson.cliExampleModule)),
  ]);
  if (date) {
    lastmodByPath[lesson.href] = date;
  }
}

fs.writeFileSync(outPath, `${JSON.stringify(lastmodByPath, null, 2)}\n`);
console.log(
  `Wrote lastmod dates for ${Object.keys(lastmodByPath).length}/${staticPages.length + lessons.length} pages to ${outPath}`,
);
