import {
  crossSchemaJoinQuery,
  databaseInit,
  exercises,
  inspectColumnsQuery,
  listSchemasQuery,
  listTablesQuery,
  migration,
  searchPathQuery,
} from "../../cli_examples/schemas-tables-and-types.sql";
import {
  InlineCode,
  LessonPage,
  LessonSection,
  Paragraph,
  Paragraphs,
  Section,
  Title2,
} from "../sql/lesson-layout";
import { CodeViewer } from "../sql/sql-editor";
import { SqlResult, useLessonSqlExample } from "../sql/use-lesson-sql-example";

export default function Lesson2() {
  const listSchemasEmpty = useLessonSqlExample({ query: listSchemasQuery, sqlLoad: "" });
  const listSchemasAfterMigration = useLessonSqlExample({
    query: listSchemasQuery,
    sqlLoad: `${migration}\n${migration}`,
  });
  const searchPath = useLessonSqlExample({
    query: searchPathQuery,
    sqlLoad: databaseInit.query,
  });
  const crossSchemaJoin = useLessonSqlExample({
    query: crossSchemaJoinQuery,
    sqlLoad: databaseInit.query,
  });
  const listTables = useLessonSqlExample({
    query: listTablesQuery,
    sqlLoad: databaseInit.query,
  });
  const inspectColumns = useLessonSqlExample({
    query: inspectColumnsQuery,
    sqlLoad: databaseInit.query,
  });

  return (
    <LessonPage
      activeLesson="schemas-tables-and-types"
      defaultQuery={exercises[0]?.query}
      exercises={exercises}
      preloadId={databaseInit.id}
      sqlLoad={databaseInit.query}
      title="Schemas, tables, and types"
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
        {
          concept: "search_path",
          description:
            "controls which schema Postgres searches first for unqualified names. SET search_path changes it for the session.",
          url: "https://www.postgresql.org/docs/current/ddl-schemas.html#DDL-SCHEMAS-PATH",
        },
      ]}
    >
      <Paragraphs>
        <p>
          A PostgreSQL server can contain multiple databases. Inside one database, schemas
          group tables and information_schema lets you inspect the shape of what exists.
          Being able to introspect a database this way is useful in real life, when you
          join a project and need to learn its schema, and in the next lesson, where we
          build on these tables.
        </p>
      </Paragraphs>

      <Section>
        <Title2>List schemas (empty database)</Title2>
        <Paragraph>
          A schema groups database objects such as tables inside one database. Given a
          fresh Postgres database <strong>where no migration has run yet</strong>,
          information_schema lets you discover what schemas already exist.
        </Paragraph>
        <div className="mt-4">
          <CodeViewer code={listSchemasQuery} />
        </div>
        <div className="mt-4">
          <SqlResult execution={listSchemasEmpty} />
        </div>
        <Paragraph>
          Every fresh Postgres database starts with exactly these 2 schemas:{" "}
          <InlineCode>public</InlineCode>, the default schema new tables land in when you
          don&apos;t name one, and <InlineCode>information_schema</InlineCode>, the
          standard views you just queried to list schemas.
        </Paragraph>
      </Section>

      <LessonSection>
        <Title2>Create the schemas (migration)</Title2>
        <Paragraph>
          With <InlineCode>CREATE SCHEMA</InlineCode> we can pick a name other than the
          default public for a schema. Most of the time, a service&apos;s migrations only
          need one schema, but as this example shows, it&apos;s possible to create more
          than one. Then we can prefix table names with the schema name, like{" "}
          <InlineCode>schema_name.table_name</InlineCode>, to say which schema we mean.
        </Paragraph>
        <div className="mt-4">
          <CodeViewer code={migration} />
        </div>
        <Paragraph>
          <InlineCode>IF NOT EXISTS</InlineCode> makes this migration idempotent: running
          it again is a no-op instead of an error, so it&apos;s safe to apply it over and
          over.
        </Paragraph>
      </LessonSection>

      <LessonSection>
        <Title2>List schemas (after migration)</Title2>
        <Paragraph>
          The migration above was just applied twice in a row before this query ran, and
          nothing broke. Same query as before, now against a migrated database.
        </Paragraph>
        <div className="mt-4">
          <CodeViewer code={listSchemasQuery} />
        </div>
        <div className="mt-4">
          <SqlResult execution={listSchemasAfterMigration} />
        </div>
        <Paragraph>library and lending now show up alongside the two defaults.</Paragraph>
      </LessonSection>

      <LessonSection>
        <Title2>Setting the default schema</Title2>
        <Paragraph>
          Yes, you can change which schema unqualified names resolve to:{" "}
          <InlineCode>SET search_path</InlineCode> picks the search order. Here we point
          it at lending, so <InlineCode>loans</InlineCode> below means{" "}
          <InlineCode>lending.loans</InlineCode> without spelling it out.
        </Paragraph>
        <div className="mt-4">
          <CodeViewer code={searchPathQuery} />
        </div>
        <div className="mt-4">
          <SqlResult execution={searchPath} />
        </div>
        <Paragraph>
          <InlineCode>search_path</InlineCode> defaults to{" "}
          <InlineCode>&quot;$user&quot;, public</InlineCode>, which is why public is where
          unqualified names land until you change it. This only affects the current
          session&apos;s name lookup — <InlineCode>lending.loans</InlineCode> is still
          reachable however search_path is set.
        </Paragraph>
      </LessonSection>

      <LessonSection>
        <Title2>A cross-schema join</Title2>
        <Paragraph>
          Joining across schemas works exactly like joining tables in the same schema — a
          schema is a naming namespace, not a query boundary. This finds which book each
          loan is for.
        </Paragraph>
        <div className="mt-4">
          <CodeViewer code={crossSchemaJoinQuery} />
        </div>
        <div className="mt-4">
          <SqlResult execution={crossSchemaJoin} />
        </div>
        <Paragraph>
          This is easy because one migration owns both schemas here. If lending belonged
          to a separate service instead, this same join would tie your query to another
          team&apos;s internal tables.
        </Paragraph>
      </LessonSection>

      <LessonSection>
        <Title2>List tables</Title2>
        <Paragraph>
          information_schema.tables shows the tables visible in each schema.
        </Paragraph>
        <div className="mt-4">
          <CodeViewer code={listTablesQuery} />
        </div>
        <div className="mt-4">
          <SqlResult execution={listTables} />
        </div>
      </LessonSection>

      <LessonSection>
        <Title2>Inspect table shape</Title2>
        <Paragraph>
          information_schema.columns shows each column name, type, and nullability.
        </Paragraph>
        <div className="mt-4">
          <CodeViewer code={inspectColumnsQuery} />
        </div>
        <div className="mt-4">
          <SqlResult execution={inspectColumns} />
        </div>
      </LessonSection>
    </LessonPage>
  );
}
