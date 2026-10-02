// The same eight documents are used by every search lesson (vectors, pgvector,
// full-text search, fuzzy search, text search in Postgres), so each approach can be
// compared on identical data.
//
// Every embedding has three readable dimensions, [databases, web, AI]: how much the
// text is about each topic. They were produced by SCORING_MODEL, a zero-shot
// classifier, scoring "title. body" (or the question) against those three topics,
// with the form in the vectors lesson (app/sql/vector-scorer.tsx). Real embedding
// models produce hundreds of unnamed dimensions instead.

// Hugging Face model id. The vectors and pgvector lessons run it in the browser.
export const SCORING_MODEL = "Xenova/mobilebert-uncased-mnli";

export type Embedding = readonly [number, number, number];

type SearchDocument = {
  title: string;
  body: string;
  embedding: Embedding;
};

export const searchDocuments: readonly SearchDocument[] = [
  {
    title: "SQL indexes",
    body: "Indexes help PostgreSQL find rows without reading the whole table.",
    embedding: [0.95, 0.03, 0.02],
  },
  {
    title: "JOIN patterns",
    body: "Joins combine rows from related tables into one result.",
    embedding: [0.66, 0.17, 0.17],
  },
  {
    title: "Query tuning",
    body: "Slow queries get faster with the right index and a better plan.",
    embedding: [0.62, 0.15, 0.23],
  },
  {
    title: "React components",
    body: "Components split a user interface into small reusable pieces.",
    embedding: [0.25, 0.26, 0.49],
  },
  {
    title: "CSS grid layouts",
    body: "Grid and flexbox position elements on a web page.",
    embedding: [0.15, 0.82, 0.03],
  },
  {
    title: "Neural networks",
    body: "Neural networks learn patterns from training data.",
    embedding: [0.14, 0.08, 0.78],
  },
  {
    title: "Chatbots",
    body: "Language models answer questions written in natural language.",
    embedding: [0.32, 0.26, 0.42],
  },
  {
    title: "Vector search",
    body: "Embeddings let a database find documents with a similar meaning.",
    embedding: [0.91, 0.04, 0.04],
  },
];

function sqlString(value: string) {
  return `'${value.replaceAll("'", "''")}'`;
}

// The questions the search lessons ask, embedded by the same model.
export const questions = {
  speedUpMyDatabase: { text: "speed up my database", embedding: [0.94, 0.04, 0.03] },
  aiThatUnderstandsText: {
    text: "AI that understands text",
    embedding: [0.16, 0.1, 0.75],
  },
  buildAWebUi: { text: "How do I build a web UI?", embedding: [0.01, 0.97, 0.02] },
  makeANiceWebPage: { text: "make a nice web page", embedding: [0.05, 0.91, 0.04] },
  findMeaning: { text: "find meaning", embedding: [0.41, 0.3, 0.28] },
} as const satisfies Record<string, { embedding: Embedding; text: string }>;

function numbers(embedding: Embedding) {
  return embedding.map((value) => value.toFixed(2)).join(", ");
}

// ARRAY[0.90, 0.10, 0.10], for a DOUBLE PRECISION[] column.
export function arrayLiteral(embedding: Embedding) {
  return `ARRAY[${numbers(embedding)}]`;
}

// '[0.90, 0.10, 0.10]', pgvector's text format for a vector column.
export function vectorLiteral(embedding: Embedding) {
  return `'[${numbers(embedding)}]'`;
}

export function searchDocumentsSeed({
  embedding,
}: {
  embedding?: (value: Embedding) => string;
} = {}) {
  const columns = embedding ? "title, body, embedding" : "title, body";
  const rows = searchDocuments.map((document) =>
    [
      sqlString(document.title),
      sqlString(document.body),
      ...(embedding ? [embedding(document.embedding)] : []),
    ].join(", "),
  );

  return `
INSERT INTO documents (${columns})
VALUES
${rows.map((row) => `  (${row})`).join(",\n")};
`;
}

// Thousands of generated documents like 'Redis search note 412', so the planner has
// a reason to use an index. The same words as the eight documents, crossed with
// ten technologies: every (technology, topic) pair matches about 1% of the rows.
export function generatedDocumentsSeed({
  count,
  embedding = false,
}: {
  count: number;
  embedding?: boolean;
}) {
  const columns = embedding ? "title, body, embedding" : "title, body";
  const embeddingValue = embedding
    ? `,
  ARRAY[abs(sin(n)), abs(sin(n * 2)), abs(cos(n * 3))]::vector(3)`
    : "";

  return `
INSERT INTO documents (${columns})
SELECT
  initcap(tech) || ' ' || topic || ' note ' || n,
  'Notes about ' || topic || ' in ' || tech || '.'${embeddingValue}
FROM generate_series(1, ${count}) AS n,
  LATERAL (SELECT
    (ARRAY['postgresql', 'mysql', 'sqlite', 'redis', 'kafka',
           'react', 'vue', 'svelte', 'python', 'rust'])[n % 10 + 1] AS tech,
    (ARRAY['indexes', 'joins', 'tuning', 'components',
           'layouts', 'networks', 'chatbots', 'search'])[n / 10 % 8 + 1] AS topic
  ) AS words;

ANALYZE documents;
`;
}
