import {
  SQL_EXAMPLE_IDS,
  sqlExampleDescription,
  sqlExampleTitle,
  sqlStatement,
  type SqlExample,
} from "./types";

export const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.example9DatabaseInit,
  name: sqlExampleTitle("Lesson 9 database"),
  description: sqlExampleDescription("Draft database for Relationships."),
  query: sqlStatement(`SELECT 1 AS ready;`),
};

export const database_inits = [databaseInit] as const;

export const examples: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.example9DraftQuery,
    name: sqlExampleTitle("Relationships"),
    description: sqlExampleDescription("Draft placeholder for lesson 9."),
    database_init: databaseInit,
    query: sqlStatement(`SELECT 'Relationships' AS topic;`),
  },
];

export const exercises: SqlExample[] = [];
