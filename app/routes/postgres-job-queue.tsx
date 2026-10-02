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
  3: "Both workers own job 1. Alice gets two receipts.",
});

const skipLockedTimeline = flattenTranscript(
  SQL_EXAMPLE_IDS.postgresJobQueueSkipLockedTranscript,
  {
    1: "Job 1 is locked, so SKIP LOCKED takes job 2 instead of waiting.",
    3: "Everything is locked: no job, no waiting.",
    5: "A crash never commits: Postgres rolls the transaction back, like this ROLLBACK.",
    6: "Job 2 is back, so nothing is lost. But attempts is 1 again: the crash rolled it back too.",
  },
);

const leaseTimeline = flattenTranscript(SQL_EXAMPLE_IDS.postgresJobQueueLeaseTranscript, {
  0: "The claim commits immediately. No transaction stays open while Worker A works.",
  2: "Job 4 is retried. Job 5 is out of attempts: it goes to 'failed', the dead-letter queue.",
  3: "Attempt 2 of job 4: the counter survived the crash.",
  4: "Job 4's first worker was only slow. attempts = 1 no longer matches, so it can't overwrite Worker C's claim.",
});

const exactlyOnceTimeline = flattenTranscript(
  SQL_EXAMPLE_IDS.postgresJobQueueExactlyOnceTranscript,
  {
    2: "The invoice is rolled back together with the claim.",
    6: "Delivered twice, invoiced once.",
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

const POSTGRES_QUEUES: readonly { href: string; name: string }[] = [
  { name: "Solid Queue", href: "https://github.com/rails/solid_queue" },
  { name: "Oban", href: "https://github.com/oban-bg/oban" },
  { name: "River", href: "https://github.com/riverqueue/river" },
  { name: "graphile-worker", href: "https://github.com/graphile/worker" },
  { name: "pg-boss", href: "https://github.com/timgit/pg-boss" },
  { name: "pgmq", href: "https://github.com/pgmq/pgmq" },
];

const DELIVERY_GUARANTEES: readonly {
  guarantee: string;
  how: string;
  onCrash: string;
}[] = [
  {
    guarantee: "At most once",
    how: "Mark done, then work",
    onCrash: "Job lost",
  },
  {
    guarantee: "At least once",
    how: "Work, then mark done",
    onCrash: "Job runs again",
  },
  {
    guarantee: "Exactly once",
    how: "Impossible",
    onCrash: "—",
  },
];

const ALTERNATIVES: readonly { name: string; summary: string }[] = [
  {
    name: "Postgres",
    summary: "Transactional with your data, nothing new to run. Thousands of jobs/s.",
  },
  {
    name: "Redis",
    summary: "Very fast; Streams add consumer groups. Memory-bound, weaker durability.",
  },
  {
    name: "RabbitMQ",
    summary: "Routing, acks, dead-letter exchanges, push delivery. One more cluster.",
  },
  {
    name: "Kafka",
    summary: "Replayable log, huge throughput, many consumer groups. Heavy to operate.",
  },
  {
    name: "SQS / SNS",
    summary: "Managed; visibility timeouts, DLQs, SNS fan-out. AWS only.",
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
          description: <>Many workers, one table, no job handed out twice.</>,
        },
        {
          concept: "Delivery guarantees",
          url: "https://en.wikipedia.org/wiki/Two_Generals%27_Problem",
          description: <>At-most-once or at-least-once. Exactly-once is impossible.</>,
        },
        {
          concept: "Leases and fencing",
          url: "https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html",
          description: (
            <>
              <InlineCode>locked_until</InlineCode> recovers dead workers&apos; jobs; the
              attempt number rejects stale reports.
            </>
          ),
        },
        {
          concept: "Exactly-once processing",
          url: "https://www.postgresql.org/docs/current/tutorial-transactions.html",
          description: <>Work and &quot;done&quot; in one transaction.</>,
        },
        {
          concept: "Transactional enqueue (outbox)",
          url: "https://microservices.io/patterns/data/transactional-outbox.html",
          description: <>Enqueue in the same transaction as your data.</>,
        },
        {
          concept: "LISTEN / NOTIFY",
          url: "https://www.postgresql.org/docs/current/sql-notify.html",
          description: <>Wake workers on commit instead of polling.</>,
        },
      ]}
    >
      <Paragraphs>
        <p>
          Emails, webhooks, PDFs, image resizing, delayed reminders: work that
          shouldn&apos;t block a request goes to a job queue. A table is enough, building
          on <InlineCode>SKIP LOCKED</InlineCode> from the{" "}
          <Link className={linkClassName} to="/lessons/postgres-locks">
            locks lesson
          </Link>
          . It&apos;s what{" "}
          {POSTGRES_QUEUES.map((queue, index) => (
            <span key={queue.name}>
              {index > 0 ? (index === POSTGRES_QUEUES.length - 1 ? " and " : ", ") : null}
              <ExternalLink href={queue.href}>{queue.name}</ExternalLink>
            </span>
          ))}{" "}
          do.
        </p>
      </Paragraphs>

      <Section>
        <Title2 id="delivery-guarantees">Delivery guarantees</Title2>
        <Paragraph>
          Each job goes to one of N workers. What happens when that worker crashes?
        </Paragraph>
        <div className="mt-3 overflow-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr>
                <th className={tableHeaderClassName}>Guarantee</th>
                <th className={tableHeaderClassName}>How</th>
                <th className={tableHeaderClassName}>Worker crashes mid-job</th>
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
        <Paragraph>
          <strong>Nobody can do exactly-once delivery</strong>: not Postgres, Kafka, or
          SQS. If a worker&apos;s &quot;done&quot; never arrives, the queue can&apos;t
          tell &quot;done, then crashed&quot; from &quot;crashed first&quot;. That&apos;s
          the{" "}
          <ExternalLink href="https://en.wikipedia.org/wiki/Two_Generals%27_Problem">
            Two Generals&apos; Problem
          </ExternalLink>{" "}
          (a simpler cousin of the{" "}
          <ExternalLink href="https://en.wikipedia.org/wiki/Byzantine_fault">
            Byzantine Generals Problem
          </ExternalLink>
          ; see also{" "}
          <ExternalLink href="https://bravenewgeek.com/you-cannot-have-exactly-once-delivery/">
            You Cannot Have Exactly-Once Delivery
          </ExternalLink>
          ). You get at-least-once plus idempotent work, or exactly-once{" "}
          <em>processing</em> inside Postgres, shown below.
        </Paragraph>
      </Section>

      <Section>
        <Title2 id="the-migration">The migration</Title2>
        <div className="mt-4">
          <SqlCodeViewer code={migration} databaseInitId={databaseInit.id} />
        </div>
      </Section>

      <Section>
        <Title2 id="the-seed">The seed</Title2>
        <div className="mt-4">
          <SqlCodeViewer code={seed} />
        </div>
      </Section>

      <LessonSection>
        <div>
          <Title2 id="the-naive-queue">The naive queue</Title2>
          <Paragraph>Each session is a real, separate worker connection.</Paragraph>
        </div>
        <Timeline entries={naiveTimeline} />
      </LessonSection>

      <LessonSection>
        <Title2 id="claiming-with-skip-locked">Claiming with SKIP LOCKED</Title2>
        <Timeline entries={skipLockedTimeline} />
        <Paragraph>
          Correct and at-least-once, but a job that always crashes retries forever, and
          long jobs hold transactions open.
        </Paragraph>
      </LessonSection>

      <LessonSection>
        <div>
          <Title2 id="leases">Leases: claim, commit, then work</Title2>
          <Paragraph>Like SQS&apos;s visibility timeout:</Paragraph>
        </div>
        <SqlCodeViewer code={claimWithLeaseQuery} />
        <Paragraph>Reclaiming expired leases:</Paragraph>
        <SqlCodeViewer code={reclaimExpiredLeasesQuery} />
        <Timeline entries={leaseTimeline} />
        <Paragraph>On an error, retry with exponential backoff:</Paragraph>
        <SqlCodeViewer code={retryWithBackoffScript} />
      </LessonSection>

      <LessonSection>
        <div>
          <Title2 id="exactly-once-processing">Exactly-once processing</Title2>
          <Paragraph>When the work is a write to the same database:</Paragraph>
        </div>
        <Timeline entries={exactlyOnceTimeline} />
        <Paragraph>
          For emails or payments, pass the job id as an{" "}
          <ExternalLink href="https://docs.stripe.com/api/idempotent_requests">
            idempotency key
          </ExternalLink>
          .
        </Paragraph>
      </LessonSection>

      <LessonSection>
        <Title2 id="enqueueing">Enqueue with your data</Title2>
        <SqlCodeViewer code={transactionalEnqueueScript} />
        <Paragraph>
          No order without its job, no job without its order. With a separate broker you
          need an{" "}
          <ExternalLink href="https://microservices.io/patterns/data/transactional-outbox.html">
            outbox table
          </ExternalLink>{" "}
          for this, which is a Postgres queue anyway.
        </Paragraph>
      </LessonSection>

      <LessonSection>
        <Title2 id="listen-notify">LISTEN / NOTIFY</Title2>
        <SqlCodeViewer code={listenNotifyScript} />
        <Paragraph>Only a hint: keep polling slowly as a safety net.</Paragraph>
      </LessonSection>

      <LessonSection>
        <Title2 id="fan-out">One event, many consumers</Title2>
        <SqlCodeViewer code={fanOutScript} />
      </LessonSection>

      <LessonSection>
        <Title2 id="postgres-or-a-broker">Postgres or a broker?</Title2>
        <Paragraph>Not the goal of this lesson, just the high-level idea:</Paragraph>
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
      </LessonSection>

      <LessonSection>
        <Title2 id="rules-of-thumb">Rules of thumb</Title2>
        <ul className="list-disc space-y-2 pl-5 text-base leading-7 text-zinc-800">
          <li>
            Claim with <InlineCode>FOR UPDATE SKIP LOCKED</InlineCode>.
          </li>
          <li>Assume every job runs twice: make it idempotent.</li>
          <li>Short in-database work: one transaction. Long work: a lease.</li>
          <li>Limit attempts, back off, keep a dead-letter status.</li>
          <li>Delete finished jobs so vacuum keeps up.</li>
        </ul>
      </LessonSection>
    </CourseLessonPage>
  );
}
