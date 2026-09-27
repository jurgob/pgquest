import { match } from "ts-pattern";

import changelogSource from "../../CHANGELOG.md?raw";
import type { Route } from "./+types/changelog";
import { MarkdownInlineText, parseMarkdownBlocks } from "../sql/markdown";
import { SiteHeader } from "../sql/site-header";

// Parsed once at module load: CHANGELOG.md is bundled into the route as a
// string, so the page (and the static branch preview) needs no loader.
const blocks = parseMarkdownBlocks(changelogSource);

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "pgquest | Changelog" },
    {
      name: "description",
      content: "What's new in pgquest: new lessons, features, and fixes.",
    },
  ];
}

export default function Changelog() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-zinc-950">
      <SiteHeader />
      <div className="mx-auto w-full max-w-3xl px-5 py-12">
        {blocks.map((block, index) =>
          match(block)
            .with({ kind: "heading", level: 1 }, ({ text }) => (
              <h1 className="text-5xl font-bold tracking-tight text-zinc-950" key={index}>
                <MarkdownInlineText text={text} />
              </h1>
            ))
            .with({ kind: "heading", level: 2 }, ({ text }) => (
              <h2
                className="mt-10 border-t border-zinc-200 pt-10 text-2xl font-bold text-zinc-950"
                id={slugify(text)}
                key={index}
              >
                <MarkdownInlineText text={text} />
              </h2>
            ))
            .with({ kind: "heading", level: 3 }, ({ text }) => (
              <h3 className="mt-6 text-lg font-semibold text-zinc-950" key={index}>
                <MarkdownInlineText text={text} />
              </h3>
            ))
            .with({ kind: "list" }, ({ items }) => (
              <ul
                className="mt-3 list-disc space-y-2 pl-6 text-base leading-7 text-zinc-800"
                key={index}
              >
                {items.map((item, itemIndex) => (
                  <li key={itemIndex}>
                    <MarkdownInlineText text={item} />
                  </li>
                ))}
              </ul>
            ))
            .with({ kind: "paragraph" }, ({ text }) => (
              <p className="mt-4 text-xl leading-9 text-zinc-700" key={index}>
                <MarkdownInlineText text={text} />
              </p>
            ))
            .exhaustive(),
        )}
      </div>
    </main>
  );
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
