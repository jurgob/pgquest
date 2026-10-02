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

export const ivfflatIndex = `
-- IVFFlat: split the vectors into lists (clusters) around centroids.
-- A search only reads the lists whose centroids are nearest to the question.
-- The centroids come from the rows already in the table: create it after
-- loading the data. Rule of thumb: lists = rows / 1000 up to 1M rows.
CREATE INDEX documents_embedding_ivfflat_idx ON documents
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);

-- How many lists a search reads (default 1). More: better recall, slower.
SET ivfflat.probes = 5;
`;

export const smallerVectorIndexes = `
-- Index a smaller copy of the vector, without storing a second column.
-- halfvec: 16-bit numbers. Half the index size, almost the same results.
CREATE INDEX ON documents
USING hnsw ((embedding::halfvec(1536)) halfvec_cosine_ops);

-- bit: 1 bit per number (positive or not). 32x smaller, much rougher.
CREATE INDEX ON documents
USING hnsw ((binary_quantize(embedding)::bit(1536)) bit_hamming_ops);

-- Queries must use the same expression to hit the index:
SELECT title FROM documents
ORDER BY embedding::halfvec(1536) <=> $1::halfvec(1536)
LIMIT 10;
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

export const largeDatabaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.pgvectorLargeDatabaseInit,
  name: "pgvector database, 5,000 documents, no index",
  description: "The eight documents plus 5,000 generated ones, without a vector index.",
  query: [migration, seed, generatedDocumentsSeed({ count: 5000, embedding: true })].join(
    "\n",
  ),
};

export const ivfflatDatabaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.pgvectorIvfflatDatabaseInit,
  name: "pgvector database, 5,000 documents, IVFFlat",
  description:
    "The eight documents plus 5,000 generated ones, with an IVFFlat index of 50 lists.",
  query: [
    migration,
    seed,
    generatedDocumentsSeed({ count: 5000, embedding: true }),
    `CREATE INDEX documents_embedding_ivfflat_idx ON documents
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);`,
  ].join("\n"),
};

export const database_inits = [
  databaseInit,
  largeDatabaseInit,
  indexedDatabaseInit,
  ivfflatDatabaseInit,
] as const;

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
    id: SQL_EXAMPLE_IDS.pgvectorExactScan,
    name: "Exact search on 5,008 rows",
    description:
      "No vector index: the plan is a Seq Scan and a Sort. Postgres measures the distance to all 5,008 rows and sorts them. Slow on big tables, but always the true nearest rows: SQL indexes and JOIN patterns come first.",
    database_init: largeDatabaseInit,
    query: `
SELECT title
FROM documents
ORDER BY embedding <=> '[0.85, 0.10, 0.05]'
LIMIT 5;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.pgvectorIndexScan,
    name: "The same search with HNSW",
    description:
      "Same rows, same query, with an HNSW index. The plan is an Index Scan whose Order By is the distance: Postgres walks the graph instead of sorting every row. Compare the results with the exact search: an approximate index can miss some of the true nearest rows.",
    database_init: indexedDatabaseInit,
    query: `
SELECT title
FROM documents
ORDER BY embedding <=> '[0.85, 0.10, 0.05]'
LIMIT 5;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.pgvectorIvfflatScan,
    name: "The same search with IVFFlat",
    description:
      "Same rows, same query, with an IVFFlat index of 50 lists. The plan is an Index Scan again. With the default ivfflat.probes = 1 it reads only the nearest list, so a true neighbour sitting in the next list is missed: compare with the exact search.",
    database_init: ivfflatDatabaseInit,
    query: `
SELECT title
FROM documents
ORDER BY embedding <=> '[0.85, 0.10, 0.05]'
LIMIT 5;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.pgvectorSmallerVectors,
    name: "halfvec and bits",
    description:
      "The same embeddings in smaller types. halfvec keeps 16 bits per number: 0.90 becomes 0.89990234, close enough. binary_quantize keeps 1 bit per number, positive or not: every document here becomes 111, except CSS grid layouts, whose third number is 0.",
    database_init: databaseInit,
    query: `
SELECT
  title,
  embedding::halfvec(3)::text AS half,
  binary_quantize(embedding)::text AS bits
FROM documents;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.pgvectorBinaryRerank,
    name: "Bits first, then re-rank",
    description:
      "Bits alone can't tell these documents apart. The usual fix: let the cheap bit distance (<~>, Hamming) pick a few candidates, then order only those by the full vectors. Same top 3 as the exact search.",
    database_init: databaseInit,
    query: `
SELECT title
FROM (
  SELECT title, embedding
  FROM documents
  ORDER BY binary_quantize(embedding)::bit(3) <~> binary_quantize('[0.85, 0.10, 0.05]'::vector(3))
  LIMIT 6
) AS candidates
ORDER BY embedding <=> '[0.85, 0.10, 0.05]'
LIMIT 3;
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
