import {
  databaseInit,
  exercises,
  lockedHoldQuery,
  migration,
  naiveHoldQuery,
  seed,
} from "../../cli_examples/concurrency-reservation-system.sql";
import { ConcurrencyComparisonDiagram } from "../sql/concurrency-timeline-diagram";
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

function ProblemCallout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 rounded-md border-l-4 border-[#e0c200] bg-[#fff3b0] px-6 py-5 text-base leading-7 text-zinc-900">
      {children}
    </div>
  );
}

export default function ConcurrencyReservationSystem() {
  const naiveExecution = useLessonSqlExample({
    query: naiveHoldQuery,
    sqlLoad: databaseInit.query,
  });
  const lockedExecution = useLessonSqlExample({
    query: lockedHoldQuery,
    sqlLoad: databaseInit.query,
  });

  return (
    <LessonPage
      activeLesson="concurrency-reservation-system"
      defaultQuery={lockedHoldQuery}
      exercises={exercises}
      preloadId={databaseInit.id}
      sqlLoad={databaseInit.query}
      title="Implementing a high-concurrency system with Postgres"
      whatWeLearned={[
        {
          concept: "Transaction",
          description:
            "a change from one database state to another. It guarantees ACID: Atomicity, Consistency, Isolation, Durability.",
          url: "https://www.postgresql.org/docs/current/tutorial-transactions.html",
        },
        {
          concept: "uuidv7()",
          description:
            "generates a time-ordered UUID, so IDs sort roughly by creation time instead of scattering randomly.",
          url: "https://www.postgresql.org/docs/current/functions-uuid.html",
        },
        {
          concept: "REFERENCES",
          description:
            "declares a foreign key: a column's values must match an existing row in the referenced table.",
          url: "https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-FK",
        },
        {
          concept: "Atomicity",
          description:
            "all of a transaction's statements take effect, or none do — nothing in between is ever visible.",
          url: "https://en.wikipedia.org/wiki/Atomicity_(database_systems)",
        },
        {
          concept: "BEGIN / COMMIT",
          description:
            "starts and ends an explicit transaction block, so every statement in between commits or rolls back together.",
          url: "https://www.postgresql.org/docs/current/sql-begin.html",
        },
        {
          concept: "Check-then-act race",
          description:
            "reading a value and acting on it in a later, separate statement leaves a gap where another transaction can change that value first.",
        },
        {
          concept: "SELECT ... FOR UPDATE",
          description:
            "locks the selected rows for the rest of the transaction — no other transaction can lock, update, or delete them until this one ends.",
          url: "https://www.postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE",
        },
      ]}
    >
      <Paragraphs>
        <p>
          Knowing your database's primitives isn't optional trivia — your app's state
          lives inside them. If you don't understand what a database actually guarantees,
          you can't know what your code is silently relying on.
        </p>
      </Paragraphs>

      <Section>
        <Title2>The problem we are solving</Title2>
        <ProblemCallout>
          <p>
            We want to design and develop the REST API service that will manage the event
            seat reservations of our new application.
          </p>
          <p className="mt-4">
            The service is required to expose the following endpoints:
          </p>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>
              <strong>Create an event.</strong> An event consists of several seats. The
              total number of seats is required to create the event and it could be
              anything between 10 and 1,000 (included).
            </li>
            <li>
              <strong>Hold a particular seat.</strong> Users can "Hold" a seat for a
              limited amount of time. This is particularly useful when other parts of the
              system are, for example, completing the confirmation flow and payment. In
              order to Hold a seat, your system will require the user identifier. A user
              can hold a seat for a configured maximum time of seconds, after which the
              seat will become available to other users. You can default this to 60
              seconds.
            </li>
            <li>
              <strong>Reserve a particular seat.</strong> A user can complete the
              reservation of a seat, only if the user is "Holding" the relevant seat.
              After the reservation, this seat becomes permanently assigned to the user.
            </li>
            <li>
              <strong>List available seats for a given event.</strong> The list of
              available seats should only include the seats that are not "On Hold" and not
              yet fully Reserved.
            </li>
          </ul>
          <p className="mt-4">Additional Points</p>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li>Limit the number of seats a given user can hold in one event.</li>
            <li>Add an endpoint to "refresh" a Hold on a seat.</li>
          </ul>
        </ProblemCallout>
      </Section>

      <Section>
        <Title2>Why this needs ACID, especially atomicity</Title2>
        <Paragraphs>
          <p>
            Solving this correctly means knowing what your database guarantees under
            concurrency. Postgres gives you <strong>ACID</strong> — especially{" "}
            <strong>Atomicity</strong>: a transaction's statements all take effect, or
            none do.
          </p>
          <p>
            But atomicity doesn't cover a read-then-write gap: two transactions can read
            the same row, decide independently, then write. That gap is exactly where this
            reservation system breaks.
          </p>
        </Paragraphs>
      </Section>

      <Section>
        <Title2>Modeling the problem</Title2>
        <Paragraphs>
          <p>
            Four tables: <InlineCode>&quot;user&quot;</InlineCode> and{" "}
            <InlineCode>seat</InlineCode> are simple catalogs.{" "}
            <InlineCode>event</InlineCode> tracks how many seats are still available.{" "}
            <InlineCode>reservation</InlineCode> links one seat to one event and one user
            — its primary key <InlineCode>(event_id, seat_id)</InlineCode> means a given
            seat can have at most one reservation row per event.
          </p>
        </Paragraphs>
        <SqlCodeViewer code={migration} />
        <Paragraph>
          Concert Night seeds with 3 seats total and{" "}
          <InlineCode>seat_available = 1</InlineCode> — only one seat left, which is
          exactly the situation where a race condition matters.
        </Paragraph>
        <SqlCodeViewer code={seed} />
      </Section>

      <LessonSection>
        <Title2>The naive way: read, then decide</Title2>
        <Paragraphs>
          <p>
            <InlineCode>holdSeat</InlineCode> reads{" "}
            <InlineCode>seat_available</InlineCode>, checks in application code whether
            it's greater than zero, then writes the decrement and the hold. That's two
            separate statements — a <InlineCode>SELECT</InlineCode> and a later{" "}
            <InlineCode>UPDATE</InlineCode> — with a gap between them where anything can
            happen.
          </p>
          <p>
            <InlineCode>BEGIN</InlineCode> and <InlineCode>COMMIT</InlineCode> wrap all
            three statements into one transaction, so they succeed or fail together — you
            never end up with the counter decremented but no reservation row, or the
            reverse. It's also what makes a lock from <InlineCode>FOR UPDATE</InlineCode>{" "}
            mean anything: the lock lasts for the transaction's duration, so without an
            explicit <InlineCode>BEGIN</InlineCode> spanning multiple statements, there's
            nothing for it to protect.
          </p>
        </Paragraphs>
        <SqlCodeViewer code={naiveHoldQuery} databaseInitId={databaseInit.id} />
        <div className="mt-4">
          <SqlResult execution={naiveExecution} />
        </div>
        <Paragraph>
          Run once, on its own, this looks completely fine: 1 seat becomes 0, one hold
          recorded. The bug only shows up when two users try to hold the last seat at the
          same instant — see the diagram below.
        </Paragraph>
      </LessonSection>

      <LessonSection>
        <Title2>The safe way: SELECT ... FOR UPDATE</Title2>
        <Paragraphs>
          <p>
            Adding{" "}
            <a
              className="text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900"
              href="https://www.postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE"
              rel="noreferrer"
              target="_blank"
            >
              <InlineCode>FOR UPDATE</InlineCode>
            </a>{" "}
            to the <InlineCode>SELECT</InlineCode> locks that row for the rest of the
            transaction: any other transaction that tries to{" "}
            <InlineCode>SELECT ... FOR UPDATE</InlineCode> the same row has to wait until
            this one commits or rolls back.
          </p>
        </Paragraphs>
        <SqlCodeViewer code={lockedHoldQuery} databaseInitId={databaseInit.id} />
        <div className="mt-4">
          <SqlResult execution={lockedExecution} />
        </div>
        <Paragraph>
          Run once, the result looks identical to the naive version — the difference only
          appears under concurrency, shown below.
        </Paragraph>
      </LessonSection>

      <LessonSection>
        <Title2>What happens under concurrency</Title2>
        <Paragraphs>
          <p>
            Here's the same "last seat" scenario, twice: first without the lock, then with
            it.
          </p>
        </Paragraphs>

        <div className="mt-6">
          <p className="font-mono text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Without FOR UPDATE
          </p>
          <div className="mt-3 text-base leading-7 text-zinc-700">
            <ul className="list-disc space-y-2 pl-5">
              <li>
                Both transactions run <InlineCode>SELECT seat_available</InlineCode>{" "}
                before either one writes anything — both read <InlineCode>1</InlineCode>,
                both decide "yes, I can hold this seat."
              </li>
              <li>
                Postgres still serializes the two <InlineCode>UPDATE</InlineCode>{" "}
                statements at the row level — B's <InlineCode>UPDATE</InlineCode> really
                does wait for A's transaction to commit. But the damage is already done: B
                already decided to proceed based on a read that was stale by the time it
                acted on it.
              </li>
              <li>
                When B's <InlineCode>UPDATE</InlineCode> finally runs, it subtracts 1 from
                the now-committed value 0, leaving{" "}
                <InlineCode>seat_available = -1</InlineCode> and two holds for one seat.
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6">
          <p className="font-mono text-sm font-semibold uppercase tracking-wide text-zinc-500">
            With FOR UPDATE
          </p>
          <div className="mt-3 text-base leading-7 text-zinc-700">
            <ul className="list-disc space-y-2 pl-5">
              <li>
                A's <InlineCode>SELECT ... FOR UPDATE</InlineCode> locks the event row
                immediately. B's identical statement doesn't get to read anything — it
                blocks right there, before B's application code has made any decision.
              </li>
              <li>
                Once A commits, B's blocked <InlineCode>SELECT</InlineCode> unblocks and
                reads the fresh, committed value: <InlineCode>0</InlineCode>.
              </li>
              <li>
                B's application code now correctly rejects the hold — no{" "}
                <InlineCode>UPDATE</InlineCode>, no <InlineCode>INSERT</InlineCode>, no
                negative counter. The lock moved the blocking point from <em>after</em>{" "}
                the decision to <em>before</em> it.
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6">
          <ConcurrencyComparisonDiagram />
        </div>
      </LessonSection>
    </LessonPage>
  );
}
