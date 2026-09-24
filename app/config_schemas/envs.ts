import { z } from "zod";

const ageSecretKeySchema = z
  .string()
  .trim()
  .min(1, "PGQUEST_SOPS_AGE_KEY is required")
  .refine(
    (value) =>
      value.startsWith("AGE-SECRET-KEY-1") || value.startsWith("AGE-SECRET-KEY-PQ-1"),
    "PGQUEST_SOPS_AGE_KEY must be an age secret key",
  );

export const sopsConfigSchema = z.object({
  PGQUEST_SOPS_AGE_KEY: ageSecretKeySchema,
});

export type SopsConfig = z.infer<typeof sopsConfigSchema>;

export const posthogEnvKeys = [
  "PGQUEST_POSTHOG_PROJECT_API_KEY",
  "PGQUEST_POSTHOG_API_HOST",
] as const;

export const posthogEnvSchema = z.object({
  PGQUEST_POSTHOG_PROJECT_API_KEY: z.string().trim().min(1),
  PGQUEST_POSTHOG_API_HOST: z.url().default("https://us.i.posthog.com"),
});

export type PosthogEnv = z.infer<typeof posthogEnvSchema>;

export const healthcheckEnvKeys = ["PGQUEST_HEALTHCHECK_PING_URL"] as const;

export const healthcheckEnvSchema = z.object({
  PGQUEST_HEALTHCHECK_PING_URL: z.url().optional(),
});

export type HealthcheckEnv = z.infer<typeof healthcheckEnvSchema>;

// Separate from PGQUEST_HEALTHCHECK_PING_URL above, which is the deployed app's own
// uptime check (pinged by app/routes/health.tsx on every /health hit). This one is a
// dedicated healthchecks.io check for CI/deploy failures — see scripts/notify.ts,
// invoked directly by .github/workflows/ci.yml, not part of the deployed app's
// runtime ServerConfig.
export const notifyEnvKeys = ["PGQUEST_NOTIFY_PING_URL"] as const;

export const notifyEnvSchema = z.object({
  PGQUEST_NOTIFY_PING_URL: z.url().optional(),
});

export type NotifyEnv = z.infer<typeof notifyEnvSchema>;
