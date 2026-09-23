import type { Route } from "./+types/transaction-isolation-levels";
import {
  aliceAloneQuery,
  databaseInit,
  exercises,
  readCommittedScript,
  readUncommittedScript,
  repeatableReadScript,
  serializableScript,
} from "../../cli_examples/transaction-isolation-levels.sql";
import { IsolationWriteSkewDiagram } from "../sql/isolation-write-skew-diagram";
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

export function meta(_args: Route.MetaArgs) {
  return [
    { title: "pgquest | Lesson 20" },
    {
      name: "description",
      content: "Compare Postgres transaction isolation levels with a write-skew bug.",
    },
  ];
}

const ISOLATION_LEVELS: { level: string; sees: string }[] = [
  {
    level: "READ UNCOMMITTED",
    sees: "Accepted, but treated exactly like READ COMMITTED. Postgres has no dirty reads.",
  },
  {
    level: "READ COMMITTED (default)",
    sees: "Every statement re-reads the latest committed data, even mid-transaction.",
  },
  {
    level: "REPEATABLE READ",
    sees: "The whole transaction sees one snapshot, frozen at its first query.",
  },
  {
    level: "SERIALIZABLE",
    sees: "Same frozen snapshot, plus conflict detection: as if transactions ran one at a time.",
  },
];

const TRADEOFFS: { cost: string; level: string; protects: string }[] = [
  {
    level: "READ UNCOMMITTED",
    protects: "Nothing extra — identical to READ COMMITTED in Postgres.",
    cost: "None. It's free, but also pointless to ask for.",
  },
  {
    level: "READ COMMITTED (default)",
    protects: 'Nothing beyond "don\'t read uncommitted data."',
    cost: "Cheapest: no extra locking, never aborts a transaction for isolation reasons.",
  },
  {
    level: "REPEATABLE READ",
    protects: "Non-repeatable reads, phantom reads.",
    cost: "Holds a snapshot open for the whole transaction; a concurrent write to a row you also wrote aborts your transaction immediately.",
  },
  {
    level: "SERIALIZABLE",
    protects:
      'Everything above, plus write skew — a real "as if run one at a time" guarantee.',
    cost: "Highest overhead: tracks read/write dependencies across every concurrent SERIALIZABLE transaction. More aborts (SQLSTATE 40001) — your app must catch and retry them.",
  },
];

export default function TransactionIsolationLevels() {
  const aliceAlone = useLessonSqlExample({
    query: aliceAloneQuery,
    sqlLoad: databaseInit.query,
  });

  return (
    <LessonPage
      activeLesson="transaction-isolation-levels"
      defaultQuery={aliceAloneQuery}
      exercises={exercises}
      preloadId={databaseInit.id}
      sqlLoad={databaseInit.query}
      title="Transaction isolation levels"
      whatWeLearned={[
        {
          concept: "READ COMMITTED",
          url: "https://www.postgresql.org/docs/current/transaction-iso.html#XACT-READ-COMMITTED",
          description: (
            <>
              Postgres's default. Each statement gets a fresh view of committed data, even
              inside an open transaction.
            </>
          ),
        },
        {
          concept: "REPEATABLE READ",
          url: "https://www.postgresql.org/docs/current/transaction-iso.html#XACT-REPEATABLE-READ",
          description: (
            <>
              The whole transaction sees one snapshot taken at its first query — later
              commits from other transactions stay invisible to it.
            </>
          ),
        },
        {
          concept: "SERIALIZABLE",
          url: "https://www.postgresql.org/docs/current/transaction-iso.html#XACT-SERIALIZABLE",
          description: (
            <>
              Adds real conflict detection on top of REPEATABLE READ's snapshot: if the
              result wouldn't match some one-at-a-time ordering of the transactions,
              Postgres rejects one of the commits instead of allowing it.
            </>
          ),
        },
        {
          concept: "Write skew",
          url: "https://www.postgresql.org/docs/current/transaction-iso.html#XACT-SERIALIZABLE",
          description: (
            <>
              Two transactions each read a shared fact, each act on what they read, and
              each commit successfully — but only because neither saw the other's change.
              Individually valid, together wrong.
            </>
          ),
        },
        {
          concept: "SQLSTATE 40001",
          url: "https://www.postgresql.org/docs/current/errcodes-appendix.html",
          description: (
            <>
              The error code for a SERIALIZABLE conflict. An application using
              SERIALIZABLE is expected to catch it and retry the transaction.
            </>
          ),
        },
        {
          concept: "SET TRANSACTION ISOLATION LEVEL",
          url: "https://www.postgresql.org/docs/current/sql-set-transaction.html",
          description: (
            <>
              Sets the isolation level for the current transaction; also settable as{" "}
              <InlineCode>BEGIN ISOLATION LEVEL ...</InlineCode>.
            </>
          ),
        },
      ]}
    >
      <Paragraphs>
        <p>
          Every transaction runs at one of four isolation levels. The level decides one
          thing: how much of what other, concurrent transactions are doing your
          transaction is allowed to see.
        </p>
        <p>
          Postgres implements only three of them for real —{" "}
          <InlineCode>READ UNCOMMITTED</InlineCode> is accepted for standards compliance
          and silently upgraded. Here's what each one actually guarantees, from the{" "}
          <a
            className="text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900"
            href="https://www.postgresql.org/docs/current/transaction-iso.html"
            rel="noreferrer"
            target="_blank"
          >
            official docs
          </a>
          :
        </p>
      </Paragraphs>

      <Section>
        <div className="mt-3 overflow-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr>
                <th className="border-b border-zinc-300 px-3 py-2 font-bold text-zinc-950">
                  Isolation level
                </th>
                <th className="border-b border-zinc-300 px-3 py-2 font-bold text-zinc-950">
                  What your transaction sees
                </th>
              </tr>
            </thead>
            <tbody>
              {ISOLATION_LEVELS.map((row) => (
                <tr key={row.level}>
                  <td className="whitespace-nowrap border-b border-zinc-100 px-3 py-2 font-mono">
                    {row.level}
                  </td>
                  <td className="border-b border-zinc-100 px-3 py-2 text-zinc-800">
                    {row.sees}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <LessonSection>
        <div>
          <Title2 id="the-scenario">The scenario</Title2>
          <Paragraphs>
            <p>
              Alice and Bob are both on call. The rule: at least one engineer must always
              be on call. Before going off call, each of them checks "is someone else
              still covering?" — and only steps down if the answer is yes.
            </p>
          </Paragraphs>
        </div>
        <Section>
          <Title2 id="check-then-act">Check, then act</Title2>
          <Paragraph>
            Run alone, Alice's script is completely ordinary: check, then update, then
            commit.
          </Paragraph>
          <SqlCodeViewer code={aliceAloneQuery} databaseInitId={databaseInit.id} />
        </Section>
        <SqlResult execution={aliceAlone} />
      </LessonSection>

      <LessonSection>
        <div>
          <Title2 id="the-race">The race</Title2>
          <Paragraphs>
            <p>Now imagine Bob's transaction interleaved with Alice's, in this order:</p>
          </Paragraphs>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-base leading-7 text-zinc-800">
            <li>
              Alice starts her transaction and runs <InlineCode>Step 1: Check</InlineCode>{" "}
              — sees 1 (Bob is on call).
            </li>
            <li>
              Bob starts his own transaction and runs his{" "}
              <InlineCode>Step 1: Check</InlineCode> — sees 1 (Alice is on call).
            </li>
            <li>
              Bob runs <InlineCode>Step 2: Update</InlineCode> and commits — Bob is off
              call.
            </li>
            <li>
              Alice, still holding her Step 1 answer, runs{" "}
              <InlineCode>Step 2: Update</InlineCode> and commits — Alice is off call too.
            </li>
          </ol>
          <Paragraphs>
            <p>
              This playground can't run two sessions at once — the engine underneath is
              single-connection — so the diagram and scripts below show what two real,
              concurrent sessions would do, the same way the Postgres docs present
              two-session examples: as a script to read, not to run.
            </p>
          </Paragraphs>
        </div>
        <div className="mt-4 overflow-x-auto">
          <IsolationWriteSkewDiagram />
        </div>
      </LessonSection>

      <LessonSection>
        <Title2 id="read-uncommitted">READ UNCOMMITTED / READ COMMITTED</Title2>
        <Paragraph>
          Both behave the same way here: neither Alice nor Bob ever look again after their
          first check, so both go off call.
        </Paragraph>
        <SqlCodeViewer code={readUncommittedScript} />
      </LessonSection>

      <LessonSection>
        <Title2 id="read-committed">READ COMMITTED (default)</Title2>
        <Paragraph>
          Same outcome — the default isolation level does not help here.
        </Paragraph>
        <SqlCodeViewer code={readCommittedScript} />
      </LessonSection>

      <LessonSection>
        <Title2 id="repeatable-read">REPEATABLE READ</Title2>
        <Paragraph>
          This is the surprising one. Freezing the snapshot doesn't stop the bug — it just
          means neither transaction would have noticed the change even if it had looked
          again. The invariant still breaks.
        </Paragraph>
        <SqlCodeViewer code={repeatableReadScript} />
      </LessonSection>

      <LessonSection>
        <Title2 id="serializable">SERIALIZABLE</Title2>
        <Paragraph>
          The only level that catches it. Postgres notices both transactions read a row
          set the other one wrote to, and refuses the second commit.
        </Paragraph>
        <SqlCodeViewer code={serializableScript} />
      </LessonSection>

      <LessonSection>
        <Title2 id="tradeoffs">Choosing a level</Title2>
        <Paragraph>
          Stricter isolation doesn't just add guarantees — it adds cost, usually in the
          form of more aborted transactions your application has to retry.
        </Paragraph>
        <div className="mt-3 overflow-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr>
                <th className="border-b border-zinc-300 px-3 py-2 font-bold text-zinc-950">
                  Isolation level
                </th>
                <th className="border-b border-zinc-300 px-3 py-2 font-bold text-zinc-950">
                  Protects against
                </th>
                <th className="border-b border-zinc-300 px-3 py-2 font-bold text-zinc-950">
                  Cost
                </th>
              </tr>
            </thead>
            <tbody>
              {TRADEOFFS.map((row) => (
                <tr key={row.level}>
                  <td className="whitespace-nowrap border-b border-zinc-100 px-3 py-2 align-top font-mono">
                    {row.level}
                  </td>
                  <td className="border-b border-zinc-100 px-3 py-2 align-top text-zinc-800">
                    {row.protects}
                  </td>
                  <td className="border-b border-zinc-100 px-3 py-2 align-top text-zinc-800">
                    {row.cost}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Paragraph>
          Default to READ COMMITTED unless you have a specific reason not to — it's what
          most queries run at anyway, including in this lesson's own scenario, where it
          made no difference. Reach for REPEATABLE READ when you need a consistent
          multi-statement read, like a report or an export. Reach for SERIALIZABLE only
          when you have a genuine cross-row invariant like this lesson's write-skew case —
          and only if your application actually retries on 40001, since without that,
          SERIALIZABLE just trades silent corruption for silent failure.
        </Paragraph>
      </LessonSection>
    </LessonPage>
  );
}
