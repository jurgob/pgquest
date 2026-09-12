import {
  SQL_EXAMPLE_IDS,
  sqlExampleDescription,
  sqlExampleTitle,
  sqlStatement,
  type SqlExample,
} from "./types";

export const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.example7DatabaseInit,
  name: sqlExampleTitle("Lesson 7 database"),
  description: sqlExampleDescription("Draft database for NULL."),
  query: sqlStatement(`SELECT 1 AS ready;`),
};

export const database_inits = [databaseInit] as const;

export const examples: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.example7DraftQuery,
    name: sqlExampleTitle("NULL"),
    description: sqlExampleDescription("Draft placeholder for lesson 7."),
    database_init: databaseInit,
    query: sqlStatement(`SELECT 'NULL' AS topic;`),
  },
];

export const exercises: SqlExample[] = [];
