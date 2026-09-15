import { existsSync, readFileSync } from "node:fs";

export function loadDotEnvIfPresent(path = ".env") {
  if (!existsSync(path)) {
    return;
  }

  const content = readFileSync(path, "utf8");
  Object.entries(parseDotEnv(content)).forEach(([key, value]) => {
    process.env[key] ??= value;
  });
}

export function parseDotEnv(content: string) {
  return Object.fromEntries(
    content
      .split(/\r?\n/)
      .map((line) => parseDotEnvLine(line))
      .filter((entry): entry is { key: string; value: string } => entry !== null)
      .map(({ key, value }) => [key, value]),
  );
}

function parseDotEnvLine(line: string) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) {
    return null;
  }

  const separatorIndex = trimmed.indexOf("=");
  if (separatorIndex === -1) {
    return null;
  }

  const key = trimmed.slice(0, separatorIndex).trim();
  const rawValue = trimmed.slice(separatorIndex + 1).trim();
  if (!key) {
    return null;
  }

  return {
    key,
    value: unwrapDotEnvValue(rawValue),
  };
}

function unwrapDotEnvValue(value: string) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}
