import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";

import type { Route } from "./+types/dbviewer";
import { databaseInit as emptyDatabaseInit } from "../../cli_examples/empty-database.sql";
import { lessons } from "../sql/lesson-catalog";
import { allDatabaseInits } from "../sql/lesson-sql-catalog";
import { SiteHeader } from "../sql/site-header";
import { SqlCodeViewer } from "../sql/sql-editor";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "pgquest | Database Viewer" },
    { name: "description", content: "Browse the SQL behind any lesson database." },
  ];
}

export default function DbViewer() {
  const { databaseInitId } = useParams();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const items = useMemo(buildDbViewerItems, []);
  const selected = items.find((item) => item.id === databaseInitId);
  const [search, setSearch] = useState(selected?.name ?? "");
  const filteredItems = useMemo(() => filterItems(items, search), [items, search]);

  useEffect(() => {
    setSearch(selected?.name ?? "");
  }, [selected?.name]);

  function selectItem(item: DbViewerItem) {
    setIsOpen(false);
    setSearch(item.name);
    void navigate(`/dbviewer/${item.id}`);
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-zinc-950">
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-8">
        <section>
          <h1 className="text-3xl font-bold text-zinc-950">Database Viewer</h1>
          <p className="mt-3 text-base leading-7 text-zinc-800">
            Browse the SQL that builds any database used across the lessons, without
            running it.
          </p>
        </section>

        <section className="relative min-w-0">
          <label className="block text-sm font-bold text-zinc-950" htmlFor="database">
            Database
          </label>
          <div className="mt-3 flex min-h-11 w-full items-center border border-zinc-300 px-2 transition focus-within:border-sky-700 focus-within:ring-2 focus-within:ring-sky-100">
            <input
              autoComplete="off"
              className="h-9 min-w-0 flex-1 border-0 bg-transparent px-1 text-base text-zinc-950 outline-none"
              id="database"
              onBlur={() =>
                window.setTimeout(() => {
                  setIsOpen(false);
                  setSearch(selected?.name ?? "");
                }, 150)
              }
              onChange={(event) => {
                setSearch(event.target.value);
                setIsOpen(true);
              }}
              onFocus={() => {
                setSearch("");
                setIsOpen(true);
              }}
              placeholder="Search databases..."
              value={search}
            />
          </div>

          {selected ? (
            <p className="mt-3 text-sm leading-6 text-zinc-700">
              <span className="font-semibold text-zinc-950">Loaded:</span> {selected.name}{" "}
              · <span className="font-mono text-xs text-zinc-500">{selected.id}</span>
            </p>
          ) : null}

          {isOpen ? (
            <div className="absolute z-10 mt-1 max-h-96 w-full overflow-auto border border-zinc-300 bg-white shadow-lg">
              {filteredItems.map((item) => (
                <button
                  className={[
                    "block w-full border-b border-zinc-200 px-3 py-3 text-left transition last:border-b-0 hover:bg-zinc-50",
                    selected?.id === item.id ? "bg-sky-50" : "",
                  ].join(" ")}
                  key={item.id}
                  // Fire before the input's onBlur closes the list.
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectItem(item)}
                  type="button"
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-zinc-950">{item.name}</span>
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-zinc-700">
                    {item.description}
                  </span>
                  <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-zinc-500">
                    <span>{item.lessonLabel}</span>
                    <span>{item.lessonTitle}</span>
                    <span>{item.id}</span>
                  </span>
                </button>
              ))}
              {filteredItems.length === 0 ? (
                <p className="px-3 py-6 text-sm text-zinc-600">No databases found.</p>
              ) : null}
            </div>
          ) : null}
        </section>

        {selected ? (
          <SqlCodeViewer code={selected.query} />
        ) : (
          <p className="text-base leading-7 text-zinc-600">
            Select a database above to view the SQL that builds it.
          </p>
        )}
      </div>
    </main>
  );
}

type DbViewerItem = {
  description: string;
  id: string;
  lessonLabel: string;
  lessonTitle: string;
  name: string;
  query: string;
};

function buildDbViewerItems(): DbViewerItem[] {
  const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));

  const emptyItem: DbViewerItem = {
    description: emptyDatabaseInit.description,
    id: emptyDatabaseInit.id,
    lessonLabel: "—",
    lessonTitle: emptyDatabaseInit.name,
    name: emptyDatabaseInit.name,
    query: emptyDatabaseInit.query,
  };

  const lessonItems = allDatabaseInits.map((databaseInit): DbViewerItem => {
    const lesson = lessonById.get(databaseInit.lessonId);

    return {
      description: databaseInit.description,
      id: databaseInit.id,
      lessonLabel: lesson?.label ?? databaseInit.lessonId,
      lessonTitle: lesson?.title ?? databaseInit.lessonId,
      name: databaseInit.name,
      query: databaseInit.query,
    };
  });

  return [emptyItem, ...lessonItems];
}

function filterItems(items: readonly DbViewerItem[], search: string) {
  const needle = search.trim().toLowerCase();

  if (!needle) {
    return items;
  }

  return items.filter((item) =>
    [item.id, item.name, item.description, item.lessonLabel, item.lessonTitle]
      .join(" ")
      .toLowerCase()
      .includes(needle),
  );
}
