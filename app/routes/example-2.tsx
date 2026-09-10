import type { Route } from "./+types/example-2";
import exampleTwoQuery, {
  migration as exampleTwoMigration,
  seed as exampleTwoSeed,
} from "../../cli_examples/example2a.sql";
import exampleTwoIndexedQuery, {
  migration as exampleTwoIndexedMigration,
  seed as exampleTwoIndexedSeed,
} from "../../cli_examples/example2b.sql";
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
    { title: "pgquest | Lesson 2" },
    { name: "description", content: "Compare a query plan with and without an index." },
  ];
}

export default function ExampleTwo() {
  const sequentialLoad = `${exampleTwoMigration}\n${exampleTwoSeed}`;
  const indexedLoad = `${exampleTwoIndexedMigration}\n${exampleTwoIndexedSeed}`;
  const sequential = useSqlExecution({ query: exampleTwoQuery, sqlLoad: sequentialLoad });
  const indexed = useSqlExecution({
    query: exampleTwoIndexedQuery,
    sqlLoad: indexedLoad,
  });

  return (
    <LessonPage
      activeLesson="lesson2"
      defaultQuery={exampleTwoIndexedQuery}
      sqlLoad={indexedLoad}
      title="Email lookup without an index"
    >
      <Paragraphs>
        <p>Look up one email in a larger users table without a supporting index.</p>
        <p>The query works, but the planner has to scan the table.</p>
      </Paragraphs>

      <Section>
        <Title2>Migration</Title2>
        <Paragraph>Create a users table without an index on email.</Paragraph>
        <CodeViewer code={exampleTwoMigration} />
      </Section>

      <Section>
        <Title2>Seed</Title2>
        <Paragraph>
          Insert enough rows and analyze the table so the planner has statistics.
        </Paragraph>
        <CodeViewer code={exampleTwoSeed} />
      </Section>

      <Section>
        <Title2>Query</Title2>
        <Paragraph>
          Find one user by email and inspect the plan PostgreSQL chooses.
        </Paragraph>
        <CodeViewer code={exampleTwoQuery} />
      </Section>

      <sequential.SQLResult />
      <sequential.SQLResultExplain>
        <div className="mt-3 text-base leading-7 text-zinc-700">
          <p>
            Without an index on <code className="font-mono text-sm">email</code>,
            PostgreSQL has no shortcut for finding one address. It chooses a{" "}
            <code className="font-mono text-sm">Seq Scan</code>, reads the{" "}
            <code className="font-mono text-sm">users</code> table row by row, and applies
            the <code className="font-mono text-sm">Filter</code> to keep only the
            matching email.
          </p>
        </div>
      </sequential.SQLResultExplain>

      <LessonSection>
        <div>
          <Title2>Email lookup with an index</Title2>
          <Paragraphs>
            <p>Run the same email lookup after adding an index on users.email.</p>
            <p>The plan should switch to users_email_idx.</p>
          </Paragraphs>
        </div>

        <Section>
          <Title2>Migration</Title2>
          <Paragraph>
            Create the same table, then add an index on the email column.
          </Paragraph>
          <CodeViewer code={exampleTwoIndexedMigration} />
        </Section>

        <Section>
          <Title2>Seed</Title2>
          <Paragraph>
            Use the same data, then analyze it so the index can be considered.
          </Paragraph>
          <CodeViewer code={exampleTwoIndexedSeed} />
        </Section>

        <Section>
          <Title2>Query</Title2>
          <Paragraph>Run the same email lookup and compare the plan.</Paragraph>
          <CodeViewer code={exampleTwoIndexedQuery} />
        </Section>

        <indexed.SQLResult />
        <indexed.SQLResultExplain>
          <div className="mt-3 text-base leading-7 text-zinc-700">
            <p>Compared to the first plan, PostgreSQL now has a better access path:</p>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>
                <code className="font-mono text-sm">
                  Index Scan using users_email_idx
                </code>{" "}
                means PostgreSQL uses the email index instead of scanning every row.
              </li>
              <li>
                <code className="font-mono text-sm">Index Cond</code> shows the condition
                used to jump through the index:{" "}
                <code className="font-mono text-sm">email = 'user9000@example.com'</code>.
              </li>
              <li>
                The total estimated cost drops from{" "}
                <code className="font-mono text-sm">218.00</code> to{" "}
                <code className="font-mono text-sm">8.30</code> because the planner
                expects the index lookup to touch far less data than a full table scan.
              </li>
            </ul>
          </div>
        </indexed.SQLResultExplain>
      </LessonSection>
    </LessonPage>
  );
}
