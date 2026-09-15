import { SQL_EXAMPLE_IDS, type SqlExample } from "./types";

const migration = `
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents > 0)
);
`;

const seed = `
INSERT INTO products (sku, name, price_cents)
VALUES
  ('BOOK-001', 'SQL Pocket Guide', 2500),
  ('MUG-001', 'PgQuest Mug', 1800);
`;

export const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.constraintsDatabaseInit,
  name: "Lesson 4 database",
  description: "Creates products with basic constraints.",
  query: `${migration}\n${seed}`,
};

export const database_inits = [databaseInit] as const;

export const examples: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.constraintsInsertValidProduct,
    name: "Insert valid data",
    description: "The row passes NOT NULL, UNIQUE, PRIMARY KEY, and CHECK constraints.",
    database_init: databaseInit,
    query: `
INSERT INTO products (sku, name, price_cents)
VALUES ('TEE-001', 'PgQuest T-shirt', 3200)
RETURNING *;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.constraintsListConstraints,
    name: "Inspect constraints",
    description: "PostgreSQL stores constraints in system catalogs that you can query.",
    database_init: databaseInit,
    query: `
SELECT conname, contype
FROM pg_constraint
WHERE conrelid = 'products'::regclass
ORDER BY conname;
`,
  },
];

export const exercises: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.constraintsExerciseInsertProduct,
    name: "Exercise 1",
    description:
      "Insert a product with sku BAG-001, name PgQuest Tote, price 4200, and return it.",
    database_init: databaseInit,
    query: `
INSERT INTO products (sku, name, price_cents)
VALUES ('BAG-001', 'PgQuest Tote', 4200)
RETURNING *;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.constraintsExerciseFindConstraints,
    name: "Exercise 2",
    description: "List the constraint names for the products table ordered by name.",
    database_init: databaseInit,
    query: `
SELECT conname
FROM pg_constraint
WHERE conrelid = 'products'::regclass
ORDER BY conname;
`,
  },
];
