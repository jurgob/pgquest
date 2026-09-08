import { useMemo, useState } from "react";

import type { Route } from "./+types/playground";
import { sqlExamples } from "../sql/example-definitions";
import { SiteHeader } from "../sql/site-header";
import { SqlEditor } from "../sql/sql-editor";
import type { SqlExampleDefinition } from "../sql/types";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "pgquest | Playground" },
    { name: "description", content: "Run PGlite SQL examples in the browser." },
  ];
}

export default function Playground() {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [loadedId, setLoadedId] = useState("");
  const selectedExample = sqlExamples.find((example) => example.id === selectedId);
  const loadedExample = sqlExamples.find((example) => example.id === loadedId);
  const filteredExamples = useMemo(() => filterExamples(sqlExamples, search), [search]);

  function selectExample(example: SqlExampleDefinition) {
    setSelectedId(example.id);
    setSearch("");
    setIsPickerOpen(false);
  }

  function removeSelection() {
    setSelectedId("");
    setSearch("");
    setIsPickerOpen(false);
  }

  function loadSelectedExample() {
    if (!selectedExample) {
      return;
    }

    setIsLoading(true);
    window.setTimeout(() => {
      setLoadedId(selectedExample.id);
      setIsLoading(false);
    }, 250);
  }

  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-8">
        <section>
          <h1 className="text-3xl font-bold text-zinc-950">Playground</h1>
          <p className="mt-3 text-base leading-7 text-zinc-800">
            Pick a migration and seed from the CLI examples, then edit and run the query
            in your browser.
          </p>
        </section>

        <section className="min-w-0">
          <label className="block text-sm font-bold text-zinc-950" htmlFor="example">
            Load Database
          </label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <div
                className="flex min-h-11 w-full items-center rounded-sm border border-zinc-300 px-2 transition focus-within:border-sky-700 focus-within:ring-2 focus-within:ring-sky-100"
                onClick={() => {
                  if (!selectedExample) {
                    setIsPickerOpen(true);
                  }
                }}
              >
                {selectedExample ? (
                  <span className="inline-flex max-w-full items-center gap-2 rounded-sm bg-sky-50 px-2 py-1 text-sm font-semibold text-zinc-950">
                    <span className="truncate">{selectedExample.title}</span>
                    <button
                      aria-label="Remove selected example"
                      className="flex h-5 w-5 items-center justify-center rounded-sm text-zinc-500 transition hover:bg-white hover:text-zinc-950"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeSelection();
                      }}
                      type="button"
                    >
                      x
                    </button>
                  </span>
                ) : (
                  <input
                    autoComplete="off"
                    className="h-9 min-w-0 flex-1 border-0 bg-transparent px-1 text-base text-zinc-950 outline-none"
                    id="example"
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setIsPickerOpen(true);
                    }}
                    onFocus={() => setIsPickerOpen(true)}
                    placeholder="Search examples..."
                    value={search}
                  />
                )}
              </div>

              {isPickerOpen ? (
                <div className="absolute z-10 mt-2 max-h-72 w-full overflow-auto border-y border-zinc-200 bg-white shadow-lg">
                  {filteredExamples.map((example) => (
                    <button
                      className="block w-full border-b border-zinc-200 px-3 py-3 text-left transition last:border-b-0 hover:bg-zinc-50"
                      key={example.id}
                      onClick={() => selectExample(example)}
                      type="button"
                    >
                      <span className="block font-semibold text-zinc-950">
                        {example.title}
                      </span>
                      <span className="mt-1 block font-mono text-xs text-zinc-500">
                        {example.id}
                      </span>
                    </button>
                  ))}
                  {filteredExamples.length === 0 ? (
                    <p className="px-3 py-4 text-sm text-zinc-600">No examples found.</p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <button
              className="flex h-11 items-center justify-center gap-2 rounded-sm bg-zinc-950 px-4 font-mono text-sm font-semibold text-white transition enabled:hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-600"
              disabled={!selectedExample || isLoading}
              onClick={loadSelectedExample}
              type="button"
            >
              {isLoading ? <LoadingIcon /> : null}
              Load
            </button>
          </div>

          {loadedExample ? (
            <p className="mt-3 text-sm font-semibold text-zinc-700">
              Dataset loaded: {loadedExample.title}
            </p>
          ) : null}
        </section>

        <SqlEditor
          example={loadedExample}
          initialQuery={loadedExample?.query ?? ""}
          key={loadedExample?.id ?? "empty"}
        />
      </div>
    </main>
  );
}

function filterExamples(examples: readonly SqlExampleDefinition[], search: string) {
  const needle = search.trim().toLowerCase();

  if (!needle) {
    return examples;
  }

  return examples.filter((example) =>
    [example.id, example.title, ...example.description]
      .join(" ")
      .toLowerCase()
      .includes(needle),
  );
}

function LoadingIcon() {
  return (
    <span
      aria-hidden="true"
      className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}
