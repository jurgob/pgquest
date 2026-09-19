import { Link } from "react-router";
import {
  databaseInit,
  databaseInitPerEventSeats,
  databaseInitWithHold,
  databaseInitWithoutCounter,
  displayCountQuery,
  eventTableWithoutCounter,
  exercises,
  insertConflictQuery,
  insertHoldQuery,
  insertWithLockQuery,
  migration,
  naiveHoldQuery,
  rollbackDemoQuery,
  seatTablePerEvent,
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
  const rollbackDemoExecution = useLessonSqlExample({
    query: rollbackDemoQuery,
    sqlLoad: databaseInitWithHold.query,
  });
  const rollbackCheckExecution = useLessonSqlExample({
    query: displayCountQuery,
    sqlLoad: databaseInitWithHold.query,
  });
  const insertHoldExecution = useLessonSqlExample({
    query: insertHoldQuery,
    sqlLoad: databaseInit.query,
  });
  const insertConflictExecution = useLessonSqlExample({
    query: insertConflictQuery,
    sqlLoad: databaseInitWithHold.query,
  });
  const displayCountExecution = useLessonSqlExample({
    query: displayCountQuery,
    sqlLoad: databaseInit.query,
  });
  const insertWithLockExecution = useLessonSqlExample({
    query: insertWithLockQuery,
    sqlLoad: databaseInitPerEventSeats.query,
  });

  return (
    <LessonPage
      activeLesson="concurrency-reservation-system"
      defaultQuery={insertWithLockQuery}
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
          concept: "Duplicate key error",
          description:
            "Postgres rejects a second row with the same primary key outright — a constraint can be simpler and safer than explicit locking.",
          url: "https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-PRIMARY-KEYS",
        },
        {
          concept: "Check-then-act race",
          description:
            "reading a value and acting on it in a later, separate statement leaves a gap where another transaction can change that value first.",
        },
        {
          concept: "SELECT ... FOR UPDATE",
          description:
            "locks the selected rows for the rest of the transaction — useful for checking and rejecting early, before attempting a write that would otherwise fail.",
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
        <Paragraphs>
          <p>
            I wrote an article about solving this same problem with Redis —{" "}
            <a
              className="text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900"
              href="https://casual-programming.com/20260918_redis_for_a_high_concurrency_reservation_system/"
              rel="noreferrer"
              target="_blank"
            >
              Redis for a High-Concurrency Reservation System
            </a>
            .
          </p>
        </Paragraphs>
      </Section>

      <Section>
        <Title2>Setting expectations: rejection is fine, double-booking is not</Title2>
        <Paragraphs>
          <p>
            Under real concurrent load, some booking attempts will fail — and that's fine.
            A UI that says "Sorry, that seat was just taken — pick another one" is a
            perfectly acceptable outcome.
          </p>
          <p>
            What's <strong>not</strong> acceptable is two different people both believing
            they hold the same seat, only discovering the conflict when they show up at
            the venue. That's the failure this lesson is actually about preventing —
            overbooking is a well-documented, recurring problem:
          </p>
        </Paragraphs>
        <ul className="mt-2 list-disc space-y-2 pl-5 text-base leading-7 text-zinc-800">
          <li>
            <a
              className="text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900"
              href="https://www.travelandtourworld.com/news/article/overbooked-flights-in-the-uk-and-globally-passengers-now-most-likely-to-be-bumped-experts-warn/"
              rel="noreferrer"
              target="_blank"
            >
              Overbooked Flights in the UK and Globally: Passengers Now Most Likely to Be
              Bumped
            </a>{" "}
            — airlines have run on deliberate overbooking for decades; this is what it
            costs passengers when the numbers don't work out.
          </li>
          <li>
            <a
              className="text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900"
              href="https://variety.com/2022/music/news/ticketmaster-explains-taylor-swift-ticket-crisis-eras-tour-1235435673/"
              rel="noreferrer"
              target="_blank"
            >
              Ticketmaster Explains Taylor Swift Ticket Crisis for Eras Tour
            </a>{" "}
            — a real-world case of a ticketing system buckling under exactly the kind of
            contention this lesson models.
          </li>
          <li>
            <a
              className="text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900"
              href="https://singhajit.com/ticket-booking-system-design/"
              rel="noreferrer"
              target="_blank"
            >
              How Ticket Booking Systems Handle 50,000 People Fighting for One Seat
            </a>{" "}
            — a systems-design look at the same problem this lesson solves.
          </li>
        </ul>
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
            <InlineCode>event</InlineCode> carries <InlineCode>seat_number</InlineCode>,
            the total number of seats it was created with, plus a{" "}
            <InlineCode>seat_available</InlineCode> counter meant to track how many are
            still free. <InlineCode>reservation</InlineCode> links one seat to one event
            and one user — its primary key <InlineCode>(event_id, seat_id)</InlineCode>{" "}
            means a given seat can have at most one reservation row per event. Hold on to
            that counter: it looks convenient, and it's exactly what the naive approach
            will get wrong.
          </p>
        </Paragraphs>
        <SqlCodeViewer code={migration} />
        <Paragraph>
          Concert Night seeds with <InlineCode>seat_number = 3</InlineCode> total and{" "}
          <InlineCode>seat_available = 1</InlineCode> — the counter claims only one seat
          left, which is exactly the situation where a race condition matters.
        </Paragraph>
        <SqlCodeViewer code={seed} />
      </Section>

      <LessonSection>
        <Title2>The naive way: rely on the seat_available counter</Title2>
        <Paragraphs>
          <p>
            The naive way isn't really "read, then decide" — that's just the symptom. The
            underlying mistake is treating <InlineCode>seat_available</InlineCode> as the
            source of truth for whether a seat can be held. Once a mutable counter is what
            decides the outcome, some transaction has to read it and act on it, and that's
            where the gap opens.
          </p>
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
          <p>
            Concretely: say the first operation succeeds and the second one fails. Does
            the first operation stay applied? Here, seat 1 is already held by Ada. Grace's
            attempt does two things — decrement <InlineCode>seat_available</InlineCode>,
            then insert her own hold on the same seat:
          </p>
        </Paragraphs>
        <SqlCodeViewer
          code={rollbackDemoQuery}
          databaseInitId={databaseInitWithHold.id}
        />
        <div className="mt-4">
          <SqlResult execution={rollbackDemoExecution} />
        </div>
        <Paragraph>
          Operation 2 fails — the primary key rejects it. Postgres doesn't apply operation
          1 and skip operation 2; it discards operation 1 too, the moment operation 2
          errors. Checking the counter afterward proves it — still{" "}
          <InlineCode>0</InlineCode>, not <InlineCode>-1</InlineCode>:
        </Paragraph>
        <SqlCodeViewer
          code={displayCountQuery}
          databaseInitId={databaseInitWithHold.id}
        />
        <div className="mt-4">
          <SqlResult execution={rollbackCheckExecution} />
        </div>
        <Paragraph>
          That's what <InlineCode>BEGIN</InlineCode> and <InlineCode>COMMIT</InlineCode>{" "}
          are for: everything in between is all-or-nothing. Now here's the full{" "}
          <InlineCode>holdSeat</InlineCode>, wrapped the same way:
        </Paragraph>
        <SqlCodeViewer code={naiveHoldQuery} databaseInitId={databaseInit.id} />
        <div className="mt-4">
          <SqlResult execution={naiveExecution} />
        </div>
        <Paragraph>
          Run once, on its own, this looks completely fine: 1 seat becomes 0, one hold
          recorded. But this isn't a rare edge case — under real concurrent traffic, two
          users racing for the last seat <strong>will</strong> both get through
          eventually. This implementation is guaranteed to overbook.
        </Paragraph>
        <Paragraphs>
          <p>
            You might reasonably ask why we store <InlineCode>seat_available</InlineCode>{" "}
            at all. We could drop it from the seed entirely and compute the number on the
            fly — <InlineCode>seat_number</InlineCode> minus a{" "}
            <InlineCode>count(*)</InlineCode> of the reservation rows — so there's no
            counter to keep in sync. That's perfectly correct, but recomputing it on every
            "seats left" render and every hold attempt means an aggregate scan on the hot
            path; under real load, running it all the time would kill performance. That
            pressure is exactly what tempts people to cache the number back into a mutable
            column — and the moment it becomes what decides a hold, you're right back to
            the race above.
          </p>
        </Paragraphs>
      </LessonSection>

      <LessonSection>
        <Title2>
          The actually overbooking-free fix: let the primary key do the work
        </Title2>
        <Paragraphs>
          <p>
            In a real app, <InlineCode>holdSeat</InlineCode> is called from a specific
            seat's button — the user already picked a seat from a list before clicking
            Hold. That means we already know <InlineCode>seat_id</InlineCode> up front; we
            never actually need to ask the database for "any available seat," only "this
            one."
          </p>
          <p>
            That changes the shape of the problem entirely. Instead of checking a counter
            and then writing, we can just insert the hold directly.{" "}
            <InlineCode>reservation</InlineCode>'s primary key{" "}
            <InlineCode>(event_id, seat_id)</InlineCode> means Postgres itself rejects a
            second hold on the same seat — no <InlineCode>SELECT</InlineCode>, no lock, no
            gap to race in.
          </p>
        </Paragraphs>
        <SqlCodeViewer code={insertHoldQuery} databaseInitId={databaseInit.id} />
        <div className="mt-4">
          <SqlResult execution={insertHoldExecution} />
        </div>
        <Paragraph>If the seat's already held, the same statement just fails:</Paragraph>
        <SqlCodeViewer
          code={insertConflictQuery}
          databaseInitId={databaseInitWithHold.id}
        />
        <div className="mt-4">
          <SqlResult execution={insertConflictExecution} />
        </div>
        <Paragraph>
          That error comes straight from Postgres, under any level of concurrency, without
          our application code needing to know anything about locks.
        </Paragraph>
        <Paragraphs>
          <p>
            So what's <InlineCode>seat_available</InlineCode> for, then? Nothing
            safety-critical. The reservation rows and their primary key are already the
            source of truth, so the cleanest model simply drops the counter. Only the{" "}
            <InlineCode>event</InlineCode> table changes — every other table stays exactly
            the same:
          </p>
        </Paragraphs>
        <SqlCodeViewer code={eventTableWithoutCounter} />
        <Paragraphs>
          <p>
            You can{" "}
            <Link
              className="text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900"
              to={`/dbviewer/${databaseInitWithoutCounter.id}`}
            >
              open the counter-less schema in the DB viewer
            </Link>{" "}
            to see the full result. And if you do decide to keep{" "}
            <InlineCode>seat_available</InlineCode> anyway, treat it only as a fast,
            approximate "seats left" badge — never let it decide whether a hold succeeds;
            the <InlineCode>INSERT</InlineCode> above already does that correctly on its
            own.
          </p>
        </Paragraphs>
        <SqlCodeViewer code={displayCountQuery} databaseInitId={databaseInit.id} />
        <div className="mt-4">
          <SqlResult execution={displayCountExecution} />
        </div>
        <Paragraphs>
          <p>
            One more variation: the <InlineCode>INSERT</InlineCode> alone is already
            correct, but every concurrent attempt races straight at the primary key. If
            you'd rather concurrent holds on a seat take turns instead of racing, you can
            lock the seat row first with{" "}
            <a
              className="text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900"
              href="https://www.postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE"
              rel="noreferrer"
              target="_blank"
            >
              <InlineCode>FOR UPDATE</InlineCode>
            </a>{" "}
            before inserting.
          </p>
          <p>
            But this one needs a schema change first. In the model so far,{" "}
            <InlineCode>seat</InlineCode> is a single global catalog shared by every event
            — so <InlineCode>SELECT ... FROM seat WHERE id = 2 FOR UPDATE</InlineCode>{" "}
            would lock "seat 2" for <em>every</em> event at once, blocking unrelated
            bookings. Scope each seat to its event and the lock only ever touches that one
            event. Again, only the <InlineCode>seat</InlineCode> table changes:
          </p>
        </Paragraphs>
        <SqlCodeViewer code={seatTablePerEvent} />
        <Paragraphs>
          <p>
            Kept the id an <InlineCode>INTEGER</InlineCode> here — nothing else in the
            schema or the queries has to change. A <InlineCode>UUID</InlineCode> id would
            work too, but it only buys you something if you need to pre-allocate seats{" "}
            <em>before</em> the event row exists, which isn't the case here.
          </p>
          <p>
            Now that a seat belongs to one event, wrap that <em>exact same insert</em> in
            a transaction that locks this event's seat row first:
          </p>
        </Paragraphs>
        <SqlCodeViewer
          code={insertWithLockQuery}
          databaseInitId={databaseInitPerEventSeats.id}
        />
        <div className="mt-4">
          <SqlResult execution={insertWithLockExecution} />
        </div>
        <Paragraph>
          Either way, the primary key is still what actually guarantees safety —{" "}
          <InlineCode>FOR UPDATE</InlineCode> here only serializes concurrent holds on the
          seat so they take turns instead of racing; it doesn't prevent overbooking on its
          own.
        </Paragraph>
      </LessonSection>

      <LessonSection>
        <Title2>What happens under concurrency</Title2>
        <Paragraphs>
          <p>
            Here's all three approaches, side by side: checking the{" "}
            <InlineCode>seat_available</InlineCode> counter (overbooks), insert only
            relying on the primary key (overbooking-free), and the exact same insert with
            a <InlineCode>FOR UPDATE</InlineCode> lock so concurrent holds serialize.
          </p>
        </Paragraphs>

        <div className="mt-6">
          <p className="font-mono text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Use seat_available to check (naive)
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
            Insert only (primary key checks)
          </p>
          <div className="mt-3 text-base leading-7 text-zinc-700">
            <ul className="list-disc space-y-2 pl-5">
              <li>
                Both transactions attempt <InlineCode>INSERT</InlineCode> for the same{" "}
                <InlineCode>seat_id</InlineCode> — the primary key{" "}
                <InlineCode>(event_id, seat_id)</InlineCode> is what's actually being
                contested, not a value either side read first.
              </li>
              <li>
                B's <InlineCode>INSERT</InlineCode> blocks the moment it hits the same
                not-yet-committed key A is inserting. Neither transaction asked for this —
                Postgres enforces it automatically.
              </li>
              <li>
                Once A commits, B's <InlineCode>INSERT</InlineCode> resumes and
                immediately fails with a duplicate-key error. B's application code catches
                that and reports "seat taken" — it never got the chance to write anything
                wrong.
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6">
          <p className="font-mono text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Insert only + FOR UPDATE (serialized)
          </p>
          <div className="mt-3 text-base leading-7 text-zinc-700">
            <ul className="list-disc space-y-2 pl-5">
              <li>
                A's <InlineCode>SELECT ... FOR UPDATE</InlineCode> locks the seat row
                immediately. B's identical statement blocks right there — the two attempts
                take turns on the seat instead of racing at the primary key.
              </li>
              <li>
                Once A commits, B's blocked <InlineCode>SELECT</InlineCode> unblocks and B
                proceeds to its <InlineCode>INSERT</InlineCode>.
              </li>
              <li>
                B's <InlineCode>INSERT</InlineCode> hits the same primary key A just
                committed and fails with a duplicate-key error — same guarantee as insert
                only, the lock just made the two attempts serialize first.
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
