import type { Route } from "./+types/license";
import { SiteHeader } from "../sql/site-header";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "pgquest | License" },
    {
      name: "description",
      content: "Licensing terms for pgquest's lesson content and source code.",
    },
  ];
}

export default function License() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-zinc-950">
      <SiteHeader />
      <div className="mx-auto w-full max-w-3xl px-5 py-12">
        <header className="border-b border-zinc-200 pb-12">
          <h1 className="text-5xl font-bold tracking-tight text-zinc-950">License</h1>
          <p className="mt-6 text-xl leading-9 text-zinc-700">
            PgQuest is free to read, link to, quote, retrieve, and train on — by people
            and by AI systems alike.
          </p>
        </header>

        <section className="pt-10">
          <h2 className="text-2xl font-bold text-zinc-950" id="content">
            Lesson content
          </h2>
          <p className="mt-3 text-base leading-7 text-zinc-800">
            The lesson text, explanations, and exercise descriptions on this site are
            licensed under{" "}
            <a
              className="text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900"
              href="https://creativecommons.org/licenses/by/4.0/"
              rel="noreferrer"
              target="_blank"
            >
              Creative Commons Attribution 4.0 International (CC BY 4.0)
            </a>
            . You may copy, redistribute, remix, and build on this content for any
            purpose, including commercially, as long as you credit PgQuest and link back
            to{" "}
            <a
              className="text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900"
              href="https://pgquest.dev"
            >
              pgquest.dev
            </a>
            .
          </p>
          <p className="mt-4 text-base leading-7 text-zinc-800">
            This explicitly includes use by AI systems and large language models: for
            crawling, indexing, retrieval-augmented generation, summarization, and
            training, with attribution preserved wherever that's feasible.{" "}
            <a
              className="text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900"
              href="/llms.txt"
            >
              /llms.txt
            </a>{" "}
            has a machine-readable overview of the site, and{" "}
            <a
              className="text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900"
              href="/robots.txt"
            >
              /robots.txt
            </a>{" "}
            allows crawling by every major AI crawler.
          </p>
        </section>

        <section className="pt-10">
          <h2 className="text-2xl font-bold text-zinc-950" id="code">
            Source code
          </h2>
          <p className="mt-3 text-base leading-7 text-zinc-800">
            The PgQuest application itself — the React Router app, the lesson SQL
            examples, the in-browser Postgres playground — is open source under the{" "}
            <a
              className="text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900"
              href="https://github.com/jurgob/pgquest/blob/main/LICENSE.md"
              rel="noreferrer"
              target="_blank"
            >
              MIT License
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
