import { arrayLiteral, questions, searchDocumentsSeed } from "./search-documents";
import { SQL_EXAMPLE_IDS, type SqlExample } from "./types";

export const migration = `
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  -- [databases, web, AI]: how much the document is about each topic.
  embedding DOUBLE PRECISION[] NOT NULL
);
`;

export const seed = searchDocumentsSeed({ embedding: arrayLiteral });

export const functions = `
-- unnest(a, b) zips two arrays into rows of (x, y) pairs,
-- so these work for any number of dimensions.

-- Euclidean (L2) distance: the straight-line distance between two points.
CREATE FUNCTION l2_distance(a DOUBLE PRECISION[], b DOUBLE PRECISION[])
RETURNS DOUBLE PRECISION
LANGUAGE sql IMMUTABLE
AS $$
  SELECT sqrt(sum((x - y) ^ 2)) FROM unnest(a, b) AS t(x, y)
$$;

-- Cosine similarity: 1 when two vectors point the same way, 0 when unrelated.
CREATE FUNCTION cosine_similarity(a DOUBLE PRECISION[], b DOUBLE PRECISION[])
RETURNS DOUBLE PRECISION
LANGUAGE sql IMMUTABLE
AS $$
  SELECT sum(x * y) / (sqrt(sum(x * x)) * sqrt(sum(y * y)))
  FROM unnest(a, b) AS t(x, y)
$$;
`;

const speed = questions.speedUpMyDatabase.embedding;

export const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.vectorsDatabaseInit,
  name: "Vectors database",
  description:
    "Eight documents with hand-made 3-dimensional embeddings, plus l2_distance and cosine_similarity functions.",
  query: [migration, seed, functions].join("\n"),
};

export const database_inits = [databaseInit] as const;

export const examples: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.vectorsShowEmbeddings,
    name: "The embeddings",
    description:
      "Each document has three numbers: how much it is about databases, the web, and AI.",
    database_init: databaseInit,
    query: `
-- ::text shows the array the way Postgres writes it.
SELECT title, embedding::text AS embedding
FROM documents;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.vectorsKeywordsMiss,
    name: "Keywords miss meaning",
    description:
      "A user searches for 'speed up my database'. No document contains those words, so a keyword search returns nothing, even though three documents are exactly about that.",
    database_init: databaseInit,
    query: `
SELECT title
FROM documents
WHERE title ILIKE '%speed up%'
   OR body ILIKE '%speed up%';
`,
  },
  {
    id: SQL_EXAMPLE_IDS.vectorsDistanceScore,
    name: "The question is a vector too",
    description: `The same model scores 'speed up my database' as ${arrayLiteral(questions.speedUpMyDatabase.embedding)}: mostly databases. Distance is Pythagoras in three dimensions: the smaller it is, the closer the meaning.`,
    database_init: databaseInit,
    query: `
SELECT
  title,
  round(sqrt(
    power(embedding[1] - ${speed[0].toFixed(2)}, 2) +
    power(embedding[2] - ${speed[1].toFixed(2)}, 2) +
    power(embedding[3] - ${speed[2].toFixed(2)}, 2)
  )::numeric, 3) AS distance
FROM documents
ORDER BY distance;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.vectorsNearestVector,
    name: "Nearest neighbours",
    description:
      "The same math, written once as a function. ORDER BY distance plus LIMIT is the whole of vector search: the k nearest neighbours.",
    database_init: databaseInit,
    query: `
SELECT title
FROM documents
ORDER BY l2_distance(embedding, ${arrayLiteral(questions.speedUpMyDatabase.embedding)})
LIMIT 3;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.vectorsCosineSimilarity,
    name: "Cosine similarity",
    description: `'AI that understands text' becomes ${arrayLiteral(questions.aiThatUnderstandsText.embedding)}. Cosine similarity compares the direction of two vectors and ignores their length. Most embedding models return vectors of length 1, so both measures give the same order; cosine is the usual default.`,
    database_init: databaseInit,
    query: `
SELECT
  title,
  round(l2_distance(embedding, ${arrayLiteral(questions.aiThatUnderstandsText.embedding)})::numeric, 3) AS distance,
  round(cosine_similarity(embedding, ${arrayLiteral(questions.aiThatUnderstandsText.embedding)})::numeric, 3) AS similarity
FROM documents
ORDER BY similarity DESC;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.vectorsCutoff,
    name: "Set a cutoff",
    description:
      "Nearest neighbours always returns rows, even when nothing is really close. A WHERE on the distance keeps only good matches.",
    database_init: databaseInit,
    query: `
SELECT title
FROM documents
WHERE l2_distance(embedding, ${arrayLiteral(questions.aiThatUnderstandsText.embedding)}) < 0.3
ORDER BY l2_distance(embedding, ${arrayLiteral(questions.aiThatUnderstandsText.embedding)});
`,
  },
  {
    id: SQL_EXAMPLE_IDS.vectorsMoreLikeThis,
    name: "More like this",
    description:
      "A 'related articles' box: use a stored document's embedding as the question, and skip the document itself.",
    database_init: databaseInit,
    query: `
SELECT other.title
FROM documents AS source
JOIN documents AS other ON other.id <> source.id
WHERE source.title = 'Vector search'
ORDER BY cosine_similarity(other.embedding, source.embedding) DESC
LIMIT 3;
`,
  },
];

export const exercises: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.vectorsExerciseFindSqlVector,
    name: "Exercise 1",
    description: `'How do I build a web UI?' has the embedding ${arrayLiteral(questions.buildAWebUi.embedding)}. Return the title of the closest document by l2_distance.`,
    database_init: databaseInit,
    query: `
SELECT title
FROM documents
ORDER BY l2_distance(embedding, ${arrayLiteral(questions.buildAWebUi.embedding)})
LIMIT 1;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.vectorsExerciseFindIndexVector,
    name: "Exercise 2",
    description:
      "Return the titles of the 3 documents most similar to ARRAY[0.60, 0.00, 0.80] by cosine_similarity, most similar first.",
    database_init: databaseInit,
    query: `
SELECT title
FROM documents
ORDER BY cosine_similarity(embedding, ARRAY[0.60, 0.00, 0.80]) DESC
LIMIT 3;
`,
  },
];
