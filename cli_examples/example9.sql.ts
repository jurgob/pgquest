import {
  SQL_EXAMPLE_IDS,
  sqlExampleDescription,
  sqlExampleTitle,
  sqlStatement,
  type SqlExample,
} from "./types";

const migration = sqlStatement(`
CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  team_id INTEGER NOT NULL REFERENCES teams (id),
  name TEXT NOT NULL
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE project_members (
  project_id INTEGER NOT NULL REFERENCES projects (id),
  user_id INTEGER NOT NULL REFERENCES users (id),
  PRIMARY KEY (project_id, user_id)
);

CREATE INDEX projects_team_id_idx ON projects (team_id);
CREATE INDEX project_members_user_id_idx ON project_members (user_id);
`);

const seed = sqlStatement(`
INSERT INTO teams (name) VALUES ('Core'), ('Data');
INSERT INTO projects (team_id, name) VALUES (1, 'PgQuest'), (1, 'Website'), (2, 'Warehouse');
INSERT INTO users (name) VALUES ('Ada'), ('Grace'), ('Linus');
INSERT INTO project_members (project_id, user_id) VALUES (1, 1), (1, 2), (3, 2), (3, 3);
`);

export const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.example9DatabaseInit,
  name: sqlExampleTitle("Lesson 9 database"),
  description: sqlExampleDescription("Creates teams, projects, users, and memberships."),
  query: sqlStatement(`${migration}\n${seed}`),
};

export const database_inits = [databaseInit] as const;

export const examples: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.example9OneToMany,
    name: sqlExampleTitle("One-to-many"),
    description: sqlExampleDescription(
      "One team can own many projects through projects.team_id.",
    ),
    database_init: databaseInit,
    query: sqlStatement(`
SELECT teams.name AS team, projects.name AS project
FROM teams
JOIN projects ON projects.team_id = teams.id
ORDER BY team, project;
`),
  },
  {
    id: SQL_EXAMPLE_IDS.example9ManyToMany,
    name: sqlExampleTitle("Many-to-many"),
    description: sqlExampleDescription(
      "A join table connects projects and users when both sides can have many matches.",
    ),
    database_init: databaseInit,
    query: sqlStatement(`
SELECT projects.name AS project, users.name AS member
FROM project_members
JOIN projects ON projects.id = project_members.project_id
JOIN users ON users.id = project_members.user_id
ORDER BY project, member;
`),
  },
  {
    id: SQL_EXAMPLE_IDS.example9ForeignKeyIndexes,
    name: sqlExampleTitle("Indexes on relationships"),
    description: sqlExampleDescription(
      "Foreign-key columns are often indexed because joins and lookups use them.",
    ),
    database_init: databaseInit,
    query: sqlStatement(`
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY indexname;
`),
  },
];

export const exercises: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.example9ExerciseProjectMembers,
    name: sqlExampleTitle("Exercise 1"),
    description: sqlExampleDescription("Select all members of the Warehouse project."),
    database_init: databaseInit,
    query: sqlStatement(`
SELECT users.name
FROM project_members
JOIN projects ON projects.id = project_members.project_id
JOIN users ON users.id = project_members.user_id
WHERE projects.name = 'Warehouse'
ORDER BY users.name;
`),
  },
  {
    id: SQL_EXAMPLE_IDS.example9ExerciseMemberCount,
    name: sqlExampleTitle("Exercise 2"),
    description: sqlExampleDescription("Count members for each project."),
    database_init: databaseInit,
    query: sqlStatement(`
SELECT projects.name, COUNT(project_members.user_id) AS members
FROM projects
LEFT JOIN project_members ON project_members.project_id = projects.id
GROUP BY projects.name
ORDER BY projects.name;
`),
  },
];
