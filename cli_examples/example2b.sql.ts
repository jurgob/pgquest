import baseQuery, { migration as baseMigration, seed } from "./example2a.sql";

export const migration = `
${baseMigration}

-- Add an index so PostgreSQL can find rows by email without scanning the whole table.
CREATE INDEX users_email_idx ON users (email);
`;

export { seed };

export default baseQuery;
