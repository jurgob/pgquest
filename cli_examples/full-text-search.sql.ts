import { generatedDocumentsSeed, searchDocumentsSeed } from "./search-documents";
import { SQL_EXAMPLE_IDS, type SqlExample } from "./types";

export const migration = `
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL
);
`;

export const seed = searchDocumentsSeed();

export const searchColumn = `
-- Computed once on INSERT/UPDATE instead of on every search.
-- setweight labels title words A and body words B, so ts_rank can
-- rank a title match above a body match.
ALTER TABLE documents ADD COLUMN search tsvector
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', title), 'A') ||
  setweight(to_tsvector('english', body), 'B')
) STORED;

-- GIN: an inverted index, lexeme -> rows that contain it.
-- Create it after a bulk load: building it once is faster than updating it per row.
CREATE INDEX documents_search_idx ON documents USING gin (search);
`;

export const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.fullTextSearchDatabaseInit,
  name: "Full-text search database",
  description: "The eight documents, as plain title and body text.",
  query: [migration, seed].join("\n"),
};

export const indexedDatabaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.fullTextSearchIndexedDatabaseInit,
  name: "Full-text search database, 5,000 documents",
  description:
    "The eight documents plus 5,000 generated ones, with a stored tsvector column and a GIN index.",
  query: [
    migration,
    seed,
    generatedDocumentsSeed({ count: 5000 }),
    searchColumn,
    "ANALYZE documents;",
  ].join("\n"),
};

export const database_inits = [databaseInit, indexedDatabaseInit] as const;

export const examples: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.fullTextSearchLexemes,
    name: "Text becomes lexemes",
    description:
      "to_tsvector splits text into words, drops stop words like 'the' and 'without', and reduces each word to its stem: 'Indexes' becomes 'index', 'reading' becomes 'read'. The numbers are word positions.",
    database_init: databaseInit,
    query: `
SELECT title, to_tsvector('english', title || ' ' || body) AS lexemes
FROM documents
LIMIT 3;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.fullTextSearchMatch,
    name: "Match with @@",
    description:
      "The query goes through the same stemming, so 'indexing' matches 'Indexes' and 'index'. ILIKE '%indexing%' would find nothing.",
    database_init: databaseInit,
    query: `
SELECT title
FROM documents
WHERE to_tsvector('english', title || ' ' || body)
   @@ plainto_tsquery('english', 'indexing');
`,
  },
  {
    id: SQL_EXAMPLE_IDS.fullTextSearchWebsearch,
    name: "Search like a search box",
    description:
      'websearch_to_tsquery understands what users type in search boxes: "quoted phrases", OR, and -word to exclude. Here: documents about finding, but not the PostgreSQL one.',
    database_init: databaseInit,
    query: `
SELECT title
FROM documents
WHERE to_tsvector('english', title || ' ' || body)
   @@ websearch_to_tsquery('english', 'find -postgresql');
`,
  },
  {
    id: SQL_EXAMPLE_IDS.fullTextSearchRank,
    name: "Rank the results",
    description:
      "ts_rank scores how well each row matches. With title words weighted A and body words B, a match in the title counts more.",
    database_init: databaseInit,
    query: `
SELECT
  title,
  round(ts_rank(
    setweight(to_tsvector('english', title), 'A') ||
    setweight(to_tsvector('english', body), 'B'),
    query
  )::numeric, 3) AS rank
FROM documents, websearch_to_tsquery('english', 'search or find') AS query
WHERE (
  setweight(to_tsvector('english', title), 'A') ||
  setweight(to_tsvector('english', body), 'B')
) @@ query
ORDER BY rank DESC;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.fullTextSearchHeadline,
    name: "Highlight the matches",
    description:
      "ts_headline returns the text with matching words wrapped in <b> tags, ready for a results page.",
    database_init: databaseInit,
    query: `
SELECT title, ts_headline('english', body, query) AS snippet
FROM documents, websearch_to_tsquery('english', 'rows') AS query
WHERE to_tsvector('english', title || ' ' || body) @@ query;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.fullTextSearchIndexScan,
    name: "Store it and index it",
    description:
      "5,008 documents, a stored search column, and a GIN index. The plan is a Bitmap Index Scan: the index returns the 62 rows containing both lexemes, and only those are read.",
    database_init: indexedDatabaseInit,
    query: `
SELECT title
FROM documents
WHERE search @@ websearch_to_tsquery('english', 'redis chatbots');
`,
  },
  {
    id: SQL_EXAMPLE_IDS.fullTextSearchTypo,
    name: "What it can't do",
    description:
      "A typo, 'postgress', becomes the lexeme 'postgress', which no document contains. Full-text search matches words, not spellings or meanings.",
    database_init: databaseInit,
    query: `
SELECT title
FROM documents
WHERE to_tsvector('english', title || ' ' || body)
   @@ plainto_tsquery('english', 'postgress');
`,
  },
];

export const exercises: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.fullTextSearchExerciseTables,
    name: "Exercise 1",
    description:
      "Return the titles of the documents whose title or body matches the plain query 'table', ordered by title.",
    database_init: databaseInit,
    query: `
SELECT title
FROM documents
WHERE to_tsvector('english', title || ' ' || body)
   @@ plainto_tsquery('english', 'table')
ORDER BY title;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.fullTextSearchExerciseExclude,
    name: "Exercise 2",
    description:
      "Use websearch_to_tsquery to find the documents that mention patterns but not networks. Return their titles.",
    database_init: databaseInit,
    query: `
SELECT title
FROM documents
WHERE to_tsvector('english', title || ' ' || body)
   @@ websearch_to_tsquery('english', 'patterns -networks');
`,
  },
];
