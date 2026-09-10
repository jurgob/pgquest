import { useEffect, useMemo, useRef, useState } from "react";
import { match } from "ts-pattern";
import type { PGliteInterface } from "@electric-sql/pglite";
import {
  autocompletion,
  type Completion,
  type CompletionContext,
} from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { HighlightStyle, syntaxHighlighting, syntaxTree } from "@codemirror/language";
import { PostgreSQL, sql } from "@codemirror/lang-sql";
import { linter, lintGutter, type Diagnostic } from "@codemirror/lint";
import { EditorState } from "@codemirror/state";
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  keymap,
  lineNumbers,
} from "@codemirror/view";
import { tags } from "@lezer/highlight";

import { createSqlDatabase, runSqlQueryOnDatabase } from "./run-example";
import { isSqlKeyword, sqlHighlight } from "./sql-highlight";
import type { ExecutionOutput, QueryRow } from "./types";

type SqlEditorProps = {
  className?: string | undefined;
  description?: string | undefined;
  databaseInit?: string | undefined;
  headerAction?: React.ReactNode;
  onSuccess?: ((query: string) => void) | undefined;
  status?: string | undefined;
  query?: string | undefined;
  title?: string | undefined;
};

export type SqlExecutionState =
  | { status: "idle" }
  | { status: "done"; output: ExecutionOutput }
  | { status: "error"; message: string }
  | { status: "loading" };

type SqlOutputView = "both" | "plan" | "result";

type SqlSchema = Record<string, readonly string[]>;

const keywordCompletions: readonly Completion[] = [
  "SELECT",
  "FROM",
  "WHERE",
  "AND",
  "OR",
  "INSERT",
  "INTO",
  "VALUES",
  "UPDATE",
  "SET",
  "DELETE",
  "RETURNING",
  "ORDER BY",
  "LIMIT",
  "EXPLAIN",
].map((label) => ({ label, type: "keyword" }));

export function SqlEditor({
  className = "",
  databaseInit,
  description,
  headerAction,
  onSuccess,
  status,
  query: initialQuery,
  title = "Interactive Playground",
}: SqlEditorProps) {
  const [query, setQuery] = useState(() => formatInitialQuery(initialQuery));
  const [execution, setExecution] = useState<SqlExecutionState>({ status: "idle" });
  const [outputView, setOutputView] = useState<SqlOutputView>("result");
  const [databaseState, setDatabaseState] = useState<DatabaseState>({ status: "idle" });
  const databaseRef = useRef<PGliteInterface | undefined>(undefined);
  const databaseSql = databaseInit ?? "";
  const schema = useMemo(() => getSqlSchema(databaseSql), [databaseSql]);
  const canRun = Boolean(databaseRef.current && query.trim());

  useEffect(() => {
    let isCurrent = true;
    let db: PGliteInterface | undefined;

    async function loadDatabase() {
      if (!databaseSql) {
        databaseRef.current = undefined;
        setDatabaseState({ status: "idle" });
        return;
      }

      setExecution({ status: "idle" });
      setDatabaseState({ status: "loading" });

      try {
        db = await createSqlDatabase(databaseSql);

        if (!isCurrent) {
          await db.close();
          return;
        }

        databaseRef.current = db;
        setDatabaseState({ status: "ready" });
      } catch (error) {
        if (!isCurrent) {
          return;
        }

        setDatabaseState({
          message: error instanceof Error ? error.message : String(error),
          status: "error",
        });
      }
    }

    const timeoutId = window.setTimeout(() => {
      void loadDatabase();
    }, 0);

    return () => {
      isCurrent = false;
      window.clearTimeout(timeoutId);
      databaseRef.current = undefined;
      void db?.close();
    };
  }, [databaseSql]);

  async function runQuery(view: Exclude<SqlOutputView, "both">) {
    const db = databaseRef.current;

    if (!db || !query.trim()) {
      return;
    }

    setOutputView(view);
    setExecution({ status: "loading" });

    const result = await runSqlQueryOnDatabase(db, query);

    const nextExecution = result.match<SqlExecutionState>(
      (output) => ({ status: "done", output }),
      (message) => ({ status: "error", message }),
    );

    setExecution(nextExecution);

    if (nextExecution.status === "done") {
      onSuccess?.(query);
    }
  }

  return (
    <section className={["min-w-0 border-t border-zinc-200 pt-6", className].join(" ")}>
      <div className="mb-3">
        <div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <h2 className="text-xl font-bold text-zinc-950">{title}</h2>
              {status ? (
                <span className="font-mono text-sm uppercase tracking-wide text-zinc-500">
                  {status}
                </span>
              ) : null}
            </div>
            {headerAction}
          </div>
          <p className="mt-1 text-base leading-7 text-zinc-700">
            {description ??
              "The database is already loaded. Write any query you want and run it directly in your browser."}
          </p>
        </div>
      </div>

      <CodeMirrorSqlEditor
        disabled={!databaseSql}
        onChange={(nextQuery) => {
          setQuery(nextQuery);
          setExecution({ status: "idle" });
        }}
        schema={schema}
        value={query}
      />

      <div className="mt-4 flex items-center justify-between gap-2">
        <button
          className="inline-flex h-10 items-center justify-center rounded-sm border border-zinc-300 px-5 font-mono text-sm font-semibold text-zinc-950 transition enabled:hover:border-zinc-950 enabled:hover:bg-zinc-950 enabled:hover:text-white disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-500"
          disabled={!databaseSql}
          onClick={() => {
            setQuery(formatInitialQuery(initialQuery));
            setExecution({ status: "idle" });
          }}
          onMouseDown={(event) => event.preventDefault()}
          type="button"
        >
          <ResetIcon />
          Reset
        </button>
        <div className="flex gap-2">
          <button
            className="inline-flex h-10 items-center justify-center rounded-sm border border-zinc-300 px-5 font-mono text-sm font-semibold text-zinc-950 transition enabled:hover:border-zinc-950 enabled:hover:bg-zinc-950 enabled:hover:text-white disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-500"
            disabled={!databaseSql}
            onClick={() => {
              setQuery("");
              setExecution({ status: "idle" });
            }}
            onMouseDown={(event) => event.preventDefault()}
            type="button"
          >
            <ClearIcon />
            Clean
          </button>
          <button
            className="inline-flex h-10 items-center justify-center rounded-sm bg-zinc-950 px-5 font-mono text-sm font-semibold text-white transition enabled:hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-600"
            disabled={!canRun || execution.status === "loading"}
            onClick={() => runQuery("result")}
            onMouseDown={(event) => event.preventDefault()}
            type="button"
          >
            {execution.status === "loading" && outputView === "result" ? (
              "Running..."
            ) : (
              <>
                <PlayIcon />
                Run
              </>
            )}
          </button>
          <button
            className="inline-flex h-10 items-center justify-center rounded-sm border border-zinc-300 px-5 font-mono text-sm font-semibold text-zinc-950 transition enabled:hover:border-zinc-950 enabled:hover:bg-zinc-950 enabled:hover:text-white disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-100 disabled:text-zinc-500"
            disabled={!canRun || execution.status === "loading"}
            onClick={() => runQuery("plan")}
            onMouseDown={(event) => event.preventDefault()}
            type="button"
          >
            {execution.status === "loading" && outputView === "plan" ? (
              "Explaining..."
            ) : (
              <>
                <ExplainIcon />
                Explain
              </>
            )}
          </button>
        </div>
      </div>

      <DatabaseStatus state={databaseState} />
      <SqlExecutionResult execution={execution} view={outputView} />
    </section>
  );
}

type DatabaseState =
  | { status: "error"; message: string }
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready" };

function CodeMirrorSqlEditor({
  disabled,
  onChange,
  schema,
  value,
}: {
  disabled: boolean;
  onChange: (value: string) => void;
  schema: SqlSchema;
  value: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | undefined>(undefined);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const element = editorRef.current;

    if (!element) {
      return;
    }

    const view = new EditorView({
      doc: value,
      extensions: [
        lineNumbers(),
        lintGutter(),
        history(),
        drawSelection(),
        highlightActiveLine(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        sql({ dialect: PostgreSQL }),
        syntaxHighlighting(sqlHighlightStyle),
        autocompletion({
          activateOnTyping: true,
          maxRenderedOptions: 12,
          override: [createSqlCompletionSource(schema)],
          selectOnOpen: false,
        }),
        linter(sqlSyntaxLinter),
        EditorState.readOnly.of(disabled),
        EditorView.editable.of(!disabled),
        EditorView.lineWrapping,
        EditorView.theme({
          "&": {
            backgroundColor: "#22251f",
            borderRadius: "0.375rem",
            color: "#f4f4f5",
            fontSize: "0.875rem",
            minHeight: "220px",
          },
          ".cm-content": {
            caretColor: "#ffffff",
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            minHeight: "220px",
            padding: "1rem 1.25rem",
          },
          ".cm-editor": {
            outline: "none",
          },
          ".cm-focused": {
            outline: "none",
          },
          ".cm-gutters": {
            backgroundColor: "#1b1d19",
            borderRight: "1px solid #3f3f46",
            color: "#a1a1aa",
          },
          ".cm-line": {
            lineHeight: "1.5rem",
          },
          ".cm-cursor, .cm-dropCursor": {
            borderLeftColor: "#ffffff",
          },
          ".cm-selectionBackground, .cm-content ::selection": {
            backgroundColor: "#0369a155",
          },
          ".cm-diagnosticText": {
            color: "#18181b",
          },
          ".cm-lintRange-error": {
            backgroundImage:
              "linear-gradient(45deg, transparent 65%, #ef4444 80%, transparent 90%), linear-gradient(135deg, transparent 65%, #ef4444 80%, transparent 90%)",
          },
          ".cm-tooltip": {
            border: "1px solid #d4d4d8",
            borderRadius: "0.25rem",
          },
          ".cm-tooltip-autocomplete": {
            backgroundColor: "#ffffff",
            color: "#18181b",
          },
          ".cm-tooltip-autocomplete ul li": {
            color: "#18181b",
          },
          ".cm-tooltip-autocomplete ul li[aria-selected]": {
            backgroundColor: "#0369a1",
            color: "#ffffff",
          },
          ".cm-completionLabel": {
            color: "inherit",
          },
          ".cm-completionDetail": {
            color: "inherit",
            opacity: "0.72",
          },
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
      ],
      parent: element,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = undefined;
    };
  }, [disabled, schema]);

  useEffect(() => {
    const view = viewRef.current;

    if (!view || view.state.doc.toString() === value) {
      return;
    }

    view.dispatch({
      changes: {
        from: 0,
        insert: value,
        to: view.state.doc.length,
      },
    });
  }, [value]);

  return <div aria-label="SQL query editor" ref={editorRef} />;
}

function DatabaseStatus({ state }: { state: DatabaseState }) {
  if (state.status === "idle" || state.status === "ready") {
    return null;
  }

  if (state.status === "loading") {
    return (
      <OutputBlock tone="neutral" title="Result">
        <SqlResultSkeleton />
      </OutputBlock>
    );
  }

  return (
    <OutputBlock tone="danger" title="Database Error">
      <pre className="overflow-auto whitespace-pre-wrap text-sm text-red-800">
        {state.message}
      </pre>
    </OutputBlock>
  );
}

function PlayIcon() {
  return (
    <svg
      aria-hidden="true"
      className="mr-2 inline h-3.5 w-3.5"
      fill="currentColor"
      viewBox="0 0 16 16"
    >
      <path d="M4 2.75v10.5L12.5 8 4 2.75Z" />
    </svg>
  );
}

function ExplainIcon() {
  return (
    <svg
      aria-hidden="true"
      className="mr-2 inline h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 16 16"
    >
      <path d="M3 4h10M3 8h10M3 12h6" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <span aria-hidden="true" className="mr-2">
      ↻
    </span>
  );
}

function ClearIcon() {
  return (
    <span aria-hidden="true" className="mr-2">
      ×
    </span>
  );
}

export function CodeWindow({ code }: { code: string }) {
  return <CodeViewer code={code} />;
}

export function CodeViewer({
  code,
  syntax: _syntax = "sql",
}: {
  code: string;
  syntax?: "explain" | "sql";
}) {
  return (
    <pre className="mt-3 min-w-0 overflow-auto rounded-md bg-[#22251f] px-5 py-4 font-mono text-sm leading-6 text-zinc-100">
      <code>{sqlHighlight(code.trim())}</code>
    </pre>
  );
}

export function SqlExecutionResult({
  execution,
  children,
  loading,
  query,
  view = "both",
}: {
  children?: React.ReactNode;
  execution: SqlExecutionState;
  loading?: React.ReactNode;
  query?: string | undefined;
  view?: SqlOutputView | undefined;
}) {
  return match(execution)
    .with({ status: "idle" }, () => null)
    .with({ status: "loading" }, () => (
      <OutputBlock tone="neutral" title={view === "plan" ? "Explanation" : "Result"}>
        {loading ?? <SqlResultSkeleton />}
      </OutputBlock>
    ))
    .with({ status: "error" }, ({ message }) => (
      <OutputBlock tone="danger" title="Error">
        <pre className="overflow-auto whitespace-pre-wrap text-sm text-red-800">
          {message}
        </pre>
      </OutputBlock>
    ))
    .with({ status: "done" }, ({ output }) => (
      <div className="mt-6 flex flex-col gap-6">
        {view === "both" || view === "result" ? (
          <OutputBlock tone="neutral" title="Result">
            <ResultTable rows={output.rows} />
          </OutputBlock>
        ) : null}
        {view === "both" || view === "plan" ? (
          <OutputBlock tone="plan" title="Explanation">
            {query ? <CodeWindow code={`EXPLAIN ${query.trim()}`} /> : null}
            <pre className="mt-3 overflow-auto whitespace-pre-wrap rounded-md bg-[#22251f] px-5 py-4 font-mono text-sm leading-6 text-zinc-100">
              {output.plan}
            </pre>
            {children}
          </OutputBlock>
        ) : null}
      </div>
    ))
    .exhaustive();
}

export function SqlResultSkeleton() {
  return (
    <div aria-label="Loading result" className="animate-pulse space-y-3" role="status">
      <div className="h-4 w-2/5 bg-zinc-200" />
      <div className="h-4 w-4/5 bg-zinc-200" />
      <div className="h-4 w-3/5 bg-zinc-200" />
      <div className="mt-6 h-px w-full bg-zinc-200" />
      <div className="h-4 w-1/2 bg-zinc-200" />
    </div>
  );
}

function OutputBlock({
  children,
  title,
  tone,
}: {
  children: React.ReactNode;
  title: string;
  tone: "danger" | "neutral" | "plan";
}) {
  const className = match(tone)
    .with("danger", () => "border-red-200")
    .with("neutral", () => "border-zinc-200")
    .with("plan", () => "border-zinc-200")
    .exhaustive();
  const titleClassName = match(tone)
    .with("danger", () => "border-red-200 text-red-700")
    .with("neutral", () => "border-zinc-200 text-zinc-950")
    .with("plan", () => "border-zinc-200 text-zinc-950")
    .exhaustive();

  return (
    <section className={["min-w-0 border-t pt-3", className].join(" ")}>
      <div className={["mb-3 text-base font-bold", titleClassName].join(" ")}>
        {title}
      </div>
      <div className="overflow-auto">{children}</div>
    </section>
  );
}

function ResultTable({ rows }: { rows: QueryRow[] }) {
  if (rows.length === 0) {
    return <p className="text-base text-zinc-600">No rows</p>;
  }

  const columns = Object.keys(rows[0] ?? {});

  return (
    <table className="w-full border-collapse text-left text-sm">
      <thead>
        <tr>
          {columns.map((column) => (
            <th
              className="border-b border-zinc-300 px-3 py-2 font-bold text-zinc-950"
              key={column}
            >
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr
            key={`${rowIndex}-${columns.map((column) => formatCell(row[column])).join("|")}`}
          >
            {columns.map((column) => (
              <td
                className="border-b border-zinc-200 px-3 py-2 text-zinc-900"
                key={column}
              >
                {formatCell(row[column])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function formatInitialQuery(query: string | undefined) {
  return query?.trim() ?? "";
}

function createSqlCompletionSource(schema: SqlSchema) {
  const tableCompletions = Object.keys(schema).map((label) => ({
    label: quoteIdentifierIfNeeded(label),
    type: "type",
  }));
  const columnCompletions = [
    ...new Set(Object.values(schema).flatMap((columns) => [...columns])),
  ].map((label) => ({
    label: quoteIdentifierIfNeeded(label),
    type: "property",
  }));

  return (context: CompletionContext) => {
    const word = context.matchBefore(/"?[A-Za-z_][A-Za-z0-9_"]*$/);

    if (!context.explicit && !word) {
      return null;
    }

    const from = word?.from ?? context.pos;
    const prefix = word?.text ?? "";
    const before = context.state.sliceDoc(0, from);

    if (isInsideString(before)) {
      return null;
    }

    const mode = getCompletionMode(before);
    const options =
      mode === "table"
        ? tableCompletions
        : mode === "column"
          ? columnCompletions
          : context.explicit
            ? keywordCompletions
            : keywordCompletions.slice(0, 5);

    const filteredOptions = filterCompletions(options, prefix);

    if (filteredOptions.length === 0) {
      return null;
    }

    return {
      from,
      options: filteredOptions,
      validFor: /^"?[A-Za-z_][A-Za-z0-9_"]*$/,
    };
  };
}

function getSqlSchema(sqlLoad: string): SqlSchema {
  const schema: SqlSchema = {};
  const createTablePattern =
    /CREATE\s+TABLE\s+(?:"([^"]+)"|([A-Za-z_][A-Za-z0-9_]*))\s*\(([\s\S]*?)\);/gi;

  for (const match of sqlLoad.matchAll(createTablePattern)) {
    const tableName = match[1] ?? match[2];
    const columnBlock = match[3];

    if (!tableName || !columnBlock) {
      continue;
    }

    const columns = columnBlock
      .split(",")
      .map((line) => line.trim().match(/^(?:"([^"]+)"|([A-Za-z_][A-Za-z0-9_]*))/))
      .map((columnMatch) => columnMatch?.[1] ?? columnMatch?.[2])
      .filter((column): column is string => Boolean(column))
      .filter((column) => !isSqlKeyword(column));

    schema[tableName] = columns;
  }

  return schema;
}

function getCompletionMode(sqlBeforeCursor: string) {
  const normalized = sqlBeforeCursor.replace(/\s+/g, " ").trimEnd().toUpperCase();

  if (
    /(WHERE|AND|OR)\s+[\s\S]*(=|<>|!=|<|>|<=|>=|LIKE|IN)\s*(?:'[^']*'|[0-9]+|\))\s*$/.test(
      normalized,
    )
  ) {
    return "keyword";
  }

  if (/(FROM|JOIN|INTO|UPDATE)\s+(?:"?[A-Z_][A-Z0-9_"]*)?$/.test(normalized)) {
    return "table";
  }

  if (
    /(^|[\s,(])(SELECT|WHERE|AND|OR|BY|SET|RETURNING)\s+[^;]*$/i.test(sqlBeforeCursor)
  ) {
    return "column";
  }

  return "keyword";
}

function filterCompletions(options: readonly Completion[], prefix: string) {
  const normalizedPrefix = normalizeCompletionText(prefix);

  if (!normalizedPrefix) {
    return options;
  }

  return options.filter((option) =>
    normalizeCompletionText(option.label).startsWith(normalizedPrefix),
  );
}

function quoteIdentifierIfNeeded(identifier: string) {
  return /^[a-z_][a-z0-9_]*$/.test(identifier)
    ? identifier
    : `"${identifier.replaceAll('"', '""')}"`;
}

function normalizeCompletionText(value: string) {
  return value.replaceAll('"', "").toLowerCase();
}

function isInsideString(sqlBeforeCursor: string) {
  return (sqlBeforeCursor.match(/'/g) ?? []).length % 2 === 1;
}

function sqlSyntaxLinter(view: EditorView): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const tree = syntaxTree(view.state);
  const cursor = tree.cursor();

  do {
    if (cursor.type.isError) {
      diagnostics.push({
        from: cursor.from,
        message: "SQL syntax error",
        severity: "error",
        to: Math.max(cursor.to, cursor.from + 1),
      });
    }
  } while (cursor.next());

  return diagnostics;
}

function formatCell(value: QueryRow[string] | undefined) {
  if (value == null) {
    return "";
  }

  return String(value);
}

const sqlHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: "#67e8f9", fontWeight: "600" },
  { tag: tags.string, color: "#bef264" },
  { tag: tags.number, color: "#fef08a" },
  { tag: tags.comment, color: "#a1a1aa" },
  { tag: tags.name, color: "#f4f4f5" },
  { tag: tags.operator, color: "#f4f4f5" },
  { tag: tags.punctuation, color: "#f4f4f5" },
]);
