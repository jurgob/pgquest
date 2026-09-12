import {
  SQL_EXAMPLE_IDS,
  sqlExampleDescription,
  sqlExampleTitle,
  sqlStatement,
  type SqlExample,
} from "./types";

const migration = sqlStatement(`
CREATE TABLE authors (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE books (
  id SERIAL PRIMARY KEY,
  author_id INTEGER NOT NULL REFERENCES authors (id),
  title TEXT NOT NULL
);

CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  book_id INTEGER NOT NULL REFERENCES books (id),
  rating INTEGER NOT NULL
);
`);

const seed = sqlStatement(`
INSERT INTO authors (name)
VALUES ('Ursula Le Guin'), ('Octavia Butler'), ('Ted Chiang');

INSERT INTO books (author_id, title)
VALUES
  (1, 'The Dispossessed'),
  (1, 'A Wizard of Earthsea'),
  (2, 'Kindred');

INSERT INTO reviews (book_id, rating)
VALUES (1, 5), (1, 4), (3, 5);
`);

export const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.example8DatabaseInit,
  name: sqlExampleTitle("Lesson 8 database"),
  description: sqlExampleDescription("Creates authors, books, and reviews."),
  query: sqlStatement(`${migration}\n${seed}`),
};

export const database_inits = [databaseInit] as const;

export const examples: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.example8InnerJoin,
    name: sqlExampleTitle("Inner join"),
    description: sqlExampleDescription(
      "INNER JOIN keeps only rows where both sides match the join condition.",
    ),
    database_init: databaseInit,
    query: sqlStatement(`
SELECT authors.name, books.title
FROM authors
JOIN books ON books.author_id = authors.id
ORDER BY authors.name, books.title;
`),
  },
  {
    id: SQL_EXAMPLE_IDS.example8LeftJoin,
    name: sqlExampleTitle("Left join"),
    description: sqlExampleDescription(
      "LEFT JOIN keeps every left row, even when the right side is missing.",
    ),
    database_init: databaseInit,
    query: sqlStatement(`
SELECT authors.name, books.title
FROM authors
LEFT JOIN books ON books.author_id = authors.id
ORDER BY authors.name, books.title;
`),
  },
  {
    id: SQL_EXAMPLE_IDS.example8JoinAggregate,
    name: sqlExampleTitle("Join and aggregate"),
    description: sqlExampleDescription(
      "Joins can feed aggregate queries, such as counting reviews per book.",
    ),
    database_init: databaseInit,
    query: sqlStatement(`
SELECT books.title, COUNT(reviews.id) AS reviews
FROM books
LEFT JOIN reviews ON reviews.book_id = books.id
GROUP BY books.title
ORDER BY books.title;
`),
  },
];

export const exercises: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.example8ExerciseAuthorBooks,
    name: sqlExampleTitle("Exercise 1"),
    description: sqlExampleDescription(
      "Join books to authors and select title plus author name.",
    ),
    database_init: databaseInit,
    query: sqlStatement(`
SELECT books.title, authors.name AS author
FROM books
JOIN authors ON authors.id = books.author_id
ORDER BY books.title;
`),
  },
  {
    id: SQL_EXAMPLE_IDS.example8ExerciseBooksWithoutReviews,
    name: sqlExampleTitle("Exercise 2"),
    description: sqlExampleDescription(
      "Find books that have no reviews by using LEFT JOIN and IS NULL.",
    ),
    database_init: databaseInit,
    query: sqlStatement(`
SELECT books.title
FROM books
LEFT JOIN reviews ON reviews.book_id = books.id
WHERE reviews.id IS NULL
ORDER BY books.title;
`),
  },
];
