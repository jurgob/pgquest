import { writeFileSync } from "node:fs";

import {
  applyProcessEnvOverrides,
  decryptConfigEnv,
  decryptedEnvPath,
  readSopsConfigFromEnv,
  toDotEnv,
} from "../app/config/sops.server";
import { loadDotEnvIfPresent } from "../app/config/dotenv.server";
import {
  healthcheckEnvKeys,
  notifyEnvKeys,
  posthogEnvKeys,
} from "../app/config_schemas/envs";
import { captureCliErrors, runCli } from "./config-cli";

const allowedKeys = [...posthogEnvKeys, ...healthcheckEnvKeys, ...notifyEnvKeys];

await runCli(() =>
  captureCliErrors(async () => {
    loadDotEnvIfPresent();

    const config = readSopsConfigFromEnv(process.env);
    const decryptedEnv = await decryptConfigEnv(config);
    const mergedEnv = applyProcessEnvOverrides(decryptedEnv, process.env, allowedKeys);
    const dotEnv = toDotEnv(mergedEnv);

    writeFileSync(decryptedEnvPath, dotEnv);
    process.stdout.write(dotEnv);
  }),
);
