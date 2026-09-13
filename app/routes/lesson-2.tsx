import { examples, exercises } from "../../cli_examples/example2.sql";
import { CourseLessonPage } from "../sql/course-lesson-page";

export default function Lesson2() {
  return (
    <CourseLessonPage
      examples={examples}
      exercises={exercises}
      intro={
        <p>
          A PostgreSQL server can contain multiple databases. Inside one database, schemas
          group tables and information_schema lets you inspect the shape of what exists.
        </p>
      }
      lessonId="lesson2"
      whatWeLearned={[
        {
          concept: "Database",
          description:
            "is a separate PostgreSQL collection of schemas, tables, data, and other objects.",
          url: "https://www.postgresql.org/docs/current/manage-ag-overview.html",
        },
        {
          concept: "Schema",
          description:
            "is a namespace inside a database. public is the default schema in a new database.",
          url: "https://www.postgresql.org/docs/current/ddl-schemas.html",
        },
        {
          concept: "information_schema",
          description:
            "contains portable metadata views for discovering schemas, tables, and columns.",
          url: "https://www.postgresql.org/docs/current/information-schema.html",
        },
        {
          concept: "schema.table",
          description:
            "is a schema-qualified table name. It removes ambiguity when tables live outside public.",
          url: "https://www.postgresql.org/docs/current/ddl-schemas.html#DDL-SCHEMAS-PATH",
        },
      ]}
    />
  );
}
