import { Link } from "react-router";

import { SQL_EXAMPLE_IDS } from "../../cli_examples/types";
import {
  claimWithLeaseQuery,
  databaseInit,
  exercises,
  fanOutScript,
  listenNotifyScript,
  migration,
  reclaimExpiredLeasesQuery,
  retryWithBackoffScript,
  seed,
  transactionalEnqueueScript,
} from "../../cli_examples/postgres-job-queue.sql";
import { CourseLessonPage } from "../sql/course-lesson-page";
import {
  InlineCode,
  LessonSection,
  Paragraph,
  Paragraphs,
  Section,
  Title2,
} from "../sql/lesson-layout";
import { flattenTranscript, Timeline } from "../sql/session-timeline";
import { SqlCodeViewer } from "../sql/sql-editor";

const naiveTimeline = flattenTranscript(SQL_EXAMPLE_IDS.postgresJobQueueNaiveTranscript, {
  1: "Worker B reads before Worker A has claimed anything, so both see job 1 as the next one.",
  3: "No error, no waiting: Worker B's UPDATE simply overwrites 'running' with 'running'. Both workers now believe they own job 1, and alice gets two receipts.",
});

const skipLockedTimeline = flattenTranscript(
  SQL_EXAMPLE_IDS.postgresJobQueueSkipLockedTranscript,
  {
    0: "The subquery locks job 1 with FOR UPDATE, and the UPDATE counts the attempt. The row lock is the claim: it lasts as long as Worker A's transaction.",
    1: "Job 1 is locked, so SKIP LOCKED moves on to job 2 instead of waiting. No two workers can ever hold the same job.",
    2: "Worker C gets job 3.",
    3: "Every pending job is locked, so Worker D gets nothing, immediately. A real worker would sleep for a moment, or wait for a notification, and try again.",
    4: "Worker A did the work, marks job 1 done, and commits, which releases its lock.",
    5: "A worker that crashes mid-job never commits. When its connection drops, Postgres rolls its transaction back, which is what this ROLLBACK does.",
    6: "Job 2 is available again, so no job is lost when a worker dies. But look at attempts: it's back to 1, because the crash rolled back the attempt counter too.",
  },
);

const leaseTimeline = flattenTranscript(SQL_EXAMPLE_IDS.postgresJobQueueLeaseTranscript, {
  0: "This time the claim commits straight away: job 1 is 'running' and belongs to Worker A for the next 5 minutes. No transaction stays open while Worker A works.",
  1: "Jobs 4 and 5 were claimed ten minutes ago by workers that died, and their 5-minute leases have run out.",
  2: "Job 4 goes back to 'pending' to be tried again. Job 5 has already used its 3 attempts, so it goes to 'failed' instead: that's the dead-letter queue, where a person looks at it.",
  3: "Job 4 is due earliest, so Worker C gets it, as its second attempt. The counter survived its first worker's crash because the claim was committed.",
  4: "Job 4's first worker wasn't dead after all, just very slow. It tries to report the job done, but the attempts = 1 check matches nothing, because job 4 is now on attempt 2. The worker learns that it lost the job, and Worker C's claim stays intact.",
  5: "Worker A still holds attempt 1 of job 1, so its report goes through.",
});

const exactlyOnceTimeline = flattenTranscript(
  SQL_EXAMPLE_IDS.postgresJobQueueExactlyOnceTranscript,
  {
    1: "The job's work is itself a database write, in the same transaction as the claim.",
    2: "Worker A crashes after doing the work but before committing. The invoice disappears together with the claim.",
    4: "Worker B does the same work again. This is a second delivery, and it's harmless: nothing Worker A did survived.",
    5: "The invoice and the job's 'done' become visible together, or not at all.",
    6: "However many workers tried, order 3 has exactly one invoice, and the job is done.",
  },
);

const linkClassName =
  "text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900";

function ExternalLink({ children, href }: { children: React.ReactNode; href: string }) {
  return (
    <a className={linkClassName} href={href} rel="noreferrer" target="_blank">
      {children}
    </a>
  );
}

const USE_CASES: readonly { example: string; useCase: string }[] = [
  {
    useCase: "Slow work after a request",
    example: "Send the receipt email after checkout, without making the customer wait.",
  },
  {
    useCase: "Calls to other services",
    example: "Deliver webhooks, charge a card, sync a customer to the CRM.",
  },
  {
    useCase: "Heavy work",
    example: "Resize uploaded images, render PDFs, generate reports.",
  },
  {
    useCase: "Scheduled and delayed work",
    example:
      "Send a reminder 24 hours before a booking; retry a failed call in a minute.",
  },
  {
    useCase: "Absorbing spikes",
    example:
      "A flash sale creates 50,000 jobs in a minute; workers get through them at their own pace.",
  },
];

const POSTGRES_QUEUES: readonly { href: string; name: string; notes: string }[] = [
  {
    name: "Solid Queue",
    href: "https://github.com/rails/solid_queue",
    notes: "Ruby on Rails' default job backend since Rails 8.",
  },
  {
    name: "Oban",
    href: "https://github.com/oban-bg/oban",
    notes: "The standard job queue for Elixir.",
  },
  { name: "River", href: "https://github.com/riverqueue/river", notes: "Go." },
  {
    name: "graphile-worker",
    href: "https://github.com/graphile/worker",
    notes: "Node.js, woken up with LISTEN/NOTIFY.",
  },
  { name: "pg-boss", href: "https://github.com/timgit/pg-boss", notes: "Node.js." },
  {
    name: "pgmq",
    href: "https://github.com/pgmq/pgmq",
    notes: "A Postgres extension with an SQS-like API.",
  },
];

const DELIVERY_GUARANTEES: readonly {
  guarantee: string;
  how: string;
  onCrash: string;
}[] = [
  {
    guarantee: "At most once",
    how: "Mark the job done, then do the work.",
    onCrash: "The job is lost. Fine for things like refreshing a cache.",
  },
  {
    guarantee: "At least once",
    how: "Do the work, then mark the job done.",
    onCrash:
      "The job runs again, even if the work had actually finished. The usual choice.",
  },
  {
    guarantee: "Exactly once",
    how: "Impossible over a network, as explained below.",
    onCrash: "—",
  },
];

const ALTERNATIVES: readonly { name: string; summary: string }[] = [
  {
    name: "Postgres",
    summary:
      "Jobs are enqueued in the same transaction as the data they're about, there's nothing new to run, and you can inspect the queue with SQL. Comfortable up to a few thousand jobs per second; beyond that, dead rows and vacuum become the bottleneck.",
  },
  {
    name: "Redis",
    summary:
      "Lists make a very fast, very simple queue; Streams add consumer groups and redelivery of unacknowledged messages. Data lives in memory, and how much survives a crash depends on how persistence is configured.",
  },
  {
    name: "RabbitMQ",
    summary:
      "A classic message broker: acknowledgements, routing, priorities, and dead-letter exchanges built in, and it pushes messages to consumers instead of being polled. One more cluster to run.",
  },
  {
    name: "Kafka",
    summary:
      "A replayable log rather than a queue: huge throughput, ordering within a partition, and any number of consumer groups reading the same events. Retrying or delaying one message is awkward, and it's heavy to operate.",
  },
  {
    name: "SQS / SNS",
    summary:
      "Fully managed. SQS has visibility timeouts and dead-letter queues built in, and SNS fans a message out to many queues. Standard queues are at-least-once and unordered, and you're tied to AWS.",
  },
];

const tableHeaderClassName = "border-b border-zinc-300 px-3 py-2 font-bold text-zinc-950";
const tableCellClassName = "border-b border-zinc-100 px-3 py-2 align-top text-zinc-800";

export default function PostgresJobQueue() {
  return (
    <CourseLessonPage
      exercises={exercises}
      lessonId="postgres-job-queue"
      whatWeLearned={[
        {
          concept: "FOR UPDATE SKIP LOCKED",
          url: "https://www.postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE",
          description: (
            <>
              Lets many workers claim jobs from the same table at once: each skips the
              rows others have locked, so no job is handed to two workers.
            </>
          ),
        },
        {
          concept: "Delivery guarantees",
          url: "https://en.wikipedia.org/wiki/Two_Generals%27_Problem",
          description: (
            <>
              At-most-once or at-least-once, depending on whether you mark a job done
              before or after doing it. Exactly-once delivery is impossible.
            </>
          ),
        },
        {
          concept: "Leases and fencing",
          url: "https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html",
          description: (
            <>
              A claim that expires (<InlineCode>locked_until</InlineCode>) lets another
              worker take over a dead worker's job; checking the attempt number when
              reporting back stops a slow worker from overwriting the new claim.
            </>
          ),
        },
        {
          concept: "Exactly-once processing",
          url: "https://www.postgresql.org/docs/current/tutorial-transactions.html",
          description: (
            <>
              When a job's work is a write to the same database, doing it and marking the
              job done in one transaction makes it happen exactly once.
            </>
          ),
        },
        {
          concept: "Transactional enqueue (outbox)",
          url: "https://microservices.io/patterns/data/transactional-outbox.html",
          description: (
            <>
              Insert the job in the same transaction as the data it's about, so there's
              never an order without its job, or a job without its order.
            </>
          ),
        },
        {
          concept: "LISTEN / NOTIFY",
          url: "https://www.postgresql.org/docs/current/sql-notify.html",
          description: (
            <>
              Wakes up idle workers when a job is committed, so they don't have to poll
              the table constantly.
            </>
          ),
        },
      ]}
    >
      <Paragraphs>
        <p>
          Some work shouldn't happen while a user waits: sending an email, calling a
          webhook, rendering a PDF. The usual answer is a job queue. The web request
          records what needs doing, and background workers pick the jobs up and do them.
        </p>
        <p className="mt-3">
          You don't need a message broker for that. A table is enough, and the{" "}
          <Link className={linkClassName} to="/lessons/postgres-locks">
            locks lesson
          </Link>{" "}
          already showed the key ingredient,{" "}
          <InlineCode>FOR UPDATE SKIP LOCKED</InlineCode>. But a queue people can rely on
          needs more than one clever query: a job must never go to two workers at once, a
          worker crashing must not lose its job, failing jobs need retries and a place to
          end up, and you need to know exactly what happens when something dies halfway.
          This lesson builds all of that.
        </p>
      </Paragraphs>

      <Section>
        <Title2 id="what-queues-are-for">What queues are for</Title2>
        <div className="mt-3 overflow-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr>
                <th className={tableHeaderClassName}>Use case</th>
                <th className={tableHeaderClassName}>Example</th>
              </tr>
            </thead>
            <tbody>
              {USE_CASES.map((row) => (
                <tr key={row.useCase}>
                  <td className={`${tableCellClassName} whitespace-nowrap font-semibold`}>
                    {row.useCase}
                  </td>
                  <td className={tableCellClassName}>{row.example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Paragraph>
          Plenty of production systems run their queue in Postgres. These popular
          libraries all use the technique in this lesson:
        </Paragraph>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-base leading-7 text-zinc-800">
          {POSTGRES_QUEUES.map((queue) => (
            <li key={queue.name}>
              <ExternalLink href={queue.href}>{queue.name}</ExternalLink>: {queue.notes}
            </li>
          ))}
        </ul>
      </Section>

      <Section>
        <Title2 id="what-a-queue-must-guarantee">What a queue must guarantee</Title2>
        <Paragraphs>
          <p>
            Picture one queue and N workers pulling from it. Each job should be handled by
            one worker, not all of them (a pattern called competing consumers). While a
            worker holds a job, no other worker may get it. And the queue has to decide
            what happens when a worker crashes halfway through. That decision is the
            queue's delivery guarantee:
          </p>
        </Paragraphs>
        <div className="mt-3 overflow-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr>
                <th className={tableHeaderClassName}>Guarantee</th>
                <th className={tableHeaderClassName}>How</th>
                <th className={tableHeaderClassName}>If the worker crashes mid-job</th>
              </tr>
            </thead>
            <tbody>
              {DELIVERY_GUARANTEES.map((row) => (
                <tr key={row.guarantee}>
                  <td className={`${tableCellClassName} whitespace-nowrap font-semibold`}>
                    {row.guarantee}
                  </td>
                  <td className={tableCellClassName}>{row.how}</td>
                  <td className={tableCellClassName}>{row.onCrash}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section>
        <Title2 id="exactly-once-delivery">
          Exactly-once delivery: nobody can do it
        </Title2>
        <Paragraphs>
          <p>
            Everyone wants the third row. No queue can provide it: not Postgres, not
            Kafka, not SQS, not RabbitMQ.
          </p>
          <p className="mt-3">
            Say a worker sends a receipt email, then tells the queue &quot;done&quot;. If
            that message never arrives, the queue can&apos;t tell &quot;the worker sent
            the email and then crashed&quot; from &quot;the worker crashed before sending
            it&quot;. Both look the same from where the queue is: silence. So it must
            choose between handing the job out again, risking a second email
            (at-least-once), or dropping it, risking no email (at-most-once). Waiting
            longer doesn&apos;t help, and neither does asking the worker to confirm its
            confirmation, because that message can get lost too.
          </p>
          <p className="mt-3">
            This is the{" "}
            <ExternalLink href="https://en.wikipedia.org/wiki/Two_Generals%27_Problem">
              Two Generals&apos; Problem
            </ExternalLink>
            , proved unsolvable in the 1970s: two parties that talk over a channel that
            can lose messages can never be certain they agree. Its better-known cousin,
            the{" "}
            <ExternalLink href="https://en.wikipedia.org/wiki/Byzantine_fault">
              Byzantine Generals Problem
            </ExternalLink>
            , is harder still, because some participants may also lie. Products that
            advertise &quot;exactly-once&quot; mean something narrower: deduplicating
            messages within a time window, or exactly-once processing inside their own
            transactions. Tyler Treat&apos;s{" "}
            <ExternalLink href="https://bravenewgeek.com/you-cannot-have-exactly-once-delivery/">
              You Cannot Have Exactly-Once Delivery
            </ExternalLink>{" "}
            explains it well.
          </p>
          <p className="mt-3">What you can have, and what this lesson builds:</p>
        </Paragraphs>
        <ul className="mt-2 list-disc space-y-2 pl-5 text-base leading-7 text-zinc-800">
          <li>
            <strong>At-least-once delivery plus idempotent work</strong>, where doing a
            job twice has the same effect as doing it once. The result is often called
            effectively-once.
          </li>
          <li>
            <strong>Exactly-once processing</strong>, when the job&apos;s work is a write
            to the same Postgres database as the queue. This is something a separate
            broker can&apos;t offer.
          </li>
        </ul>
      </Section>

      <Section>
        <Title2 id="the-migration">The migration</Title2>
        <Paragraph>
          A <InlineCode>jobs</InlineCode> table is the queue.{" "}
          <InlineCode>status</InlineCode> tracks each job&apos;s life,{" "}
          <InlineCode>attempts</InlineCode> and <InlineCode>max_attempts</InlineCode>{" "}
          drive retries, <InlineCode>run_at</InlineCode> lets a job wait until later, and{" "}
          <InlineCode>locked_until</InlineCode> is used for leases, later in the lesson.
          The partial index only contains pending jobs, so it stays small however many
          finished jobs pile up. <InlineCode>orders</InlineCode> and{" "}
          <InlineCode>invoices</InlineCode> are the application&apos;s own data.
        </Paragraph>
        <div className="mt-4">
          <SqlCodeViewer code={migration} databaseInitId={databaseInit.id} />
        </div>
      </Section>

      <Section>
        <Title2 id="the-seed">The seed</Title2>
        <Paragraph>
          Three orders, three pending jobs, and two jobs whose workers died ten minutes
          ago.
        </Paragraph>
        <div className="mt-4">
          <SqlCodeViewer code={seed} />
        </div>
      </Section>

      <LessonSection>
        <div>
          <Title2 id="the-naive-queue">The naive queue</Title2>
          <Paragraphs>
            <p>
              The obvious worker loop: find the oldest pending job, mark it running, do
              it. Each session below is a separate worker with its own real connection to
              one Postgres server, recorded at build time as in the locks lesson.
            </p>
          </Paragraphs>
        </div>
        <Timeline entries={naiveTimeline} />
        <Paragraph>
          Adding <InlineCode>AND status = &apos;pending&apos;</InlineCode> to the UPDATE
          would make Worker B&apos;s claim update nothing, so only one worker would win.
          But all the workers would still race for the same first row, and all but one
          would have to start over, again and again, under load.
        </Paragraph>
      </LessonSection>

      <LessonSection>
        <div>
          <Title2 id="claiming-with-skip-locked">Claiming jobs with SKIP LOCKED</Title2>
          <Paragraphs>
            <p>
              Instead, each worker locks the job it picks with{" "}
              <InlineCode>FOR UPDATE SKIP LOCKED</InlineCode>. Rows another worker has
              locked are skipped rather than waited for, so four workers get four
              different jobs in one round trip each. Here, each worker keeps its
              transaction open while it works, so the row lock is the claim:
            </p>
          </Paragraphs>
        </div>
        <Timeline entries={skipLockedTimeline} />
        <Paragraphs>
          <p>
            This is a correct at-least-once queue in one query, and for short jobs
            it&apos;s a good design. Worker B may already have sent bob&apos;s receipt
            when it crashed, so bob may get it twice: that&apos;s the at-least-once part.
          </p>
          <p className="mt-3">Holding the transaction open has two costs, though:</p>
        </Paragraphs>
        <ul className="list-disc space-y-2 pl-5 text-base leading-7 text-zinc-800">
          <li>
            A job that crashes its worker every time (a &quot;poison&quot; job) is retried
            forever, because the crash also rolls back the attempt counter.
          </li>
          <li>
            A 10-minute job means a transaction open for 10 minutes, holding a database
            connection the whole time and keeping vacuum from cleaning up dead rows (see
            the{" "}
            <Link className={linkClassName} to="/lessons/mvcc">
              MVCC lesson
            </Link>
            ).
          </li>
        </ul>
      </LessonSection>

      <LessonSection>
        <div>
          <Title2 id="leases">Leases: claim, commit, then work</Title2>
          <Paragraphs>
            <p>
              The fix is to commit the claim right away and record how long it lasts. The
              job is marked <InlineCode>running</InlineCode> with a{" "}
              <InlineCode>locked_until</InlineCode> deadline, and the worker does the work
              outside any transaction. If the worker doesn&apos;t report back before the
              deadline, the job is considered abandoned. SQS calls this a visibility
              timeout.
            </p>
          </Paragraphs>
        </div>
        <SqlCodeViewer code={claimWithLeaseQuery} />
        <Paragraph>
          Something now has to notice expired leases. Any worker can run this before
          claiming, or a scheduled task can run it every few seconds:
        </Paragraph>
        <SqlCodeViewer code={reclaimExpiredLeasesQuery} />
        <Timeline entries={leaseTimeline} />
        <Paragraphs>
          <p>
            Step 5 is the subtle one. A lease can expire while its worker is still alive:
            a long garbage-collection pause, a slow network, a job that took longer than
            expected. Without the <InlineCode>attempts = 1</InlineCode> check, the slow
            worker would mark job 4 done while Worker C is still working on it. Using the
            attempt number this way is called a fencing token: every report names the
            claim it belongs to, and reports about an old claim are ignored.
          </p>
          <p className="mt-3">
            When a job fails with an error instead of a crash, the worker puts it back
            with a delay that doubles each time (exponential backoff), so a service
            that&apos;s down isn&apos;t hammered with retries:
          </p>
        </Paragraphs>
        <SqlCodeViewer code={retryWithBackoffScript} />
      </LessonSection>

      <LessonSection>
        <div>
          <Title2 id="exactly-once-processing">
            Exactly-once processing, inside Postgres
          </Title2>
          <Paragraphs>
            <p>
              Delivery can&apos;t be exactly-once, but processing can be, if the
              job&apos;s work is a write to the same database. Then the work and the
              &quot;done&quot; go into one transaction, and they commit or roll back
              together. Holding the transaction open is the right choice here, since the
              work is a few quick writes.
            </p>
          </Paragraphs>
        </div>
        <Timeline entries={exactlyOnceTimeline} />
        <Paragraphs>
          <p>
            The job was delivered twice, and the invoice was created once. For work
            outside the database, like an email, a payment, or a webhook, no transaction
            can take it back. There, make the work idempotent: pass the job id as an
            idempotency key to APIs that support one (
            <ExternalLink href="https://docs.stripe.com/api/idempotent_requests">
              Stripe does
            </ExternalLink>
            ), or record what you&apos;ve done under a unique constraint and skip it the
            second time.
          </p>
        </Paragraphs>
      </LessonSection>

      <LessonSection>
        <Title2 id="enqueueing">Enqueueing in the same transaction</Title2>
        <Paragraphs>
          <p>
            The same idea works in the other direction. If orders go into Postgres and
            jobs go to a separate broker, the order can commit while the message is lost,
            or the message can be sent for an order that then rolls back. With the queue
            in the same database, both are one transaction:
          </p>
        </Paragraphs>
        <SqlCodeViewer code={transactionalEnqueueScript} />
        <Paragraph>
          Teams using a separate broker end up with this pattern anyway: they write events
          to an{" "}
          <ExternalLink href="https://microservices.io/patterns/data/transactional-outbox.html">
            outbox table
          </ExternalLink>{" "}
          in the same transaction, and a relay process forwards them to the broker. The
          outbox is a Postgres queue.
        </Paragraph>
      </LessonSection>

      <LessonSection>
        <Title2 id="listen-notify">Waking workers up: LISTEN and NOTIFY</Title2>
        <Paragraphs>
          <p>
            Idle workers find new jobs by polling, which wastes queries when the queue is
            empty and adds delay when it isn&apos;t. <InlineCode>LISTEN</InlineCode> and{" "}
            <InlineCode>NOTIFY</InlineCode> let the producer wake them up instead.
            Notifications are sent only when the transaction commits, so a worker is never
            woken up for a job it can&apos;t see yet:
          </p>
        </Paragraphs>
        <SqlCodeViewer code={listenNotifyScript} />
        <Paragraph>
          A notification is only a hint. It&apos;s lost if no worker is listening at that
          moment, so workers still poll every few seconds as a safety net. The table is
          always the source of truth.
        </Paragraph>
      </LessonSection>

      <LessonSection>
        <Title2 id="fan-out">One event, many consumers</Title2>
        <Paragraphs>
          <p>
            So far each job goes to exactly one worker. Sometimes one event must reach
            several independent consumers instead: a new order needs a receipt, an
            invoice, and a CRM update. The simplest way is one job per consumer, created
            together:
          </p>
        </Paragraphs>
        <SqlCodeViewer code={fanOutScript} />
        <Paragraph>
          The alternative is Kafka&apos;s model: keep one append-only table of events and
          let each consumer remember the last id it read. It&apos;s harder to get right
          than it looks. Ids come from a sequence when a row is inserted, not when it
          commits, so a transaction holding id 7 can commit after id 8 is already visible.
          A consumer that has moved past 8 never sees 7.
        </Paragraph>
      </LessonSection>

      <LessonSection>
        <Title2 id="keeping-it-healthy">Keeping the queue healthy</Title2>
        <ul className="list-disc space-y-2 pl-5 text-base leading-7 text-zinc-800">
          <li>
            Every claim and every status change creates a new row version. A busy queue
            produces dead rows quickly, so make sure autovacuum keeps up with the jobs
            table, and watch <InlineCode>n_dead_tup</InlineCode> in{" "}
            <InlineCode>pg_stat_user_tables</InlineCode>.
          </li>
          <li>
            Delete finished jobs regularly, or partition the table by time and drop old
            partitions, which leaves nothing for vacuum to clean up.
          </li>
          <li>
            Keep an index that covers only what workers search for, like the partial index
            on pending jobs in the migration.
          </li>
          <li>
            Look at <InlineCode>failed</InlineCode> jobs. The dead-letter queue is only
            useful if someone reads it.
          </li>
        </ul>
      </LessonSection>

      <LessonSection>
        <Title2 id="postgres-or-a-broker">Postgres or a message broker?</Title2>
        <Paragraph>
          Comparing queue technologies isn&apos;t the goal of this lesson, and each of
          these deserves a lesson of its own. This is just a high-level idea of where each
          one fits:
        </Paragraph>
        <div className="overflow-auto">
          <table className="w-full border-collapse text-left text-sm">
            <tbody>
              {ALTERNATIVES.map((row) => (
                <tr key={row.name}>
                  <td className={`${tableCellClassName} whitespace-nowrap font-semibold`}>
                    {row.name}
                  </td>
                  <td className={tableCellClassName}>{row.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Paragraph>
          A reasonable default: start with Postgres when jobs belong to your data and
          volume is moderate, and move to a dedicated system when you need very high
          throughput, event replay, or many teams consuming the same stream.
        </Paragraph>
      </LessonSection>

      <LessonSection>
        <Title2 id="rules-of-thumb">Rules of thumb</Title2>
        <ul className="list-disc space-y-2 pl-5 text-base leading-7 text-zinc-800">
          <li>
            Claim jobs with <InlineCode>FOR UPDATE SKIP LOCKED</InlineCode>, never with a
            separate SELECT and UPDATE.
          </li>
          <li>
            Assume every job can run more than once, and make the work idempotent.
            Exactly-once delivery doesn&apos;t exist.
          </li>
          <li>
            For short jobs whose work is in the database, claim, work, and mark done in
            one transaction: that&apos;s exactly-once processing.
          </li>
          <li>
            For long jobs or external calls, commit the claim with a lease, and check the
            attempt number when reporting back.
          </li>
          <li>
            Limit attempts, back off between them, and send jobs that keep failing to a
            dead-letter status.
          </li>
          <li>Enqueue jobs in the same transaction as the data they&apos;re about.</li>
        </ul>
      </LessonSection>
    </CourseLessonPage>
  );
}
