import type { ServerConfig } from "./config.server";

export const internalTrafficQueryParam = "pgquest_internal" as const;

export type PublicPosthogConfig = {
  projectApiKey: string;
  apiHost: string;
};

export function getPublicPosthogConfig(config: ServerConfig): PublicPosthogConfig {
  return {
    projectApiKey: config.posthog.projectApiKey,
    apiHost: config.posthog.apiHost,
  };
}
