import { useEffect, useState } from "react";
import { match } from "ts-pattern";

import { runSqlExample } from "./run-example";
import { SiteHeader } from "./site-header";
import type {
  ExecutionOutput,
  LessonId,
  QueryRow,
  SqlExampleDefinition,
  SqlExampleId,
} from "./types";

type SqlExamplePageProps = {
  activeLesson: LessonId;
  followUps?: readonly SqlExampleDefinition[];
  lessons: readonly SqlExampleDefinition[];
};

type ExecutionState =
  | { status: "done"; output: ExecutionOutput }
  | { status: "error"; message: string }
  | { status: "loading" };

type SqlTokenKind =
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

type LessonCacheKey = string & { readonly __brand: "LessonCacheKey" };

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { readonly [key: string]: JsonValue | undefined };

type CachedExecutionPayload = {
  version: 1;
  output: ExecutionOutput;
};

export function SqlExamplePage({
  activeLesson,
  followUps = [],
  lessons,
}: SqlExamplePageProps) {
  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <SiteHeader activeLesson={activeLesson} />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-8">
        <section className="flex flex-col gap-12">
          {lessons.map((lesson) => (
            <LessonPanel key={lesson.id} lesson={lesson} />
          ))}
          {followUps.map((lesson) => (
            <FollowUpPanel key={lesson.id} lesson={lesson} />
          ))}
        </section>
      </div>
    </main>
  );
}

function LessonPanel({ lesson }: { lesson: SqlExampleDefinition }) {
  const execution = useExampleExecution(lesson);

  return (
    <article className="flex min-w-0 flex-col gap-6 border-t border-zinc-200 pt-8 first:border-t-0 first:pt-0">
      <div>
        <div>
          <h1 className="text-3xl font-bold text-zinc-950">{lesson.title}</h1>
          <div className="mt-3 text-base leading-7 text-zinc-800">
            {lesson.description.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-7">
        <CodeSection
          code={lesson.migration}
          text={lesson.codeDescriptions.migration}
          title="Migration"
        />
        <CodeSection
          code={lesson.seed}
          text={lesson.codeDescriptions.seed}
          title="Seed"
        />
        <CodeSection code={lesson.query} text={lesson.codeDescriptions.query} />
      </div>

      <ExecutionResult execution={execution} lessonId={lesson.id} />
    </article>
  );
}

function FollowUpPanel({ lesson }: { lesson: SqlExampleDefinition }) {
  const execution = useExampleExecution(lesson);

  return (
    <article className="flex min-w-0 flex-col gap-6 border-t border-zinc-200 pt-8">
      <div>
        <h2 className="text-2xl font-bold text-zinc-950">{lesson.title}</h2>
        <div className="mt-3 text-base leading-7 text-zinc-800">
          {lesson.description.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </div>

      <CodeSection code={lesson.query} text={lesson.codeDescriptions.query} />
      <ExecutionResult execution={execution} lessonId={lesson.id} />
    </article>
  );
}

function useExampleExecution(lesson: SqlExampleDefinition): ExecutionState {
  const [execution, setExecution] = useState<ExecutionState>({ status: "loading" });

  useEffect(() => {
    let isCurrent = true;
    const cachedOutput = readCachedExecution(lesson);

    if (cachedOutput) {
      setExecution({ status: "done", output: cachedOutput });
      return () => {
        isCurrent = false;
      };
    }

    setExecution({ status: "loading" });

    void runSqlExample(lesson).then((result) => {
      if (!isCurrent) {
        return;
      }

      setExecution(
        result.match<ExecutionState>(
          (output) => {
            writeCachedExecution(lesson, output);
            return { status: "done", output };
          },
          (message) => ({ status: "error", message }),
        ),
      );
    });

    return () => {
      isCurrent = false;
    };
  }, [lesson]);

  return execution;
}

function CodeSection({
  code,
  text,
  title,
}: {
  code: string;
  text: string;
  title?: string;
}) {
  return (
    <section className="min-w-0">
      {title ? <h2 className="text-xl font-bold text-zinc-950">{title}</h2> : null}
      <p className="mt-1 text-base leading-7 text-zinc-800">{text}</p>
      <CodeWindow code={code} />
    </section>
  );
}

function CodeWindow({ code }: { code: string }) {
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

function ExecutionResult({
  execution,
  lessonId,
}: {
  execution: ExecutionState;
  lessonId: SqlExampleId;
}) {
  return match(execution)
    .with({ status: "loading" }, () => (
      <OutputBlock tone="neutral" title="Running">
        <p className="text-base text-zinc-700">Preparing the lesson output...</p>
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
      <div className="flex flex-col gap-6">
        <OutputBlock tone="neutral" title="Result">
          <ResultTable rows={output.rows} />
        </OutputBlock>
        <OutputBlock tone="plan" title="Explanation">
          {lessonId === "example1-basic-select" ? (
            <p className="mb-3 text-base leading-7 text-zinc-700">
              Add <code className="font-mono text-sm">EXPLAIN</code> before a SQL query to
              see how PostgreSQL plans to execute it. Read the{" "}
              <a
                className="text-sky-700 underline decoration-sky-300 underline-offset-4"
                href="https://www.postgresql.org/docs/current/sql-explain.html"
                rel="noreferrer"
                target="_blank"
              >
                PostgreSQL EXPLAIN documentation
              </a>
              .
            </p>
          ) : null}
          <pre className="overflow-auto whitespace-pre-wrap rounded-md bg-[#22251f] px-5 py-4 font-mono text-sm leading-6 text-zinc-100">
            {output.plan}
          </pre>
          <p className="mt-3 text-base leading-7 text-zinc-700">
            {lessonId === "example1-basic-select"
              ? 'Seq Scan on "User" means PostgreSQL reads every row from the beginning of the table to the end. The cost, 0.00..18.50, is an estimate of startup and total work, not milliseconds. rows=850 is the estimated number of rows, and width=68 is the estimated average row size in bytes. The row estimate is not the two rows we inserted because this simple example has not collected table statistics.'
              : lessonId === "example1-specific-select"
                ? "The WHERE clause filters for Ada's email, so PostgreSQL adds a Filter step and keeps only rows with that email. This plan still uses a Seq Scan, so it reads the table from beginning to end and checks each email. Unlike the first SELECT, which returned every row and had no filter, this query returns only the matching user. The planner estimates rows=4 instead of rows=850 because the filter narrows the result, while the estimated total cost changes from 18.50 to 20.62."
                : "This plan describes the steps PostgreSQL expects to use, along with estimates for the work, result count, and row size."}
          </p>
        </OutputBlock>
      </div>
    ))
    .exhaustive();
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
        {rows.map((row) => (
          <tr key={columns.map((column) => formatCell(row[column])).join("|")}>
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
    .with("keyword", () => "font-semibold text-cyan-300")
    .with("string", () => "text-lime-300")
    .with("number", () => "text-yellow-200")
    .with("identifier", () => "text-zinc-100")
    .with("operator", () => "text-zinc-100")
    .with("punctuation", () => "text-zinc-100")
    .with("whitespace", () => "")
    .exhaustive();
}

function readCachedExecution(lesson: SqlExampleDefinition) {
  const rawValue = localStorage.getItem(getLessonCacheKey(lesson));

  if (!rawValue) {
    return undefined;
  }

  try {
    const value = JSON.parse(rawValue) as JsonValue;

    if (isCachedExecutionPayload(value)) {
      return value.output;
    }

    localStorage.removeItem(getLessonCacheKey(lesson));
    return undefined;
  } catch {
    localStorage.removeItem(getLessonCacheKey(lesson));
    return undefined;
  }
}

function writeCachedExecution(lesson: SqlExampleDefinition, output: ExecutionOutput) {
  const payload: CachedExecutionPayload = {
    version: 1,
    output,
  };

  try {
    localStorage.setItem(getLessonCacheKey(lesson), JSON.stringify(payload));
  } catch {
    return;
  }
}

function getLessonCacheKey(lesson: SqlExampleDefinition): LessonCacheKey {
  return `pgquest:${lesson.id}:${hashSql(
    `${lesson.migration}\n${lesson.seed}\n${lesson.query}`,
  )}` as LessonCacheKey;
}

function hashSql(sql: string) {
  let hash = 0;

  for (let index = 0; index < sql.length; index += 1) {
    hash = (hash * 31 + sql.charCodeAt(index)) >>> 0;
  }

  return hash.toString(16);
}

function isCachedExecutionPayload(value: JsonValue): value is CachedExecutionPayload {
  if (!isJsonObject(value) || value.version !== 1 || !value.output) {
    return false;
  }

  return isJsonObject(value.output) && isExecutionOutput(value.output);
}

function isExecutionOutput(value: JsonValue): value is ExecutionOutput {
  return (
    isJsonObject(value) &&
    Array.isArray(value.rows) &&
    value.rows.every(isQueryRow) &&
    typeof value.plan === "string"
  );
}

function isQueryRow(value: JsonValue): value is QueryRow {
  return isJsonObject(value) && Object.values(value).every(isSqlValue);
}

function isSqlValue(value: JsonValue | undefined): value is QueryRow[string] {
  return (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

function isJsonObject(
  value: JsonValue,
): value is { readonly [key: string]: JsonValue | undefined } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const sqlKeywords = new Set([
  "ANALYZE",
  "AND",
  "AS",
  "BY",
  "CASE",
  "CREATE",
  "DEFAULT",
  "ELSE",
  "END",
  "FROM",
  "GENERATE_SERIES",
  "INDEX",
  "INSERT",
  "INTO",
  "KEY",
  "NOT",
  "NULL",
  "ON",
  "PRIMARY",
  "SELECT",
  "SERIAL",
  "TABLE",
  "TEXT",
  "THEN",
  "VALUES",
  "WHEN",
  "WHERE",
]);
