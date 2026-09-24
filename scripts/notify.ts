import { err, ok, type Result } from "neverthrow";

import { decryptConfigEnv, readSopsConfigFromEnv } from "../app/config/sops.server";
import { loadDotEnvIfPresent } from "../app/config/dotenv.server";
import { notifyEnvSchema } from "../app/config_schemas/envs";
import { captureCliErrors, CliUsageError, failCli, runCli } from "./config-cli";

// Posts a ping to the CI/deploy-result healthchecks.io check
// (PGQUEST_NOTIFY_PING_URL — see app/config_schemas/envs.ts for why this is separate
// from PGQUEST_HEALTHCHECK_PING_URL, the deployed app's own uptime check). `error`
// hits `/fail`, which triggers an alert immediately. `success` hits the plain ping
// URL — healthchecks.io only notifies on a STATE CHANGE, so this is silent unless
// the check was previously down (in which case it sends a recovery/"UP" alert) —
// see .github/workflows/ci.yml for where this is actually invoked.
const usage = 'pnpm run notify success|error "<message>"';

type NotifyArgs = { status: "error" | "success"; message: string };

await runCli(() => {
  const args = parseArgs(process.argv.slice(2));
  if (args.isErr()) {
    return failCli(args.error);
  }

  const { message, status } = args.value;

  return captureCliErrors(async () => {
    loadDotEnvIfPresent();

    const sopsConfig = readSopsConfigFromEnv(process.env);
    const decryptedEnv = await decryptConfigEnv(sopsConfig);
    const notifyEnv = notifyEnvSchema.parse(decryptedEnv);
    const pingUrl = notifyEnv.PGQUEST_NOTIFY_PING_URL;

    if (!pingUrl) {
      console.log("PGQUEST_NOTIFY_PING_URL is not configured — skipping notification.");
      return;
    }

    const url = status === "error" ? `${pingUrl}/fail` : pingUrl;
    const response = await fetch(url, { body: message, method: "POST" });

    if (!response.ok) {
      throw new Error(`Notify ping failed: ${response.status} ${response.statusText}`);
    }

    console.log(`Notified (${status}): ${message}`);
  });
});

function parseArgs(args: readonly string[]): Result<NotifyArgs, CliUsageError> {
  const [status, message] = args;

  if (status !== "success" && status !== "error") {
    return err(
      new CliUsageError(`First argument must be "success" or "error"\n\nUsage: ${usage}`),
    );
  }

  if (message === undefined) {
    return err(new CliUsageError(`Missing message\n\nUsage: ${usage}`));
  }

  return ok({ message, status });
}
