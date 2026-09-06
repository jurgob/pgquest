import baseQuery, { migration as baseMigration, seed } from "./example2a.sql";

export const migration = `
${baseMigration}

CREATE INDEX users_email_idx ON users (email);
`;

export { seed };

export default baseQuery;
