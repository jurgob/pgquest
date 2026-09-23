import type { Route } from "./+types/introduction-to-indexes";
import {
  examples as exampleThreeExamples,
  exercises as exampleThreeExercises,
} from "../../cli_examples/introduction-to-indexes.sql";
import { getSqlExample, SQL_EXAMPLE_IDS } from "../../cli_examples/types";
import {
  InlineCode,
  LessonPage,
  Paragraph,
  Paragraphs,
  Section,
  Title2,
} from "../sql/lesson-layout";
import { SqlCodeViewer } from "../sql/sql-editor";
import { SqlPlan, SqlResult, useLessonSqlExample } from "../sql/use-lesson-sql-example";

const writeQuery = `
UPDATE users
SET email = 'renamed9000@example.com'
WHERE email = 'user9000@example.com';
`.trim();

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "pgquest | Lesson 3" },
    { name: "description", content: "Compare a query plan with and without an index." },
  ];
}

export default function ExampleThree() {
  const sequentialExample = getSqlExample(
    exampleThreeExamples,
    SQL_EXAMPLE_IDS.introductionToIndexesSequentialScan,
  );
  const indexedExample = getSqlExample(
    exampleThreeExamples,
    SQL_EXAMPLE_IDS.introductionToIndexesIndexScan,
  );
  const sequentialLoad = sequentialExample.database_init?.query ?? "";
  const indexedLoad = indexedExample.database_init?.query ?? "";
  const exampleThreeMigration = getSqlExample(
    exampleThreeExamples,
    SQL_EXAMPLE_IDS.introductionToIndexesMigration,
  ).query;
  const exampleThreeSeed = getSqlExample(
    exampleThreeExamples,
    SQL_EXAMPLE_IDS.introductionToIndexesSeed,
  ).query;
  const exampleThreeQuery = sequentialExample.query;
  const exampleThreeIndexedMigration = getSqlExample(
    exampleThreeExamples,
    SQL_EXAMPLE_IDS.introductionToIndexesIndexedMigration,
  ).query;
  const exampleThreeIndexedSeed = exampleThreeSeed;
  const exampleThreeIndexedQuery = indexedExample.query;
  const sequential = useLessonSqlExample({
    query: exampleThreeQuery,
    runExplain: true,
    sqlLoad: sequentialLoad,
  });
  const indexed = useLessonSqlExample({
    query: exampleThreeIndexedQuery,
    runExplain: true,
    sqlLoad: indexedLoad,
  });
  const sequentialWrite = useLessonSqlExample({
    query: writeQuery,
    runExplain: true,
    sqlLoad: sequentialLoad,
  });
  const indexedWrite = useLessonSqlExample({
    query: writeQuery,
    runExplain: true,
    sqlLoad: indexedLoad,
  });

  return (
    <LessonPage
      activeLesson="introduction-to-indexes"
      defaultQuery={exampleThreeIndexedQuery}
      exercises={exampleThreeExercises}
      preloadId={indexedExample.database_init?.id}
      sqlLoad={indexedLoad}
      title="An introduction to indexes"
      whatWeLearned={[
        {
          concept: "CREATE INDEX",
          description:
            "creates an index, which gives PostgreSQL another way to find matching rows without scanning the whole table.",
          url: "https://www.postgresql.org/docs/current/sql-createindex.html",
        },
        {
          concept: "CASE",
          description:
            "builds conditional values inside a SQL statement. In this lesson we use it while seeding rows into different cities.",
          url: "https://www.postgresql.org/docs/current/functions-conditional.html",
        },
      ]}
    >
      <Paragraphs>
        <p>
          Indexes are mainly used for performance reasons: they give PostgreSQL a faster
          path to rows that match a query.
        </p>
        <p>
          Let&apos;s pretend we have two versions of the same users dataset. They use the
          same seed data, but one migration creates an email index and the other does not.
        </p>
      </Paragraphs>

      <Section>
        <Title2 id="migration">Migration</Title2>
        <Paragraph>As you can see, the only difference is the index.</Paragraph>
        <div className="mt-4 flex flex-col gap-5">
          <div className="min-w-0">
            <h3 className="mb-2 font-mono text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Without Index
            </h3>
            <SqlCodeViewer code={exampleThreeMigration} />
          </div>
          <div className="min-w-0">
            <h3 className="mb-2 font-mono text-sm font-semibold uppercase tracking-wide text-zinc-500">
              With Index
            </h3>
            <SqlCodeViewer code={exampleThreeIndexedMigration} />
          </div>
        </div>
      </Section>

      <Section>
        <Title2 id="seed">Seed</Title2>
        <Paragraph>
          Both databases use the same seed data, then analyze the table so the planner has
          statistics.
        </Paragraph>
        <SqlCodeViewer code={exampleThreeIndexedSeed} />
      </Section>

      <Section>
        <Title2 id="query">Query</Title2>
        <Paragraph>This is the same email lookup query on both databases.</Paragraph>
        <SqlCodeViewer code={exampleThreeIndexedQuery} />
      </Section>

      <Section>
        <Title2 id="result">Result</Title2>
        <Paragraph>The query returns the same row either way.</Paragraph>
        <SqlResult execution={indexed} />
      </Section>

      <Section>
        <Title2 id="explain">Explain</Title2>
        <Paragraph>The result is the same, but the plan is different.</Paragraph>
        <SqlCodeViewer code={"EXPLAIN " + exampleThreeIndexedQuery.trim()} />
        <div className="mt-4 flex flex-col gap-5">
          <div className="min-w-0">
            <h3 className="mb-2 font-mono text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Without Index
            </h3>
            <SqlPlan execution={sequential} />
          </div>
          <div className="min-w-0">
            <h3 className="mb-2 font-mono text-sm font-semibold uppercase tracking-wide text-zinc-500">
              With Index
            </h3>
            <SqlPlan execution={indexed} />
          </div>
        </div>
        <div className="mt-3 text-base leading-7 text-zinc-700">
          <p>
            Without an index, PostgreSQL has to read through the users table and check
            each row until it finds the email. That is what{" "}
            <InlineCode>Seq Scan</InlineCode> means. With the index, PostgreSQL has a
            separate lookup structure ordered by email, so it can find{" "}
            <InlineCode>user9000@example.com</InlineCode> by searching that smaller
            structure first. That is the <InlineCode>Index Scan</InlineCode>.
          </p>
          <p className="mt-3">
            The estimated cost changes from{" "}
            <InlineCode className="border-rose-200 bg-rose-100 px-1.5 font-semibold text-rose-900">
              0.00..218.00
            </InlineCode>{" "}
            to{" "}
            <InlineCode className="border-emerald-200 bg-emerald-100 px-1.5 font-semibold text-emerald-900">
              0.29..8.30
            </InlineCode>
            . The startup cost is a little higher because PostgreSQL has to enter the
            index first, but the total cost is about{" "}
            <InlineCode className="border-sky-200 bg-sky-100 px-1.5 font-semibold text-sky-900">
              26x
            </InlineCode>{" "}
            lower because it expects to touch far fewer rows.
          </p>
          <p className="mt-3">
            The tradeoff is that the index is extra data PostgreSQL has to store and keep
            updated. Reads that filter by email get faster, but inserts, updates, and
            deletes can become a little slower because PostgreSQL must maintain the table
            and the index.
          </p>
          <p className="mt-3">
            <span className="font-semibold text-zinc-950">Note:</span> A primary key is a
            special case: PostgreSQL automatically creates a unique index for it. So we do
            not need to add another index on <InlineCode>id</InlineCode>. But the table
            itself is not stored in primary-key order; the index is the ordered lookup
            structure.
          </p>
          <div className="mt-6">
            <h3 className="text-xl font-bold text-zinc-950">Write Query</h3>
            <p className="mt-2">
              This update changes the indexed email value, so PostgreSQL has to change the
              table row. In the indexed database, it also has to keep the email index
              correct.
            </p>
            <div className="mt-3">
              <SqlCodeViewer code={writeQuery} />
            </div>
          </div>
          <div className="mt-6">
            <h3 className="text-xl font-bold text-zinc-950">Write Explain</h3>
            <p className="mt-2">
              The index still helps PostgreSQL find the row, but the write now has extra
              work after the row is found: the email index entry must be updated too.
            </p>
            <SqlCodeViewer code={"EXPLAIN " + writeQuery} />
            <div className="mt-4 flex flex-col gap-5">
              <div className="min-w-0">
                <h4 className="mb-2 font-mono text-sm font-semibold uppercase tracking-wide text-zinc-500">
                  Without Index
                </h4>
                <SqlPlan execution={sequentialWrite} />
              </div>
              <div className="min-w-0">
                <h4 className="mb-2 font-mono text-sm font-semibold uppercase tracking-wide text-zinc-500">
                  With Index
                </h4>
                <SqlPlan execution={indexedWrite} />
              </div>
            </div>
            <p className="mt-3">
              Both plans start with <InlineCode>Update on users</InlineCode> because both
              queries change a row in the same table. The difference is the step
              underneath it: without the index, PostgreSQL uses a{" "}
              <InlineCode>Seq Scan</InlineCode> and checks rows until it finds the
              matching email. With the index, it uses{" "}
              <InlineCode>users_email_idx</InlineCode> to find the row first.
            </p>
            <p className="mt-3">
              This cost still drops from{" "}
              <InlineCode className="border-rose-200 bg-rose-100 px-1.5 font-semibold text-rose-900">
                218.00
              </InlineCode>{" "}
              to{" "}
              <InlineCode className="border-emerald-200 bg-emerald-100 px-1.5 font-semibold text-emerald-900">
                8.30
              </InlineCode>{" "}
              because the plan is measuring how PostgreSQL finds the row to update. The
              index helps that part. The extra write work happens after the row is found:
              PostgreSQL must remove the old email from the index and add the new one.
              That write overhead is real, but it is not obvious from this simple{" "}
              <InlineCode>EXPLAIN</InlineCode> cost.
            </p>
          </div>
        </div>
      </Section>
    </LessonPage>
  );
}
