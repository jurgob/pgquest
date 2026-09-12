import {
  SQL_EXAMPLE_IDS,
  sqlExampleDescription,
  sqlExampleTitle,
  sqlStatement,
  type SqlExample,
} from "./types";

export const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.example15DatabaseInit,
  name: sqlExampleTitle("Lesson 15 database"),
  description: sqlExampleDescription("Draft database for Vectors."),
  query: sqlStatement(`SELECT 1 AS ready;`),
};

export const database_inits = [databaseInit] as const;

export const examples: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.example15DraftQuery,
    name: sqlExampleTitle("Vectors"),
    description: sqlExampleDescription("Draft placeholder for lesson 15."),
    database_init: databaseInit,
    query: sqlStatement(`SELECT 'Vectors' AS topic;`),
  },
];

export const exercises: SqlExample[] = [];
