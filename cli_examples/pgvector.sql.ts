import {
  generatedDocumentsSeed,
  searchDocumentsSeed,
  vectorLiteral,
} from "./search-documents";
import { SQL_EXAMPLE_IDS, type SqlExample } from "./types";

export const migration = `
-- CREATE EXTENSION also makes PGlite load pgvector for this database.
CREATE EXTENSION vector;

CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  -- Exactly 3 dimensions: [databases, web, AI].
  embedding vector(3) NOT NULL
);
`;

export const seed = searchDocumentsSeed({ embedding: vectorLiteral });

export const hnswIndex = `
-- HNSW: a graph of vectors linked to their neighbours. A search walks the
-- graph towards the question instead of measuring every row.
-- The operator class must match the operator you ORDER BY:
--   vector_l2_ops for <->, vector_cosine_ops for <=>, vector_ip_ops for <#>.
CREATE INDEX documents_embedding_idx ON documents
USING hnsw (embedding vector_cosine_ops);
`;

export const realWorld = `
-- A real embedding model, e.g. text-embedding-3-small, returns 1,536 numbers.
CREATE TABLE documents (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  embedding vector(1536) NOT NULL
);

CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops);

-- The app calls the model, then stores the vector like any other value:
INSERT INTO documents (title, body, embedding)
VALUES ($1, $2, $3);

-- And searches with the question's vector:
SELECT id, title
FROM documents
ORDER BY embedding <=> $1
LIMIT 10;
`;

export const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.pgvectorDatabaseInit,
  name: "pgvector database",
  description:
    "The eight documents from the vectors lesson, with a pgvector vector(3) column.",
  query: [migration, seed].join("\n"),
};

export const indexedDatabaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.pgvectorIndexedDatabaseInit,
  name: "pgvector database, 5,000 documents",
  description:
    "The eight documents plus 5,000 generated ones, with an HNSW index on the embedding.",
  query: [
    migration,
    seed,
    generatedDocumentsSeed({ count: 5000, embedding: true }),
    hnswIndex,
  ].join("\n"),
};

export const database_inits = [databaseInit, indexedDatabaseInit] as const;

export const examples: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.pgvectorNearest,
    name: "Same question, one operator",
    description:
      "'speed up my database' is '[0.85, 0.10, 0.05]'. <-> is the L2 distance: the same l2_distance the vectors lesson wrote by hand, and the same three results.",
    database_init: databaseInit,
    query: `
SELECT
  title,
  round((embedding <-> '[0.85, 0.10, 0.05]')::numeric, 3) AS distance
FROM documents
ORDER BY embedding <-> '[0.85, 0.10, 0.05]'
LIMIT 3;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.pgvectorOperators,
    name: "The distance operators",
    description:
      "'AI that understands text' is '[0.20, 0.10, 0.95]'. <=> is cosine distance (1 - cosine similarity). <#> is the negative inner product, negative so that ascending order still means closest first. All three: smaller is closer.",
    database_init: databaseInit,
    query: `
SELECT
  title,
  round((embedding <-> '[0.20, 0.10, 0.95]')::numeric, 3) AS l2,
  round((embedding <=> '[0.20, 0.10, 0.95]')::numeric, 3) AS cosine,
  round((embedding <#> '[0.20, 0.10, 0.95]')::numeric, 3) AS inner_product
FROM documents
ORDER BY embedding <=> '[0.20, 0.10, 0.95]';
`,
  },
  {
    id: SQL_EXAMPLE_IDS.pgvectorHelpers,
    name: "A real type",
    description:
      "vector(3) is checked: inserting '[1, 2]' fails with 'expected 3 dimensions, not 2'. pgvector also ships helper functions, and casts to and from arrays.",
    database_init: databaseInit,
    query: `
SELECT
  title,
  vector_dims(embedding) AS dims,
  round(vector_norm(embedding)::numeric, 3) AS length,
  embedding::real[]::text AS as_array
FROM documents
LIMIT 3;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.pgvectorMoreLikeThis,
    name: "More like this",
    description:
      "Related documents, with the stored embedding as the question. It's still SQL: joins and WHERE work as usual.",
    database_init: databaseInit,
    query: `
SELECT other.title
FROM documents AS source
JOIN documents AS other ON other.id <> source.id
WHERE source.title = 'Vector search'
ORDER BY other.embedding <=> source.embedding
LIMIT 3;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.pgvectorIndexScan,
    name: "An HNSW index",
    description:
      "5,008 documents and an HNSW index. The plan is an Index Scan whose Order By is the distance: Postgres reads the nearest rows straight from the index, instead of sorting all of them.",
    database_init: indexedDatabaseInit,
    query: `
SELECT title
FROM documents
ORDER BY embedding <=> '[0.85, 0.10, 0.05]'
LIMIT 5;
`,
  },
];

export const exercises: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.pgvectorExerciseClosest,
    name: "Exercise 1",
    description:
      "'How do I build a web UI?' is '[0.05, 0.90, 0.05]'. Return the title of the closest document by L2 distance (<->).",
    database_init: databaseInit,
    query: `
SELECT title
FROM documents
ORDER BY embedding <-> '[0.05, 0.90, 0.05]'
LIMIT 1;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.pgvectorExerciseRelated,
    name: "Exercise 2",
    description:
      "Return the titles of the 2 documents closest to 'Neural networks' by cosine distance (<=>), without 'Neural networks' itself.",
    database_init: databaseInit,
    query: `
SELECT other.title
FROM documents AS source
JOIN documents AS other ON other.id <> source.id
WHERE source.title = 'Neural networks'
ORDER BY other.embedding <=> source.embedding
LIMIT 2;
`,
  },
];
