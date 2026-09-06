export const migration = `
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  city TEXT NOT NULL
);
`;

export const seed = `
INSERT INTO users (name, email, city)
SELECT
  'User ' || value,
  'user' || value || '@example.com',
  CASE value % 4
    WHEN 0 THEN 'London'
    WHEN 1 THEN 'Paris'
    WHEN 2 THEN 'Berlin'
    ELSE 'Madrid'
  END
FROM generate_series(1, 10000) AS value;

ANALYZE users;
`;

export default `
SELECT id, name, email, city
FROM users
WHERE email = 'user9000@example.com';
`;
