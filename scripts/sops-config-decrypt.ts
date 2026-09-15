import { writeFileSync } from "node:fs";

import {
  applyProcessEnvOverrides,
  decryptConfigEnv,
  decryptedEnvPath,
  readSopsConfigFromEnv,
  toDotEnv,
} from "../app/config/sops.server";
import { loadDotEnvIfPresent } from "../app/config/dotenv.server";
import { captureCliErrors, runCli } from "./config-cli";

await runCli(() =>
  captureCliErrors(async () => {
  loadDotEnvIfPresent();

  const config = readSopsConfigFromEnv(process.env);
  const decryptedEnv = await decryptConfigEnv(config);
  const mergedEnv = applyProcessEnvOverrides(decryptedEnv, process.env);
  const dotEnv = toDotEnv(mergedEnv);

  writeFileSync(decryptedEnvPath, dotEnv);
  process.stdout.write(dotEnv);
  }),
);
