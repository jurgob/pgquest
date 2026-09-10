import { useEffect, useMemo, useState } from "react";

import { runSqlQuery } from "./run-example";
import type { ExecutionOutput, SqlExecutionInput } from "./types";
import { CodeViewer, OutputBlock, ResultTable, SqlResultSkeleton } from "./sql-editor";

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
        <CodeViewer code={"Loading plan..."} syntax="explain" />
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
      <CodeViewer code={execution.output.plan} syntax="explain" />
    </OutputBlock>
  );
}
