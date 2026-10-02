import { questions, searchDocumentsSeed, vectorLiteral } from "./search-documents";
import { SQL_EXAMPLE_IDS, type SqlExample } from "./types";

export const migration = `
CREATE EXTENSION pg_trgm;
CREATE EXTENSION vector;

CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  -- From an embedding model: [databases, web, AI].
  embedding vector(3) NOT NULL,
  -- Kept up to date by Postgres on every INSERT and UPDATE.
  search tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', title), 'A') ||
    setweight(to_tsvector('english', body), 'B')
  ) STORED
);

-- One index per search style, all in the same table.
CREATE INDEX ON documents USING gin (title gin_trgm_ops);   -- ILIKE, fuzzy
CREATE INDEX ON documents USING gin (search);               -- full-text
CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops); -- semantic
`;

export const seed = searchDocumentsSeed({ embedding: vectorLiteral });

// Not runnable here: pgai calls a model API from inside Postgres.
export const pgaiExample = `
-- pgai: a vectorizer keeps an embeddings table in sync with a source table,
-- calling the embedding model for every new or changed row.
SELECT ai.create_vectorizer(
  'documents'::regclass,
  loading => ai.loading_column(column_name => 'body'),
  destination => ai.destination_table(target_table => 'documents_embeddings'),
  embedding => ai.embedding_openai(model => 'text-embedding-3-small', dimensions => 1536)
);
`;

export const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.textSearchInPostgresDatabaseInit,
  name: "Text search database",
  description:
    "The eight documents with a trigram index, a full-text search column, and a pgvector embedding.",
  query: [migration, seed].join("\n"),
};

export const database_inits = [databaseInit] as const;

export const examples: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.textSearchInPostgresIlike,
    name: "1. Pattern matching: ILIKE",
    description:
      "Characters, anywhere in the text. Simple and exact: 'index' also matches 'Indexes'. No ranking, no typos, no word forms beyond the substring.",
    database_init: databaseInit,
    query: `
SELECT title
FROM documents
WHERE title ILIKE '%index%' OR body ILIKE '%index%';
`,
  },
  {
    id: SQL_EXAMPLE_IDS.textSearchInPostgresFuzzy,
    name: "2. Fuzzy matching: pg_trgm",
    description:
      "Similar spellings. 'sql indxes' has a typo and still finds the document, with a score to sort by.",
    database_init: databaseInit,
    query: `
SELECT title, round(similarity(title, 'sql indxes')::numeric, 3) AS score
FROM documents
WHERE title % 'sql indxes'
ORDER BY score DESC;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.textSearchInPostgresFullText,
    name: "3. Full-text search: tsvector",
    description:
      "Words, not characters. 'indexing tables' matches 'Indexes' and 'table' through stemming, and ts_rank orders the results.",
    database_init: databaseInit,
    query: `
SELECT title, round(ts_rank(search, query)::numeric, 3) AS rank
FROM documents, websearch_to_tsquery('english', 'indexing tables') AS query
WHERE search @@ query
ORDER BY rank DESC;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.textSearchInPostgresSemantic,
    name: "4. Semantic search: pgvector",
    description: `Meaning, not words. 'speed up my database' shares no word with any document, but its embedding, ${vectorLiteral(questions.speedUpMyDatabase.embedding)}, is close to SQL indexes and to Vector search, which the model rates as mostly about databases.`,
    database_init: databaseInit,
    query: `
SELECT title, round((embedding <=> ${vectorLiteral(questions.speedUpMyDatabase.embedding)})::numeric, 3) AS distance
FROM documents
ORDER BY embedding <=> ${vectorLiteral(questions.speedUpMyDatabase.embedding)}
LIMIT 3;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.textSearchInPostgresHybrid,
    name: "5. Hybrid: keywords + meaning",
    description: `The search 'find meaning', embedded as ${vectorLiteral(questions.findMeaning.embedding)}. Rank the rows once by full-text and once by vector distance, then merge the two lists with reciprocal rank fusion: each list adds 1 / (60 + position). Rows near the top of both lists win.`,
    database_init: databaseInit,
    query: `
WITH keyword AS (
  SELECT id, row_number() OVER (ORDER BY ts_rank(search, query) DESC) AS position
  FROM documents, websearch_to_tsquery('english', 'find or meaning') AS query
  WHERE search @@ query
),
semantic AS (
  SELECT id, row_number() OVER (ORDER BY embedding <=> ${vectorLiteral(questions.findMeaning.embedding)}) AS position
  FROM documents
  ORDER BY embedding <=> ${vectorLiteral(questions.findMeaning.embedding)}
  LIMIT 5
)
SELECT
  documents.title,
  keyword.position AS keyword_position,
  semantic.position AS semantic_position,
  round(
    coalesce(1.0 / (60 + keyword.position), 0) +
    coalesce(1.0 / (60 + semantic.position), 0),
  4) AS score
FROM documents
LEFT JOIN keyword ON keyword.id = documents.id
LEFT JOIN semantic ON semantic.id = documents.id
WHERE keyword.id IS NOT NULL OR semantic.id IS NOT NULL
ORDER BY score DESC
LIMIT 5;
`,
  },
];

export const exercises: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.textSearchInPostgresExerciseFullText,
    name: "Exercise 1",
    description:
      "Use the search column to find the documents matching the web search 'language models'. Return their titles.",
    database_init: databaseInit,
    query: `
SELECT title
FROM documents
WHERE search @@ websearch_to_tsquery('english', 'language models');
`,
  },
  {
    id: SQL_EXAMPLE_IDS.textSearchInPostgresExerciseSemantic,
    name: "Exercise 2",
    description: `'make a nice web page' is ${vectorLiteral(questions.makeANiceWebPage.embedding)}. Return the titles of the 2 closest documents by cosine distance (<=>).`,
    database_init: databaseInit,
    query: `
SELECT title
FROM documents
ORDER BY embedding <=> ${vectorLiteral(questions.makeANiceWebPage.embedding)}
LIMIT 2;
`,
  },
];
