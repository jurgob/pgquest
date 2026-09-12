import {
  SQL_EXAMPLE_IDS,
  sqlExampleDescription,
  sqlExampleTitle,
  sqlStatement,
  type SqlExample,
} from "./types";

export const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.example13DatabaseInit,
  name: sqlExampleTitle("Lesson 13 database"),
  description: sqlExampleDescription("Draft database for Transactions."),
  query: sqlStatement(`SELECT 1 AS ready;`),
};

export const database_inits = [databaseInit] as const;

export const examples: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.example13DraftQuery,
    name: sqlExampleTitle("Transactions"),
    description: sqlExampleDescription("Draft placeholder for lesson 13."),
    database_init: databaseInit,
    query: sqlStatement(`SELECT 'Transactions' AS topic;`),
  },
];

export const exercises: SqlExample[] = [];
