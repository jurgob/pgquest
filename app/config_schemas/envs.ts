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
