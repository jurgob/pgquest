import { migration, seed } from "./example1.sql";

export { migration, seed };

export default `
INSERT INTO "User" (name, email)
VALUES ('Linus Torvalds', 'linus@example.com')
RETURNING *;
`;
