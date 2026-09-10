import { useEffect, useMemo, useState } from "react";

import { runSqlQuery } from "./run-example";
import { SqlExecutionResult, type SqlExecutionState } from "./sql-editor";
import type { SqlExecutionInput } from "./types";

export function useSqlExecution(input: SqlExecutionInput) {
  const [execution, setExecution] = useState<SqlExecutionState>({ status: "loading" });
  const stableInput = useMemo(() => input, [input.query, input.sqlLoad]);

  useEffect(() => {
    let isCurrent = true;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      setExecution({ status: "loading" });

      void runSqlQuery(stableInput, stableInput.query, controller.signal).then(
        (result) => {
          if (!isCurrent) {
            return;
          }

          setExecution(
            result.match<SqlExecutionState>(
              (output) => ({ status: "done", output }),
              (message) => ({ status: "error", message }),
            ),
          );
        },
      );
    }, 0);

    return () => {
      isCurrent = false;
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [stableInput]);

  return {
    SQLResult: ({ children }: { children?: React.ReactNode }) => (
      <SqlExecutionResult execution={execution} view="result">
        {children}
      </SqlExecutionResult>
    ),
    SQLResultExplain: ({ children }: { children?: React.ReactNode }) => (
      <SqlExecutionResult execution={execution} query={stableInput.query} view="plan">
        {children}
      </SqlExecutionResult>
    ),
  };
}
