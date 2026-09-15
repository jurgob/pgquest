import { encryptValue, readSopsConfigFromEnv } from "../app/config/sops.server";
import { loadDotEnvIfPresent } from "../app/config/dotenv.server";
import { captureCliErrors, failCli, readRequiredArg, runCli } from "./config-cli";

await runCli(() => {
  const value = readRequiredArg(process.argv[2], "pnpm sops:encrypt <value>");
  if (value.isErr()) {
    return failCli(value.error);
  }

  return captureCliErrors(async () => {
    loadDotEnvIfPresent();
    const config = readSopsConfigFromEnv(process.env);
    console.log(await encryptValue(value.value, config));
  });
});
