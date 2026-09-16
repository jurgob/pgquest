import { Link } from "react-router";
import {
  crossSchemaJoinQuery,
  databaseInit,
  exercises,
  informationSchemaOverviewQuery,
  inspectColumnsQuery,
  listSchemasQuery,
  listTablesQuery,
  migration,
  primaryKeyViaInformationSchemaQuery,
  primaryKeyViaPgConstraintQuery,
  primaryKeyViaPgIndexQuery,
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
import { SqlCodeViewer } from "../sql/sql-editor";
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
  const informationSchemaOverview = useLessonSqlExample({
    query: informationSchemaOverviewQuery,
    sqlLoad: databaseInit.query,
  });
  const primaryKeyViaInformationSchema = useLessonSqlExample({
    query: primaryKeyViaInformationSchemaQuery,
    sqlLoad: databaseInit.query,
  });
  const primaryKeyViaPgConstraint = useLessonSqlExample({
    query: primaryKeyViaPgConstraintQuery,
    sqlLoad: databaseInit.query,
  });
  const primaryKeyViaPgIndex = useLessonSqlExample({
    query: primaryKeyViaPgIndexQuery,
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
        {
          concept: "PRIMARY KEY",
          description:
            "identifies the column(s) that uniquely and non-null identify each row.",
          url: "https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-PRIMARY-KEYS",
        },
        {
          concept: "Sequence",
          description:
            "is its own database object that generates an ordered series of unique numbers, independent of any table.",
          url: "https://www.postgresql.org/docs/current/sql-createsequence.html",
        },
        {
          concept: "SERIAL",
          description:
            "is shorthand for an integer column backed by a sequence-generated default. It isn't a real type of its own.",
          url: "https://www.postgresql.org/docs/current/datatype-numeric.html#DATATYPE-SERIAL",
        },
        {
          concept: "nextval",
          description:
            "advances a sequence and returns its next value. It's what a SERIAL column's default calls.",
          url: "https://www.postgresql.org/docs/current/functions-sequence.html",
        },
        {
          concept: "column_default",
          description:
            "is the information_schema.columns field holding a column's literal default expression, such as a SERIAL column's nextval(...) call.",
          url: "https://www.postgresql.org/docs/current/infoschema-columns.html",
        },
        {
          concept: "regclass",
          description:
            "is an OID alias type: a reference to a table, sequence, or other relation by identity rather than by name, displayed as whatever name currently resolves to it.",
          url: "https://www.postgresql.org/docs/current/datatype-oid.html",
        },
        {
          concept: "pg_index",
          description:
            "is the Postgres catalog behind every index, including the unique index that backs a primary key.",
          url: "https://www.postgresql.org/docs/current/catalog-pg-index.html",
        },
        {
          concept: "pg_constraint",
          description:
            "is the Postgres catalog that information_schema's constraint views are built from.",
          url: "https://www.postgresql.org/docs/current/catalog-pg-constraint.html",
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
          <SqlCodeViewer code={listSchemasQuery} />
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
          <SqlCodeViewer code={migration} />
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
          <SqlCodeViewer code={listSchemasQuery} />
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
          <SqlCodeViewer code={searchPathQuery} databaseInitId={databaseInit.id} />
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
          <SqlCodeViewer code={crossSchemaJoinQuery} databaseInitId={databaseInit.id} />
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
          <SqlCodeViewer code={listTablesQuery} databaseInitId={databaseInit.id} />
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
          <SqlCodeViewer code={inspectColumnsQuery} databaseInitId={databaseInit.id} />
        </div>
        <div className="mt-4">
          <SqlResult execution={inspectColumns} />
        </div>
      </LessonSection>

      <LessonSection>
        <Title2>Putting it together</Title2>
        <Paragraph>
          You don&apos;t need to read the migration to know the shape of these tables.
          Joining <InlineCode>information_schema.tables</InlineCode> and{" "}
          <InlineCode>information_schema.columns</InlineCode> reconstructs every column,
          type, and nullability across both schemas, straight from what Postgres itself
          tracks.
        </Paragraph>
        <Paragraph>
          Watch the <InlineCode>column_default</InlineCode> column below: it holds the
          literal default expression Postgres runs whenever a column is left out of an{" "}
          <InlineCode>INSERT</InlineCode>. For an <InlineCode>id</InlineCode> column
          it&apos;ll read something like{" "}
          <InlineCode>nextval(&apos;lending.loans_id_seq&apos;::regclass)</InlineCode> —
          that&apos;s what <InlineCode>SERIAL</InlineCode> actually is. Declaring a column{" "}
          <InlineCode>SERIAL</InlineCode> silently creates a{" "}
          <a
            className="text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900"
            href="https://www.postgresql.org/docs/current/sql-createsequence.html"
            rel="noreferrer"
            target="_blank"
          >
            sequence
          </a>{" "}
          (a sequence is just a{" "}
          <Link
            className="text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900"
            to="/lessons/my-first-query#everything-is-a-relation"
          >
            relation
          </Link>
          ) named <InlineCode>table_column_seq</InlineCode> by convention (here,{" "}
          <InlineCode>lending.loans_id_seq</InlineCode>) and points the column&apos;s
          default at <InlineCode>nextval()</InlineCode> on it. The{" "}
          <InlineCode>::regclass</InlineCode> cast is there because{" "}
          <InlineCode>nextval()</InlineCode> takes a regclass argument — a reference to
          the sequence by object identity (its OID), not by a plain text name — so the
          default keeps working even if the sequence or its schema gets renamed; Postgres
          just prints it back as whatever name currently resolves to that OID.
        </Paragraph>
        <Paragraph>
          One thing is still missing: <InlineCode>information_schema.columns</InlineCode>{" "}
          doesn&apos;t say which column is the primary key. Here are three ways to get
          that.
        </Paragraph>
        <div className="mt-4">
          <SqlCodeViewer
            code={informationSchemaOverviewQuery}
            databaseInitId={databaseInit.id}
          />
        </div>
        <div className="mt-4">
          <SqlResult execution={informationSchemaOverview} />
        </div>
      </LessonSection>

      <LessonSection>
        <Title2>Finding primary keys: information_schema</Title2>
        <Paragraph>
          The portable, ANSI-SQL-standard way — works the same on any SQL database, not
          just Postgres.
        </Paragraph>
        <div className="mt-4">
          <SqlCodeViewer
            code={primaryKeyViaInformationSchemaQuery}
            databaseInitId={databaseInit.id}
          />
        </div>
        <div className="mt-4">
          <SqlResult execution={primaryKeyViaInformationSchema} />
        </div>
      </LessonSection>

      <LessonSection>
        <Title2>Finding primary keys: pg_constraint</Title2>
        <Paragraph>
          Postgres&apos; own catalog, the one <InlineCode>information_schema</InlineCode>{" "}
          is built on top of. Not portable, but simpler and faster.
        </Paragraph>
        <div className="mt-4">
          <SqlCodeViewer
            code={primaryKeyViaPgConstraintQuery}
            databaseInitId={databaseInit.id}
          />
        </div>
        <div className="mt-4">
          <SqlResult execution={primaryKeyViaPgConstraint} />
        </div>
      </LessonSection>

      <LessonSection>
        <Title2>Finding primary keys: pg_index</Title2>
        <Paragraph>
          A primary key is always backed by a unique index, so you can find it there too —
          useful when you care about the index itself.
        </Paragraph>
        <div className="mt-4">
          <SqlCodeViewer
            code={primaryKeyViaPgIndexQuery}
            databaseInitId={databaseInit.id}
          />
        </div>
        <div className="mt-4">
          <SqlResult execution={primaryKeyViaPgIndex} />
        </div>
      </LessonSection>
    </LessonPage>
  );
}
