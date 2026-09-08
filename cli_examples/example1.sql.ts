export const migration = `
CREATE TABLE "User" (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL
);
`;

export const seed = `
INSERT INTO "User" (name, email)
VALUES
  ('Ada Lovelace', 'ada@example.com'),
  ('Grace Hopper', 'grace@example.com');

-- Collect table statistics so EXPLAIN can estimate this tiny table accurately.
ANALYZE "User";
`;

export default `
SELECT * FROM "User";
`;
