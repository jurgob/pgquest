import {
  SQL_EXAMPLE_IDS,
  sqlExampleDescription,
  sqlExampleTitle,
  sqlStatement,
  type SqlExample,
} from "./types";

export const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.example3DatabaseInit,
  name: sqlExampleTitle("Lesson 3 database"),
  description: sqlExampleDescription("Draft database for Insert, update, delete."),
  query: sqlStatement(`SELECT 1 AS ready;`),
};

export const database_inits = [databaseInit] as const;

export const examples: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.example3DraftQuery,
    name: sqlExampleTitle("Insert, update, delete"),
    description: sqlExampleDescription("Draft placeholder for lesson 3."),
    database_init: databaseInit,
    query: sqlStatement(`SELECT 'Insert, update, delete' AS topic;`),
  },
];

export const exercises: SqlExample[] = [];
