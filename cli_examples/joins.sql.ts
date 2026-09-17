import { SQL_EXAMPLE_IDS, type SqlExample } from "./types";

const migration = `
CREATE TABLE authors (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE books (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  author_id INTEGER REFERENCES authors (id)
);
`;

const seed = `
INSERT INTO authors (name)
VALUES ('J.R.R. Tolkien'), ('Isaac Asimov'), ('Agatha Christie');

INSERT INTO books (title, author_id)
VALUES
  ('The Fellowship of the Ring', 1),
  ('The Two Towers', 1),
  ('I, Robot', 2),
  ('Beowulf', NULL);
`;

export const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.joinsDatabaseInit,
  name: "Types of JOINs database",
  description:
    "Creates authors and books. Agatha Christie has no book, and Beowulf has no author.",
  query: `${migration}\n${seed}`,
};

export const database_inits = [databaseInit] as const;

const orderClause = "ORDER BY authors.name, books.title";
const orderClauseNullsLast = "ORDER BY authors.name NULLS LAST, books.title NULLS LAST";

export const previewAuthorsQuery = `
SELECT * FROM authors ORDER BY id;
`;

export const previewBooksQuery = `
SELECT * FROM books ORDER BY id;
`;

export const innerJoinQuery = `
SELECT authors.name, books.title
FROM authors
JOIN books ON books.author_id = authors.id
${orderClause};
`;

export const leftJoinQuery = `
SELECT authors.name, books.title
FROM authors
LEFT JOIN books ON books.author_id = authors.id
${orderClauseNullsLast};
`;

export const rightJoinQuery = `
SELECT authors.name, books.title
FROM authors
RIGHT JOIN books ON books.author_id = authors.id
${orderClauseNullsLast};
`;

export const fullOuterJoinQuery = `
SELECT authors.name, books.title
FROM authors
FULL OUTER JOIN books ON books.author_id = authors.id
${orderClauseNullsLast};
`;

export const crossJoinQuery = `
SELECT authors.name, books.title
FROM authors
CROSS JOIN books
${orderClause};
`;

export const examples: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.joinsPreviewAuthors,
    name: "authors",
    description: "Agatha Christie has no row in books.",
    database_init: databaseInit,
    query: previewAuthorsQuery,
  },
  {
    id: SQL_EXAMPLE_IDS.joinsPreviewBooks,
    name: "books",
    description: "Beowulf's author_id is NULL.",
    database_init: databaseInit,
    query: previewBooksQuery,
  },
  {
    id: SQL_EXAMPLE_IDS.joinsInnerJoin,
    name: "INNER JOIN",
    description: "Only rows with a match on both sides survive.",
    database_init: databaseInit,
    query: innerJoinQuery,
  },
  {
    id: SQL_EXAMPLE_IDS.joinsLeftJoin,
    name: "LEFT JOIN",
    description: "Every author survives, matched or not.",
    database_init: databaseInit,
    query: leftJoinQuery,
  },
  {
    id: SQL_EXAMPLE_IDS.joinsRightJoin,
    name: "RIGHT JOIN",
    description: "Every book survives, matched or not.",
    database_init: databaseInit,
    query: rightJoinQuery,
  },
  {
    id: SQL_EXAMPLE_IDS.joinsFullOuterJoin,
    name: "FULL OUTER JOIN",
    description: "Every author and every book survives.",
    database_init: databaseInit,
    query: fullOuterJoinQuery,
  },
  {
    id: SQL_EXAMPLE_IDS.joinsCrossJoin,
    name: "CROSS JOIN",
    description: "Every author paired with every book: 3 authors × 4 books = 12 rows.",
    database_init: databaseInit,
    query: crossJoinQuery,
  },
];

export const exercises: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.joinsExerciseBookAuthors,
    name: "Exercise 1",
    description:
      "List every book with its author's name, keeping books that have no author.",
    database_init: databaseInit,
    query: `
SELECT books.title, authors.name AS author
FROM books
LEFT JOIN authors ON authors.id = books.author_id
ORDER BY books.title;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.joinsExerciseAuthorsWithoutBooks,
    name: "Exercise 2",
    description: "Find every author who has not written a book yet.",
    database_init: databaseInit,
    query: `
SELECT authors.name
FROM authors
LEFT JOIN books ON books.author_id = authors.id
WHERE books.id IS NULL;
`,
  },
];
