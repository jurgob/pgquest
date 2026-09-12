import {
  SQL_EXAMPLE_IDS,
  sqlExampleDescription,
  sqlExampleTitle,
  sqlStatement,
  type SqlExample,
} from "./types";

export const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.example5DatabaseInit,
  name: sqlExampleTitle("Lesson 5 database"),
  description: sqlExampleDescription("Draft database for Introduction to indexes."),
  query: sqlStatement(`SELECT 1 AS ready;`),
};

export const database_inits = [databaseInit] as const;

export const examples: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.example5DraftQuery,
    name: sqlExampleTitle("Introduction to indexes"),
    description: sqlExampleDescription("Draft placeholder for lesson 5."),
    database_init: databaseInit,
    query: sqlStatement(`SELECT 'Introduction to indexes' AS topic;`),
  },
];

export const exercises: SqlExample[] = [];
