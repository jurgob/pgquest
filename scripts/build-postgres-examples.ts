import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { lessons } from "../app/sql/lesson-catalog";
import { runConcurrentSessionSteps, runMultiSessionSteps } from "../app/sql/run-example";
import type { PostgresExampleStepResultWithObservers } from "../app/sql/run-example";
import type { PostgresTranscript, SqlExampleId } from "../cli_examples/types";

type GeneratedEntry = {
  inputHash: string;
  steps: readonly PostgresExampleStepResultWithObservers<string>[];
};

type GeneratedFile = Record<SqlExampleId, GeneratedEntry>;

const root = process.cwd();
const examplesDir = path.join(root, "cli_examples");
const outPath = path.join(root, "app", "generated", "postgres-examples.json");

const previous: GeneratedFile = fs.existsSync(outPath)
  ? JSON.parse(fs.readFileSync(outPath, "utf8"))
  : {};

// Every lesson's cli_examples module MAY export `postgresTranscripts` — this script
// doesn't know or care which lessons do; it just picks them up wherever they exist,
// the same way scripts/run-cli-examples.ts picks up `examples`/`exercises`.
const transcripts: PostgresTranscript[] = [];

for (const lesson of lessons) {
  const filePath = path.join(examplesDir, lesson.cliExampleModule);
  const mod: { postgresTranscripts?: readonly PostgresTranscript[] } = await import(
    pathToFileURL(filePath).href
  );
  transcripts.push(...(mod.postgresTranscripts ?? []));
}

const result: GeneratedFile = {} as GeneratedFile;
let computed = 0;
let reused = 0;

for (const transcript of transcripts) {
  const inputHash = hashInput(transcript);
  const cached = previous[transcript.id];

  if (cached && cached.inputHash === inputHash) {
    result[transcript.id] = cached;
    reused += 1;
    continue;
  }

  // A transcript with any `observedBy` checkpoint needs a real second session
  // (runConcurrentSessionSteps' clone-based approach) — everything else uses the
  // simpler, browser-compatible replay-per-step approach.
  const needsConcurrentSession = transcript.queries.some(
    (step) => (step.observedBy?.length ?? 0) > 0,
  );
  const steps = needsConcurrentSession
    ? await runConcurrentSessionSteps({
        queries: transcript.queries,
        runExplain: transcript.runExplain ?? false,
        sqlLoad: transcript.sqlLoad,
      })
    : await runMultiSessionSteps({
        queries: transcript.queries,
        runExplain: transcript.runExplain ?? false,
        sqlLoad: transcript.sqlLoad,
      });
  result[transcript.id] = { inputHash, steps };
  computed += 1;
}

fs.writeFileSync(outPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(
  `Wrote ${transcripts.length} postgres example transcript(s) to ${outPath} (${computed} computed, ${reused} reused from cache).`,
);

function hashInput(transcript: PostgresTranscript): string {
  const payload = JSON.stringify({
    queries: transcript.queries,
    runExplain: transcript.runExplain ?? false,
    sqlLoad: transcript.sqlLoad,
  });
  return createHash("sha256").update(payload).digest("hex");
}
