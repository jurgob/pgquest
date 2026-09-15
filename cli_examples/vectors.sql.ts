import {
  SQL_EXAMPLE_IDS,
  sqlExampleDescription,
  sqlExampleTitle,
  sqlStatement,
  type SqlExample,
} from "./types";

const migration = sqlStatement(`
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  embedding DOUBLE PRECISION[] NOT NULL
);
`);

const seed = sqlStatement(`
INSERT INTO documents (title, embedding)
VALUES
  ('SQL indexes', ARRAY[0.90, 0.10, 0.20]),
  ('JSON documents', ARRAY[0.20, 0.80, 0.30]),
  ('Vector search', ARRAY[0.10, 0.20, 0.95]),
  ('JOIN patterns', ARRAY[0.75, 0.25, 0.25]);
`);

export const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.vectorsDatabaseInit,
  name: sqlExampleTitle("Lesson 15 database"),
  description: sqlExampleDescription("Creates documents with small vector embeddings."),
  query: sqlStatement(`${migration}\n${seed}`),
};

export const database_inits = [databaseInit] as const;

export const examples: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.vectorsNearestVector,
    name: sqlExampleTitle("Nearest vector"),
    description: sqlExampleDescription(
      "This uses arrays to show the same idea: nearest embeddings sort first.",
    ),
    database_init: databaseInit,
    query: sqlStatement(`
SELECT title
FROM documents
ORDER BY
  power(embedding[1] - 0.85, 2) +
  power(embedding[2] - 0.15, 2) +
  power(embedding[3] - 0.20, 2)
LIMIT 2;
`),
  },
  {
    id: SQL_EXAMPLE_IDS.vectorsDistanceScore,
    name: sqlExampleTitle("Show distance"),
    description: sqlExampleDescription(
      "The smaller the distance score, the more similar the document is to the query vector.",
    ),
    database_init: databaseInit,
    query: sqlStatement(`
SELECT
  title,
  power(embedding[1] - 0.10, 2) +
  power(embedding[2] - 0.20, 2) +
  power(embedding[3] - 0.90, 2) AS distance
FROM documents
ORDER BY distance;
`),
  },
];

export const exercises: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.vectorsExerciseFindSqlVector,
    name: sqlExampleTitle("Exercise 1"),
    description: sqlExampleDescription(
      "Find the closest document to ARRAY[0.95, 0.10, 0.20].",
    ),
    database_init: databaseInit,
    query: sqlStatement(`
SELECT title
FROM documents
ORDER BY
  power(embedding[1] - 0.95, 2) +
  power(embedding[2] - 0.10, 2) +
  power(embedding[3] - 0.20, 2)
LIMIT 1;
`),
  },
  {
    id: SQL_EXAMPLE_IDS.vectorsExerciseFindIndexVector,
    name: sqlExampleTitle("Exercise 2"),
    description: sqlExampleDescription(
      "Return the two closest documents to ARRAY[0.70, 0.25, 0.25].",
    ),
    database_init: databaseInit,
    query: sqlStatement(`
SELECT title
FROM documents
ORDER BY
  power(embedding[1] - 0.70, 2) +
  power(embedding[2] - 0.25, 2) +
  power(embedding[3] - 0.25, 2)
LIMIT 2;
`),
  },
];
