import { migration, seed } from "./example1.sql";

export { migration, seed };

export default `
SELECT * FROM "User"
WHERE email = 'ada@example.com';
`;
