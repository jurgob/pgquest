import type { ReactNode } from "react";

export type SqlTokenKind =
  | "boolean"
  | "comment"
  | "function"
  | "identifier"
  | "keyword"
  | "null"
  | "number"
  | "operator"
  | "parameter"
  | "punctuation"
  | "string"
  | "type"
  | "whitespace";

export type SqlHighlightOptions = {
  styleClasses?: Partial<Record<SqlTokenKind, string>>;
};

const defaultStyleClasses: Record<SqlTokenKind, string> = {
  boolean: "text-amber-200",
  comment: "text-zinc-400",
  function: "text-sky-300",
  identifier: "text-zinc-100",
  keyword: "font-semibold text-cyan-300",
  null: "text-amber-200",
  number: "text-yellow-200",
  operator: "text-zinc-100",
  parameter: "text-orange-300",
  punctuation: "text-zinc-100",
  string: "text-lime-300",
  type: "text-purple-300",
  whitespace: "",
};

const keywords = new Set([
  "ALL",
  "ALTER",
  "ANALYZE",
  "AND",
  "AS",
  "ASC",
  "BEGIN",
  "BY",
  "CASE",
  "CHECK",
  "COMMIT",
  "CONSTRAINT",
  "CREATE",
  "CROSS",
  "DEFAULT",
  "DELETE",
  "DESC",
  "DISTINCT",
  "DROP",
  "ELSE",
  "END",
  "EXCEPT",
  "EXPLAIN",
  "FOR",
  "FOREIGN",
  "FROM",
  "FULL",
  "GROUP",
  "HAVING",
  "IN",
  "INDEX",
  "INNER",
  "INSERT",
  "INTO",
  "IS",
  "JOIN",
  "KEY",
  "LEFT",
  "LIMIT",
  "NOT",
  "NULLS",
  "OFFSET",
  "ON",
  "OR",
  "ORDER",
  "OUTER",
  "PRIMARY",
  "REFERENCES",
  "RETURNING",
  "RIGHT",
  "ROLLBACK",
  "SELECT",
  "SET",
  "TABLE",
  "THEN",
  "UNION",
  "UNIQUE",
  "UPDATE",
  "VALUES",
  "WHEN",
  "WHERE",
  "WITH",
]);

const types = new Set([
  "BIGINT",
  "BOOLEAN",
  "CHAR",
  "DATE",
  "DECIMAL",
  "DOUBLE",
  "INTEGER",
  "INT",
  "JSON",
  "JSONB",
  "NUMERIC",
  "REAL",
  "SERIAL",
  "TEXT",
  "TIME",
  "TIMESTAMP",
  "UUID",
  "VARCHAR",
]);

const functions = new Set([
  "AVG",
  "COUNT",
  "COALESCE",
  "CONCAT",
  "CURRENT_DATE",
  "CURRENT_TIMESTAMP",
  "GENERATE_SERIES",
  "MAX",
  "MIN",
  "NOW",
  "ROUND",
  "SUM",
]);

const booleans = new Set(["FALSE", "TRUE"]);
const operators = [
  "#>>",
  "#>",
  "->>",
  "->",
  "::",
  "!=",
  "<=",
  ">=",
  "<>",
  "||",
  "=",
  "<",
  ">",
  "+",
  "-",
  "*",
  "/",
  "%",
];

export function isSqlKeyword(value: string) {
  return keywords.has(value.toUpperCase());
}

/** Tokenizes SQL into React elements without interpreting its contents as HTML. */
export function sqlHighlight(
  sql: string,
  options: SqlHighlightOptions = {},
): ReactNode[] {
  return tokenizeSql(sql).map((token, index) => (
    <span
      className={[
        `sql-hl-${token.kind}`,
        token.kind === "identifier" && token.value.startsWith('"')
          ? "sql-hl-quoted-identifier text-lime-300"
          : defaultStyleClasses[token.kind],
        options.styleClasses?.[token.kind],
      ]
        .filter(Boolean)
        .join(" ")}
      key={`${index}-${token.value}`}
    >
      {token.value}
    </span>
  ));
}

const explainTokenPattern =
  /(Seq Scan|Index Scan|Bitmap Heap Scan|Bitmap Index Scan|cost=\d+(?:\.\d+)?\.\.\d+(?:\.\d+)?|rows=\d+|width=\d+|Filter:|Index Cond:|'[^']*'::[A-Za-z_][A-Za-z0-9_]*)/g;

export function explainHighlight(explain: string): ReactNode[] {
  return explain.split(explainTokenPattern).map((part, index) => {
    if (!part) {
      return null;
    }

    const className = getExplainTokenClassName(part);

    if (!className) {
      return part;
    }

    return (
      <span className={className} key={`${index}-${part}`}>
        {part}
      </span>
    );
  });
}

function getExplainTokenClassName(value: string) {
  if (/^(?:Seq Scan|Index Scan|Bitmap Heap Scan|Bitmap Index Scan)$/.test(value)) {
    return "font-semibold text-sky-200";
  }

  if (/^cost=/.test(value)) {
    return "rounded-sm bg-emerald-950 px-1 py-0.5 font-semibold text-emerald-100";
  }

  if (/^(?:rows|width)=/.test(value)) {
    return "text-yellow-200";
  }

  if (/^(?:Filter|Index Cond):$/.test(value)) {
    return "font-semibold text-zinc-200";
  }

  if (/^'/.test(value)) {
    return "text-lime-300";
  }

  return undefined;
}

type SqlToken = { kind: SqlTokenKind; value: string };

function tokenizeSql(sql: string): SqlToken[] {
  const tokens: SqlToken[] = [];
  let position = 0;

  while (position < sql.length) {
    const token = readSqlToken(sql.slice(position));
    tokens.push(token);
    position += token.value.length;
  }

  return tokens;
}

function readSqlToken(sql: string): SqlToken {
  const whitespace = sql.match(/^\s+/);
  if (whitespace?.[0]) return { kind: "whitespace", value: whitespace[0] };

  const lineComment = sql.match(/^--[^\n]*/);
  if (lineComment?.[0]) return { kind: "comment", value: lineComment[0] };

  const blockComment = sql.match(/^\/\*[\s\S]*?\*\//);
  if (blockComment?.[0]) return { kind: "comment", value: blockComment[0] };

  const dollarString = sql.match(/^\$([A-Za-z_][A-Za-z0-9_]*)?\$[\s\S]*?\$\1\$/);
  if (dollarString?.[0]) return { kind: "string", value: dollarString[0] };

  const stringLiteral = sql.match(/^(?:E)?'(?:''|[^'])*'/);
  if (stringLiteral?.[0]) return { kind: "string", value: stringLiteral[0] };

  const quotedIdentifier = sql.match(/^"(?:""|[^"])*"/);
  if (quotedIdentifier?.[0]) return { kind: "identifier", value: quotedIdentifier[0] };

  const parameter = sql.match(/^\$\d+/);
  if (parameter?.[0]) return { kind: "parameter", value: parameter[0] };

  const number = sql.match(/^\d+(?:\.\d+)?/);
  if (number?.[0]) return { kind: "number", value: number[0] };

  const word = sql.match(/^[A-Za-z_][A-Za-z0-9_$]*/);
  if (word?.[0]) return { kind: classifyWord(word[0], sql), value: word[0] };

  const operator = operators.find((candidate) => sql.startsWith(candidate));
  if (operator) return { kind: "operator", value: operator };

  if (/^[(),.;[\]]/.test(sql)) return { kind: "punctuation", value: sql[0] ?? "" };

  return { kind: "operator", value: sql[0] ?? "" };
}

function classifyWord(word: string, sql: string): SqlTokenKind {
  const upperWord = word.toUpperCase();
  if (booleans.has(upperWord)) return "boolean";
  if (upperWord === "NULL") return "null";
  if (keywords.has(upperWord)) return "keyword";
  if (types.has(upperWord)) return "type";
  if (functions.has(upperWord) && /^\s*\(/.test(sql.slice(word.length)))
    return "function";
  return "identifier";
}
