import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { parseHTML } from "linkedom";
import { MemoryRouter } from "react-router";
import { compile, optimize } from "@tailwindcss/node";
import { ExerciseProgressProvider } from "../app/sql/exercise-progress-context";
import { lessons } from "../app/sql/lesson-catalog";
import {
  getPrecomputedLessonSqlResult,
  setLessonSqlInputCollector,
} from "../app/sql/lesson-sql-results";
import { SiteHeader } from "../app/sql/site-header";
import { StaticPreviewProvider } from "../app/sql/static-preview";
import type { SqlExecutionInput } from "../app/sql/types";

// Builds build/preview/index.html: a single self-contained, JavaScript-light
// snapshot of the site for reviewing a branch without deploying it (see
// .claude/skills/preview/SKILL.md, which publishes it as a claude.ai Artifact).
// Every page is prerendered into a <template>, links between pages become
// #p-<page> hashes handled by a tiny inline router, and only the Tailwind
// classes the pages actually use are compiled and inlined. Anything that needs
// PGlite in the browser (Try Yourself, exercises, playground, search, db
// viewer) is left out; lesson examples come from the precomputed
// app/generated/lesson-sql-results.json.

type Page = {
  key: string;
  path: string;
  title: string;
  html: string;
};

const root = process.cwd();
const outDir = path.join(root, "build", "preview");
const outPath = path.join(outDir, "index.html");
const publicDir = path.join(root, "public");

const branch = previewBranchName();
const artifactTitle = `pgquest/${branch}`;
const commit = git("rev-parse", "--short", "HEAD");
const hasUncommittedChanges = git("status", "--porcelain").length > 0;

const routeSources: { path: string; routeModule: string }[] = [
  { path: "/", routeModule: "routes/home.tsx" },
  ...lessons.map((lesson) => ({ path: lesson.href, routeModule: lesson.routeModule })),
  { path: "/license", routeModule: "routes/license.tsx" },
  { path: "/changelog", routeModule: "routes/changelog.tsx" },
];
const pageKeys = new Map(
  routeSources.map((source) => [source.path, pageKey(source.path)]),
);

const renderedInputs: SqlExecutionInput[] = [];
setLessonSqlInputCollector((input) => renderedInputs.push(input));

const pages: Page[] = [];

for (const source of routeSources) {
  const mod: {
    default: React.ComponentType;
    meta?: (args: never) => { title?: string }[];
  } = await import(pathToFileURL(path.join(root, "app", source.routeModule)).href);
  const title = mod.meta?.({} as never).find((entry) => entry.title)?.title ?? "pgquest";

  pages.push({
    html: renderPage(source.path, React.createElement(mod.default)),
    key: pageKey(source.path),
    path: source.path,
    title,
  });
}

setLessonSqlInputCollector(undefined);

const missingResults = renderedInputs.filter(
  (input) => !getPrecomputedLessonSqlResult(input),
);

if (missingResults.length > 0) {
  console.error(
    `${missingResults.length} lesson example(s) have no precomputed result — run \`pnpm run build-assets:lesson-sql-results\` first.`,
  );
  process.exit(1);
}

pages.push({
  html: renderPage(
    "/unavailable",
    <main className="min-h-screen overflow-x-hidden bg-white text-zinc-950">
      <SiteHeader />
      <div className="mx-auto w-full max-w-3xl px-5 py-12">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-950">
          Not in this preview
        </h1>
        <p className="mt-4 text-lg leading-8 text-zinc-700">
          This page runs PostgreSQL in the browser, so the static branch preview leaves it
          out. Run <code className="font-mono">pnpm dev</code> to try it.
        </p>
      </div>
    </main>,
  ),
  key: "unavailable",
  path: "/unavailable",
  title: "pgquest | Not in this preview",
});

const classNames = new Set<string>();
const templates = pages.map((page) => {
  const html = rewritePage(page.html, classNames);
  return `<template id="pgq-t-${page.key}" data-title="${escapeAttribute(page.title)}">${html}</template>`;
});

const css = await compileTailwind(classNames);
const builtAt = new Date().toISOString().replace(/\.\d+Z$/, "Z");

const document = `<title>${escapeHtml(artifactTitle)}</title>
<meta name="description" content="Static preview of the pgquest ${escapeAttribute(branch)} branch">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap">
<style>${css}</style>
<style>
body { font-family: var(--font-sans); font-size: 16px; line-height: 1.5; background: #fff; }
.pgq-banner { display: flex; flex-wrap: wrap; gap: 4px 12px; align-items: baseline; padding: 8px 20px; background: #fef3c7; color: #422006; border-bottom: 1px solid #fcd34d; font: 13px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace; }
.pgq-banner strong { font-weight: 700; }
</style>
<div class="pgq-banner" role="note">
  <strong>Branch preview</strong>
  <span>${escapeHtml(branch)} @ ${escapeHtml(commit)}${hasUncommittedChanges ? " + uncommitted changes" : ""}</span>
  <span>built ${builtAt}</span>
  <span>Static snapshot: exercises, playground and search are not included.</span>
</div>
<div id="pgq-view"></div>
${templates.join("\n")}
<script>${routerScript()}</script>
`;

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, document);
fs.writeFileSync(
  path.join(outDir, "preview.json"),
  `${JSON.stringify({ branch, commit, hasUncommittedChanges, title: artifactTitle }, null, 2)}\n`,
);

console.log(
  `Wrote ${pages.length} page(s) to ${path.relative(root, outPath)} (${(Buffer.byteLength(document) / 1024).toFixed(0)} KB) — artifact title "${artifactTitle}".`,
);

function renderPage(pagePath: string, element: React.ReactElement) {
  return renderToStaticMarkup(
    <StaticPreviewProvider value={true}>
      <MemoryRouter initialEntries={[pagePath]}>
        <ExerciseProgressProvider>{element}</ExerciseProgressProvider>
      </MemoryRouter>
    </StaticPreviewProvider>,
  );
}

function rewritePage(html: string, classes: Set<string>) {
  const { document } = parseHTML(`<div id="pgq-root">${html}</div>`);
  const container = document.getElementById("pgq-root")!;

  for (const link of Array.from(container.querySelectorAll("a[href]"))) {
    const href = link.getAttribute("href") ?? "";

    if (!href.startsWith("/")) {
      continue;
    }

    const [pathname = "/", anchor] = href.split("#");
    link.setAttribute("href", `#p-${pageKeys.get(pathname) ?? "unavailable"}`);

    if (anchor && pageKeys.has(pathname)) {
      link.setAttribute("data-anchor", anchor);
    }
  }

  for (const image of Array.from(container.querySelectorAll("img[src]"))) {
    const src = image.getAttribute("src") ?? "";
    const file = path.join(publicDir, src);

    if (src.startsWith("/") && fs.existsSync(file)) {
      image.setAttribute("src", dataUri(file));
    }
  }

  for (const element of Array.from(container.querySelectorAll("[class]"))) {
    for (const name of (element.getAttribute("class") ?? "").split(/\s+/)) {
      if (name) {
        classes.add(name);
      }
    }
  }

  return container.innerHTML;
}

async function compileTailwind(candidates: Set<string>) {
  const base = path.join(root, "app");
  const compiler = await compile(fs.readFileSync(path.join(base, "app.css"), "utf8"), {
    base,
    onDependency: () => {},
  });

  return optimize(compiler.build([...candidates]), { minify: true }).code;
}

// Runs in the artifact page: shows one <template> at a time, keyed by the URL
// hash, so lesson links, back/forward and reloads all work inside one file.
function routerScript() {
  return `(() => {
  const view = document.getElementById("pgq-view");
  let pendingAnchor = null;
  let currentKey = null;

  function show() {
    const hash = decodeURIComponent(location.hash.slice(1));
    const key = hash.startsWith("p-") ? hash.slice(2) : null;
    const template =
      (key && document.getElementById("pgq-t-" + key)) ||
      (currentKey ? null : document.getElementById("pgq-t-home"));

    if (template) {
      currentKey = template.id.slice(6);
      view.replaceChildren(template.content.cloneNode(true));
      document.title = template.dataset.title;
    }

    const anchor = pendingAnchor || (key ? null : hash);
    pendingAnchor = null;
    const target = anchor && document.getElementById(anchor);
    if (target) {
      target.scrollIntoView();
    } else if (template) {
      window.scrollTo(0, 0);
    }
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest && event.target.closest("a[href^='#']");
    if (!link) return;
    const href = link.getAttribute("href");
    if (!href.startsWith("#p-")) {
      event.preventDefault();
      const target = document.getElementById(decodeURIComponent(href.slice(1)));
      if (target) target.scrollIntoView({ behavior: "smooth" });
      return;
    }
    pendingAnchor = link.dataset.anchor || null;
    if (location.hash === href) {
      event.preventDefault();
      show();
    }
  });
  document.addEventListener("submit", (event) => event.preventDefault());
  window.addEventListener("hashchange", show);
  show();
})();`;
}

function pageKey(pagePath: string) {
  const trimmed = pagePath.replace(/^\/+|\/+$/g, "");
  return trimmed === "" ? "home" : trimmed.replace(/[^a-zA-Z0-9]+/g, "-");
}

// In Claude Code on the web the session branch is claude/<slug>-<suffix>; work
// is pushed to <slug> (see CLAUDE.md), so the preview is named after that.
function previewBranchName() {
  const fromEnv = process.env.PGQUEST_PREVIEW_NAME;
  if (fromEnv) {
    return fromEnv;
  }

  const current = git("rev-parse", "--abbrev-ref", "HEAD");
  return current.startsWith("claude/")
    ? current.slice("claude/".length).replace(/-[a-z0-9]{6}$/, "")
    : current;
}

function git(...args: string[]) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

function dataUri(file: string) {
  const types: Record<string, string> = {
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
    ".jpg": "image/jpeg",
  };
  const type = types[path.extname(file)] ?? "application/octet-stream";
  return `data:${type};base64,${fs.readFileSync(file).toString("base64")}`;
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}
