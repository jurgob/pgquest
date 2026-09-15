import { loadDotEnvIfPresent } from "./dotenv.server";
import {
  applyProcessEnvOverrides,
  decryptConfigEnv,
  readSopsConfigFromEnv,
} from "./sops.server";
import {
  type PosthogEnv,
  posthogEnvKeys,
  posthogEnvSchema,
} from "../config_schemas/envs";

export type ServerConfig = {
  posthog: {
    projectApiKey: string;
    apiHost: string;
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
  const env = applyProcessEnvOverrides(decryptedEnv, process.env, posthogEnvKeys);
  const posthogEnv = posthogEnvSchema.parse(env);

  return buildServerConfig(posthogEnv);
}

function buildServerConfig(env: PosthogEnv): ServerConfig {
  const posthog: ServerConfig["posthog"] = {
    projectApiKey: env.PGQUEST_POSTHOG_PROJECT_API_KEY,
    apiHost: env.PGQUEST_POSTHOG_API_HOST,
  };

  return {
    posthog,
  };
}
