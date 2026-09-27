import {
  databaseInit,
  exercises,
  explainListFixedQuery,
  explainListQuery,
  explainSearchFixedQuery,
  explainSearchQuery,
  fixedDatabaseInit,
  keysetPagination,
  migration,
  seed,
  slowestCallsQuery,
  slowestListCallsQuery,
  topByTypeQuery,
  tracking,
  traffic,
  trigramIndex,
} from "../../cli_examples/slow-queries.sql";
import { CourseLessonPage } from "../sql/course-lesson-page";
import {
  InlineCode,
  LessonSection,
  Paragraph,
  Paragraphs,
  Section,
  Title2,
} from "../sql/lesson-layout";
import { OutputBlock, SqlCodeViewer, SqlExplainViewer } from "../sql/sql-editor";
import { SqlResult, useLessonSqlExample } from "../sql/use-lesson-sql-example";
import type { LessonSqlState } from "../sql/use-lesson-sql-example";

// EXPLAIN returns one row per plan line, in a column named "QUERY PLAN"; show them as
// a plan instead of as a table.
function QueryPlanResult({ execution }: { execution: LessonSqlState }) {
  if (execution.status !== "done") {
    return <SqlResult execution={execution} />;
  }

  const plan = execution.output.rows.map((row) => String(row["QUERY PLAN"])).join("\n");

  return (
    <OutputBlock tone="plan">
      <SqlExplainViewer code={plan} />
    </OutputBlock>
  );
}

function ColumnHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 font-mono text-sm font-semibold uppercase tracking-wide text-zinc-500">
      {children}
    </h3>
  );
}

export default function SlowQueries() {
  const topByType = useLessonSqlExample({
    query: topByTypeQuery,
    sqlLoad: databaseInit.query,
  });
  const slowestCalls = useLessonSqlExample({
    query: slowestCallsQuery,
    sqlLoad: databaseInit.query,
  });
  const slowestListCalls = useLessonSqlExample({
    query: slowestListCallsQuery,
    sqlLoad: databaseInit.query,
  });
  const explainSearch = useLessonSqlExample({
    query: explainSearchQuery,
    sqlLoad: databaseInit.query,
  });
  const explainSearchFixed = useLessonSqlExample({
    query: explainSearchFixedQuery,
    sqlLoad: fixedDatabaseInit.query,
  });
  const explainList = useLessonSqlExample({
    query: explainListQuery,
    sqlLoad: databaseInit.query,
  });
  const explainListFixed = useLessonSqlExample({
    query: explainListFixedQuery,
    sqlLoad: fixedDatabaseInit.query,
  });
  const topByTypeFixed = useLessonSqlExample({
    query: topByTypeQuery,
    sqlLoad: fixedDatabaseInit.query,
  });

  return (
    <CourseLessonPage
      exercises={exercises}
      lessonId="slow-queries"
      whatWeLearned={[
        {
          concept: "pg_stat_statements",
          url: "https://www.postgresql.org/docs/current/pgstatstatements.html",
          description: (
            <>
              Groups every statement by its shape and keeps running totals: calls, time,
              rows, buffer blocks.
            </>
          ),
        },
        {
          concept: "EXPLAIN (ANALYZE, BUFFERS)",
          url: "https://www.postgresql.org/docs/current/using-explain.html#USING-EXPLAIN-ANALYZE",
          description: (
            <>Runs the query and shows what each step of the plan really did.</>
          ),
        },
        {
          concept: "pg_trgm",
          url: "https://www.postgresql.org/docs/current/pgtrgm.html",
          description: (
            <>
              Trigram indexes: make <InlineCode>ILIKE &apos;%...%&apos;</InlineCode> use
              an index.
            </>
          ),
        },
        {
          concept: "Keyset pagination",
          url: "https://www.postgresql.org/docs/current/queries-limit.html",
          description: (
            <>
              <InlineCode>WHERE id &gt; last_id</InlineCode> instead of{" "}
              <InlineCode>OFFSET</InlineCode>: every page costs the same.
            </>
          ),
        },
      ]}
    >
      <Paragraphs>
        <p>
          An app is slow. Find which queries are to blame, understand why, fix them, and
          check that the fix worked.
        </p>
      </Paragraphs>

      <Section>
        <Title2 id="the-migration">The migration</Title2>
        <div className="mt-4">
          <SqlCodeViewer code={migration} />
        </div>
      </Section>

      <Section>
        <Title2 id="the-seed">The seed</Title2>
        <div className="mt-4">
          <SqlCodeViewer code={seed} />
        </div>
      </Section>

      <LessonSection>
        <Title2 id="the-app">The app</Title2>
        <Paragraph>
          Four endpoints: create, list, delete, search. First, turn on tracking:
        </Paragraph>
        <div className="mt-4">
          <SqlCodeViewer code={tracking} />
        </div>
        <Paragraph>Then send the app&apos;s traffic, each endpoint many times:</Paragraph>
        <div className="mt-4">
          <SqlCodeViewer code={traffic} />
        </div>
      </LessonSection>

      <LessonSection>
        <Title2 id="slowest-query-types">Slowest query types</Title2>
        <div className="mt-4">
          <SqlCodeViewer code={topByTypeQuery} databaseInitId={databaseInit.id} />
        </div>
        <div className="mt-4">
          <SqlResult execution={topByType} />
        </div>
        <Paragraph>
          Search: 20 calls, most of the total time. Timings are real, measured in your
          browser.
        </Paragraph>
      </LessonSection>

      <LessonSection>
        <Title2 id="slowest-actual-calls">Slowest actual calls</Title2>
        <div className="mt-4">
          <SqlCodeViewer code={slowestCallsQuery} databaseInitId={databaseInit.id} />
        </div>
        <div className="mt-4">
          <SqlResult execution={slowestCalls} />
        </div>
        <div className="mt-4">
          <SqlCodeViewer code={slowestListCallsQuery} databaseInitId={databaseInit.id} />
        </div>
        <div className="mt-4">
          <SqlResult execution={slowestListCalls} />
        </div>
      </LessonSection>

      <LessonSection>
        <Title2 id="why-is-search-slow">Why is search slow?</Title2>
        <div className="mt-4">
          <SqlCodeViewer code={explainSearchQuery} databaseInitId={databaseInit.id} />
        </div>
        <div className="mt-4">
          <QueryPlanResult execution={explainSearch} />
        </div>
      </LessonSection>

      <LessonSection>
        <Title2 id="fix-1-a-trigram-index">Fix 1: a trigram index</Title2>
        <div className="mt-4">
          <SqlCodeViewer code={trigramIndex} />
        </div>
        <div className="mt-4">
          <SqlCodeViewer
            code={explainSearchFixedQuery}
            databaseInitId={fixedDatabaseInit.id}
          />
        </div>
        <div className="mt-4">
          <QueryPlanResult execution={explainSearchFixed} />
        </div>
      </LessonSection>

      <LessonSection>
        <Title2 id="why-are-deep-pages-slow">Why are deep pages slow?</Title2>
        <div className="mt-4">
          <SqlCodeViewer code={explainListQuery} databaseInitId={databaseInit.id} />
        </div>
        <div className="mt-4">
          <QueryPlanResult execution={explainList} />
        </div>
      </LessonSection>

      <LessonSection>
        <Title2 id="fix-2-keyset-pagination">Fix 2: keyset pagination</Title2>
        <Paragraph>No index this time: change the query.</Paragraph>
        <div className="mt-4">
          <SqlCodeViewer code={keysetPagination} />
        </div>
        <div className="mt-4">
          <SqlCodeViewer
            code={explainListFixedQuery}
            databaseInitId={fixedDatabaseInit.id}
          />
        </div>
        <div className="mt-4">
          <QueryPlanResult execution={explainListFixed} />
        </div>
      </LessonSection>

      <LessonSection>
        <Title2 id="verify">Verify</Title2>
        <Paragraph>Same traffic, before and after both fixes.</Paragraph>
        <div className="mt-4 flex flex-col gap-5">
          <div className="min-w-0">
            <ColumnHeading>Before</ColumnHeading>
            <SqlResult execution={topByType} />
          </div>
          <div className="min-w-0">
            <ColumnHeading>After</ColumnHeading>
            <SqlResult execution={topByTypeFixed} />
          </div>
        </div>
        <Paragraph>
          Search and list are fixed. <InlineCode>INSERT</InlineCode> now touches more
          blocks: every new row also updates the trigram index. Indexes aren&apos;t free.
        </Paragraph>
      </LessonSection>
    </CourseLessonPage>
  );
}
