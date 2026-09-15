import { SQL_EXAMPLE_IDS, type SqlExample } from "./types";

const migration = `
CREATE TABLE articles (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL
);
`;

const seed = `
INSERT INTO articles (title, body)
VALUES
  ('PostgreSQL indexing guide', 'Indexes help PostgreSQL find rows.'),
  ('SQL join guide', 'Joins combine rows from different tables.'),
  ('JSON in Postgres', 'jsonb stores structured documents.'),
  ('Vector search notes', 'Similarity search compares embeddings.');
`;

export const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.textSearchBasicsDatabaseInit,
  name: "Lesson 11 database",
  description: "Creates searchable articles.",
  query: `${migration}\n${seed}`,
};

export const database_inits = [databaseInit] as const;

export const examples: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.textSearchBasicsLikePrefix,
    name: "Prefix search",
    description:
      "LIKE uses % as a wildcard. This pattern matches titles starting with SQL.",
    database_init: databaseInit,
    query: `
SELECT title
FROM articles
WHERE title LIKE 'SQL%';
`,
  },
  {
    id: SQL_EXAMPLE_IDS.textSearchBasicsIlikeContains,
    name: "Case-insensitive search",
    description: "ILIKE works like LIKE, but ignores letter case.",
    database_init: databaseInit,
    query: `
SELECT title
FROM articles
WHERE title ILIKE '%postgres%';
`,
  },
  {
    id: SQL_EXAMPLE_IDS.textSearchBasicsLowerSearch,
    name: "Normalize then search",
    description: "LOWER can make a regular LIKE comparison case-insensitive.",
    database_init: databaseInit,
    query: `
SELECT title
FROM articles
WHERE LOWER(body) LIKE '%search%';
`,
  },
];

export const exercises: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.textSearchBasicsExerciseFindPostgres,
    name: "Exercise 1",
    description: "Find articles whose title mentions Postgres.",
    database_init: databaseInit,
    query: `
SELECT title
FROM articles
WHERE title ILIKE '%postgres%';
`,
  },
  {
    id: SQL_EXAMPLE_IDS.textSearchBasicsExerciseFindGuide,
    name: "Exercise 2",
    description: "Find articles whose title ends with guide.",
    database_init: databaseInit,
    query: `
SELECT title
FROM articles
WHERE title ILIKE '%guide';
`,
  },
];
