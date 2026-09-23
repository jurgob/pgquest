import rawTranscripts from "../generated/postgres-examples.json";
import type { SqlExampleId } from "../../cli_examples/types";
import type { PostgresExampleStepResultWithObservers } from "./run-example";

type GeneratedTranscript = {
  inputHash: string;
  steps: readonly PostgresExampleStepResultWithObservers<string>[];
};

const transcripts = rawTranscripts as Record<SqlExampleId, GeneratedTranscript>;

// Looks up a session transcript precomputed by scripts/build-postgres-examples.ts —
// see cli_examples/*.sql.ts's `postgresTranscripts` export for how one gets
// registered, and app/sql/run-example.ts's runMultiSessionSteps/
// runConcurrentSessionSteps for what actually produced these steps at build time.
export function getPostgresTranscriptSteps(
  id: SqlExampleId,
): readonly PostgresExampleStepResultWithObservers<string>[] {
  const transcript = transcripts[id];

  if (!transcript) {
    throw new Error(
      `Missing precomputed postgres transcript "${id}" — run \`pnpm run build-assets:pgexamples\`.`,
    );
  }

  return transcript.steps;
}
