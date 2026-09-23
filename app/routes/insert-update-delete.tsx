import { Link } from "react-router";

import { getSqlExample, SQL_EXAMPLE_IDS } from "../../cli_examples/types";
import {
  afterKatherineDeletedInit,
  databaseInit,
  examples,
  exercises,
  migration,
  seed,
} from "../../cli_examples/insert-update-delete.sql";
import { CourseLessonPage } from "../sql/course-lesson-page";
import { HotUpdateDiagram } from "../sql/hot-update-diagram";
import {
  InlineCode,
  LessonSection,
  Paragraph,
  Paragraphs,
  Section,
  Title2,
} from "../sql/lesson-layout";
import { SqlCodeViewer } from "../sql/sql-editor";
import { SqlPlan, SqlResult, useLessonSqlExample } from "../sql/use-lesson-sql-example";

export default function Lesson3() {
  const insertExample = getSqlExample(
    examples,
    SQL_EXAMPLE_IDS.insertUpdateDeleteInsertReturning,
  );
  const updateExample = getSqlExample(
    examples,
    SQL_EXAMPLE_IDS.insertUpdateDeleteUpdateReturning,
  );
  const deleteExample = getSqlExample(
    examples,
    SQL_EXAMPLE_IDS.insertUpdateDeleteDeleteReturning,
  );
  const upsertExample = getSqlExample(examples, SQL_EXAMPLE_IDS.insertUpdateDeleteUpsert);
  const deactivateMalesExample = getSqlExample(
    examples,
    SQL_EXAMPLE_IDS.insertUpdateDeleteDeactivateMales,
  );
  const refreshDeleteExample = getSqlExample(
    examples,
    SQL_EXAMPLE_IDS.insertUpdateDeleteRefreshDelete,
  );
  const refreshInsertExample = getSqlExample(
    examples,
    SQL_EXAMPLE_IDS.insertUpdateDeleteRefreshInsert,
  );
  const refreshUpsertExample = getSqlExample(
    examples,
    SQL_EXAMPLE_IDS.insertUpdateDeleteRefreshUpsert,
  );

  const insertExecution = useLessonSqlExample({
    query: insertExample.query,
    runExplain: true,
    sqlLoad: databaseInit.query,
  });
  const updateExecution = useLessonSqlExample({
    query: updateExample.query,
    runExplain: true,
    sqlLoad: databaseInit.query,
  });
  const deleteExecution = useLessonSqlExample({
    query: deleteExample.query,
    runExplain: true,
    sqlLoad: databaseInit.query,
  });
  const upsertExecution = useLessonSqlExample({
    query: upsertExample.query,
    runExplain: true,
    sqlLoad: databaseInit.query,
  });
  const deactivateMalesExecution = useLessonSqlExample({
    query: deactivateMalesExample.query,
    runExplain: true,
    sqlLoad: databaseInit.query,
  });
  const refreshDeleteExecution = useLessonSqlExample({
    query: refreshDeleteExample.query,
    sqlLoad: databaseInit.query,
  });
  const refreshInsertExecution = useLessonSqlExample({
    query: refreshInsertExample.query,
    sqlLoad: afterKatherineDeletedInit.query,
  });
  const refreshUpsertExecution = useLessonSqlExample({
    query: refreshUpsertExample.query,
    sqlLoad: databaseInit.query,
  });

  return (
    <CourseLessonPage
      exercises={exercises}
      lessonId="insert-update-delete"
      whatWeLearned={[
        {
          concept: "INSERT",
          description: "adds new rows to a table.",
          url: "https://www.postgresql.org/docs/current/sql-insert.html",
        },
        {
          concept: "UPDATE",
          description:
            "changes rows that match a WHERE clause — every match, not just one.",
          url: "https://www.postgresql.org/docs/current/sql-update.html",
        },
        {
          concept: "DELETE",
          description: "removes rows that match a WHERE clause.",
          url: "https://www.postgresql.org/docs/current/sql-delete.html",
        },
        {
          concept: "RETURNING",
          description: "turns writes into visible result rows.",
          url: "https://www.postgresql.org/docs/current/dml-returning.html",
        },
        {
          concept: "INSERT ... ON CONFLICT",
          description:
            "an upsert: insert a new row, or update the existing one if it already conflicts on a unique column.",
          url: "https://www.postgresql.org/docs/current/sql-insert.html#SQL-ON-CONFLICT",
        },
        {
          concept: "MVCC",
          description:
            "PostgreSQL never overwrites a row version in place. A DELETE or UPDATE leaves the old version behind as a dead tuple instead of erasing it.",
          url: "https://www.postgresql.org/docs/current/mvcc-intro.html",
        },
        {
          concept: "VACUUM",
          description:
            "reclaims the space dead tuples leave behind. A HOT update can often clean some of that up on its own; DELETE + INSERT always needs a real VACUUM pass.",
          url: "https://www.postgresql.org/docs/current/sql-vacuum.html",
        },
        {
          concept: "HOT update",
          description:
            "a Heap-Only Tuple update: when the new row version fits on the same page and no indexed column changed, PostgreSQL updates it without touching any other index.",
          url: "https://www.postgresql.org/docs/current/storage-hot.html",
        },
      ]}
    >
      <Paragraphs>
        <p>
          Reading rows is only half of SQL. This lesson changes data with INSERT, UPDATE,
          and DELETE, always using RETURNING so the result is visible.
        </p>
      </Paragraphs>

      <Section>
        <Title2 id="migration">Migration</Title2>
        <Paragraph>
          One table, <InlineCode>users</InlineCode>. <InlineCode>email</InlineCode> is{" "}
          <InlineCode>UNIQUE</InlineCode> — that gives PostgreSQL a lookup index for free,
          and it&apos;s what an upsert will conflict on later in this lesson.
        </Paragraph>
        <SqlCodeViewer code={migration} />
      </Section>

      <Section>
        <Title2 id="seed">Seed</Title2>
        <Paragraph>Eight people, a mix of genders, everyone active to start.</Paragraph>
        <SqlCodeViewer code={seed} />
      </Section>

      <LessonSection>
        <Title2 id={insertExample.id}>{insertExample.name}</Title2>
        <Paragraph>{insertExample.description}</Paragraph>
        <SqlCodeViewer code={insertExample.query} databaseInitId={databaseInit.id} />
        <div className="mt-4">
          <SqlResult execution={insertExecution} />
        </div>
      </LessonSection>

      <LessonSection>
        <Title2 id="update-and-delete">Update and delete a row</Title2>
        <Paragraph>
          <InlineCode>UPDATE</InlineCode> changes columns on matching rows.{" "}
          <InlineCode>DELETE</InlineCode> removes matching rows outright. Both scope their
          effect with a <InlineCode>WHERE</InlineCode> clause — leave it off and every row
          in the table is changed, or gone.
        </Paragraph>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div className="min-w-0">
            <h3 className="mb-2 font-mono text-sm font-semibold uppercase tracking-wide text-zinc-500">
              {updateExample.name}
            </h3>
            <Paragraph>{updateExample.description}</Paragraph>
            <SqlCodeViewer code={updateExample.query} databaseInitId={databaseInit.id} />
            <div className="mt-4">
              <SqlResult execution={updateExecution} />
            </div>
          </div>
          <div className="min-w-0">
            <h3 className="mb-2 font-mono text-sm font-semibold uppercase tracking-wide text-zinc-500">
              {deleteExample.name}
            </h3>
            <Paragraph>{deleteExample.description}</Paragraph>
            <SqlCodeViewer code={deleteExample.query} databaseInitId={databaseInit.id} />
            <div className="mt-4">
              <SqlResult execution={deleteExecution} />
            </div>
          </div>
        </div>
      </LessonSection>

      <LessonSection>
        <Title2 id="cost-of-insert-update-delete">
          The cost of insert, update, delete
        </Title2>
        <Paragraph>
          Let&apos;s take a look at each query&apos;s <InlineCode>EXPLAIN</InlineCode>.
        </Paragraph>
        <div className="mt-4 min-w-0">
          <h3 className="mb-2 font-mono text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Insert
          </h3>
          <SqlPlan execution={insertExecution} />
        </div>
        <div className="mt-4 min-w-0">
          <h3 className="mb-2 font-mono text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Update
          </h3>
          <SqlPlan execution={updateExecution} />
        </div>
        <div className="mt-4 min-w-0">
          <h3 className="mb-2 font-mono text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Delete
          </h3>
          <SqlPlan execution={deleteExecution} />
        </div>
        <Paragraphs>
          <p>
            <InlineCode>INSERT</InlineCode> has nothing to find — it just builds the new
            row and stops. The plan is <InlineCode>Insert on users</InlineCode> straight
            over a <InlineCode>Result</InlineCode> node, cost close to{" "}
            <InlineCode className="border-emerald-200 bg-emerald-100 px-1.5 font-semibold text-emerald-900">
              0.00..0.01
            </InlineCode>
            .
          </p>
          <p className="mt-3">
            <InlineCode>UPDATE</InlineCode> and <InlineCode>DELETE</InlineCode> have to
            locate the row before they can touch it. Because{" "}
            <InlineCode>email</InlineCode> is <InlineCode>UNIQUE</InlineCode>, PostgreSQL
            already has an index for it, so both plans show an{" "}
            <InlineCode>Index Scan</InlineCode> on that index underneath{" "}
            <InlineCode>Update on users</InlineCode> /{" "}
            <InlineCode>Delete on users</InlineCode>, costed around{" "}
            <InlineCode className="border-amber-200 bg-amber-100 px-1.5 font-semibold text-amber-900">
              0.15..8.17
            </InlineCode>
            . That&apos;s higher than the insert, but still cheap — the same index-vs-scan
            tradeoff from the indexes lesson, just triggered by a write instead of a plain{" "}
            <InlineCode>SELECT</InlineCode>. With PostgreSQL&apos;s default cost constants
            (<InlineCode>random_page_cost = 4</InlineCode>), the 8.17 is mostly two page
            reads: one to read the matching entry in the <InlineCode>email</InlineCode>{" "}
            index, one to fetch the actual row from the table — 4 + 4, plus a sliver of{" "}
            <InlineCode>cpu_tuple_cost</InlineCode> for evaluating the condition and
            handing back the one row. The tiny <InlineCode>0.15</InlineCode> startup cost
            is just descending the index to find that first matching entry — small here
            because the table (and its index) only spans a page or two.
          </p>
        </Paragraphs>
      </LessonSection>

      <LessonSection>
        <Title2 id="upsert">UPSERT</Title2>
        <Paragraphs>
          <p>
            PostgreSQL has no dedicated <InlineCode>UPSERT</InlineCode> keyword. MySQL has{" "}
            <InlineCode>INSERT ... ON DUPLICATE KEY UPDATE</InlineCode>; SQL Server and
            Oracle have <InlineCode>MERGE</InlineCode>. PostgreSQL instead extends{" "}
            <InlineCode>INSERT</InlineCode> itself: <InlineCode>ON CONFLICT</InlineCode>{" "}
            lets that single statement insert a new row or update the existing one,
            depending on whether it already exists — atomically, with no race condition
            between a separate check and a follow-up write. The absence of this feature
            from Postgres has been a long-standing complaint from Postgres users{" "}
            <a
              className="text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900"
              href="http://petereisentraut.blogspot.com/2010/05/merge-syntax.html"
              rel="noreferrer"
              target="_blank"
            >
              [2]
            </a>{" "}
            <a
              className="text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900"
              href="http://lucumr.pocoo.org/2014/2/16/a-case-for-upserts/"
              rel="noreferrer"
              target="_blank"
            >
              [3]
            </a>{" "}
            <a
              className="text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900"
              href="http://lwn.net/Articles/601144/"
              rel="noreferrer"
              target="_blank"
            >
              [4]
            </a>{" "}
            <a
              className="text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900"
              href="https://postgresql.uservoice.com/forums/21853-general"
              rel="noreferrer"
              target="_blank"
            >
              [5]
            </a>
            .
          </p>
        </Paragraphs>
        <SqlCodeViewer code={upsertExample.query} databaseInitId={databaseInit.id} />
        <div className="mt-4">
          <SqlResult execution={upsertExecution} />
        </div>
        <Paragraph>
          Katherine Johnson&apos;s <InlineCode>id</InlineCode> doesn&apos;t change — this
          updated the existing row instead of erroring on the duplicate email or inserting
          a second one.
        </Paragraph>
        <div className="mt-6">
          <h3 className="text-xl font-bold text-zinc-950">Explain the explain</h3>
          <Paragraph>
            It&apos;s still an <InlineCode>Insert on users</InlineCode> plan — PostgreSQL
            always attempts the insert first.
          </Paragraph>
          <div className="mt-4">
            <SqlPlan execution={upsertExecution} />
          </div>
          <Paragraphs>
            <p>
              Two lines make it an upsert:{" "}
              <InlineCode>Conflict Resolution: UPDATE</InlineCode> and{" "}
              <InlineCode>Conflict Arbiter Indexes: users_email_key</InlineCode>. The
              second one names the unique index PostgreSQL checks to decide whether a row
              already exists. If <InlineCode>email</InlineCode> collides, it runs the{" "}
              <InlineCode>DO UPDATE SET</InlineCode> instead of raising a duplicate-key
              error — no index on the conflict column, no upsert.
            </p>
          </Paragraphs>
        </div>
      </LessonSection>

      <LessonSection>
        <Title2 id="deactivate-every-male-user">
          Deactivate every male user (bulk update)
        </Title2>
        <Paragraph>{deactivateMalesExample.description}</Paragraph>
        <SqlCodeViewer
          code={deactivateMalesExample.query}
          databaseInitId={databaseInit.id}
        />
        <div className="mt-4">
          <SqlResult execution={deactivateMalesExecution} />
        </div>
        <div className="mt-6">
          <h3 className="text-xl font-bold text-zinc-950">Explain the explain</h3>
          <Paragraph>
            <InlineCode>gender</InlineCode> has no index, unlike{" "}
            <InlineCode>email</InlineCode>.
          </Paragraph>
          <div className="mt-4">
            <SqlPlan execution={deactivateMalesExecution} />
          </div>
          <Paragraphs>
            <p>
              The plan falls back to <InlineCode>Seq Scan on users</InlineCode> with{" "}
              <InlineCode>Filter: (gender = &apos;male&apos;)</InlineCode> — PostgreSQL
              reads every row in the table, keeps the ones that match, and updates each
              one it keeps. <InlineCode>RETURNING *</InlineCode> hands back every row it
              touched, not just one. On a small table this is nothing; on a large one, an
              index on <InlineCode>gender</InlineCode> would turn that seq scan into an
              index scan the same way it did for <InlineCode>email</InlineCode> above.
            </p>
          </Paragraphs>
        </div>
      </LessonSection>

      <LessonSection>
        <Title2 id="upsert-vs-delete-insert">UPSERT vs DELETE + INSERT</Title2>
        <Paragraphs>
          <p>
            Refreshing an existing row is often written as a{" "}
            <InlineCode>DELETE</InlineCode> followed by an <InlineCode>INSERT</InlineCode>
            . It reaches the same end state as the upsert above, but not the same way
            under the hood — deleting marks the old row dead and writes the replacement
            somewhere new, while <InlineCode>ON CONFLICT</InlineCode> updates the existing
            row in place. A{" "}
            <a
              className="text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900"
              href="https://iniakunhuda.medium.com/postgresql-upsert-vs-delete-insert-a-complete-performance-guide-021c2cd7dcc3"
              rel="noreferrer"
              target="_blank"
            >
              full comparison
            </a>{" "}
            walks through the difference in detail, including the VACUUM cost DELETE +
            INSERT leaves behind.
          </p>
          <p className="mt-3">
            A{" "}
            <a
              className="text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900"
              href="https://www.postgresql.org/docs/current/sql-vacuum.html"
              rel="noreferrer"
              target="_blank"
            >
              VACUUM
            </a>{" "}
            is a cleanup process for rows marked as deleted — either run by hand (
            <InlineCode>VACUUM users;</InlineCode>) or triggered automatically in the
            background by <InlineCode>autovacuum</InlineCode>. It scans the table for
            those leftover rows and marks their space reusable, so the table doesn&apos;t
            just keep growing with every write.
          </p>
          <p className="mt-3">
            VACUUM is needed because PostgreSQL internally implements{" "}
            <a
              className="text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900"
              href="https://www.postgresql.org/docs/current/mvcc-intro.html"
              rel="noreferrer"
              target="_blank"
            >
              MVCC
            </a>{" "}
            (Multi-Version Concurrency Control): it never overwrites a row version in
            place, because some other transaction might still need to see the version that
            was there before. A <InlineCode>DELETE</InlineCode> just marks that row&apos;s
            version as no longer current — the bytes stay on the{" "}
            <a
              className="text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900"
              href="https://en.wikipedia.org/wiki/Block_(data_storage)"
              rel="noreferrer"
              target="_blank"
            >
              disk page
            </a>{" "}
            as a <InlineCode>dead tuple</InlineCode> until <InlineCode>VACUUM</InlineCode>{" "}
            reclaims the space. An <InlineCode>UPDATE</InlineCode> (what{" "}
            <InlineCode>ON CONFLICT DO UPDATE</InlineCode> runs) leaves a dead tuple too —
            MVCC doesn&apos;t make an exception for it — but when the new version fits on
            the same page and no indexed column changed, it qualifies as a{" "}
            <a
              className="text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900"
              href="https://www.postgresql.org/docs/current/storage-hot.html"
              rel="noreferrer"
              target="_blank"
            >
              HOT (Heap-Only Tuple) update
            </a>
            : no other index has to be touched, and PostgreSQL can often clean up that
            dead space on its own without waiting for a full{" "}
            <InlineCode>VACUUM</InlineCode> pass. A <InlineCode>DELETE</InlineCode>{" "}
            followed by a separate <InlineCode>INSERT</InlineCode> never gets that
            shortcut. Learn more in the{" "}
            <Link
              className="text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900"
              to="/lessons/mvcc"
            >
              dedicated lesson about MVCC
            </Link>
            .
          </p>
        </Paragraphs>
        <div className="mt-4 flex justify-center">
          <HotUpdateDiagram />
        </div>
        <Paragraphs>
          <p>
            Same scenario as the upsert above — deactivate Katherine Johnson — done two
            ways, with <InlineCode>EXPLAIN (ANALYZE, BUFFERS)</InlineCode> instead of a
            plain <InlineCode>EXPLAIN</InlineCode>. This actually runs the statement and
            reports real timing and page reads, not just an estimate.
          </p>
        </Paragraphs>
        <div className="mt-4">
          <div className="grid gap-6 border-b border-zinc-200 pb-2 md:grid-cols-2">
            <h3 className="font-mono text-sm font-semibold uppercase tracking-wide text-zinc-500">
              DELETE + INSERT
            </h3>
            <h3 className="font-mono text-sm font-semibold uppercase tracking-wide text-zinc-500 md:border-l md:border-zinc-200 md:pl-6">
              UPSERT
            </h3>
          </div>
          <div className="grid gap-6 pt-4 md:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-5 pb-6">
              <div>
                <Paragraph>{refreshDeleteExample.description}</Paragraph>
                <SqlCodeViewer
                  code={refreshDeleteExample.query}
                  databaseInitId={databaseInit.id}
                />
                <div className="mt-4">
                  <SqlResult execution={refreshDeleteExecution} />
                </div>
              </div>
              <div>
                <Paragraph>{refreshInsertExample.description}</Paragraph>
                <SqlCodeViewer
                  code={refreshInsertExample.query}
                  databaseInitId={afterKatherineDeletedInit.id}
                />
                <div className="mt-4">
                  <SqlResult execution={refreshInsertExecution} />
                </div>
              </div>
            </div>
            <div className="min-w-0 pb-6 md:border-l md:border-zinc-200 md:pl-6">
              <Paragraph>{refreshUpsertExample.description}</Paragraph>
              <SqlCodeViewer
                code={refreshUpsertExample.query}
                databaseInitId={databaseInit.id}
              />
              <div className="mt-4">
                <SqlResult execution={refreshUpsertExecution} />
              </div>
            </div>
          </div>
        </div>
        <Paragraphs>
          <p>
            Look at the <InlineCode>Buffers</InlineCode> line in each plan — it counts
            real page touches, not an estimate. DELETE + INSERT pays for two statements: a
            lookup through the <InlineCode>email</InlineCode> index to find the old row,
            then a whole new tuple written elsewhere in the table — with a new{" "}
            <InlineCode>id</InlineCode>, since the sequence never rewinds after a delete —
            and every index loses an entry and gains a new one. UPSERT pays for the same
            conflict-checking lookup, but updates the tuple it already found instead: same{" "}
            <InlineCode>id</InlineCode>, one statement, and (usually) no other index
            touched. Run this enough times and that gap compounds — here&apos;s what the
            article linked above measured on a 100k-row table, single-row operations:
          </p>
        </Paragraphs>
        <div className="mt-4 overflow-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr>
                <th className="border-b border-zinc-300 px-3 py-2 font-bold text-zinc-950">
                  Approach
                </th>
                <th className="border-b border-zinc-300 px-3 py-2 font-bold text-zinc-950">
                  Total Time
                </th>
                <th className="border-b border-zinc-300 px-3 py-2 font-bold text-zinc-950">
                  Buffer Hits
                </th>
                <th className="border-b border-zinc-300 px-3 py-2 font-bold text-zinc-950">
                  Disk I/O
                </th>
                <th className="border-b border-zinc-300 px-3 py-2 font-bold text-zinc-950">
                  Dead Tuples
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border-b border-zinc-100 px-3 py-2 font-mono">
                  DELETE + INSERT
                </td>
                <td className="border-b border-zinc-100 px-3 py-2 text-zinc-800">
                  0.423 ms
                </td>
                <td className="border-b border-zinc-100 px-3 py-2 text-zinc-800">10</td>
                <td className="border-b border-zinc-100 px-3 py-2 text-zinc-800">
                  Higher
                </td>
                <td className="border-b border-zinc-100 px-3 py-2 text-zinc-800">Yes</td>
              </tr>
              <tr>
                <td className="border-b border-zinc-100 px-3 py-2 font-mono">
                  UPSERT (ON CONFLICT)
                </td>
                <td className="border-b border-zinc-100 px-3 py-2 text-zinc-800">
                  0.145 ms
                </td>
                <td className="border-b border-zinc-100 px-3 py-2 text-zinc-800">5</td>
                <td className="border-b border-zinc-100 px-3 py-2 text-zinc-800">
                  Lower
                </td>
                <td className="border-b border-zinc-100 px-3 py-2 text-zinc-800">No</td>
              </tr>
            </tbody>
          </table>
        </div>
        <Paragraphs>
          <p>
            In their benchmark, the <InlineCode>UPSERT</InlineCode> approach is{" "}
            <InlineCode className="border-emerald-200 bg-emerald-100 px-1.5 font-semibold text-emerald-900">
              ~2.9x
            </InlineCode>{" "}
            faster and uses <InlineCode>50%</InlineCode> fewer buffer hits than DELETE +
            INSERT.
          </p>
        </Paragraphs>
      </LessonSection>
    </CourseLessonPage>
  );
}
