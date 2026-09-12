import {
  SQL_EXAMPLE_IDS,
  sqlExampleDescription,
  sqlExampleTitle,
  sqlStatement,
  type SqlExample,
} from "./types";

export const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.example6DatabaseInit,
  name: sqlExampleTitle("Lesson 6 database"),
  description: sqlExampleDescription("Draft database for Aggregation intro."),
  query: sqlStatement(`SELECT 1 AS ready;`),
};

export const database_inits = [databaseInit] as const;

export const examples: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.example6DraftQuery,
    name: sqlExampleTitle("Aggregation intro"),
    description: sqlExampleDescription("Draft placeholder for lesson 6."),
    database_init: databaseInit,
    query: sqlStatement(`SELECT 'Aggregation intro' AS topic;`),
  },
];

export const exercises: SqlExample[] = [];
