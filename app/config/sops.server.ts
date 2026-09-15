import { readFileSync } from "node:fs";

import * as age from "age-encryption";
import { decryptSops } from "sops-age";

import {
  type SopsConfig,
  sopsConfigSchema,
} from "../config_schemas/envs";

export const encryptedConfigPath = "config.enc.json" as const;
export const decryptedEnvPath = ".env.decrypted" as const;

export function readSopsConfigFromEnv(env: NodeJS.ProcessEnv): SopsConfig {
  return sopsConfigSchema.parse(env);
}

export async function encryptValue(value: string, config: SopsConfig) {
  const recipient = await age.identityToRecipient(config.PGQUEST_SOPS_AGE_KEY);
  const encrypter = new age.Encrypter();
  encrypter.addRecipient(recipient);

  const ciphertext = await encrypter.encrypt(value);
  return Buffer.from(ciphertext).toString("base64");
}

export async function decryptValue(value: string, config: SopsConfig) {
  const decrypter = new age.Decrypter();
  decrypter.addIdentity(config.PGQUEST_SOPS_AGE_KEY);

  const ciphertext = isArmoredAgeValue(value)
    ? age.armor.decode(value)
    : Buffer.from(value, "base64");

  return decrypter.decrypt(ciphertext, "text");
}

export async function decryptConfigEnv(config: SopsConfig) {
  const rawConfig = JSON.parse(readFileSync(encryptedConfigPath, "utf8")) as unknown;

  if (isSopsConfig(rawConfig)) {
    const decrypted = (await decryptSops({
      path: encryptedConfigPath,
      fileType: "json",
      secretKey: config.PGQUEST_SOPS_AGE_KEY,
    })) as unknown;

    return readEnvShape(decrypted);
  }

  return decryptArmoredEnvShape(rawConfig, config);
}

export function applyProcessEnvOverrides(
  decryptedEnv: Record<string, string>,
  env: NodeJS.ProcessEnv,
) {
  const mergedEnv = { ...decryptedEnv };
  for (const key of Object.keys(mergedEnv)) {
    const overrideValue = env[key];
    if (overrideValue !== undefined) {
      mergedEnv[key] = overrideValue;
    }
  }

  return mergedEnv;
}

export function toDotEnv(env: Record<string, string>) {
  return Object.entries(env)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${quoteDotEnvValue(value)}`)
    .join("\n")
    .concat("\n");
}

function isSopsConfig(value: unknown): value is { sops: unknown } {
  return (
    typeof value === "object" &&
    value !== null &&
    "sops" in value
  );
}

async function decryptArmoredEnvShape(
  value: unknown,
  config: SopsConfig,
): Promise<Record<string, string>> {
  const env = readEnvShape(value);
  const decryptedEntries = await Promise.all(
    Object.entries(env).map(async ([key, envValue]) => {
      if (!isEncryptedValue(envValue)) {
        return [key, envValue] as const;
      }

      return [key, await decryptValue(envValue, config)] as const;
    }),
  );

  return Object.fromEntries(decryptedEntries);
}

function readEnvShape(value: unknown): Record<string, string> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${encryptedConfigPath} must decrypt to an object`);
  }

  const env: Record<string, string> = {};
  for (const [key, envValue] of Object.entries(value)) {
    if (key === "sops") {
      continue;
    }

    if (!key.startsWith("PGQUEST_")) {
      throw new Error(`${encryptedConfigPath} contains non-PGQUEST key ${key}`);
    }

    if (typeof envValue !== "string") {
      throw new Error(`${encryptedConfigPath}.${key} must be a string`);
    }

    env[key] = envValue;
  }

  return env;
}

function isArmoredAgeValue(value: string) {
  return value.startsWith("-----BEGIN AGE ENCRYPTED FILE-----");
}

function isEncryptedValue(value: string) {
  return isArmoredAgeValue(value) || isBase64AgeValue(value);
}

function isBase64AgeValue(value: string) {
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(value)) {
    return false;
  }

  const bytes = Buffer.from(value, "base64");
  return new TextDecoder()
    .decode(bytes.subarray(0, 32))
    .startsWith("age-encryption.org/v1");
}

function quoteDotEnvValue(value: string) {
  if (/^[A-Za-z0-9_./:@-]+$/.test(value)) {
    return value;
  }

  return JSON.stringify(value);
}
