import type { SqlExampleId } from "../../cli_examples/types";
import { getPostgresTranscriptSteps } from "./postgres-examples";
import type {
  PostgresExampleStepOutcome,
  PostgresExampleStepResult,
  PostgresExampleStepResultWithObservers,
} from "./run-example";
import { SqlCodeViewer } from "./sql-editor";
import { SqlResult } from "./use-lesson-sql-example";
import type { LessonSqlState } from "./use-lesson-sql-example";

// Up to four concurrent sessions, as used by the locks and job queue lessons.
export type TimelineSessionId = "A" | "B" | "C" | "D";

export type TimelineEntry = {
  explanation?: string;
  step: PostgresExampleStepResult<TimelineSessionId>;
};

function transcriptSteps(
  id: SqlExampleId,
): readonly PostgresExampleStepResultWithObservers<TimelineSessionId>[] {
  return getPostgresTranscriptSteps(
    id,
  ) as readonly PostgresExampleStepResultWithObservers<TimelineSessionId>[];
}

// Flattens a transcript into one in-order timeline (each step, then its observedBy
// checkpoints, if any). `explanations` is keyed by position in that flat list.
export function flattenTranscript(
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

function toLessonSqlState(outcome: PostgresExampleStepOutcome): LessonSqlState {
  return outcome.status === "done"
    ? { output: outcome.output, status: "done" }
    : { message: outcome.message, status: "error" };
}

export function Timeline({ entries }: { entries: readonly TimelineEntry[] }) {
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

const SESSION_BADGE_CLASSNAMES: Record<TimelineSessionId, string> = {
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
  step: PostgresExampleStepResult<TimelineSessionId>;
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
