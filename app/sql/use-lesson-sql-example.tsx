import { useEffect, useMemo, useState } from "react";

import type { PostgresExampleStep } from "../../cli_examples/types";
import { runMultiSessionSteps, runSqlQuery } from "./run-example";
import type { ExecutionOutput, SqlExecutionInput } from "./types";
import {
  OutputBlock,
  ResultTable,
  SqlExplainViewer,
  SqlResultSkeleton,
} from "./sql-editor";

export type LessonSqlState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "done"; output: ExecutionOutput };

export function useLessonSqlExample(input: SqlExecutionInput): LessonSqlState {
  const [state, setState] = useState<LessonSqlState>({ status: "loading" });
  const stableInput = useMemo(() => input, [input.query, input.sqlLoad]);

  useEffect(() => {
    let isCurrent = true;
    const controller = new AbortController();

    setState({ status: "loading" });

    void runSqlQuery(stableInput, stableInput.query, controller.signal).then((result) => {
      if (!isCurrent) {
        return;
      }

      result.match(
        (output) => setState({ output, status: "done" }),
        (message) => setState({ message, status: "error" }),
      );
    });

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [stableInput]);

  return state;
}

export function SqlResult({ execution }: { execution: LessonSqlState }) {
  if (execution.status === "loading") {
    return (
      <OutputBlock tone="neutral">
        <SqlResultSkeleton />
      </OutputBlock>
    );
  }

  if (execution.status === "error") {
    return (
      <OutputBlock tone="danger">
        <pre className="overflow-auto whitespace-pre-wrap text-sm text-red-800">
          {execution.message}
        </pre>
      </OutputBlock>
    );
  }

  return (
    <OutputBlock tone="neutral">
      <ResultTable rows={execution.output.rows} />
    </OutputBlock>
  );
}

export function SqlPlan({ execution }: { execution: LessonSqlState }) {
  if (execution.status === "loading") {
    return (
      <OutputBlock tone="plan">
        <SqlExplainViewer code={"Loading plan..."} />
      </OutputBlock>
    );
  }

  if (execution.status === "error") {
    return (
      <OutputBlock tone="danger">
        <pre className="overflow-auto whitespace-pre-wrap text-sm text-red-800">
          {execution.message}
        </pre>
      </OutputBlock>
    );
  }

  return (
    <OutputBlock tone="plan">
      <SqlExplainViewer code={execution.output.plan} />
    </OutputBlock>
  );
}

export type MultiSessionStepResult<SessionId extends string> =
  PostgresExampleStep<SessionId> & {
    state: LessonSqlState;
  };

/**
 * Live variant of a precomputed session transcript — runs `runMultiSessionSteps`
 * (see app/sql/run-example.ts for the actual replay algorithm and why each step
 * needs its own fresh connection) in an effect, updating state incrementally as
 * each step finishes. Prefer a lesson importing the precomputed
 * `app/generated/postgres-examples.json` output of
 * `scripts/build-postgres-examples.ts` where possible — this hook exists for
 * transcripts not yet registered there (e.g. while authoring a new lesson).
 */
export function useLessonSqlExampleMultipleSession<
  const SessionIds extends readonly string[],
>({
  pgSessionIds,
  queries,
  runExplain = false,
  sqlLoad,
}: {
  sqlLoad: string;
  pgSessionIds: SessionIds;
  queries: readonly PostgresExampleStep<SessionIds[number]>[];
  // Applies to every step. Defaults to false — see SqlExecutionInput.runExplain.
  runExplain?: boolean;
}): readonly MultiSessionStepResult<SessionIds[number]>[] {
  for (const step of queries) {
    if (!pgSessionIds.includes(step.pgSessionId)) {
      throw new Error(
        `useLessonSqlExampleMultipleSession: unknown pgSessionId "${step.pgSessionId}" — expected one of: ${pgSessionIds.join(", ")}`,
      );
    }
  }

  const [steps, setSteps] = useState<
    readonly MultiSessionStepResult<SessionIds[number]>[]
  >(() => queries.map((step) => ({ ...step, state: { status: "loading" } })));

  const queriesKey = JSON.stringify(queries);

  useEffect(() => {
    let isCurrent = true;
    const controller = new AbortController();

    setSteps(queries.map((step) => ({ ...step, state: { status: "loading" } })));

    function updateStep(index: number, state: LessonSqlState) {
      setSteps((previous) =>
        previous.map((step, i) => (i === index ? { ...step, state } : step)),
      );
    }

    runMultiSessionSteps({
      onStep: (index, outcome) => {
        if (!isCurrent) {
          return;
        }
        updateStep(
          index,
          outcome.status === "done"
            ? { output: outcome.output, status: "done" }
            : { message: outcome.message, status: "error" },
        );
      },
      queries,
      runExplain,
      signal: controller.signal,
      sqlLoad,
    }).catch(() => {
      // AbortError from unmount cancels the signal — every settled step already
      // reported its own outcome via onStep, so there's nothing left to show here.
    });

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [sqlLoad, queriesKey, runExplain]);

  return steps;
}
