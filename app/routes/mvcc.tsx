import { Link } from "react-router";

import { SQL_EXAMPLE_IDS } from "../../cli_examples/types";
import {
  databaseInit,
  exercises,
  hiddenColumnsQuery,
  migration,
  plainSelectQuery,
  seed,
  SESSION_IDS,
  twoInsertsOneTransactionQuery,
  updateChangesXminQuery,
} from "../../cli_examples/mvcc.sql";
import { CourseLessonPage } from "../sql/course-lesson-page";
import {
  InlineCode,
  LessonSection,
  Paragraph,
  Paragraphs,
  Section,
  Title2,
} from "../sql/lesson-layout";
import { getPostgresTranscriptSteps } from "../sql/postgres-examples";
import type {
  PostgresExampleStepOutcome,
  PostgresExampleStepResult,
  PostgresExampleStepResultWithObservers,
} from "../sql/run-example";
import { SqlCodeViewer } from "../sql/sql-editor";
import { SqlResult, useLessonSqlExample } from "../sql/use-lesson-sql-example";
import type { LessonSqlState } from "../sql/use-lesson-sql-example";

type SessionId = (typeof SESSION_IDS)[number];

const sessionSteps: readonly PostgresExampleStepResultWithObservers<SessionId>[] =
  getPostgresTranscriptSteps(
    SQL_EXAMPLE_IDS.mvccSessionATranscript,
  ) as readonly PostgresExampleStepResultWithObservers<SessionId>[];

// "Step 0": both sessions, side by side, looking at the same row before Session A
// does anything — the shared baseline everything else branches from.
const baselineTimeline: readonly {
  explanation?: string;
  step: PostgresExampleStepResult<SessionId>;
}[] = [
  { step: sessionSteps[0]! },
  {
    explanation:
      "Same starting point for both — before Session A touches anything, this is the one committed row version that exists, and both sessions agree on it.",
    step: sessionSteps[0]!.observedBy![0]!,
  },
];

// The rest of "Two concurrent transactions" as one flat, in-order timeline: Session
// A's numbered steps with each step's Session B checkpoint (if any) spliced in right
// after it. Every entry here — A or B — renders through the same TranscriptStep
// widget below.
const concurrentTimeline: readonly {
  explanation?: string;
  step: PostgresExampleStepResult<SessionId>;
}[] = [
  { step: sessionSteps[1]! },
  {
    explanation:
      "Session A's new row version already exists on disk, xmin and all, but MVCC keeps it invisible to every other session until it commits — this is what stops dirty reads.",
    step: sessionSteps[1]!.observedBy![0]!,
  },
  { step: sessionSteps[2]! },
  { step: sessionSteps[3]! },
  { step: sessionSteps[4]! },
  {
    explanation:
      "Now that Session A has committed, a fresh SELECT gets a fresh snapshot. A SELECT issued earlier, inside an open REPEATABLE READ or SERIALIZABLE transaction, would keep seeing the old row — that's the subject of the isolation-levels lesson.",
    step: sessionSteps[4]!.observedBy![0]!,
  },
];

function toLessonSqlState(outcome: PostgresExampleStepOutcome): LessonSqlState {
  return outcome.status === "done"
    ? { output: outcome.output, status: "done" }
    : { message: outcome.message, status: "error" };
}

export default function Mvcc() {
  const plainSelect = useLessonSqlExample({
    query: plainSelectQuery,
    sqlLoad: databaseInit.query,
  });
  const hiddenColumns = useLessonSqlExample({
    query: hiddenColumnsQuery,
    sqlLoad: databaseInit.query,
  });
  const twoInsertsOneTransaction = useLessonSqlExample({
    query: twoInsertsOneTransactionQuery,
    sqlLoad: databaseInit.query,
  });
  const updateChangesXmin = useLessonSqlExample({
    query: updateChangesXminQuery,
    sqlLoad: databaseInit.query,
  });

  return (
    <CourseLessonPage
      exercises={exercises}
      lessonId="mvcc"
      whatWeLearned={[
        {
          concept: "MVCC",
          url: "https://www.postgresql.org/docs/current/mvcc-intro.html",
          description: (
            <>
              Multi-Version Concurrency Control: Postgres never overwrites a row in place.
              Every write creates a new row version, so readers never block writers and
              writers never block readers.
            </>
          ),
        },
        {
          concept: "xmin",
          url: "https://www.postgresql.org/docs/current/ddl-system-columns.html",
          description: (
            <>
              A hidden column on every row: the id of the transaction that created this
              row version.
            </>
          ),
        },
        {
          concept: "xmax",
          url: "https://www.postgresql.org/docs/current/ddl-system-columns.html",
          description: (
            <>
              A hidden column on every row: the id of the transaction that ended this row
              version — 0 while it's still the live version.
            </>
          ),
        },
        {
          concept: "Dead tuple",
          url: "https://www.postgresql.org/docs/current/routine-vacuuming.html",
          description: (
            <>
              A row version nothing can see anymore once every transaction that could
              still need it is gone — reclaimed by <InlineCode>VACUUM</InlineCode>.
            </>
          ),
        },
      ]}
    >
      <Paragraphs>
        <p>
          The{" "}
          <Link
            className="text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900"
            to="/lessons/insert-update-delete"
          >
            Insert, update, delete, upsert
          </Link>{" "}
          lesson mentioned that Postgres never overwrites a row in place — that's{" "}
          <a
            className="text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900"
            href="https://www.postgresql.org/docs/current/mvcc-intro.html"
            rel="noreferrer"
            target="_blank"
          >
            MVCC
          </a>{" "}
          (Multi-Version Concurrency Control). This lesson goes deeper: every row secretly
          carries the two system columns that make MVCC work,{" "}
          <InlineCode>xmin</InlineCode> and <InlineCode>xmax</InlineCode>, and we'll read
          them directly to watch a row version get created, live, inside a real{" "}
          <InlineCode>BEGIN ... COMMIT</InlineCode>.
        </p>
      </Paragraphs>

      <Section>
        <Title2 id="the-migration">The migration</Title2>
        <Paragraph>
          One table, <InlineCode>accounts</InlineCode>. Empty, as far as MVCC goes — there
          is no <InlineCode>xmin</InlineCode> or <InlineCode>xmax</InlineCode> column
          declared anywhere in here.
        </Paragraph>
        <div className="mt-4">
          <SqlCodeViewer code={migration} />
        </div>
      </Section>

      <Section>
        <Title2 id="the-seed">The seed</Title2>
        <Paragraph>
          This is what creates checking and savings, the two rows we'll be watching.
        </Paragraph>
        <div className="mt-4">
          <SqlCodeViewer code={seed} />
        </div>
      </Section>

      <LessonSection>
        <Title2 id="a-normal-select">A normal SELECT</Title2>
        <Paragraph>
          Nothing unusual — just the columns declared in the migration above.
        </Paragraph>
        <div className="mt-4">
          <SqlCodeViewer code={plainSelectQuery} databaseInitId={databaseInit.id} />
        </div>
        <div className="mt-4">
          <SqlResult execution={plainSelect} />
        </div>
      </LessonSection>

      <LessonSection>
        <Title2 id="select-the-hidden-columns">Select the hidden columns</Title2>
        <Paragraphs>
          <p>
            Even though the migration never declared them, every row secretly carries{" "}
            <InlineCode>xmin</InlineCode> and <InlineCode>xmax</InlineCode> — Postgres
            adds them to every table automatically, and you can select them like any other
            column.
          </p>
        </Paragraphs>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-7 text-zinc-800">
          <li>
            <InlineCode>xmin</InlineCode> — the id of the transaction that created this
            row version.
          </li>
          <li>
            <InlineCode>xmax</InlineCode> — the id of the transaction that ended it.{" "}
            <InlineCode>0</InlineCode> means nothing has, so this is the live version.
          </li>
          <li>
            <InlineCode>ctid</InlineCode> — this row version's physical location on disk.
          </li>
        </ul>
        <div className="mt-4">
          <SqlCodeViewer code={hiddenColumnsQuery} databaseInitId={databaseInit.id} />
        </div>
        <div className="mt-4">
          <SqlResult execution={hiddenColumns} />
        </div>
        <Paragraph>
          <InlineCode>(0,1)</InlineCode> isn't a transaction id — that's{" "}
          <InlineCode>ctid</InlineCode>, formatted as (page number, position on that
          page). checking landed in slot 1 of page 0, savings in slot 2 of the same page.
          They differ because they're two different rows, each with its own physical slot
          — not because two transactions ran. Both actually share the same{" "}
          <InlineCode>xmin</InlineCode> above, since the seed's single{" "}
          <InlineCode>INSERT</InlineCode> statement created them both in one transaction.
        </Paragraph>
      </LessonSection>

      <LessonSection>
        <Title2 id="two-inserts-one-transaction">Two inserts, one transaction</Title2>
        <Paragraph>
          Two separate <InlineCode>INSERT</InlineCode> statements, but one transaction:
          both new rows come back with the same <InlineCode>xmin</InlineCode>.{" "}
          <InlineCode>xmin</InlineCode> is stamped by the transaction, not the statement —
          anything that same transaction creates or changes shares it.
        </Paragraph>
        <div className="mt-4">
          <SqlCodeViewer
            code={twoInsertsOneTransactionQuery}
            databaseInitId={databaseInit.id}
          />
        </div>
        <div className="mt-4">
          <SqlResult execution={twoInsertsOneTransaction} />
        </div>
        <Paragraph>
          payroll and reserve come back with the same <InlineCode>xmin</InlineCode> —
          proof it tracks the transaction, not the statement. Without the explicit{" "}
          <InlineCode>BEGIN</InlineCode>/<InlineCode>COMMIT</InlineCode> wrapping them,
          each <InlineCode>INSERT</InlineCode> would run as its own implicit,
          auto-committed transaction and get a different <InlineCode>xmin</InlineCode> —
          the same way checking and savings differ in <InlineCode>ctid</InlineCode> above
          but not in <InlineCode>xmin</InlineCode>, because that seed was one statement
          too.
        </Paragraph>
      </LessonSection>

      <LessonSection>
        <Title2 id="update-changes-xmin">xmin changes on UPDATE</Title2>
        <Paragraph>
          <InlineCode>UPDATE</InlineCode> doesn't touch the row you had — it writes a
          brand new row version stamped with the current transaction's id as its{" "}
          <InlineCode>xmin</InlineCode>. Compare the number below to checking's{" "}
          <InlineCode>xmin</InlineCode> above: it's a new, higher transaction id, even
          though <InlineCode>id</InlineCode> and <InlineCode>name</InlineCode> didn't
          change.
        </Paragraph>
        <div className="mt-4">
          <SqlCodeViewer code={updateChangesXminQuery} databaseInitId={databaseInit.id} />
        </div>
        <div className="mt-4">
          <SqlResult execution={updateChangesXmin} />
        </div>
      </LessonSection>

      <LessonSection>
        <div>
          <Title2 id="two-concurrent-transactions">Two concurrent transactions</Title2>
          <Paragraphs>
            <p>
              Two transactions are about to touch the same row, in the same{" "}
              <Link
                className="text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900"
                to="/dbviewer/mvcc.database-init"
              >
                migration and seed
              </Link>{" "}
              as above. Session A opens a transaction, updates checking's balance, and
              holds that change open for a moment before committing. Session B just runs
              plain <InlineCode>SELECT</InlineCode>s against that same row, once while
              Session A's change is still uncommitted and once after it commits — watch
              what changes between those two checks.
            </p>
            <p className="mt-3">
              Both sessions below are real — two genuinely separate, concurrently-open
              connections to one real Postgres server, exactly like two{" "}
              <InlineCode>psql</InlineCode> windows. Session A's steps run in order on its
              connection — a real <InlineCode>BEGIN</InlineCode>, an uncommitted{" "}
              <InlineCode>UPDATE</InlineCode>, a real <InlineCode>COMMIT</InlineCode>.
              Session B's checks run on a second connection while Session A's transaction
              is still open, so its results are whatever Postgres's own MVCC visibility
              rules actually hand back — nothing simulated or narrated. (This only works
              server-side, at build time — the browser's playground runs on PGlite, a
              single-connection engine, so both sessions' full transcripts are precomputed
              once against a real Postgres and baked into this page rather than re-run on
              every visit.)
            </p>
          </Paragraphs>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {baselineTimeline.map((entry, index) => (
            <TranscriptStep
              key={index}
              explanation={entry.explanation}
              step={entry.step}
              stepNumber={0}
            />
          ))}
        </div>
        <div className="flex flex-col gap-4">
          {concurrentTimeline.map((entry, index) => (
            <TranscriptStep
              key={index}
              explanation={entry.explanation}
              step={entry.step}
              stepNumber={index + 1}
            />
          ))}
        </div>
        <Paragraph>
          Readers never wait on writers, and writers never wait on readers — Session A and
          Session B were never blocked by each other. They were just looking at different
          row versions of the same row.
        </Paragraph>
      </LessonSection>
    </CourseLessonPage>
  );
}

// Session A's badge is dark, Session B's is blue — the only thing that varies
// between steps in the timeline below. Every step here is precomputed, static data
// from postgres-examples.generated.json (see sessionSteps above) — none of them
// execute anything at render time, whichever session they belong to.
function TranscriptStep({
  explanation,
  step,
  stepNumber,
}: {
  explanation?: string | undefined;
  step: PostgresExampleStepResult<SessionId>;
  stepNumber: number;
}) {
  return (
    <div className="border border-zinc-200 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`rounded-sm px-2 py-0.5 font-mono text-xs font-semibold uppercase text-white ${step.pgSessionId === "A" ? "bg-zinc-950" : "bg-sky-700"}`}
        >
          Session {step.pgSessionId}
        </span>
        <span className="font-mono text-xs uppercase tracking-wide text-zinc-500">
          Step {stepNumber}
        </span>
        {step.label ? <span className="text-sm text-zinc-700">{step.label}</span> : null}
      </div>
      <div className="mt-3">
        <SqlCodeViewer code={step.query} />
      </div>
      <div className="mt-3">
        <SqlResult execution={toLessonSqlState(step)} />
      </div>
      {explanation ? (
        <p className="mt-3 text-base leading-7 text-zinc-800">{explanation}</p>
      ) : null}
    </div>
  );
}
