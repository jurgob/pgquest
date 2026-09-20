import {
  databaseInit,
  databaseInitExpiredHold,
  databaseInitGraceHold,
  databaseInitLiveHold,
  exercises,
  holdLimitQuery,
  holdQuery,
  holdRejectedQuery,
  listAvailableQuery,
  migration,
  refreshWithLimitQuery,
  reserveQuery,
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
  const holdExecution = useLessonSqlExample({
    query: holdQuery,
    sqlLoad: databaseInit.query,
  });
  const holdRejectedExecution = useLessonSqlExample({
    query: holdRejectedQuery,
    sqlLoad: databaseInitLiveHold.query,
  });
  const holdTakeoverExecution = useLessonSqlExample({
    query: holdQuery,
    sqlLoad: databaseInitExpiredHold.query,
  });
  const reserveExecution = useLessonSqlExample({
    query: reserveQuery,
    sqlLoad: databaseInitGraceHold.query,
  });
  const reserveRejectedExecution = useLessonSqlExample({
    query: reserveQuery,
    sqlLoad: databaseInitLiveHold.query,
  });
  const listAvailableExecution = useLessonSqlExample({
    query: listAvailableQuery,
    sqlLoad: databaseInitLiveHold.query,
  });

  return (
    <LessonPage
      activeLesson="concurrency-reservation-system"
      defaultQuery={holdQuery}
      exercises={exercises}
      preloadId={databaseInit.id}
      sqlLoad={databaseInit.query}
      title="Implementing a high-concurrency system with Postgres"
      whatWeLearned={[
        {
          concept: "Primary key (event_id, seat_id)",
          description:
            "one reservation row per seat, so two people can never both book the same seat — the double-booking invariant holds by construction.",
          url: "https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-PRIMARY-KEYS",
        },
        {
          concept: "INSERT ... ON CONFLICT DO UPDATE",
          description:
            "upsert: take the seat if free, or take over an expired hold — atomically, in one statement, with no read-then-write gap.",
          url: "https://www.postgresql.org/docs/current/sql-insert.html#SQL-ON-CONFLICT",
        },
        {
          concept: "EXCLUDED",
          description:
            "the pseudo-table holding the row you tried to insert, available inside DO UPDATE — lets the update refer back to the values you were writing.",
          url: "https://www.postgresql.org/docs/current/sql-insert.html#SQL-ON-CONFLICT",
        },
        {
          concept: "Guarded UPDATE",
          description:
            "checking ownership and status in the WHERE clause protects a single seat; UPDATE takes a row lock automatically.",
          url: "https://www.postgresql.org/docs/current/sql-update.html",
        },
        {
          concept: "Expiry as a rule",
          description:
            "a hold counts only while holding_date is newer than the window; nothing has to delete it on a timer.",
        },
        {
          concept: "pg_advisory_xact_lock",
          description:
            "coordinates holds and refreshes for the same user/event pair; the lock releases automatically on commit or rollback.",
          url: "https://www.postgresql.org/docs/current/explicit-locking.html#ADVISORY-LOCKS",
        },
        {
          concept: "Atomicity",
          description:
            "the transaction commits all its changes or none; isolation and locking determine how concurrent transactions interact.",
          url: "https://en.wikipedia.org/wiki/Atomicity_(database_systems)",
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
        <Title2 id="the-problem-we-are-solving">The problem we are solving</Title2>
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
            . Here we'll do it in Postgres — and lean on guarantees Redis simply can't
            give you.
          </p>
        </Paragraphs>
      </Section>

      <Section>
        <Title2 id="setting-expectations">
          Setting expectations: rejection is fine, double-booking is not
        </Title2>
        <Paragraphs>
          <p>
            Under real concurrent load, some booking attempts will fail — and that's fine.
            A UI that says "Sorry, that seat was just taken — pick another one" is a
            perfectly acceptable outcome.
          </p>
          <p>
            What's <strong>not</strong> acceptable is two different people both believing
            they hold or reserved the same seat, only discovering the conflict when they
            show up at the venue. That's the failure this lesson is about preventing —
            overbooking is a well-documented, recurring problem:
          </p>
        </Paragraphs>
        <ul className="mt-2 list-disc space-y-2 pl-5 text-base leading-7 text-zinc-800">
          <li>
            <a
              className="text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900"
              href="https://www.cbsnews.com/losangeles/news/ticketmaster-sells-some-fans-duplicate-sugar-bowl-tickets/"
              rel="noreferrer"
              target="_blank"
            >
              Ticketmaster Sells Some Fans Duplicate Sugar Bowl Tickets
            </a>{" "}
            — Ticketmaster itself confirmed some buyers "received two tickets to the same
            seat."
          </li>
          <li>
            <a
              className="text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900"
              href="https://www.ticketnews.com/2018/03/paul-simon-fan-scored-floor-seats-had-them-revoked-by-ticketmaster-after-seat-was/"
              rel="noreferrer"
              target="_blank"
            >
              Fan Had Ticket Revoked After Ticketmaster "Double Sold" His Floor Seat
            </a>{" "}
            — the seat was double-sold, and the buyer with a valid ticket still lost it.
          </li>
          <li>
            <a
              className="text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900"
              href="https://www.cbsnews.com/chicago/news/on-the-secondary-market-its-buyer-beware-when-tickets-are-sold-twice/"
              rel="noreferrer"
              target="_blank"
            >
              On The Secondary Market, It's Buyer Beware When Tickets Are Sold Twice
            </a>{" "}
            — the same seat sold to multiple buyers, and only one of them got in.
          </li>
          <li>
            <a
              className="text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900"
              href="https://www.timeslive.co.za/news/south-africa/2026-05-21-flysafair-denies-wrongdoing-after-overbooking-scandal-referral/"
              rel="noreferrer"
              target="_blank"
            >
              FlySafair Denies Wrongdoing After Overbooking Scandal Referral
            </a>{" "}
            — a 2026 case where a regulator says overbooking was systematic, not
            accidental.
          </li>
        </ul>
      </Section>

      <Section>
        <Title2 id="modeling-the-problem">Modeling the problem</Title2>
        <Paragraphs>
          <p>
            Four tables. <InlineCode>&quot;user&quot;</InlineCode> is a catalog.{" "}
            <InlineCode>event</InlineCode> stores the total{" "}
            <InlineCode>seat_number</InlineCode>. <InlineCode>seat</InlineCode> belongs to
            one event (so locking a seat later only ever touches that event).{" "}
            <InlineCode>reservation</InlineCode> is the heart of it: one row per seat,
            with a status of <InlineCode>H</InlineCode> (holding) or{" "}
            <InlineCode>R</InlineCode> (reserved).
          </p>
          <p>
            A transaction-scoped advisory lock will coordinate requests for each
            user/event pair, even when that user has no reservations yet. A partial index
            on reservation holds makes the limit lookup efficient.
          </p>
          <p>
            The single most important line is{" "}
            <InlineCode>PRIMARY KEY (event_id, seat_id)</InlineCode>. It means a seat can
            have <strong>at most one</strong> reservation row — so two people can never
            both hold or reserve the same seat. The double-booking invariant is enforced
            by the schema itself, not by application code.
          </p>
        </Paragraphs>
        <SqlCodeViewer code={migration} />
        <Paragraph>
          A hold lasts a limited time — we'll use <strong>30 seconds</strong> here.
          Crucially, expiry is a <strong>rule, not a background job</strong>: we never
          delete a hold on a timer. A hold simply <em>counts</em> only while its{" "}
          <InlineCode>holding_date</InlineCode> is newer than{" "}
          <InlineCode>statement_timestamp() - interval &apos;30 seconds&apos;</InlineCode>
          . Once it's older than that, the seat is free again — the row can just sit there
          until someone takes it over.
        </Paragraph>
        <Paragraph>
          These examples evaluate expiry at the start of the operation's SQL statement.
          <InlineCode>now()</InlineCode> is fixed at the start of the transaction, so it
          can be stale after waiting for a lock. Send the lock command and the subsequent
          write as separate commands on the same connection, and keep transactions short:
          a hold can expire before a slow transaction commits.
        </Paragraph>
        <SqlCodeViewer code={seed} />
      </Section>

      <Section>
        <Title2 id="the-functions-well-implement">The functions we'll implement</Title2>
        <Paragraphs>
          <p>In a program, you'd have these functions:</p>
        </Paragraphs>
        <div className="pt-8">
          <Title2 id="hold-seat">
            <InlineCode className="text-xl">holdSeat(eventId, seatId, userId)</InlineCode>
          </Title2>
        </div>
        <div className="pl-6">
          <Paragraph>
            Lock the user/event pair, check a limit of two live holds, and take the seat
            before committing. This is the complete operation:
          </Paragraph>
          <SqlCodeViewer code={holdLimitQuery} />
        </div>
        <div className="pt-8">
          <Title2 id="refresh-hold-seat">
            <InlineCode className="text-xl">
              refreshHoldSeat(eventId, seatId, userId)
            </InlineCode>
          </Title2>
        </div>
        <div className="pl-6">
          <SqlCodeViewer code={refreshWithLimitQuery} />
        </div>
        <div className="pt-8">
          <Title2 id="reserve-seat">
            <InlineCode className="text-xl">
              reserveSeat(eventId, seatId, userId)
            </InlineCode>
          </Title2>
        </div>
        <div className="pl-6">
          <SqlCodeViewer code={reserveQuery} />
        </div>
        <div className="pt-8">
          <Title2 id="get-available-seats">
            <InlineCode className="text-xl">getAvailableSeats(eventId)</InlineCode>
          </Title2>
        </div>
        <div className="pl-6">
          <SqlCodeViewer code={listAvailableQuery} />
        </div>
      </Section>

      <LessonSection>
        <Title2 id="holding-a-seat">Holding a seat</Title2>
        <Paragraphs>
          <p>
            Holding is trickier than it looks: we want to grab the seat if it's free,{" "}
            <em>or</em> take it over if the current hold has expired, but never if someone
            is actively holding or has reserved it. The tempting version is
            read-then-write — <InlineCode>SELECT</InlineCode> to check, then{" "}
            <InlineCode>INSERT</InlineCode> or <InlineCode>UPDATE</InlineCode> — and that
            has a gap between the check and the write where another request slips in.
          </p>
          <p>
            Instead we do it in <strong>one statement</strong>. The primary key turns the
            insert into an upsert: if a row already exists,{" "}
            <InlineCode>ON CONFLICT DO UPDATE</InlineCode> takes over — but only when its{" "}
            <InlineCode>WHERE</InlineCode> says the existing hold has expired. The unique
            constraint and the lock on the conflicting reservation protect this seat. This
            standalone statement doesn't enforce the user's hold limit; the transaction
            above adds that protection.
          </p>
          <p>
            <InlineCode>EXCLUDED</InlineCode> is a pseudo-table Postgres exposes inside{" "}
            <InlineCode>DO UPDATE</InlineCode>: it holds the row you just tried to insert
            (the one that hit the conflict), so <InlineCode>EXCLUDED.user_id</InlineCode>{" "}
            below means "the user_id from the VALUES clause" — whoever is making this hold
            attempt.
          </p>
        </Paragraphs>
        <SqlCodeViewer code={holdQuery} databaseInitId={databaseInit.id} />
        <div className="mt-4">
          <SqlResult execution={holdExecution} />
        </div>
        <Paragraph>
          If the seat is <strong>actively held</strong> (not expired), the{" "}
          <InlineCode>ON CONFLICT</InlineCode> guard fails and the statement changes
          nothing — zero rows come back, which the app turns into "seat taken". Here Bob
          tries to grab A2 while Ada is still holding it:
        </Paragraph>
        <SqlCodeViewer
          code={holdRejectedQuery}
          databaseInitId={databaseInitLiveHold.id}
        />
        <div className="mt-4">
          <SqlResult execution={holdRejectedExecution} />
        </div>
        <Paragraph>
          But if the previous hold has <strong>expired</strong>, the exact same statement
          takes it over cleanly — no delete, no separate check. This time Grace takes over
          Ada's expired hold:
        </Paragraph>
        <SqlCodeViewer code={holdQuery} databaseInitId={databaseInitExpiredHold.id} />
        <div className="mt-4">
          <SqlResult execution={holdTakeoverExecution} />
        </div>
      </LessonSection>

      <LessonSection>
        <Title2 id="reserving-confirm-only-if-you-still-hold-it">
          Reserving: confirm only if you still hold it
        </Title2>
        <Paragraphs>
          <p>
            Reserving is where a naive implementation overbooks. Near the expiry deadline,
            your hold can lapse and someone else can take the seat while your confirmation
            is mid-flight. If confirm is a plain{" "}
            <InlineCode>UPDATE ... SET status = &apos;R&apos;</InlineCode>, you'd hand the
            seat to a user whose hold is already gone.
          </p>
          <p>
            So we put every precondition in the <InlineCode>WHERE</InlineCode>: it's still
            an <InlineCode>H</InlineCode> row, still <em>yours</em>, and still within the
            window at the statement's start. If another writer changes the row while we
            wait, Postgres checks the updated row against these conditions. A hold that
            was already expired when this statement began matches nothing:
          </p>
        </Paragraphs>
        <SqlCodeViewer code={reserveQuery} databaseInitId={databaseInitGraceHold.id} />
        <div className="mt-4">
          <SqlResult execution={reserveExecution} />
        </div>
        <Paragraph>
          Try the same confirm against a seat someone else holds and it simply matches
          nothing — zero rows, no double-booking:
        </Paragraph>
        <SqlCodeViewer code={reserveQuery} databaseInitId={databaseInitLiveHold.id} />
        <div className="mt-4">
          <SqlResult execution={reserveRejectedExecution} />
        </div>
      </LessonSection>

      <LessonSection>
        <Title2 id="listing-available-seats">Listing available seats</Title2>
        <Paragraphs>
          <p>
            A seat is available if it has no reservation row at all, <em>or</em> if its
            only row is a hold that has already expired. The same 30-second rule that
            governs holds decides visibility here:
          </p>
        </Paragraphs>
        <SqlCodeViewer
          code={listAvailableQuery}
          databaseInitId={databaseInitLiveHold.id}
        />
        <div className="mt-4">
          <SqlResult execution={listAvailableExecution} />
        </div>
        <Paragraph>
          Ada is actively holding A2, so it drops out of the list — only A1 and A3 come
          back. Let a hold expire and the seat quietly reappears, no cleanup required.
        </Paragraph>
      </LessonSection>

      <LessonSection>
        <Title2 id="when-you-need-a-lock-for-update">
          When you actually need a lock: advisory locks
        </Title2>
        <Paragraphs>
          <p>
            The upsert and guarded updates use row locks automatically to protect a single
            seat. The <strong>per-user hold limit</strong> spans several seats: two
            requests can write different reservation rows and never conflict. Putting a
            count and an insert in one statement alone doesn't prevent that race.
          </p>
          <p>
            Run it naively and two concurrent requests from the same user both read the
            same count, both see room under the limit, and both insert. The limit is
            broken.
          </p>
        </Paragraphs>
        <SqlCodeViewer code={holdLimitQuery} databaseInitId={databaseInit.id} />
        <Paragraphs>
          <p>
            Both requests first call <InlineCode>pg_advisory_xact_lock</InlineCode>
            with the same key for this user/event pair. The second request waits until the
            first commits or rolls back, releasing its lock. At{" "}
            <InlineCode>READ COMMITTED</InlineCode>, its subsequent statement gets a fresh
            snapshot that includes the first request's committed hold. Acquiring the lock
            in a CTE inside the count statement would retain a snapshot from before the
            wait.
          </p>
          <p>
            The check and seat insert must finish in this same transaction, on the same
            connection. Committing after the count and inserting afterward releases the
            lock too early. A zero-row insert means either the user is at the limit or the
            seat is unavailable; report success only after commit.
          </p>
          <p>
            This is a coordination rule: an advisory lock does not automatically lock
            reservations. Every path that creates a hold or extends its expiry must
            acquire the same lock first. That's why the refresh operation above also uses
            it. Confirming a reservation only reduces the number of holds, so its guarded
            update can stand alone.
          </p>
          <p>
            Locking the <InlineCode>user</InlineCode> row would also queue that user's
            requests for unrelated events, and <InlineCode>FOR UPDATE</InlineCode>
            conflicts with foreign-key checks referencing that user. The advisory lock
            coordinates the user/event pair without a persistent lock row. Use the
            transaction-scoped function shown here: a session-scoped advisory lock would
            survive commit and rollback until explicitly released or the connection
            closes.
          </p>
          <p>
            Our IDs are UUIDs, while this advisory-lock function accepts a 64-bit integer.{" "}
            <InlineCode>hashtextextended</InlineCode> hashes a namespaced string
            containing the event UUID followed by the user UUID, with seed zero. Casting
            through <InlineCode>uuid::text</InlineCode> gives a canonical spelling. Every
            caller must use this same key recipe. A hash collision makes unrelated pairs
            wait for each other; it does not allow two requests for the same pair to
            bypass the lock.
          </p>
          <p>
            Keep the explicit <InlineCode>READ COMMITTED</InlineCode> setting. An advisory
            lock does not refresh a transaction's snapshot under{" "}
            <InlineCode>REPEATABLE READ</InlineCode>, so changing the isolation level
            would invalidate this count-and-insert strategy.
          </p>
          <p>
            The index on <InlineCode>(event_id, user_id, holding_date)</InlineCode>,
            restricted to <InlineCode>status = &apos;H&apos;</InlineCode>, supports the
            live-hold lookup. We only need to know whether two holds exist, so
            <InlineCode>LIMIT 2</InlineCode> inside the counted subquery stops after two
            matches. The expiry cutoff belongs in the query: a partial index cannot
            automatically remove entries as time passes.
          </p>
        </Paragraphs>

        <div className="mt-6">
          <ConcurrencyComparisonDiagram />
        </div>

        <Paragraphs>
          <p>
            The lock makes concurrent holds and refreshes for the same user/event pair
            take turns. Pairs with different lock keys can proceed independently, with the
            reservation's unique key still resolving competition for the same seat.
            Atomicity, advisory locks, row locks, and statement snapshots each do a
            different part of the work.
          </p>
        </Paragraphs>
      </LessonSection>
    </LessonPage>
  );
}
