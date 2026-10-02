import { generatedDocumentsSeed, searchDocumentsSeed } from "./search-documents";
import { SQL_EXAMPLE_IDS, type SqlExample } from "./types";

export const migration = `
-- CREATE EXTENSION also makes PGlite load pg_trgm for this database.
CREATE EXTENSION pg_trgm;

CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL
);
`;

export const seed = searchDocumentsSeed();

export const trigramIndexes = `
-- GIN: speeds up %, <%, LIKE and ILIKE '%...%'.
CREATE INDEX documents_title_trgm_idx ON documents
USING gin (title gin_trgm_ops);

-- GiST: can also return rows ordered by <-> distance, nearest first.
CREATE INDEX documents_title_trgm_gist_idx ON documents
USING gist (title gist_trgm_ops);
`;

export const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.fuzzySearchDatabaseInit,
  name: "Fuzzy search database",
  description: "The eight documents, with the pg_trgm extension.",
  query: [migration, seed].join("\n"),
};

export const indexedDatabaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.fuzzySearchIndexedDatabaseInit,
  name: "Fuzzy search database, 5,000 documents",
  description:
    "The eight documents plus 5,000 generated ones, with GIN and GiST trigram indexes on the title.",
  query: [migration, seed, generatedDocumentsSeed({ count: 5000 }), trigramIndexes].join(
    "\n",
  ),
};

export const database_inits = [databaseInit, indexedDatabaseInit] as const;

export const examples: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.fuzzySearchShowTrgm,
    name: "Trigrams",
    description:
      "pg_trgm lowercases a string, pads each word with spaces, and cuts it into every 3-letter chunk.",
    database_init: databaseInit,
    query: `
SELECT show_trgm('Index')::text AS index, show_trgm('Indx')::text AS typo;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.fuzzySearchSimilarity,
    name: "Similarity",
    description:
      "similarity() is the share of trigrams two strings have in common: 1 is identical, 0 is nothing shared. A search with two typos still finds the right document.",
    database_init: databaseInit,
    query: `
SELECT title, round(similarity(title, 'nueral netwrks')::numeric, 3) AS score
FROM documents
ORDER BY score DESC
LIMIT 3;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.fuzzySearchPercent,
    name: "The % operator",
    description:
      "title % 'reakt componets' is true when the similarity is above pg_trgm.similarity_threshold, 0.3 by default. Use it in WHERE, and an index can help.",
    database_init: databaseInit,
    query: `
SELECT title, round(similarity(title, 'reakt componets')::numeric, 3) AS score
FROM documents
WHERE title % 'reakt componets';
`,
  },
  {
    id: SQL_EXAMPLE_IDS.fuzzySearchWordSimilarity,
    name: "A word inside longer text",
    description:
      "similarity() compares whole strings, so one word against a sentence scores low. word_similarity() finds the best matching part of the text instead: 'postgress' is close to 'PostgreSQL'.",
    database_init: databaseInit,
    query: `
SELECT
  title,
  round(similarity('postgress', body)::numeric, 3) AS whole,
  round(word_similarity('postgress', body)::numeric, 3) AS best_word
FROM documents
ORDER BY best_word DESC
LIMIT 3;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.fuzzySearchDidYouMean,
    name: "Did you mean",
    description:
      "<-> is the trigram distance, 1 - similarity. ORDER BY it with LIMIT 1 for a 'did you mean' suggestion.",
    database_init: databaseInit,
    query: `
SELECT title AS did_you_mean
FROM documents
ORDER BY title <-> 'css grd layot'
LIMIT 1;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.fuzzySearchIlikeIndex,
    name: "An index for ILIKE",
    description:
      "A B-tree can't answer ILIKE '%...%': the match can start anywhere. A trigram index can: it finds the rows containing every trigram of the pattern. Both trigram indexes support ILIKE; here the planner picks the GiST one.",
    database_init: indexedDatabaseInit,
    query: `
SELECT title
FROM documents
WHERE title ILIKE '%note 4711%';
`,
  },
  {
    id: SQL_EXAMPLE_IDS.fuzzySearchGistOrder,
    name: "An index for nearest matches",
    description:
      "A GiST trigram index returns rows already ordered by <-> distance, so a typo-tolerant autocomplete reads a handful of rows instead of scoring all 5,008.",
    database_init: indexedDatabaseInit,
    query: `
SELECT title
FROM documents
ORDER BY title <-> 'Redis chatbot note 42'
LIMIT 3;
`,
  },
];

export const exercises: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.fuzzySearchExerciseBestMatch,
    name: "Exercise 1",
    description:
      "A user typed 'quary tunning'. Return the title of the document with the highest similarity() to it.",
    database_init: databaseInit,
    query: `
SELECT title
FROM documents
ORDER BY similarity(title, 'quary tunning') DESC
LIMIT 1;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.fuzzySearchExerciseWordMatch,
    name: "Exercise 2",
    description:
      "A user typed 'naturl'. Return the titles of the documents whose body has a word with word_similarity() above 0.5.",
    database_init: databaseInit,
    query: `
SELECT title
FROM documents
WHERE word_similarity('naturl', body) > 0.5;
`,
  },
];
