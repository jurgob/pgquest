import {
  SQL_EXAMPLE_IDS,
  sqlExampleDescription,
  sqlExampleTitle,
  sqlStatement,
  type SqlExample,
} from "./types";

export const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.example4DatabaseInit,
  name: sqlExampleTitle("Lesson 4 database"),
  description: sqlExampleDescription("Draft database for Constraints."),
  query: sqlStatement(`SELECT 1 AS ready;`),
};

export const database_inits = [databaseInit] as const;

export const examples: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.example4DraftQuery,
    name: sqlExampleTitle("Constraints"),
    description: sqlExampleDescription("Draft placeholder for lesson 4."),
    database_init: databaseInit,
    query: sqlStatement(`SELECT 'Constraints' AS topic;`),
  },
];

export const exercises: SqlExample[] = [];
