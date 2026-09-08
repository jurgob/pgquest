import { useMemo, useRef, useState } from "react";
import { match } from "ts-pattern";

import { runSqlQuery } from "./run-example";
import type {
  ExecutionOutput,
  QueryRow,
  SqlExampleDefinition,
  SqlExampleId,
} from "./types";

type SqlEditorProps = {
  className?: string | undefined;
  description?: string | undefined;
  example?: SqlExampleDefinition | undefined;
  explanationDetail?: ExplanationDetail | undefined;
  initialQuery?: string | undefined;
  title?: string | undefined;
};

export type SqlExecutionState =
  | { status: "idle" }
  | { status: "done"; output: ExecutionOutput }
  | { status: "error"; message: string }
  | { status: "loading" };

type SqlTokenKind =
  | "comment"
  | "identifier"
  | "keyword"
  | "number"
  | "operator"
  | "punctuation"
  | "string"
  | "whitespace";

type SqlToken = {
  kind: SqlTokenKind;
  value: string;
};

type SqlOutputView = "both" | "plan" | "result";
type ExplanationDetail = "lesson" | "plan-only";

const baseSuggestions = [
  "SELECT",
  "FROM",
  "WHERE",
  "INSERT",
  "UPDATE",
  "DELETE",
  "CREATE",
  "INDEX",
  "EXPLAIN",
  "ANALYZE",
  "ORDER",
  "GROUP",
  "LIMIT",
  "RETURNING",
];

export function SqlEditor({
  className = "",
  description,
  example,
  explanationDetail = "plan-only",
  initialQuery,
  title = "Interactive Playground",
}: SqlEditorProps) {
  const [query, setQuery] = useState(initialQuery ?? example?.query ?? "");
  const [execution, setExecution] = useState<SqlExecutionState>({ status: "idle" });
  const [outputView, setOutputView] = useState<SqlOutputView>("result");
  const [selectionStart, setSelectionStart] = useState(query.length);
  const [isFocused, setIsFocused] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const suggestions = useSqlSuggestions(example, query, selectionStart);
  const canRun = Boolean(example && query.trim());

  function syncSelection() {
    setSelectionStart(textAreaRef.current?.selectionStart ?? 0);
  }

  function insertSuggestion(value: string) {
    const bounds = getCurrentWordBounds(query, selectionStart);
    const nextQuery = query.slice(0, bounds.start) + value + query.slice(bounds.end);
    const nextPosition = bounds.start + value.length;

    setQuery(nextQuery);
    setSelectionStart(nextPosition);
    requestAnimationFrame(() => {
      textAreaRef.current?.focus();
      textAreaRef.current?.setSelectionRange(nextPosition, nextPosition);
    });
  }

  async function runQuery(view: Exclude<SqlOutputView, "both">) {
    if (!example || !query.trim()) {
      return;
    }

    setOutputView(view);
    setExecution({ status: "loading" });

    const result = await runSqlQuery(example, query);

    setExecution(
      result.match<SqlExecutionState>(
        (output) => ({ status: "done", output }),
        (message) => ({ status: "error", message }),
      ),
    );
  }

  return (
    <section className={["min-w-0 border-t border-zinc-200 pt-6", className].join(" ")}>
      <div className="mb-3">
        <div>
          <h2 className="text-xl font-bold text-zinc-950">{title}</h2>
          <p className="mt-1 text-base leading-7 text-zinc-700">
            {description ??
              (example
                ? `Experiment with the ${example.title} database yourself. Edit the query and run it in your browser.`
                : "Choose a database before running a query.")}
          </p>
        </div>
      </div>

      <div className="relative">
        <div className="relative min-h-[220px] overflow-hidden rounded-md bg-[#22251f]">
          <pre
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 m-0 overflow-auto whitespace-pre-wrap break-words px-5 py-4 font-mono text-sm leading-6 text-zinc-100"
          >
            <code>
              {tokenizeSql(query || " ").map((token, index) => (
                <span
                  className={getSqlTokenClassName(token.kind)}
                  key={`${index}-${token.value}`}
                >
                  {token.value}
                </span>
              ))}
            </code>
          </pre>
          <textarea
            aria-label="SQL query editor"
            className="relative block min-h-[220px] w-full resize-y overflow-auto bg-transparent px-5 py-4 font-mono text-sm leading-6 text-transparent caret-white outline-none selection:bg-sky-500/40"
            disabled={!example}
            onBlur={() => setIsFocused(false)}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelectionStart(event.target.selectionStart);
              setExecution({ status: "idle" });
            }}
            onClick={syncSelection}
            onFocus={() => setIsFocused(true)}
            onKeyDown={(event) => {
              const firstSuggestion = suggestions[0];

              if (event.key === "Tab" && firstSuggestion) {
                event.preventDefault();
                insertSuggestion(firstSuggestion);
              }
            }}
            onKeyUp={syncSelection}
            placeholder="SELECT * FROM users;"
            ref={textAreaRef}
            spellCheck={false}
            value={query}
          />
        </div>

        {isFocused && suggestions.length > 0 ? (
          <div className="absolute left-0 right-0 top-full z-10 mt-2 flex flex-wrap gap-2 rounded-sm border border-zinc-200 bg-white p-2 shadow-lg">
            {suggestions.map((suggestion) => (
              <button
                className="rounded-sm border border-zinc-300 px-2 py-1 font-mono text-xs text-zinc-800 transition hover:border-sky-700 hover:text-sky-700"
                key={suggestion}
                onMouseDown={(event) => {
                  event.preventDefault();
                  insertSuggestion(suggestion);
                }}
                type="button"
              >
                {suggestion}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex justify-end gap-2">
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

      <SqlExecutionResult
        execution={execution}
        explanationDetail={explanationDetail}
        lessonId={example?.id}
        view={outputView}
      />
    </section>
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

export function CodeWindow({ code }: { code: string }) {
  return (
    <pre className="mt-3 min-w-0 overflow-auto rounded-md bg-[#22251f] px-5 py-4 font-mono text-sm leading-6 text-zinc-100">
      <code>
        {tokenizeSql(code.trim()).map((token, index) => (
          <span
            className={getSqlTokenClassName(token.kind)}
            key={`${index}-${token.value}`}
          >
            {token.value}
          </span>
        ))}
      </code>
    </pre>
  );
}

export function SqlExecutionResult({
  execution,
  explanationDetail = "lesson",
  lessonId,
  query,
  view = "both",
}: {
  execution: SqlExecutionState;
  explanationDetail?: ExplanationDetail | undefined;
  lessonId?: SqlExampleId | undefined;
  query?: string | undefined;
  view?: SqlOutputView | undefined;
}) {
  return match(execution)
    .with({ status: "idle" }, () => null)
    .with({ status: "loading" }, () => (
      <OutputBlock tone="neutral" title="Running">
        <p className="text-base text-zinc-700">Preparing the database...</p>
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
            {lessonId === "example1-basic-select" && query ? (
              <p className="mb-3 text-base leading-7 text-zinc-700">
                Add <code className="font-mono text-sm">EXPLAIN</code> before a query to
                ask PostgreSQL how it plans to run it. Plain{" "}
                <code className="font-mono text-sm">EXPLAIN</code> does not execute the
                query; it only builds the plan.{" "}
                <code className="font-mono text-sm">EXPLAIN ANALYZE</code> is the version
                that actually runs the query and reports real timings.
              </p>
            ) : null}
            {query ? <CodeWindow code={`EXPLAIN ${query.trim()}`} /> : null}
            <pre className="mt-3 overflow-auto whitespace-pre-wrap rounded-md bg-[#22251f] px-5 py-4 font-mono text-sm leading-6 text-zinc-100">
              {output.plan}
            </pre>
            {explanationDetail === "lesson" ? (
              <PlanExplanation lessonId={lessonId} />
            ) : null}
          </OutputBlock>
        ) : null}
      </div>
    ))
    .exhaustive();
}

function PlanExplanation({ lessonId }: { lessonId?: SqlExampleId | undefined }) {
  if (lessonId === "example1-basic-select") {
    return (
      <div className="mt-3 text-base leading-7 text-zinc-700">
        <p>Read the plan from left to right:</p>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>
            <code className="font-mono text-sm">Seq Scan</code> means sequential scan:
            PostgreSQL plans to read the table from beginning to end.
          </li>
          <li>
            <code className="font-mono text-sm">on "User"</code> names the table being
            scanned.
          </li>
          <li>
            <code className="font-mono text-sm">0.00</code> is the startup cost,{" "}
            <code className="font-mono text-sm">1.02</code> is the total cost. These
            numbers are{" "}
            <a
              className="text-sky-700 underline decoration-sky-300 underline-offset-4"
              href="https://www.postgresql.org/docs/current/using-explain.html"
              rel="noreferrer"
              target="_blank"
            >
              internal planner units
            </a>
            , not milliseconds; they are based on PostgreSQL's estimate of relative work,
            such as reading table pages, checking rows, and CPU work.
          </li>
          <li>
            <code className="font-mono text-sm">rows=2</code> is PostgreSQL's estimated
            number of rows this step will return.
          </li>
          <li>
            <code className="font-mono text-sm">width=34</code> is the estimated average
            row size in bytes.
          </li>
        </ul>
      </div>
    );
  }

  if (lessonId === "example1-specific-select") {
    return (
      <div className="mt-3 text-base leading-7 text-zinc-700">
        <p>Compared to the first plan, two things changed:</p>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>
            PostgreSQL still uses a <code className="font-mono text-sm">Seq Scan</code>,
            so it still reads the whole table from beginning to end.
          </li>
          <li>
            The plan now has a <code className="font-mono text-sm">Filter</code> step for
            the <code className="font-mono text-sm">WHERE email = ...</code> condition, so
            rows that do not match Ada's email are discarded after they are read.
          </li>
        </ul>
      </div>
    );
  }

  return (
    <p className="mt-3 text-base leading-7 text-zinc-700">
      {getPlanExplanation(lessonId)}
    </p>
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

function useSqlSuggestions(
  example: SqlExampleDefinition | undefined,
  query: string,
  selectionStart: number,
) {
  return useMemo(() => {
    const currentWord = getCurrentWord(query, selectionStart).toUpperCase();

    if (!currentWord) {
      return [];
    }

    return [...new Set<string>([...baseSuggestions, ...extractIdentifiers(example)])]
      .filter((suggestion) => suggestion.toUpperCase().startsWith(currentWord))
      .filter((suggestion) => suggestion.toUpperCase() !== currentWord)
      .slice(0, 8);
  }, [example, query, selectionStart]);
}

function extractIdentifiers(example: SqlExampleDefinition | undefined) {
  if (!example) {
    return [];
  }

  const sql = `${example.migration}\n${example.seed}`;
  return Array.from(sql.matchAll(/"?([A-Za-z_][A-Za-z0-9_]*)"?/g), ([, value]) => value)
    .filter((value): value is string => typeof value === "string")
    .filter((value) => value && !isSqlKeyword(value))
    .slice(0, 50);
}

function getCurrentWord(query: string, selectionStart: number) {
  const bounds = getCurrentWordBounds(query, selectionStart);
  return query.slice(bounds.start, bounds.end);
}

function getCurrentWordBounds(query: string, selectionStart: number) {
  let start = selectionStart;
  let end = selectionStart;

  while (start > 0 && /[A-Za-z0-9_]/.test(query[start - 1] ?? "")) {
    start -= 1;
  }

  while (end < query.length && /[A-Za-z0-9_]/.test(query[end] ?? "")) {
    end += 1;
  }

  return { end, start };
}

function formatCell(value: QueryRow[string] | undefined) {
  if (value == null) {
    return "";
  }

  return String(value);
}

function tokenizeSql(sql: string): SqlToken[] {
  const tokens: SqlToken[] = [];
  let position = 0;

  while (position < sql.length) {
    const rest = sql.slice(position);
    const token = readSqlToken(rest);

    tokens.push(token);
    position += token.value.length;
  }

  return tokens;
}

function readSqlToken(sql: string): SqlToken {
  const whitespace = sql.match(/^\s+/);

  if (whitespace?.[0]) {
    return { kind: "whitespace", value: whitespace[0] };
  }

  const lineComment = sql.match(/^--[^\n]*/);

  if (lineComment?.[0]) {
    return { kind: "comment", value: lineComment[0] };
  }

  const stringLiteral = sql.match(/^'(?:''|[^'])*'/);

  if (stringLiteral?.[0]) {
    return { kind: "string", value: stringLiteral[0] };
  }

  const quotedIdentifier = sql.match(/^"(?:""|[^"])*"/);

  if (quotedIdentifier?.[0]) {
    return { kind: "identifier", value: quotedIdentifier[0] };
  }

  const numberLiteral = sql.match(/^\d+(?:\.\d+)?/);

  if (numberLiteral?.[0]) {
    return { kind: "number", value: numberLiteral[0] };
  }

  const word = sql.match(/^[A-Za-z_][A-Za-z0-9_]*/);

  if (word?.[0]) {
    return {
      kind: isSqlKeyword(word[0]) ? "keyword" : "identifier",
      value: word[0],
    };
  }

  const punctuation = sql.match(/^[(),.;]/);

  if (punctuation?.[0]) {
    return { kind: "punctuation", value: punctuation[0] };
  }

  return { kind: "operator", value: sql[0] ?? "" };
}

function isSqlKeyword(value: string) {
  return sqlKeywords.has(value.toUpperCase());
}

function getSqlTokenClassName(kind: SqlTokenKind) {
  return match(kind)
    .with("comment", () => "text-zinc-400")
    .with("keyword", () => "font-semibold text-cyan-300")
    .with("string", () => "text-lime-300")
    .with("number", () => "text-yellow-200")
    .with("identifier", () => "text-zinc-100")
    .with("operator", () => "text-zinc-100")
    .with("punctuation", () => "text-zinc-100")
    .with("whitespace", () => "")
    .exhaustive();
}

function getPlanExplanation(lessonId: SqlExampleId | undefined) {
  return lessonId === "example1-basic-select"
    ? 'Seq Scan on "User" means PostgreSQL reads every row from the beginning of the table to the end. The cost, 0.00..1.02, is an estimate of startup and total work, not milliseconds. rows=2 is the estimated number of rows, and width=34 is the estimated average row size in bytes.'
    : lessonId === "example1-specific-select"
      ? "The WHERE clause filters for Ada's email, so PostgreSQL adds a Filter step and keeps only rows with that email. This plan still uses a Seq Scan, so it reads the table from beginning to end and checks each email."
      : "This plan describes the steps PostgreSQL expects to use, along with estimates for the work, result count, and row size.";
}

const sqlKeywords = new Set([
  "ANALYZE",
  "AND",
  "AS",
  "BY",
  "CASE",
  "CREATE",
  "DEFAULT",
  "DELETE",
  "ELSE",
  "END",
  "EXPLAIN",
  "FROM",
  "GENERATE_SERIES",
  "GROUP",
  "INDEX",
  "INSERT",
  "INTO",
  "KEY",
  "LIMIT",
  "NOT",
  "NULL",
  "ON",
  "ORDER",
  "PRIMARY",
  "RETURNING",
  "SELECT",
  "SERIAL",
  "TABLE",
  "TEXT",
  "THEN",
  "UPDATE",
  "VALUES",
  "WHEN",
  "WHERE",
]);
