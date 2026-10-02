// The same eight documents are used by every search lesson (vectors, pgvector,
// full-text search, fuzzy search, text search in Postgres), so each approach can be
// compared on identical data.
//
// Embeddings are hand-made with three readable dimensions:
// [databases, web, AI]. Real embedding models produce hundreds of unnamed ones.

type SearchDocument = {
  title: string;
  body: string;
  embedding: readonly [number, number, number];
};

export const searchDocuments: readonly SearchDocument[] = [
  {
    title: "SQL indexes",
    body: "Indexes help PostgreSQL find rows without reading the whole table.",
    embedding: [0.9, 0.1, 0.1],
  },
  {
    title: "JOIN patterns",
    body: "Joins combine rows from related tables into one result.",
    embedding: [0.85, 0.05, 0.05],
  },
  {
    title: "Query tuning",
    body: "Slow queries get faster with the right index and a better plan.",
    embedding: [0.8, 0.15, 0.1],
  },
  {
    title: "React components",
    body: "Components split a user interface into small reusable pieces.",
    embedding: [0.05, 0.95, 0.1],
  },
  {
    title: "CSS grid layouts",
    body: "Grid and flexbox position elements on a web page.",
    embedding: [0.05, 0.9, 0],
  },
  {
    title: "Neural networks",
    body: "Neural networks learn patterns from training data.",
    embedding: [0.05, 0.05, 0.95],
  },
  {
    title: "Chatbots",
    body: "Language models answer questions written in natural language.",
    embedding: [0.1, 0.25, 0.9],
  },
  {
    title: "Vector search",
    body: "Embeddings let a database find documents with a similar meaning.",
    embedding: [0.6, 0.05, 0.8],
  },
];

function sqlString(value: string) {
  return `'${value.replaceAll("'", "''")}'`;
}

function numbers(embedding: SearchDocument["embedding"]) {
  return embedding.map((value) => value.toFixed(2)).join(", ");
}

// ARRAY[0.90, 0.10, 0.10], for a DOUBLE PRECISION[] column.
export function arrayLiteral(embedding: SearchDocument["embedding"]) {
  return `ARRAY[${numbers(embedding)}]`;
}

// '[0.90, 0.10, 0.10]', pgvector's text format for a vector column.
export function vectorLiteral(embedding: SearchDocument["embedding"]) {
  return `'[${numbers(embedding)}]'`;
}

export function searchDocumentsSeed({
  embedding,
}: {
  embedding?: (value: SearchDocument["embedding"]) => string;
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
