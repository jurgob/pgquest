import { SQL_EXAMPLE_IDS, type SqlExample } from "./types";

const migration = `
CREATE TABLE "User" (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL
);

CREATE TABLE "Order" (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES "User" (id),
  amount NUMERIC NOT NULL
);
`;

const seed = `
INSERT INTO "User" (name, email)
VALUES
  ('Ada Lovelace', 'ada@example.com'),
  ('Grace Hopper', 'grace@example.com');

INSERT INTO "Order" (user_id, amount)
VALUES
  (1, 42.00),
  (1, 15.50),
  (2, 9.99);

ANALYZE "User";
ANALYZE "Order";
`;

export const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.introductionToJoinDatabaseInit,
  name: "Introduction to JOIN database",
  description: "Creates User and Order, with Order referencing User by id.",
  query: `${migration}\n${seed}`,
};

export const database_inits = [databaseInit] as const;

export const examples: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.introductionToJoinWithoutJoin,
    name: "Order rows alone",
    description: "Order only carries user_id — no name, no email.",
    database_init: databaseInit,
    query: `
SELECT * FROM "Order";
`,
  },
  {
    id: SQL_EXAMPLE_IDS.introductionToJoinWithJoin,
    name: "Combine with JOIN",
    description:
      "JOIN matches Order.user_id to User.id, pulling both tables into one result.",
    database_init: databaseInit,
    query: `
SELECT "Order".id, "User".name, "Order".amount
FROM "Order"
JOIN "User" ON "User".id = "Order".user_id
ORDER BY "Order".id;
`,
  },
];

export const exercises: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.introductionToJoinExerciseOrderEmails,
    name: "Exercise 1",
    description: "List each order's amount with the user's email, ordered by order id.",
    database_init: databaseInit,
    query: `
SELECT "Order".id, "User".email, "Order".amount
FROM "Order"
JOIN "User" ON "User".id = "Order".user_id
ORDER BY "Order".id;
`,
  },
];
