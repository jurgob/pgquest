import {
  SQL_EXAMPLE_IDS,
  sqlExampleDescription,
  sqlExampleTitle,
  sqlStatement,
  type SqlExample,
} from "./types";

export const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.example12DatabaseInit,
  name: sqlExampleTitle("Lesson 12 database"),
  description: sqlExampleDescription("Draft database for JSON in PostgreSQL."),
  query: sqlStatement(`SELECT 1 AS ready;`),
};

export const database_inits = [databaseInit] as const;

export const examples: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.example12DraftQuery,
    name: sqlExampleTitle("JSON in PostgreSQL"),
    description: sqlExampleDescription("Draft placeholder for lesson 12."),
    database_init: databaseInit,
    query: sqlStatement(`SELECT 'JSON in PostgreSQL' AS topic;`),
  },
];

export const exercises: SqlExample[] = [];
