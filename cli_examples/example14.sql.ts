import {
  SQL_EXAMPLE_IDS,
  sqlExampleDescription,
  sqlExampleTitle,
  sqlStatement,
  type SqlExample,
} from "./types";

export const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.example14DatabaseInit,
  name: sqlExampleTitle("Lesson 14 database"),
  description: sqlExampleDescription("Draft database for Advanced aggregation."),
  query: sqlStatement(`SELECT 1 AS ready;`),
};

export const database_inits = [databaseInit] as const;

export const examples: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.example14DraftQuery,
    name: sqlExampleTitle("Advanced aggregation"),
    description: sqlExampleDescription("Draft placeholder for lesson 14."),
    database_init: databaseInit,
    query: sqlStatement(`SELECT 'Advanced aggregation' AS topic;`),
  },
];

export const exercises: SqlExample[] = [];
