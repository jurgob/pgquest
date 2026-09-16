import { loadDotEnvIfPresent } from "./dotenv.server";
import {
  applyProcessEnvOverrides,
  decryptConfigEnv,
  readSopsConfigFromEnv,
} from "./sops.server";
import {
  type HealthcheckEnv,
  healthcheckEnvKeys,
  healthcheckEnvSchema,
  type PosthogEnv,
  posthogEnvKeys,
  posthogEnvSchema,
} from "../config_schemas/envs";

export type ServerConfig = {
  posthog: {
    projectApiKey: string;
    apiHost: string;
  };
  healthcheck: {
    pingUrl: string | undefined;
  };
};

let configPromise: Promise<ServerConfig> | undefined;

export function readServerConfig() {
  configPromise ??= readServerConfigUncached();
  return configPromise;
}

async function readServerConfigUncached(): Promise<ServerConfig> {
  loadDotEnvIfPresent();

  const sopsConfig = readSopsConfigFromEnv(process.env);
  const decryptedEnv = await decryptConfigEnv(sopsConfig);
  const allowedKeys = [...posthogEnvKeys, ...healthcheckEnvKeys];
  const env = applyProcessEnvOverrides(decryptedEnv, process.env, allowedKeys);
  const posthogEnv = posthogEnvSchema.parse(env);
  const healthcheckEnv = healthcheckEnvSchema.parse(env);

  return buildServerConfig(posthogEnv, healthcheckEnv);
}

function buildServerConfig(
  posthogEnv: PosthogEnv,
  healthcheckEnv: HealthcheckEnv,
): ServerConfig {
  return {
    posthog: {
      projectApiKey: posthogEnv.PGQUEST_POSTHOG_PROJECT_API_KEY,
      apiHost: posthogEnv.PGQUEST_POSTHOG_API_HOST,
    },
    healthcheck: {
      pingUrl: healthcheckEnv.PGQUEST_HEALTHCHECK_PING_URL,
    },
  };
}
