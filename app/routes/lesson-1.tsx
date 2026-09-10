import type { Route } from "./+types/lesson-1";
import exampleOneQuery, {
  migration as exampleOneMigration,
  seed as exampleOneSeed,
} from "../../cli_examples/example1.sql";
import exampleOneSpecificQuery from "../../cli_examples/example1b.sql";
import exampleOneInsertQuery from "../../cli_examples/example1c.sql";
import {
  LessonPage,
  LessonSection,
  Paragraph,
  Paragraphs,
  Section,
  Title2,
} from "../sql/lesson-layout";
import { CodeViewer } from "../sql/sql-editor";
import { useSqlExecution } from "../sql/use-sql-execution";

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "pgquest | Lesson 1" },
    { name: "description", content: "Run a basic PGlite SQL lesson." },
  ];
}

export default function LessonOne() {
  const sqlLoad = `${exampleOneMigration}\n${exampleOneSeed}`;
  const exampleOne = useSqlExecution({ query: exampleOneQuery, sqlLoad });
  const exampleOneSpecific = useSqlExecution({
    query: exampleOneSpecificQuery,
    sqlLoad,
  });
  const exampleOneInsert = useSqlExecution({
    query: exampleOneInsertQuery,
    sqlLoad,
  });

  return (
    <LessonPage
      activeLesson="lesson1"
      defaultQuery={exampleOneInsertQuery}
      sqlLoad={sqlLoad}
      title="My first query"
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

      <exampleOne.SQLResult />
      <exampleOne.SQLResultExplain>
        <div className="mt-3 text-base leading-7 text-zinc-700">
          <p>
            Add <code className="font-mono text-sm">EXPLAIN</code> before a query to ask
            PostgreSQL how it plans to run it. Plain{" "}
            <code className="font-mono text-sm">EXPLAIN</code> does not execute the query;
            it only builds the plan.{" "}
            <code className="font-mono text-sm">EXPLAIN ANALYZE</code> is the version that
            actually runs the query and reports real timings.
          </p>
          <p className="mt-3">Read the plan from left to right:</p>
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
      </exampleOne.SQLResultExplain>

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
        <exampleOneSpecific.SQLResult />
        <exampleOneSpecific.SQLResultExplain>
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
        </exampleOneSpecific.SQLResultExplain>
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
        <exampleOneInsert.SQLResult />
        <exampleOneInsert.SQLResultExplain>
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
        </exampleOneInsert.SQLResultExplain>
      </LessonSection>
    </LessonPage>
  );
}
