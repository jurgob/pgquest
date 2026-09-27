import type { MDXComponents } from "mdx/types";
import type { ReactNode } from "react";

import ChangelogContent from "../../CHANGELOG.md";
import type { Route } from "./+types/changelog";
import { SiteHeader } from "../sql/site-header";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "pgquest | Changelog" },
    {
      name: "description",
      content: "What's new in pgquest: new lessons, features, and fixes.",
    },
  ];
}

// CHANGELOG.md is compiled to a component at build time, so the page is plain
// server-rendered HTML; these map each Markdown element to the site's styles.
const components: MDXComponents = {
  h1: ({ children }) => (
    <h1 className="text-5xl font-bold tracking-tight text-zinc-950">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2
      className="mt-10 border-t border-zinc-200 pt-10 text-2xl font-bold text-zinc-950"
      id={slugify(children)}
    >
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-6 text-lg font-semibold text-zinc-950">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="mt-4 text-base leading-7 text-zinc-800 first-of-type:text-xl first-of-type:leading-9 first-of-type:text-zinc-700">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="mt-3 list-disc space-y-2 pl-6 text-base leading-7 text-zinc-800">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mt-3 list-decimal space-y-2 pl-6 text-base leading-7 text-zinc-800">
      {children}
    </ol>
  ),
  code: ({ children }) => (
    <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[0.9em]">
      {children}
    </code>
  ),
  a: ({ children, href }) => {
    const external = href !== undefined && /^https?:\/\//.test(href);
    return (
      <a
        className="text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900"
        href={href}
        {...(external ? { rel: "noreferrer", target: "_blank" } : {})}
      >
        {children}
      </a>
    );
  },
};

export default function Changelog() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-zinc-950">
      <SiteHeader />
      <div className="mx-auto w-full max-w-3xl px-5 py-12">
        <ChangelogContent components={components} />
      </div>
    </main>
  );
}

function slugify(children: ReactNode) {
  return String(children)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
