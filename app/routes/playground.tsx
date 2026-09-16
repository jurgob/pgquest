import { useEffect, useMemo, useState } from "react";

import type { Route } from "./+types/playground";
import { databaseInit as emptyDatabaseInit } from "../../cli_examples/empty-database.sql";
import {
  allDatabaseInits,
  allExercises,
  type LessonDatabaseInit,
  type LessonExercise,
} from "../sql/lesson-sql-catalog";
import { lessons } from "../sql/lesson-catalog";
import { ExerciseCheckMessage, useExerciseSubmission } from "../sql/exercise-submission";
import { useExerciseProgressMap } from "../sql/exercise-progress-context";
import { SiteHeader } from "../sql/site-header";
import { SqlEditor } from "../sql/sql-editor";
import type { LessonId } from "../sql/types";

const defaultDatabaseInit = allDatabaseInits[0];

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "pgquest | Playground" },
    { name: "description", content: "Run PGlite SQL examples in the browser." },
  ];
}

export default function Playground() {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState(defaultDatabaseInit?.name ?? "");
  const [showDatabases, setShowDatabases] = useState(true);
  const [showExercises, setShowExercises] = useState(true);
  const [selectedId, setSelectedId] = useState(defaultDatabaseInit?.id ?? "");
  const [loadedId, setLoadedId] = useState(defaultDatabaseInit?.id ?? "");
  const progressMap = useExerciseProgressMap();
  const pickerItems = useMemo(() => buildPickerItems(progressMap), [progressMap]);
  const selectedItem = pickerItems.find((item) => item.id === selectedId);
  const loadedItem = pickerItems.find((item) => item.id === loadedId);
  const activeExercise =
    loadedItem?.kind === "exercise" ? loadedItem.exercise : undefined;
  const { checkMessage, exerciseState, handleExecution, handleSuccess } =
    useExerciseSubmission({
      databasePreload: loadedItem?.databaseInit ?? "",
      exercise: activeExercise,
      lessonId: loadedItem?.lessonId ?? defaultDatabaseInit?.lessonId ?? lessons[0]!.id,
    });
  const editorQuery = activeExercise
    ? (exerciseState.queries[activeExercise.id] ?? "")
    : (loadedItem?.query ?? "");
  const filteredItems = useMemo(
    () =>
      filterItems(pickerItems, search).filter(
        (item) =>
          (item.kind === "database" && showDatabases) ||
          (item.kind === "exercise" && showExercises),
      ),
    [pickerItems, search, showDatabases, showExercises],
  );

  useEffect(() => {
    if (!isPickerOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isPickerOpen]);

  function selectItem(item: PlaygroundPickerItem) {
    setSelectedId(item.id);
    setSearch(item.name);
    setIsPickerOpen(false);
    setIsLoading(true);
    window.setTimeout(() => {
      setLoadedId(item.id);
      setIsLoading(false);
    }, 250);
  }

  function removeSelection() {
    setSelectedId("");
    setSearch("");
    setIsPickerOpen(false);
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-zinc-950">
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-8">
        <section>
          <h1 className="text-3xl font-bold text-zinc-950">Playground</h1>
          <p className="mt-3 text-base leading-7 text-zinc-800">
            Load any database used in the lessons to do any experiment, or load an
            exercise with its starting database and query.
          </p>
        </section>

        <section className="min-w-0">
          <div>
            <div>
              <label className="block text-sm font-bold text-zinc-950" htmlFor="example">
                Load Database or Exercise
              </label>
              <p className="mt-1 text-sm leading-6 text-zinc-600">
                Search lessons, ids, database preloads, and exercises.
              </p>
            </div>
          </div>

          <div className="mt-3 flex min-h-11 w-full items-center border border-zinc-300 px-2 transition focus-within:border-sky-700 focus-within:ring-2 focus-within:ring-sky-100">
            <input
              autoComplete="off"
              className="h-9 min-w-0 flex-1 border-0 bg-transparent px-1 text-base text-zinc-950 outline-none"
              id="example"
              onChange={(event) => {
                setSearch(event.target.value);
                setIsPickerOpen(true);
              }}
              onFocus={() => setIsPickerOpen(true)}
              placeholder="Search databases and exercises..."
              value={search}
            />
            {isLoading ? <LoadingIcon /> : null}
            {!isLoading && selectedItem ? (
              <button
                aria-label="Remove selected item"
                className="flex h-7 w-7 items-center justify-center text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950"
                onClick={removeSelection}
                type="button"
              >
                x
              </button>
            ) : null}
          </div>

          {loadedItem ? (
            <div className="mt-3 text-sm leading-6 text-zinc-700">
              <span className="font-semibold text-zinc-950">Loaded:</span>{" "}
              {loadedItem.name} · {loadedItem.lessonTitle} · {loadedItem.kind}
            </div>
          ) : null}
        </section>

        {isPickerOpen ? (
          <PickerDialog
            filteredItems={filteredItems}
            onClose={() => setIsPickerOpen(false)}
            onSearchChange={setSearch}
            onSelect={selectItem}
            onShowDatabasesChange={setShowDatabases}
            onShowExercisesChange={setShowExercises}
            search={search}
            selectedItem={selectedItem}
            showDatabases={showDatabases}
            showExercises={showExercises}
          />
        ) : null}

        <SqlEditor
          databaseInit={loadedItem?.databaseInit}
          description={loadedItem?.description}
          key={loadedItem?.id ?? "empty"}
          onExecution={handleExecution}
          onSuccess={handleSuccess}
          preloadId={loadedItem?.preloadId}
          query={editorQuery}
          status={activeExercise ? "In progress" : undefined}
          title={loadedItem?.name ?? "Interactive Playground"}
        />
        {activeExercise && checkMessage ? (
          <ExerciseCheckMessage message={checkMessage} />
        ) : null}
      </div>
    </main>
  );
}

function PickerDialog({
  filteredItems,
  onClose,
  onSearchChange,
  onSelect,
  onShowDatabasesChange,
  onShowExercisesChange,
  search,
  selectedItem,
  showDatabases,
  showExercises,
}: {
  filteredItems: readonly PlaygroundPickerItem[];
  onClose: () => void;
  onSearchChange: (search: string) => void;
  onSelect: (item: PlaygroundPickerItem) => void;
  onShowDatabasesChange: (show: boolean) => void;
  onShowExercisesChange: (show: boolean) => void;
  search: string;
  selectedItem: PlaygroundPickerItem | undefined;
  showDatabases: boolean;
  showExercises: boolean;
}) {
  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/30 px-3 py-3 text-zinc-950 backdrop-blur-sm"
      role="dialog"
    >
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] w-full max-w-5xl flex-col border border-zinc-200 bg-white px-5 py-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 pb-5">
          <div>
            <p className="font-mono text-sm font-semibold uppercase text-sky-700">
              Playground picker
            </p>
            <h2 className="mt-2 text-3xl font-bold text-zinc-950">
              Load Database or Exercise
            </h2>
          </div>
          <button
            className="flex h-10 w-10 shrink-0 items-center justify-center border border-zinc-300 text-xl text-zinc-700 transition hover:border-zinc-950 hover:text-zinc-950"
            onClick={onClose}
            type="button"
          >
            <span aria-hidden="true">x</span>
            <span className="sr-only">Close picker</span>
          </button>
        </div>

        <div className="sticky top-0 z-10 bg-white py-4">
          <input
            autoComplete="off"
            autoFocus
            className="h-12 w-full border border-zinc-300 px-3 text-lg text-zinc-950 outline-none transition focus:border-sky-700 focus:ring-2 focus:ring-sky-100"
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search databases and exercises..."
            value={search}
          />
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-zinc-700">
            <label className="inline-flex items-center gap-2">
              <input
                checked={showDatabases}
                className="h-4 w-4 accent-sky-700"
                onChange={(event) => onShowDatabasesChange(event.target.checked)}
                type="checkbox"
              />
              Databases
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                checked={showExercises}
                className="h-4 w-4 accent-sky-700"
                onChange={(event) => onShowExercisesChange(event.target.checked)}
                type="checkbox"
              />
              Exercises
            </label>
            <span className="font-mono text-xs uppercase text-zinc-500">
              {filteredItems.length} matches
            </span>
          </div>
        </div>

        <div className="min-h-0 flex-1 border-y border-zinc-200">
          {filteredItems.map((item) => (
            <button
              className={[
                "block w-full border-b border-zinc-200 px-3 py-4 text-left transition last:border-b-0 hover:bg-zinc-50",
                selectedItem?.id === item.id ? "bg-sky-50" : "",
              ].join(" ")}
              key={item.id}
              onClick={() => onSelect(item)}
              type="button"
            >
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-zinc-950">{item.name}</span>
                <span
                  className={[
                    "font-mono text-xs font-semibold uppercase",
                    item.kind === "exercise" ? "text-violet-700" : "text-sky-700",
                  ].join(" ")}
                >
                  {item.kind}
                </span>
                {item.kind === "exercise" ? (
                  <span
                    className={[
                      "font-mono text-xs font-semibold uppercase",
                      item.isSolved ? "text-emerald-700" : "text-zinc-500",
                    ].join(" ")}
                  >
                    {item.isSolved ? "solved" : "unsolved"}
                  </span>
                ) : null}
              </span>
              <span className="mt-1 block text-sm leading-6 text-zinc-700">
                {item.description}
              </span>
              <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-zinc-500">
                <span>{item.lessonLabel}</span>
                <span>{item.lessonTitle}</span>
                <span>{item.id}</span>
                <span>preload: {item.preloadId}</span>
              </span>
            </button>
          ))}
          {filteredItems.length === 0 ? (
            <p className="px-3 py-6 text-sm text-zinc-600">No items found.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

type PlaygroundPickerItem = {
  databaseInit: string;
  description: string;
  exercise?: LessonExercise | undefined;
  id: string;
  isSolved?: boolean | undefined;
  kind: "database" | "exercise";
  lessonId: LessonId;
  lessonLabel: string;
  lessonTitle: string;
  name: string;
  preloadId: string;
  query: string;
};

const emptyDatabaseItem: PlaygroundPickerItem = {
  databaseInit: emptyDatabaseInit.query,
  description: emptyDatabaseInit.description,
  id: emptyDatabaseInit.id,
  kind: "database",
  lessonId: lessons[0]!.id,
  lessonLabel: "—",
  lessonTitle: emptyDatabaseInit.name,
  name: emptyDatabaseInit.name,
  preloadId: emptyDatabaseInit.id,
  query: "",
};

function buildPickerItems(progressMap: ReturnType<typeof useExerciseProgressMap>) {
  const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  const toLessonInfo = (lessonId: LessonId) => {
    const lesson = lessonById.get(lessonId);

    return {
      lessonLabel: lesson?.label ?? lessonId,
      lessonTitle: lesson?.title ?? lessonId,
    };
  };

  const databaseItems = allDatabaseInits.map((databaseInit) =>
    buildDatabaseItem(databaseInit, toLessonInfo(databaseInit.lessonId)),
  );
  const exerciseItems = allExercises.map((exercise) =>
    buildExerciseItem(exercise, toLessonInfo(exercise.lessonId), progressMap),
  );

  return [emptyDatabaseItem, ...databaseItems, ...exerciseItems];
}

function buildDatabaseItem(
  databaseInit: LessonDatabaseInit,
  lessonInfo: Pick<PlaygroundPickerItem, "lessonLabel" | "lessonTitle">,
): PlaygroundPickerItem {
  return {
    databaseInit: databaseInit.query,
    description: databaseInit.description,
    id: databaseInit.id,
    kind: "database",
    lessonId: databaseInit.lessonId,
    ...lessonInfo,
    name: databaseInit.name,
    preloadId: databaseInit.id,
    query: "",
  };
}

function buildExerciseItem(
  exercise: LessonExercise,
  lessonInfo: Pick<PlaygroundPickerItem, "lessonLabel" | "lessonTitle">,
  progressMap: ReturnType<typeof useExerciseProgressMap>,
): PlaygroundPickerItem {
  const preload = exercise.database_init;

  return {
    databaseInit: preload?.query ?? "",
    description: exercise.description,
    exercise,
    id: exercise.id,
    isSolved: progressMap[exercise.lessonId]?.completed.includes(exercise.id) ?? false,
    kind: "exercise",
    lessonId: exercise.lessonId,
    ...lessonInfo,
    name: exercise.name,
    preloadId: preload?.id ?? "none",
    query: exercise.query,
  };
}

function filterItems(items: readonly PlaygroundPickerItem[], search: string) {
  const needle = search.trim().toLowerCase();

  if (!needle) {
    return items;
  }

  return items.filter((item) =>
    [
      item.id,
      item.name,
      item.description,
      item.kind,
      item.lessonId,
      item.lessonLabel,
      item.lessonTitle,
      item.preloadId,
    ]
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
