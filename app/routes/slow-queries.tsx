import { Link } from "react-router";

import {
  databaseInit,
  exercises,
  explainLoginQuery,
  explainRecentOrdersQuery,
  explainWriteScript,
  fixedDatabaseInit,
  lowerEmailIndex,
  migration,
  recentOrdersIndex,
  runningNowQuery,
  seed,
  tableScansQuery,
  topByMeanTimeQuery,
  topByTotalTimeQuery,
  trackingSetupScript,
  trafficQueries,
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

const linkClassName =
  "text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900";

const PLAN_WARNING_SIGNS: readonly { means: string; sign: string }[] = [
  {
    sign: "Seq Scan with a large Rows Removed by Filter",
    means:
      "Postgres read the whole table to keep a few rows. Usually a missing index, or one the query can't use.",
  },
  {
    sign: "Estimated rows far from actual rows",
    means:
      "The planner guessed wrong, so it may have picked the wrong plan. Stale statistics are the usual cause: run ANALYZE.",
  },
  {
    sign: "Sort Method: external merge  Disk",
    means: "The sort didn't fit in work_mem and spilled to disk.",
  },
  {
    sign: "A node with a large loops count",
    means:
      "The node ran once per row of its parent, typically the inner side of a Nested Loop. Multiply its time by loops.",
  },
  {
    sign: "Large Buffers numbers",
    means:
      "The query touches a lot of data. Each block is 8 kB: shared hit came from memory, read came from disk.",
  },
];

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
  const topByTotalTime = useLessonSqlExample({
    query: topByTotalTimeQuery,
    sqlLoad: databaseInit.query,
  });
  const topByMeanTime = useLessonSqlExample({
    query: topByMeanTimeQuery,
    sqlLoad: databaseInit.query,
  });
  const tableScans = useLessonSqlExample({
    query: tableScansQuery,
    sqlLoad: databaseInit.query,
  });
  const explainRecentOrders = useLessonSqlExample({
    query: explainRecentOrdersQuery,
    sqlLoad: databaseInit.query,
  });
  const explainRecentOrdersFixed = useLessonSqlExample({
    query: explainRecentOrdersQuery,
    sqlLoad: fixedDatabaseInit.query,
  });
  const explainLogin = useLessonSqlExample({
    query: explainLoginQuery,
    sqlLoad: databaseInit.query,
  });
  const explainLoginFixed = useLessonSqlExample({
    query: explainLoginQuery,
    sqlLoad: fixedDatabaseInit.query,
  });
  const topByTotalTimeFixed = useLessonSqlExample({
    query: topByTotalTimeQuery,
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
              An extension that groups every statement by its shape and keeps running
              totals: calls, time, rows, and buffer blocks. The first place to look when
              the database is slow.
            </>
          ),
        },
        {
          concept: "Total time vs. mean time",
          description: (
            <>
              <InlineCode>total_exec_time</InlineCode> is what a query costs the database;{" "}
              <InlineCode>mean_exec_time</InlineCode> is what one caller waits. Fix the
              biggest total first.
            </>
          ),
        },
        {
          concept: "pg_stat_user_tables",
          url: "https://www.postgresql.org/docs/current/monitoring-stats.html#MONITORING-PG-STAT-ALL-TABLES-VIEW",
          description: (
            <>
              Per-table counters. Many sequential scans reading many rows point at a
              missing index.
            </>
          ),
        },
        {
          concept: "EXPLAIN ANALYZE",
          url: "https://www.postgresql.org/docs/current/using-explain.html#USING-EXPLAIN-ANALYZE",
          description: (
            <>
              Runs the query and shows the plan with what really happened: actual rows,
              time, loops, and, with <InlineCode>BUFFERS</InlineCode>, how much data each
              step touched.
            </>
          ),
        },
        {
          concept: "Composite index",
          url: "https://www.postgresql.org/docs/current/indexes-multicolumn.html",
          description: (
            <>
              An index on the filter column followed by the sort column serves both{" "}
              <InlineCode>WHERE</InlineCode> and{" "}
              <InlineCode>ORDER BY ... LIMIT</InlineCode>, so Postgres reads just the rows
              it returns.
            </>
          ),
        },
        {
          concept: "Expression index",
          url: "https://www.postgresql.org/docs/current/indexes-expressional.html",
          description: (
            <>
              An index on <InlineCode>lower(email)</InlineCode> instead of{" "}
              <InlineCode>email</InlineCode>. An index is only used when the query filters
              on exactly what it indexes.
            </>
          ),
        },
        {
          concept: "log_min_duration_statement",
          url: "https://www.postgresql.org/docs/current/runtime-config-logging.html#GUC-LOG-MIN-DURATION-STATEMENT",
          description: (
            <>
              Logs each statement slower than a threshold, with its real parameter values,
              which is what you need to run <InlineCode>EXPLAIN ANALYZE</InlineCode> on
              it.
            </>
          ),
        },
      ]}
    >
      <Paragraphs>
        <p>
          The app got slow. Pages that used to load instantly now take a second, and the
          database server's CPU is busy. Which query is it? Guessing is how you spend a
          day adding an index nobody needed. Postgres keeps statistics about every query
          it runs, so you don't have to guess.
        </p>
        <p className="mt-3">
          This lesson follows the loop you'll use every time: <strong>track</strong> which
          queries cost the most, <strong>analyze</strong> the worst one with{" "}
          <InlineCode>EXPLAIN ANALYZE</InlineCode>, <strong>fix</strong> it, and{" "}
          <strong>verify</strong> that the fix worked. It builds on the{" "}
          <Link className={linkClassName} to="/lessons/introduction-to-indexes">
            introduction to indexes
          </Link>
          .
        </p>
      </Paragraphs>

      <Section>
        <Title2 id="the-migration">The migration</Title2>
        <Paragraph>
          A small shop: customers, and their orders. Each table has a primary key, and
          email is <InlineCode>UNIQUE</InlineCode>, which also gives it an index.
        </Paragraph>
        <div className="mt-4">
          <SqlCodeViewer code={migration} />
        </div>
      </Section>

      <Section>
        <Title2 id="the-seed">The seed</Title2>
        <Paragraph>
          5,000 customers and 60,000 orders, spread over most of a year. Enough rows that
          reading a whole table takes a few milliseconds.
        </Paragraph>
        <div className="mt-4">
          <SqlCodeViewer code={seed} />
        </div>
      </Section>

      <LessonSection>
        <Title2 id="the-traffic">The traffic</Title2>
        <Paragraphs>
          <p>
            Then the application does its job. The lesson database replays a burst of
            requests, interleaved the way real traffic would be. Each request runs one of
            four queries, with different values every time:
          </p>
        </Paragraphs>
        <div className="overflow-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr>
                <th className="border-b border-zinc-300 px-3 py-2 font-bold text-zinc-950">
                  Request
                </th>
                <th className="border-b border-zinc-300 px-3 py-2 font-bold text-zinc-950">
                  Calls
                </th>
                <th className="border-b border-zinc-300 px-3 py-2 font-bold text-zinc-950">
                  One of those calls
                </th>
              </tr>
            </thead>
            <tbody>
              {trafficQueries.map((trafficQuery) => (
                <tr key={trafficQuery.endpoint}>
                  <td className="whitespace-nowrap border-b border-zinc-100 px-3 py-2 align-top text-zinc-800">
                    {trafficQuery.endpoint}
                  </td>
                  <td className="border-b border-zinc-100 px-3 py-2 align-top font-mono text-zinc-800">
                    {trafficQuery.calls}
                  </td>
                  <td className="border-b border-zinc-100 px-3 py-2 align-top font-mono text-xs text-zinc-800">
                    {trafficQuery.sql(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Paragraph>
          Nothing here looks obviously wrong. That's normal: slow queries rarely look
          slow. They look like every other query, until the table grows.
        </Paragraph>
      </LessonSection>

      <LessonSection>
        <Title2 id="tracking-with-pg-stat-statements">
          Tracking with pg_stat_statements
        </Title2>
        <Paragraphs>
          <p>
            <InlineCode>pg_stat_statements</InlineCode> is an extension that ships with
            Postgres. Once it's loaded, it records every statement the server runs, and
            groups statements that differ only in their constants. The 40 recent orders
            queries, each for a different customer, become a single row, with the customer
            id replaced by <InlineCode>$1</InlineCode>. For each of these normalized
            queries it keeps running totals: how many times it ran, how long it took, how
            many rows it returned, how much data it touched.
          </p>
          <p className="mt-3">
            The lesson database has it enabled, and resets its statistics right before the
            traffic, so they only describe the traffic. Here are the queries that cost the
            database the most time:
          </p>
        </Paragraphs>
        <SqlCodeViewer code={topByTotalTimeQuery} databaseInitId={databaseInit.id} />
        <SqlResult execution={topByTotalTime} />
        <Paragraphs>
          <p>
            These timings are real: your browser just ran the whole traffic, so the
            numbers change a little every time you load the page. The ranking doesn't.
          </p>
          <p className="mt-3">
            The customer's recent orders query is on top, with about half of the total
            time on its own. The login comes next. The order page ran five times as often
            as either of them and barely registers. The{" "}
            <InlineCode>WHERE query NOT LIKE &apos;%pg_stat%&apos;</InlineCode> filter
            hides the monitoring queries themselves, since{" "}
            <InlineCode>pg_stat_statements</InlineCode> tracks those too.
          </p>
        </Paragraphs>
      </LessonSection>

      <LessonSection>
        <Title2 id="total-time-vs-mean-time">Total time vs. mean time</Title2>
        <Paragraph>
          Sort the same statistics by mean time, the average for a single call, and the
          ranking changes:
        </Paragraph>
        <SqlCodeViewer code={topByMeanTimeQuery} databaseInitId={databaseInit.id} />
        <SqlResult execution={topByMeanTime} />
        <Paragraphs>
          <p>
            The monthly revenue report is by far the slowest call. But it ran twice, while
            the recent orders query ran 40 times. Total time is what a query costs the
            database, so it's where a fix frees up the most capacity. Mean time is what
            one user waits, so it's what to look at when a specific page is slow. Start
            with total time, and keep an eye on the mean.
          </p>
          <p className="mt-3">
            The last two columns explain the timings.{" "}
            <InlineCode>blocks_per_call</InlineCode> counts the 8 kB blocks of table and
            index data each call touched (<InlineCode>shared_blks_hit</InlineCode> from
            memory plus <InlineCode>shared_blks_read</InlineCode> from disk). The recent
            orders query touches over 400 blocks, pretty much the whole orders table, to
            return 10 rows. Compare that to the order page: 3 blocks for 1 row. Unlike
            time, block counts don't depend on how busy the machine is, which makes them a
            good measure to compare before and after a fix.
          </p>
        </Paragraphs>
      </LessonSection>

      <LessonSection>
        <Title2 id="which-tables-get-scanned">Which tables get scanned?</Title2>
        <Paragraph>
          Postgres also keeps statistics per table. A sequential scan reads a table from
          start to end; that's fine once in a while, but a table scanned over and over is
          usually missing an index:
        </Paragraph>
        <SqlCodeViewer code={tableScansQuery} databaseInitId={databaseInit.id} />
        <SqlResult execution={tableScans} />
        <Paragraph>
          These counters add up since the database was created, seed included, but the
          traffic dominates them: over 40 sequential scans of orders read 2.5 million
          rows, nearly the whole table each time, for traffic that returned a few hundred.
          customers was scanned about 40 times too, once per login, even though email has
          an index. We&apos;ll see why.
        </Paragraph>
      </LessonSection>

      <LessonSection>
        <Title2 id="analyzing-with-explain-analyze">
          Analyzing with EXPLAIN ANALYZE
        </Title2>
        <Paragraphs>
          <p>
            <InlineCode>pg_stat_statements</InlineCode> tells you which query is slow, not
            why. For that, pick one real call of it, with real values in place of{" "}
            <InlineCode>$1</InlineCode> and <InlineCode>$2</InlineCode>, and run it with{" "}
            <InlineCode>EXPLAIN ANALYZE</InlineCode>. Plain{" "}
            <InlineCode>EXPLAIN</InlineCode>, as in the indexes lesson, only shows the
            plan and the planner&apos;s estimates. <InlineCode>ANALYZE</InlineCode>{" "}
            actually runs the query and adds what really happened at each step;{" "}
            <InlineCode>BUFFERS</InlineCode> adds how many blocks each step touched
            (it&apos;s on by default with <InlineCode>ANALYZE</InlineCode> since Postgres
            18).
          </p>
        </Paragraphs>
        <SqlCodeViewer code={explainRecentOrdersQuery} databaseInitId={databaseInit.id} />
        <QueryPlanResult execution={explainRecentOrders} />
        <Paragraphs>
          <p>
            Read a plan from the most indented line up: each step feeds its rows to the
            one above it.
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <InlineCode>Seq Scan on orders</InlineCode> reads every row, and{" "}
              <InlineCode>Rows Removed by Filter</InlineCode> shows it threw away 59,988
              of them to keep the 12 orders of customer 42.
            </li>
            <li>
              <InlineCode>Sort</InlineCode> then orders those 12 by{" "}
              <InlineCode>created_at DESC</InlineCode>, and <InlineCode>Limit</InlineCode>{" "}
              keeps the first 10.
            </li>
            <li>
              <InlineCode>actual time=first..last</InlineCode> is in milliseconds: when
              the step produced its first row, and its last. Nearly all of the total is
              spent in the scan.
            </li>
            <li>
              <InlineCode>Buffers: shared hit</InlineCode> is the same 400-odd blocks{" "}
              <InlineCode>pg_stat_statements</InlineCode> reported per call.
            </li>
          </ul>
          <p className="mt-3">
            So the query isn&apos;t slow because of the sort, or the limit. It&apos;s slow
            because finding one customer&apos;s orders means reading all of them.
          </p>
        </Paragraphs>
        <Paragraph>Things to look for in any plan:</Paragraph>
        <div className="overflow-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr>
                <th className="border-b border-zinc-300 px-3 py-2 font-bold text-zinc-950">
                  In the plan
                </th>
                <th className="border-b border-zinc-300 px-3 py-2 font-bold text-zinc-950">
                  What it usually means
                </th>
              </tr>
            </thead>
            <tbody>
              {PLAN_WARNING_SIGNS.map((row) => (
                <tr key={row.sign}>
                  <td className="border-b border-zinc-100 px-3 py-2 align-top font-mono">
                    {row.sign}
                  </td>
                  <td className="border-b border-zinc-100 px-3 py-2 align-top text-zinc-800">
                    {row.means}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Paragraph>
          One warning: because <InlineCode>EXPLAIN ANALYZE</InlineCode> really runs the
          statement, analyzing an <InlineCode>INSERT</InlineCode>,{" "}
          <InlineCode>UPDATE</InlineCode>, or <InlineCode>DELETE</InlineCode> really
          changes data. Wrap it in a transaction and roll back:
        </Paragraph>
        <SqlCodeViewer code={explainWriteScript} />
      </LessonSection>

      <LessonSection>
        <Title2 id="fix-an-index-that-matches-the-query">
          Fix 1: an index that matches the query
        </Title2>
        <Paragraphs>
          <p>
            Postgres automatically indexes primary keys and unique columns, but not
            foreign keys: <InlineCode>orders.customer_id</InlineCode> references
            customers, and nothing indexes it. That&apos;s one of the most common causes
            of slow queries.
          </p>
          <p className="mt-3">
            An index on <InlineCode>customer_id</InlineCode> alone would find the 12
            orders directly, then sort them. We can do better: an index on{" "}
            <InlineCode>customer_id</InlineCode> and then{" "}
            <InlineCode>created_at DESC</InlineCode> keeps each customer&apos;s orders
            already sorted newest first, so Postgres reads the first 10 entries and stops.
          </p>
        </Paragraphs>
        <SqlCodeViewer code={recentOrdersIndex} />
        <SqlCodeViewer
          code={explainRecentOrdersQuery}
          databaseInitId={fixedDatabaseInit.id}
        />
        <QueryPlanResult execution={explainRecentOrdersFixed} />
        <Paragraph>
          An <InlineCode>Index Scan</InlineCode> instead of a sequential scan, no{" "}
          <InlineCode>Sort</InlineCode> step at all, and a handful of blocks instead of
          hundreds. Column order matters: an index on{" "}
          <InlineCode>(created_at, customer_id)</InlineCode> couldn&apos;t jump to
          customer 42&apos;s orders, because they&apos;d be scattered across the whole
          index.
        </Paragraph>
      </LessonSection>

      <LessonSection>
        <Title2 id="fix-the-index-that-wasnt-used">
          Fix 2: the index that wasn&apos;t used
        </Title2>
        <Paragraph>
          Now the login. <InlineCode>email</InlineCode> is <InlineCode>UNIQUE</InlineCode>
          , so it has an index, yet customers was scanned once per login:
        </Paragraph>
        <SqlCodeViewer code={explainLoginQuery} databaseInitId={databaseInit.id} />
        <QueryPlanResult execution={explainLogin} />
        <Paragraphs>
          <p>
            Look at the <InlineCode>Filter</InlineCode> line. The query doesn&apos;t
            compare <InlineCode>email</InlineCode>, it compares{" "}
            <InlineCode>lower(email)</InlineCode>, so the application can match emails
            whatever their case. The index stores <InlineCode>email</InlineCode> values,
            and Postgres can&apos;t use it to find <InlineCode>lower(email)</InlineCode>{" "}
            values. So it computes <InlineCode>lower()</InlineCode> for every one of the
            5,000 customers, which is also why this scan is slower per row than the one on
            orders.
          </p>
          <p className="mt-3">
            The same thing happens with any function or calculation on an indexed column:{" "}
            <InlineCode>WHERE created_at::date = ...</InlineCode>,{" "}
            <InlineCode>WHERE id + 1 = ...</InlineCode>. The fix is to index exactly what
            the query filters on, an expression index:
          </p>
        </Paragraphs>
        <SqlCodeViewer code={lowerEmailIndex} />
        <SqlCodeViewer code={explainLoginQuery} databaseInitId={fixedDatabaseInit.id} />
        <QueryPlanResult execution={explainLoginFixed} />
        <Paragraph>
          The other way to fix it is to change the data instead of the index: store emails
          already lowercased and compare them directly, or use the{" "}
          <InlineCode>citext</InlineCode> type, whose comparisons ignore case.
        </Paragraph>
      </LessonSection>

      <LessonSection>
        <Title2 id="verify-the-fix">Verify the fix</Title2>
        <Paragraph>
          An index that looks right in <InlineCode>EXPLAIN</InlineCode> still needs
          checking against the real traffic. Here is the same traffic, replayed on the
          same data with both indexes, next to the original:
        </Paragraph>
        <SqlCodeViewer code={topByTotalTimeQuery} databaseInitId={fixedDatabaseInit.id} />
        <div className="flex flex-col gap-5">
          <div className="min-w-0">
            <ColumnHeading>Before</ColumnHeading>
            <SqlResult execution={topByTotalTime} />
          </div>
          <div className="min-w-0">
            <ColumnHeading>After</ColumnHeading>
            <SqlResult execution={topByTotalTimeFixed} />
          </div>
        </div>
        <Paragraphs>
          <p>
            The two queries we fixed dropped from the top of the list to fractions of a
            millisecond per call. The monthly report is now the most expensive query, and
            it&apos;s tempting to go after it next.
          </p>
          <p className="mt-3">
            But look at what it does: it adds up every paid order of the year. It needs
            most of the table, so no index will make it read much less. It runs twice. Not
            every slow query is a problem; if it ever becomes one, the answer is usually
            to precompute it (a materialized view, or a summary table), not an index.
            Knowing when to stop is part of the job, since every index also slows down
            every write to its table.
          </p>
        </Paragraphs>
      </LessonSection>

      <LessonSection>
        <Title2 id="tracking-in-production">Tracking in production</Title2>
        <Paragraphs>
          <p>
            Here, <InlineCode>pg_stat_statements</InlineCode> was loaded for you. On a
            real server it has to be in <InlineCode>shared_preload_libraries</InlineCode>,
            which needs a restart. Most managed services (RDS, Cloud SQL, Supabase, and
            others) already load it; you only need the{" "}
            <InlineCode>CREATE EXTENSION</InlineCode>.
          </p>
        </Paragraphs>
        <SqlCodeViewer code={trackingSetupScript} />
        <Paragraphs>
          <p>A few things that help in practice:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              The statistics add up from the last reset, possibly months ago. To see what
              is slow now, reset after a deploy, or save snapshots of the view and compare
              two of them.
            </li>
            <li>
              <InlineCode>pg_stat_statements</InlineCode> only shows{" "}
              <InlineCode>$1</InlineCode>.{" "}
              <InlineCode>log_min_duration_statement</InlineCode> logs each slow call with
              its actual values, which are what you paste into{" "}
              <InlineCode>EXPLAIN ANALYZE</InlineCode>. The same query can be fast for one
              customer and slow for another.
            </li>
            <li>
              The <InlineCode>auto_explain</InlineCode> extension goes one step further
              and logs the plan of every slow call, as it ran.
            </li>
            <li>
              For what is slow right now, rather than in total,{" "}
              <InlineCode>pg_stat_activity</InlineCode> lists the running queries and when
              they started:
            </li>
          </ul>
        </Paragraphs>
        <SqlCodeViewer code={runningNowQuery} />
      </LessonSection>

      <LessonSection>
        <Title2 id="rules-of-thumb">Rules of thumb</Title2>
        <ul className="list-disc space-y-2 pl-5 text-base leading-7 text-zinc-800">
          <li>
            Measure before you fix. Enable <InlineCode>pg_stat_statements</InlineCode> on
            every database, before you need it.
          </li>
          <li>
            Fix the biggest total time first; a fast query called a lot can cost more than
            a slow one called rarely.
          </li>
          <li>
            Explain one real call, with{" "}
            <InlineCode>EXPLAIN (ANALYZE, BUFFERS)</InlineCode>, and read it from the
            inside out.
          </li>
          <li>
            Index foreign key columns you filter on. Postgres doesn&apos;t do it for you.
          </li>
          <li>
            Build indexes to match the query: filter columns first, then the{" "}
            <InlineCode>ORDER BY</InlineCode> columns, and index expressions when the
            query filters on an expression.
          </li>
          <li>
            Verify with the same statistics you started from, and compare blocks, not just
            milliseconds.
          </li>
        </ul>
      </LessonSection>
    </CourseLessonPage>
  );
}
