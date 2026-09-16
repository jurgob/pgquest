import { SQL_EXAMPLE_IDS, type SqlExample } from "./types";

export const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.emptyDatabase,
  name: "Empty database",
  description: "A fresh Postgres database with nothing created yet.",
  query: "-- This database is empty. No migrations have run.\n",
};
