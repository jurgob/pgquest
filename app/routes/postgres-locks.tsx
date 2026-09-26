import { Link } from "react-router";

import { SQL_EXAMPLE_IDS } from "../../cli_examples/types";
import {
  alterTakesAccessExclusiveQuery,
  blockingQuery,
  databaseInit,
  deadlockFixScript,
  exercises,
  migration,
  migrationWithLockTimeoutScript,
  seed,
  selectTakesAccessShareQuery,
  SESSION_IDS,
  updateTakesRowExclusiveQuery,
} from "../../cli_examples/postgres-locks.sql";
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
import type { SqlExampleId } from "../../cli_examples/types";

type SessionId = (typeof SESSION_IDS)[number];

type TimelineEntry = {
  explanation?: string;
  step: PostgresExampleStepResult<SessionId>;
};

function transcriptSteps(
  id: SqlExampleId,
): readonly PostgresExampleStepResultWithObservers<SessionId>[] {
  return getPostgresTranscriptSteps(
    id,
  ) as readonly PostgresExampleStepResultWithObservers<SessionId>[];
}

// Flattens a transcript into one in-order timeline (each step, then its observedBy
// checkpoints, if any). `explanations` is keyed by position in that flat list.
function flattenTranscript(
  id: SqlExampleId,
  explanations: Readonly<Record<number, string>>,
): readonly TimelineEntry[] {
  const entries = transcriptSteps(id).flatMap((step) => [
    step,
    ...(step.observedBy ?? []),
  ]);
  return entries.map((step, index) => {
    const explanation = explanations[index];
    return explanation === undefined ? { step } : { explanation, step };
  });
}

const tableLockTimeline = flattenTranscript(
  SQL_EXAMPLE_IDS.postgresLocksTableLockTranscript,
  {
    0: "Session A only reads, but its transaction keeps the ACCESS SHARE lock on accounts until it ends, not just while the SELECT runs.",
    1: "An UPDATE needs ROW EXCLUSIVE, which doesn't conflict with ACCESS SHARE, so it goes straight through.",
    2: "ALTER TABLE needs ACCESS EXCLUSIVE, which conflicts with every mode, including Session A's ACCESS SHARE. So Session B waits until Session A's transaction ends.",
    3: "Session C only wants to read, and reading doesn't conflict with Session A. But it does conflict with the ACCESS EXCLUSIVE lock Session B is waiting for, and Postgres grants conflicting lock requests in the order they arrive. So Session C waits behind Session B.",
    4: "granted = false is what waiting looks like in pg_locks: Session A holds its lock, Sessions B and C are queued.",
    5: "pg_blocking_pids() shows the chain: C waits for B, which waits for A. Every new query on accounts would join the back of this queue.",
    6: "Session A commits and releases its lock. Session B's ALTER TABLE runs, then Session C's SELECT: both finished right after this step.",
  },
);

const rowLockTimeline = flattenTranscript(
  SQL_EXAMPLE_IDS.postgresLocksRowLockTranscript,
  {
    0: "Session A now holds a row lock on alice's row, until its transaction ends.",
    1: "Reading is never blocked by a row lock: Session B sees the last committed version of alice's row (1000), exactly as in the MVCC lesson.",
    2: "Same table, different row: no conflict. Row locks are per row.",
    3: "Same row: Session B waits for Session A's transaction to end. When it finally runs, it starts from Session A's committed 900, not the 1000 it read in step 2.",
    4: "The row lock itself isn't in pg_locks, but waiting for it is: Session B waits (granted = false) for a ShareLock on Session A's transaction id, which Session A holds until it commits. The tuple lock marks Session B as first in line for alice's row. Session B's own transaction id lock is there because it already updated bob's row.",
    5: "The commit releases Session A's transaction id lock, and Session B's update finishes.",
  },
);

const rowLockStrengthTimeline = flattenTranscript(
  SQL_EXAMPLE_IDS.postgresLocksRowLockStrengthTranscript,
  {
    1: "Inserting a transfer for alice makes Postgres check the foreign key, which takes FOR KEY SHARE on alice's accounts row. FOR KEY SHARE conflicts with FOR UPDATE, so the insert waits for Session A to commit.",
    4: "FOR NO KEY UPDATE promises not to change alice's id, so the foreign-key check's FOR KEY SHARE doesn't conflict with it, and the insert goes straight through.",
  },
);

const queueTimeline = flattenTranscript(SQL_EXAMPLE_IDS.postgresLocksQueueTranscript, {
  1: "SKIP LOCKED skips any row someone else has locked and takes the next one. That's how you build a job queue on a plain table.",
  2: "A plain FOR UPDATE waits for the locked row. When Worker A commits, transfer 1 is no longer pending, so Postgres re-checks the WHERE clause and moves on to transfer 2: Worker C waited only to end up with a different row.",
  3: "NOWAIT fails immediately instead of waiting.",
});

const deadlockTimeline = flattenTranscript(
  SQL_EXAMPLE_IDS.postgresLocksDeadlockTranscript,
  {
    2: "Session A needs bob's row, which Session B holds, so it waits.",
    3: "Now Session B needs alice's row, which Session A holds: each waits for the other. After deadlock_timeout (1 second by default), Postgres finds the cycle and cancels Session A's statement with \"deadlock detected\". That releases alice's row, and Session B's update goes through.",
    4: "An error aborts Session A's whole transaction, so all it can do is roll back, undoing its first update too.",
    5: "Only Session B's transfer happened.",
  },
);

// Postgres's table-level lock conflict matrix, from
// https://www.postgresql.org/docs/current/explicit-locking.html#LOCKING-TABLES
const TABLE_LOCK_MODES: readonly {
  conflicts: readonly number[];
  mode: string;
  short: string;
  takenBy: string;
}[] = [
  { mode: "ACCESS SHARE", short: "AS", takenBy: "SELECT", conflicts: [8] },
  {
    mode: "ROW SHARE",
    short: "RS",
    takenBy: "SELECT ... FOR UPDATE / FOR SHARE",
    conflicts: [7, 8],
  },
  {
    mode: "ROW EXCLUSIVE",
    short: "RE",
    takenBy: "INSERT, UPDATE, DELETE, MERGE",
    conflicts: [5, 6, 7, 8],
  },
  {
    mode: "SHARE UPDATE EXCLUSIVE",
    short: "SUE",
    takenBy: "VACUUM, ANALYZE, CREATE INDEX CONCURRENTLY",
    conflicts: [4, 5, 6, 7, 8],
  },
  {
    mode: "SHARE",
    short: "S",
    takenBy: "CREATE INDEX",
    conflicts: [3, 4, 6, 7, 8],
  },
  {
    mode: "SHARE ROW EXCLUSIVE",
    short: "SRE",
    takenBy: "CREATE TRIGGER, ADD FOREIGN KEY",
    conflicts: [3, 4, 5, 6, 7, 8],
  },
  {
    mode: "EXCLUSIVE",
    short: "E",
    takenBy: "REFRESH MATERIALIZED VIEW CONCURRENTLY",
    conflicts: [2, 3, 4, 5, 6, 7, 8],
  },
  {
    mode: "ACCESS EXCLUSIVE",
    short: "AE",
    takenBy: "Most ALTER TABLE, DROP, TRUNCATE, VACUUM FULL, LOCK TABLE",
    conflicts: [1, 2, 3, 4, 5, 6, 7, 8],
  },
];

// The lock scopes worth knowing, keyed by pg_locks.locktype where there is one. See
// https://www.postgresql.org/docs/current/view-pg-locks.html for the full list,
// which also includes internal ones (page, tuple, extend, object, virtualxid).
const LOCK_SCOPES: readonly {
  locks: string;
  notes: string;
  scope: string;
  takenBy: string;
}[] = [
  {
    scope: "Table (relation)",
    locks: "A whole table, and also indexes, sequences, and views",
    takenBy: "Every statement, automatically; or LOCK TABLE",
    notes: "Eight modes, from ACCESS SHARE to ACCESS EXCLUSIVE. Visible in pg_locks.",
  },
  {
    scope: "Row",
    locks: "One row",
    takenBy: "UPDATE, DELETE, SELECT ... FOR UPDATE / SHARE, foreign-key checks",
    notes:
      "Four strengths. Stored on the row itself (in xmax), not in pg_locks, so Postgres can lock millions of rows cheaply.",
  },
  {
    scope: "Transaction ID (transactionid)",
    locks: "A running transaction",
    takenBy: "Every transaction that writes, on itself",
    notes:
      "How waiting on a row actually works: a session blocked on a row waits for the holder's transaction id lock, released at commit or rollback.",
  },
  {
    scope: "Advisory (advisory)",
    locks: "A number your application chooses",
    takenBy: "Only your code: pg_advisory_xact_lock() and friends",
    notes:
      "Postgres gives it no meaning. Held until the end of the transaction, or of the session.",
  },
  {
    scope: "Predicate (SIReadLock)",
    locks: "Rows, pages, or tables a SERIALIZABLE transaction has read",
    takenBy: "SERIALIZABLE transactions, automatically",
    notes:
      "Never blocks anyone: it's bookkeeping for detecting write skew (see the isolation levels lesson).",
  },
];

const ROW_LOCK_MODES: readonly {
  conflicts: string;
  mode: string;
  takenBy: string;
}[] = [
  {
    mode: "FOR KEY SHARE",
    takenBy: "Foreign-key checks on the referenced row",
    conflicts: "FOR UPDATE",
  },
  {
    mode: "FOR SHARE",
    takenBy: "SELECT ... FOR SHARE",
    conflicts: "FOR NO KEY UPDATE, FOR UPDATE",
  },
  {
    mode: "FOR NO KEY UPDATE",
    takenBy: "UPDATE that doesn't change a key column",
    conflicts: "FOR SHARE, FOR NO KEY UPDATE, FOR UPDATE",
  },
  {
    mode: "FOR UPDATE",
    takenBy: "DELETE, UPDATE of a key column, SELECT ... FOR UPDATE",
    conflicts: "All four",
  },
];

const linkClassName =
  "text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900";

function toLessonSqlState(outcome: PostgresExampleStepOutcome): LessonSqlState {
  return outcome.status === "done"
    ? { output: outcome.output, status: "done" }
    : { message: outcome.message, status: "error" };
}

export default function PostgresLocks() {
  const selectTakesAccessShare = useLessonSqlExample({
    query: selectTakesAccessShareQuery,
    sqlLoad: databaseInit.query,
  });
  const updateTakesRowExclusive = useLessonSqlExample({
    query: updateTakesRowExclusiveQuery,
    sqlLoad: databaseInit.query,
  });
  const alterTakesAccessExclusive = useLessonSqlExample({
    query: alterTakesAccessExclusiveQuery,
    sqlLoad: databaseInit.query,
  });

  return (
    <CourseLessonPage
      exercises={exercises}
      lessonId="postgres-locks"
      whatWeLearned={[
        {
          concept: "Table-level locks",
          url: "https://www.postgresql.org/docs/current/explicit-locking.html#LOCKING-TABLES",
          description: (
            <>
              Every statement locks the tables it touches in one of eight modes, held
              until the transaction ends. Two sessions conflict only if their modes do.
            </>
          ),
        },
        {
          concept: "ACCESS EXCLUSIVE",
          url: "https://www.postgresql.org/docs/current/explicit-locking.html#LOCKING-TABLES",
          description: (
            <>
              The lock most <InlineCode>ALTER TABLE</InlineCode>s take. It conflicts with
              everything, including plain <InlineCode>SELECT</InlineCode>s.
            </>
          ),
        },
        {
          concept: "Row-level locks",
          url: "https://www.postgresql.org/docs/current/explicit-locking.html#LOCKING-ROWS",
          description: (
            <>
              <InlineCode>FOR KEY SHARE</InlineCode>, <InlineCode>FOR SHARE</InlineCode>,{" "}
              <InlineCode>FOR NO KEY UPDATE</InlineCode>, and{" "}
              <InlineCode>FOR UPDATE</InlineCode>. They block other writers and lockers of
              the same row, never plain readers.
            </>
          ),
        },
        {
          concept: "pg_locks",
          url: "https://www.postgresql.org/docs/current/view-pg-locks.html",
          description: (
            <>
              A system view listing every lock currently held or awaited, by which session
              (<InlineCode>pid</InlineCode>), and whether it was granted.
            </>
          ),
        },
        {
          concept: "NOWAIT / SKIP LOCKED",
          url: "https://www.postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE",
          description: (
            <>
              Instead of waiting for a locked row, fail immediately (
              <InlineCode>NOWAIT</InlineCode>) or skip it (
              <InlineCode>SKIP LOCKED</InlineCode>).
            </>
          ),
        },
        {
          concept: "lock_timeout",
          url: "https://www.postgresql.org/docs/current/runtime-config-client.html#GUC-LOCK-TIMEOUT",
          description: (
            <>
              The longest a statement will wait for a lock before failing. Essential for
              schema migrations on busy tables.
            </>
          ),
        },
        {
          concept: "Deadlock",
          url: "https://www.postgresql.org/docs/current/explicit-locking.html#LOCKING-DEADLOCKS",
          description: (
            <>
              Two transactions each waiting for a lock the other holds. Postgres detects
              it and cancels one; locking rows in a consistent order prevents it.
            </>
          ),
        },
      ]}
    >
      <Paragraphs>
        <p>
          The{" "}
          <Link className={linkClassName} to="/lessons/mvcc">
            MVCC lesson
          </Link>{" "}
          ended on a promise: readers never wait on writers, and writers never wait on
          readers. But two writers changing the same row can't both win, and nobody should
          drop a table while someone else is reading it. That's what locks are for.
        </p>
        <p className="mt-3">
          Postgres takes almost all of its locks automatically, so you rarely write a lock
          statement yourself. What matters is knowing which locks your statements take,
          and what they'll make other sessions wait for. Most of this lesson is about two
          scopes: table-level locks, which every statement takes, and row-level locks,
          which writes take on the rows they change.
        </p>
      </Paragraphs>

      <Section>
        <Title2 id="what-postgres-can-lock">What Postgres can lock</Title2>
        <Paragraph>
          Locks come in different scopes. Each one shows up in{" "}
          <InlineCode>pg_locks</InlineCode>, the system view that lists every lock
          currently held or awaited, under its own <InlineCode>locktype</InlineCode>{" "}
          (except row locks, as you'll see).
        </Paragraph>
        <div className="mt-3 overflow-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr>
                <th className="border-b border-zinc-300 px-3 py-2 font-bold text-zinc-950">
                  Scope
                </th>
                <th className="border-b border-zinc-300 px-3 py-2 font-bold text-zinc-950">
                  What gets locked
                </th>
                <th className="border-b border-zinc-300 px-3 py-2 font-bold text-zinc-950">
                  Taken by
                </th>
                <th className="border-b border-zinc-300 px-3 py-2 font-bold text-zinc-950">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody>
              {LOCK_SCOPES.map((row) => (
                <tr key={row.scope}>
                  <td className="whitespace-nowrap border-b border-zinc-100 px-3 py-2 align-top font-mono">
                    {row.scope}
                  </td>
                  <td className="border-b border-zinc-100 px-3 py-2 align-top text-zinc-800">
                    {row.locks}
                  </td>
                  <td className="border-b border-zinc-100 px-3 py-2 align-top text-zinc-800">
                    {row.takenBy}
                  </td>
                  <td className="border-b border-zinc-100 px-3 py-2 align-top text-zinc-800">
                    {row.notes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Paragraph>
          Almost every lock lasts until its transaction ends; statements can't release
          them early. The one exception is session-level advisory locks (
          <InlineCode>pg_advisory_lock</InlineCode>), which last until you release them or
          disconnect.
        </Paragraph>
      </Section>

      <Section>
        <Title2 id="the-migration">The migration</Title2>
        <Paragraph>
          Accounts, and a queue of transfers that reference them through a foreign key.
          That foreign key will matter later.
        </Paragraph>
        <div className="mt-4">
          <SqlCodeViewer code={migration} />
        </div>
      </Section>

      <Section>
        <Title2 id="the-seed">The seed</Title2>
        <Paragraph>Two accounts and three pending transfers.</Paragraph>
        <div className="mt-4">
          <SqlCodeViewer code={seed} />
        </div>
      </Section>

      <LessonSection>
        <Title2 id="every-statement-takes-a-table-lock">
          Every statement takes a table lock
        </Title2>
        <Paragraphs>
          <p>
            Filtering <InlineCode>pg_locks</InlineCode> to your own session (
            <InlineCode>pid = pg_backend_pid()</InlineCode>) inside an open transaction
            shows exactly what your statements have taken so far. Even a plain{" "}
            <InlineCode>SELECT</InlineCode> takes a lock:
          </p>
        </Paragraphs>
        <SqlCodeViewer
          code={selectTakesAccessShareQuery}
          databaseInitId={databaseInit.id}
        />
        <SqlResult execution={selectTakesAccessShare} />
        <Paragraph>
          Each table gets the lock its statement needs, and the transaction keeps all of
          them until it commits or rolls back:
        </Paragraph>
        <SqlCodeViewer
          code={updateTakesRowExclusiveQuery}
          databaseInitId={databaseInit.id}
        />
        <SqlResult execution={updateTakesRowExclusive} />
        <Paragraph>And a schema change takes the strongest one:</Paragraph>
        <SqlCodeViewer
          code={alterTakesAccessExclusiveQuery}
          databaseInitId={databaseInit.id}
        />
        <SqlResult execution={alterTakesAccessExclusive} />
      </LessonSection>

      <LessonSection>
        <Title2 id="the-eight-table-lock-modes">The eight table lock modes</Title2>
        <Paragraphs>
          <p>
            Every table-level lock is one of eight modes, from weakest to strongest. A
            lock only makes another session wait if the two modes conflict (✕ below). Most
            combinations don't: a thousand sessions can read and write the same table at
            once, because <InlineCode>ACCESS SHARE</InlineCode> and{" "}
            <InlineCode>ROW EXCLUSIVE</InlineCode> are compatible.
          </p>
          <p className="mt-3">
            Don't let the names mislead you: <InlineCode>ROW SHARE</InlineCode> and{" "}
            <InlineCode>ROW EXCLUSIVE</InlineCode> are table-level locks too. The names
            are historical.
          </p>
        </Paragraphs>
        <div className="overflow-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr>
                <th className="border-b border-zinc-300 px-3 py-2 font-bold text-zinc-950">
                  Mode
                </th>
                <th className="border-b border-zinc-300 px-3 py-2 font-bold text-zinc-950">
                  Taken by
                </th>
                {TABLE_LOCK_MODES.map((column) => (
                  <th
                    className="border-b border-zinc-300 px-2 py-2 text-center font-mono text-xs font-bold text-zinc-950"
                    key={column.short}
                    title={column.mode}
                  >
                    {column.short}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TABLE_LOCK_MODES.map((row) => (
                <tr key={row.mode}>
                  <td className="whitespace-nowrap border-b border-zinc-100 px-3 py-2 align-top font-mono">
                    {row.mode}{" "}
                    <span className="text-xs text-zinc-500">({row.short})</span>
                  </td>
                  <td className="border-b border-zinc-100 px-3 py-2 align-top text-zinc-800">
                    {row.takenBy}
                  </td>
                  {TABLE_LOCK_MODES.map((column, columnIndex) => (
                    <td
                      className="border-b border-zinc-100 px-2 py-2 text-center align-top font-bold text-red-700"
                      key={column.short}
                    >
                      {row.conflicts.includes(columnIndex + 1) ? "✕" : ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </LessonSection>

      <LessonSection>
        <div>
          <Title2 id="when-table-locks-collide">When table locks collide</Title2>
          <Paragraphs>
            <p>
              Each session below is a real, separate connection to one real Postgres
              server, like several <InlineCode>psql</InlineCode> windows open side by
              side, run at build time the same way as in the MVCC lesson. Session A holds
              a transaction open while the others use the same table, and Session D looks
              at what's going on.
            </p>
            <p className="mt-3">
              Some statements genuinely wait for a lock. Those steps are marked, and show
              the result they returned once they finally got it, and after which step that
              happened.
            </p>
          </Paragraphs>
        </div>
        <Timeline entries={tableLockTimeline} />
        <Paragraph>
          This is why schema migrations on busy tables are risky: while an{" "}
          <InlineCode>ALTER TABLE</InlineCode> holds or even just waits for{" "}
          <InlineCode>ACCESS EXCLUSIVE</InlineCode>, every new query on that table queues
          behind it, like Session C did. See the{" "}
          <a className={linkClassName} href="#not-waiting">
            lock_timeout
          </a>{" "}
          section below for the standard defense.
        </Paragraph>
      </LessonSection>

      <LessonSection>
        <div>
          <Title2 id="row-level-locks">Row-level locks</Title2>
          <Paragraphs>
            <p>
              Table locks alone can't stop two sessions from updating the same row at
              once: both only need the compatible <InlineCode>ROW EXCLUSIVE</InlineCode>.
              So every <InlineCode>UPDATE</InlineCode> and <InlineCode>DELETE</InlineCode>{" "}
              also locks each row it changes, until the transaction ends.
            </p>
            <p className="mt-3">
              Row locks don't show up in <InlineCode>pg_locks</InlineCode>. Postgres
              records them on the row itself, in the same <InlineCode>xmax</InlineCode>{" "}
              column you saw in the MVCC lesson, so it can lock millions of rows without
              running out of lock memory.
            </p>
          </Paragraphs>
        </div>
        <Timeline entries={rowLockTimeline} />
      </LessonSection>

      <LessonSection>
        <div>
          <Title2 id="four-row-lock-strengths">Four strengths of row lock</Title2>
          <Paragraphs>
            <p>
              Like table locks, row locks come in modes. You can take them explicitly with{" "}
              <InlineCode>SELECT ... FOR ...</InlineCode>, and writes take them
              automatically:
            </p>
          </Paragraphs>
        </div>
        <div className="overflow-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr>
                <th className="border-b border-zinc-300 px-3 py-2 font-bold text-zinc-950">
                  Row lock
                </th>
                <th className="border-b border-zinc-300 px-3 py-2 font-bold text-zinc-950">
                  Taken by
                </th>
                <th className="border-b border-zinc-300 px-3 py-2 font-bold text-zinc-950">
                  Conflicts with
                </th>
              </tr>
            </thead>
            <tbody>
              {ROW_LOCK_MODES.map((row) => (
                <tr key={row.mode}>
                  <td className="whitespace-nowrap border-b border-zinc-100 px-3 py-2 align-top font-mono">
                    {row.mode}
                  </td>
                  <td className="border-b border-zinc-100 px-3 py-2 align-top text-zinc-800">
                    {row.takenBy}
                  </td>
                  <td className="border-b border-zinc-100 px-3 py-2 align-top text-zinc-800">
                    {row.conflicts}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Paragraphs>
          <p>
            The subtle one is <InlineCode>FOR KEY SHARE</InlineCode>. Every time you
            insert a transfer, Postgres checks that its account exists and locks that
            account row <InlineCode>FOR KEY SHARE</InlineCode>, so nobody can delete it
            before the insert commits. That makes <InlineCode>FOR UPDATE</InlineCode> on a
            parent row surprisingly expensive: it blocks inserts into every child table.
          </p>
        </Paragraphs>
        <Timeline entries={rowLockStrengthTimeline} />
        <Paragraph>
          A plain <InlineCode>UPDATE accounts SET balance = ...</InlineCode> takes{" "}
          <InlineCode>FOR NO KEY UPDATE</InlineCode> automatically, since it doesn't touch
          the key. So when you lock rows yourself before updating them, prefer{" "}
          <InlineCode>FOR NO KEY UPDATE</InlineCode> over{" "}
          <InlineCode>FOR UPDATE</InlineCode> unless you're about to delete the row or
          change its key. This is the conflict the{" "}
          <Link className={linkClassName} to="/lessons/concurrency-reservation-system">
            reservation system lesson
          </Link>{" "}
          mentions when it avoids locking the user row.
        </Paragraph>
      </LessonSection>

      <LessonSection>
        <div>
          <Title2 id="not-waiting">Not waiting: NOWAIT, SKIP LOCKED, lock_timeout</Title2>
          <Paragraphs>
            <p>
              Waiting is the default, and it's usually right. But sometimes waiting is the
              bug. Take a queue of transfers processed by several workers: each worker
              grabs the oldest pending transfer and locks it while working on it.
            </p>
          </Paragraphs>
        </div>
        <Timeline entries={queueTimeline} />
        <Paragraphs>
          <p>
            <InlineCode>NOWAIT</InlineCode> and <InlineCode>SKIP LOCKED</InlineCode> only
            apply to row locks taken with <InlineCode>SELECT ... FOR ...</InlineCode>. For
            everything else, including table locks, there's{" "}
            <InlineCode>lock_timeout</InlineCode>: the longest a statement will wait for a
            lock before failing. The most important place to use it is schema migrations,
            so a migration stuck behind a long-running transaction, like Session B's{" "}
            <InlineCode>ALTER TABLE</InlineCode> earlier, gives up instead of making every
            other query on the table queue behind it:
          </p>
        </Paragraphs>
        <SqlCodeViewer code={migrationWithLockTimeoutScript} />
      </LessonSection>

      <LessonSection>
        <div>
          <Title2 id="deadlocks">Deadlocks</Title2>
          <Paragraphs>
            <p>
              Two transfers run at the same time, alice to bob and bob to alice. Each
              locks its first row, then waits for the row the other one already holds.
              Neither can ever continue on its own:
            </p>
          </Paragraphs>
        </div>
        <Timeline entries={deadlockTimeline} />
        <Paragraphs>
          <p>
            A deadlock isn't a bug in Postgres, and it doesn't corrupt anything: one
            transaction is cancelled, the other proceeds. Your application should catch{" "}
            <InlineCode>deadlock detected</InlineCode> (SQLSTATE{" "}
            <InlineCode>40P01</InlineCode>) and retry the cancelled transaction.
          </p>
          <p className="mt-3">
            The real fix is to make the cycle impossible: have every transaction lock the
            rows it needs in the same order. Then the second transfer waits for the first
            instead of deadlocking with it:
          </p>
        </Paragraphs>
        <SqlCodeViewer code={deadlockFixScript} />
      </LessonSection>

      <LessonSection>
        <Title2 id="who-is-blocking-whom">Who is blocking whom?</Title2>
        <Paragraph>
          When queries pile up in production, this is the first query to run. It's the one
          Session D ran earlier: for every session waiting on a lock, it shows which
          sessions are in its way, using <InlineCode>pg_blocking_pids()</InlineCode>.
        </Paragraph>
        <SqlCodeViewer code={blockingQuery} />
        <Paragraph>
          Follow the chain to the session at its head, and check that session's{" "}
          <InlineCode>state</InlineCode> in <InlineCode>pg_stat_activity</InlineCode>. The
          classic culprit is <InlineCode>idle in transaction</InlineCode>: an application
          that opened a transaction, took some locks, and never committed.{" "}
          <InlineCode>pg_terminate_backend(pid)</InlineCode> ends it, and{" "}
          <InlineCode>idle_in_transaction_session_timeout</InlineCode> stops it from
          happening again.
        </Paragraph>
      </LessonSection>

      <LessonSection>
        <Title2 id="advisory-locks">Advisory locks</Title2>
        <Paragraph>
          Every lock so far protects a table or a row. Sometimes you need to protect an
          idea instead, like "only one request at a time for this user and this event",
          where there's no single row to lock. Advisory locks lock an arbitrary number
          that your application chooses the meaning of. The{" "}
          <Link className={linkClassName} to="/lessons/concurrency-reservation-system">
            reservation system lesson
          </Link>{" "}
          uses one to close a real race condition.
        </Paragraph>
      </LessonSection>

      <LessonSection>
        <Title2 id="rules-of-thumb">Rules of thumb</Title2>
        <ul className="list-disc space-y-2 pl-5 text-base leading-7 text-zinc-800">
          <li>
            Keep transactions short. Every lock is held until the transaction ends, so a
            transaction left open while your app calls another service holds its locks the
            whole time.
          </li>
          <li>
            Set <InlineCode>lock_timeout</InlineCode> in migrations, and prefer{" "}
            <InlineCode>CREATE INDEX CONCURRENTLY</InlineCode>, which takes{" "}
            <InlineCode>SHARE UPDATE EXCLUSIVE</InlineCode> instead of{" "}
            <InlineCode>SHARE</InlineCode> and so doesn't block writes.
          </li>
          <li>
            Use <InlineCode>FOR NO KEY UPDATE</InlineCode> rather than{" "}
            <InlineCode>FOR UPDATE</InlineCode> unless you're deleting the row or changing
            its key.
          </li>
          <li>
            Lock rows in a consistent order to avoid deadlocks, and retry when one happens
            anyway.
          </li>
          <li>
            For work queues, use <InlineCode>FOR UPDATE SKIP LOCKED</InlineCode>.
          </li>
          <li>
            When something is stuck, <InlineCode>pg_locks</InlineCode> and{" "}
            <InlineCode>pg_blocking_pids(pid)</InlineCode> tell you who is waiting on
            whom.
          </li>
        </ul>
      </LessonSection>
    </CourseLessonPage>
  );
}

function Timeline({ entries }: { entries: readonly TimelineEntry[] }) {
  return (
    <div className="flex flex-col gap-4">
      {entries.map((entry, index) => (
        <TranscriptStep
          explanation={entry.explanation}
          key={index}
          step={entry.step}
          stepNumber={index + 1}
        />
      ))}
    </div>
  );
}

const SESSION_BADGE_CLASSNAMES: Record<SessionId, string> = {
  A: "bg-zinc-950",
  B: "bg-sky-700",
  C: "bg-emerald-700",
  D: "bg-violet-700",
};

// Every step is precomputed, static data from app/generated/postgres-examples.json;
// nothing executes at render time.
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
          className={`rounded-sm px-2 py-0.5 font-mono text-xs font-semibold uppercase text-white ${SESSION_BADGE_CLASSNAMES[step.pgSessionId]}`}
        >
          Session {step.pgSessionId}
        </span>
        <span className="font-mono text-xs uppercase tracking-wide text-zinc-500">
          Step {stepNumber}
        </span>
        {step.label ? <span className="text-sm text-zinc-700">{step.label}</span> : null}
        {step.blocks && step.unblockedAfter !== undefined ? (
          <span className="rounded-sm border border-amber-300 bg-amber-50 px-2 py-0.5 font-mono text-xs font-semibold text-amber-800">
            Waits for a lock · finished after step {step.unblockedAfter + 1}
          </span>
        ) : null}
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
