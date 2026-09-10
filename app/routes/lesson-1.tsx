import type { Route } from "./+types/lesson-1";
import {
  databaseInit as exampleOneDatabaseInit,
  exercises as exampleOneExercises,
  insertUser as exampleOneInsertQuery,
  migration as exampleOneMigration,
  seed as exampleOneSeed,
  selectAll as exampleOneQuery,
  selectByEmail as exampleOneSpecificQuery,
} from "../../cli_examples/example1.sql";
import {
  LessonPage,
  LessonSection,
  Paragraph,
  Paragraphs,
  Section,
  Title2,
} from "../sql/lesson-layout";
import { CodeViewer } from "../sql/sql-editor";
import { SqlPlan, SqlResult, useLessonSqlExample } from "../sql/use-lesson-sql-example";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "pgquest | Lesson 1" },
    { name: "description", content: "Run a basic PGlite SQL lesson." },
  ];
}

export default function LessonOne() {
  const sqlLoad = exampleOneDatabaseInit.query;
  const exampleOne = useLessonSqlExample({ query: exampleOneQuery, sqlLoad });
  const exampleOneSpecific = useLessonSqlExample({
    query: exampleOneSpecificQuery,
    sqlLoad,
  });
  const exampleOneInsert = useLessonSqlExample({
    query: exampleOneInsertQuery,
    sqlLoad,
  });

  return (
    <LessonPage
      activeLesson="lesson1"
      defaultQuery={exampleOneInsertQuery}
      exercises={exampleOneExercises}
      sqlLoad={sqlLoad}
      title="My first query"
      whatWeLearned={[
        {
          concept: "SQL command / statement",
          url: "https://www.postgresql.org/docs/current/sql-commands.html",
          description: (
            <>
              <strong>Migration, seed, and query are just conventions.</strong> They are
              labels we use to organize SQL statements by purpose. PostgreSQL receives SQL
              statements; it does not receive a special migration, seed, or query object.
              <br />A <strong>migration</strong> is a versioned set of statements that
              changes the database structure or data. <br />A <strong>seed</strong> is a
              set of statements that populates predefined data, usually after the required
              tables exist. <br />A <strong>query</strong> is a statement we run to read
              or change data, often a SELECT statement. These labels describe when and why
              the statements run, not different kinds of SQL.
            </>
          ),
        },
        {
          concept: "CREATE TABLE",
          url: "https://www.postgresql.org/docs/current/sql-createtable.html",
          description: <>Defines a new table and its columns and constraints.</>,
        },
        {
          concept: "ANALYZE",
          url: "https://www.postgresql.org/docs/current/sql-analyze.html",
          description: (
            <>Collects table statistics that PostgreSQL uses when planning queries.</>
          ),
        },
        {
          concept: "INSERT",
          url: "https://www.postgresql.org/docs/current/sql-insert.html",
          description: (
            <>
              Adds new rows to an existing table, whether as seed data or application
              data.
            </>
          ),
        },
        {
          concept: "SELECT",
          url: "https://www.postgresql.org/docs/current/sql-select.html",
          description: <>Reads rows from one or more tables.</>,
        },
        {
          concept: "EXPLAIN",
          url: "https://www.postgresql.org/docs/current/sql-explain.html",
          description: (
            <>Shows the execution plan PostgreSQL expects to use for a query.</>
          ),
        },
        {
          concept: "Planner cost units",
          url: "https://www.postgresql.org/docs/current/runtime-config-query.html#RUNTIME-CONFIG-QUERY-CONSTANTS",
          description: (
            <>
              The cost values in an EXPLAIN plan are internal planner units, not
              milliseconds.
            </>
          ),
        },
        {
          concept: "WHERE",
          url: "https://www.postgresql.org/docs/current/queries-table-expressions.html#QUERIES-WHERE",
          description: <>Filters rows so only records matching a condition remain.</>,
        },
        {
          concept: "RETURNING",
          url: "https://www.postgresql.org/docs/current/dml-returning.html",
          description: <>Returns rows affected by INSERT, UPDATE, or DELETE.</>,
        },
      ]}
    >
      <Paragraphs>
        <p>
          In SQL, you cannot start by writing users: the database needs a table schema
          first.
        </p>
        <p>
          We create the schema with a migration, add example rows with a seed, then run a
          query.
        </p>
      </Paragraphs>

      <Section>
        <Title2>Migration</Title2>
        <Paragraph>
          A migration defines the table schema before the application uses the database.
          It is SQL usually run during deployment or setup; CREATE TABLE creates the
          table.
        </Paragraph>
        <CodeViewer code={exampleOneMigration} />
      </Section>

      <Section>
        <Title2>Seed</Title2>
        <Paragraph>
          A seed inserts initial or example data after the schema exists. It is also SQL,
          but it runs after migrations so there is a table to insert into.
        </Paragraph>
        <CodeViewer code={exampleOneSeed} />
      </Section>

      <Section>
        <Title2>Query</Title2>
        <Paragraph>
          Once the table and rows exist, this SELECT reads every user back without a
          filter.
        </Paragraph>
        <CodeViewer code={exampleOneQuery} />
      </Section>

      <SqlResult execution={exampleOne} />

      <Section>
        <Title2>Explanation</Title2>
        <Paragraph>
          Add <code className="font-mono text-sm">EXPLAIN</code> before a query to ask
          PostgreSQL how it plans to run it. Plain{" "}
          <code className="font-mono text-sm">EXPLAIN</code> does not execute the query;
          it only builds the plan.{" "}
          <code className="font-mono text-sm">EXPLAIN ANALYZE</code> is the version that
          actually runs the query and reports real timings.
        </Paragraph>
        <CodeViewer code={"EXPLAIN " + exampleOneQuery.trim()} />
        <SqlPlan execution={exampleOne} />
        <div className="mt-3 text-base leading-7 text-zinc-700">
          <p>Read the plan from left to right:</p>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>
              <code className="font-mono text-sm">Seq Scan</code> means sequential scan:
              PostgreSQL plans to read the table from beginning to end.
            </li>
            <li>
              <code className="font-mono text-sm">on "User"</code> names the table being
              scanned.
            </li>
            <li>
              <code className="font-mono text-sm">0.00</code> is the startup cost,{" "}
              <code className="font-mono text-sm">1.02</code> is the total cost. These
              numbers are internal planner units, not milliseconds.
            </li>
            <li>
              <code className="font-mono text-sm">rows=2</code> is PostgreSQL's estimated
              number of rows this step will return.
            </li>
            <li>
              <code className="font-mono text-sm">width=34</code> is the estimated average
              row size in bytes.
            </li>
          </ul>
        </div>
      </Section>

      

      <LessonSection>
        <Title2>Postgres Terminology</Title2>
        <Paragraphs>
          <p>
            In the PostgreSQL documentation, you might not find much use of terms such as
            <code className="mx-1 font-mono text-sm">seed</code> and
            <code className="mx-1 font-mono text-sm">migration</code>. These are mostly
            conventions introduced by application frameworks and database tooling rather
            than fundamental PostgreSQL concepts. The term
            <code className="mx-1 font-mono text-sm">query</code>, on the other hand, is
            used extensively by PostgreSQL.
          </p>
          <p>
            PostgreSQL and SQL have strong foundations in the relational model. One of its
            key concepts is a{" "}
            <a
              className="text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900"
              href="https://en.wikipedia.org/wiki/Relation_(database)"
              rel="noreferrer"
              target="_blank"
            >
              relation
            </a>
            , together with SQL statements that operate on data.
          </p>
          <p>
            As a developer, you can roughly think of a SQL statement as a small program
            expressed as text and sent to PostgreSQL for parsing, planning, and execution.
            This is somewhat analogous to passing JavaScript source code to
            <code className="mx-1 font-mono text-sm">eval()</code> or
            <code className="mx-1 font-mono text-sm">node -e</code>. SQL is declarative,
            though: you generally describe the result or change you want rather than the
            exact sequence of operations used to produce it.
          </p>
          <p>
            You can roughly think of a relation as the mathematical concept underlying a
            table or query result. A relation consists of tuples, which roughly correspond
            to rows in SQL.
          </p>
        </Paragraphs>

        <Section>
          <Title2>Reading a relation</Title2>
          <Paragraph>
            This statement produces a result containing rows from the
            <code className="mx-1 font-mono text-sm">"User"</code> table:
          </Paragraph>
          <CodeViewer code={exampleOneQuery} />
        </Section>

        <Section>
          <Title2>Changing a relation</Title2>
          <Paragraph>
            This statement changes the stored
            <code className="mx-1 font-mono text-sm">"User"</code> table by adding a row.
            <code className="mx-1 font-mono text-sm">RETURNING</code> additionally
            produces a result containing the inserted row:
          </Paragraph>
          <CodeViewer code={exampleOneInsertQuery} />
        </Section>

        <Section>
          <Paragraph>
            Conceptually, you might imagine the table state before and after the
            <code className="mx-1 font-mono text-sm">INSERT</code>:
          </Paragraph>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <pre className="overflow-auto rounded-md bg-[#22251f] px-5 py-4 font-mono text-sm leading-6 text-zinc-100">
              <code>{`Before:
"User" = {
  (1, "Ada Lovelace", "ada@example.com"),
  (2, "Grace Hopper", "grace@example.com")
}`}</code>
            </pre>
            <pre className="overflow-auto rounded-md bg-[#22251f] px-5 py-4 font-mono text-sm leading-6 text-zinc-100">
              <code>{`After:
"User" = {
  (1, "Ada Lovelace", "ada@example.com"),
  (2, "Grace Hopper", "grace@example.com"),
  (3, "Linus Torvalds", "linus@example.com")
}`}</code>
            </pre>
          </div>
          <Paragraphs>
            <p>
              This is a useful mathematical mental model, but PostgreSQL does not
              literally construct and store an entirely new table every time an
              <code className="mx-1 font-mono text-sm">INSERT</code> occurs. PostgreSQL
              has its own physical storage and MVCC mechanisms for implementing these
              changes.
            </p>
          </Paragraphs>
        </Section>
      </LessonSection>

      <LessonSection>
        <div>
          <Title2>Let's select a specific user by email</Title2>
          <Paragraphs>
            <p>
              Instead of reading every user, we can filter the table by a known email.
            </p>
            <p>The result contains only Ada Lovelace's row.</p>
          </Paragraphs>
        </div>
        <Section>
          <Title2>Query</Title2>
          <Paragraph>
            This SELECT looks for one user whose email matches the value in the WHERE
            clause.
          </Paragraph>
          <CodeViewer code={exampleOneSpecificQuery} />
        </Section>
        <SqlResult execution={exampleOneSpecific} />
        <Section>
          <Title2>Explanation</Title2>
          <CodeViewer code={"EXPLAIN " + exampleOneSpecificQuery.trim()} />
          <div className="mt-3 text-base leading-7 text-zinc-700">
            <p>Compared to the first plan, two things changed:</p>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>
                PostgreSQL still uses a{" "}
                <code className="font-mono text-sm">Seq Scan</code>, so it still reads the
                whole table from beginning to end.
              </li>
              <li>
                The plan now has a <code className="font-mono text-sm">Filter</code> step
                for the <code className="font-mono text-sm">WHERE email = ...</code>{" "}
                condition, so rows that do not match Ada's email are discarded after they
                are read.
              </li>
            </ul>
          </div>
          <SqlPlan execution={exampleOneSpecific} />
        </Section>
      </LessonSection>

      <LessonSection>
        <div>
          <Title2>Insert a new user</Title2>
          <Paragraphs>
            <p>
              Tables are not only for reading data. You can also insert new rows into
              them.
            </p>
            <p>
              <code className="font-mono text-sm">INSERT</code> adds a new row to a table
              that already exists.
            </p>
            <p>
              <code className="font-mono text-sm">RETURNING</code> sends the inserted row
              back as the query result.
            </p>
          </Paragraphs>
        </div>
        <Section>
          <Title2>Query</Title2>
          <Paragraph>
            This INSERT creates a new user and returns the row PostgreSQL added.
          </Paragraph>
          <CodeViewer code={exampleOneInsertQuery} />
        </Section>
        <SqlResult execution={exampleOneInsert} />
        <Section>
          <Title2>Explanation</Title2>
          <CodeViewer code={"EXPLAIN " + exampleOneInsertQuery.trim()} />
          <div className="mt-3 text-base leading-7 text-zinc-700">
            <p>
              The plan starts with{" "}
              <code className="font-mono text-sm">Insert on "User"</code> because
              PostgreSQL is writing into the{" "}
              <code className="font-mono text-sm">"User"</code> table.
            </p>
            <p>
              The <code className="font-mono text-sm">Result</code> step creates the
              single row from the literal values in the query; PostgreSQL does not need to
              scan another table first.
            </p>
          </div>
          <SqlPlan execution={exampleOneInsert} />
        </Section>
      </LessonSection>
    </LessonPage>
  );
}
