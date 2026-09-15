import { err, errAsync, ok, ResultAsync, type Result } from "neverthrow";
import { ZodError } from "zod";

type CliError = CliUsageError | CliConfigError | CliUnexpectedError;

export class CliUsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CliUsageError";
  }
}

export class CliConfigError extends Error {
  readonly zodError: ZodError;

  constructor(zodError: ZodError) {
    super("Invalid CLI config");
    this.name = "CliConfigError";
    this.zodError = zodError;
  }
}

export class CliUnexpectedError extends Error {
  override readonly cause: unknown;

  constructor(cause: unknown) {
    super(formatUnexpectedMessage(cause));
    this.name = "CliUnexpectedError";
    this.cause = cause;
  }
}

export async function runCli(command: () => ResultAsync<void, CliError>) {
  const result = await command();

  result.match(
    () => undefined,
    (error) => {
      process.exitCode = 1;
      process.stderr.write(formatCliError(error));
    },
  );
}

export function failCli(error: CliError) {
  return errAsync<void, CliError>(error);
}

export function readRequiredArg(
  value: string | undefined,
  usage: string,
): Result<string, CliUsageError> {
  if (value === undefined) {
    return err(new CliUsageError(`Missing value\n\nUsage: ${usage}`));
  }

  return ok(value);
}

export function captureCliErrors(command: () => Promise<void>) {
  return ResultAsync.fromPromise(command(), toCliError);
}

function toCliError(error: unknown): CliError {
  if (error instanceof CliUsageError) {
    return error;
  }

  if (error instanceof ZodError) {
    return new CliConfigError(error);
  }

  return new CliUnexpectedError(error);
}

function formatCliError(error: CliError) {
  if (error instanceof CliUsageError) {
    return `Error: ${error.message}\n`;
  }

  if (error instanceof CliConfigError) {
    return [
      "Config error:",
      ...error.zodError.issues.map((issue) => `- ${formatZodIssue(issue)}`),
      "",
      "Add the missing values to .env or export them in your shell.",
      "",
    ].join("\n");
  }

  return `Error: ${error.message}\n`;
}

function formatZodIssue(issue: ZodError["issues"][number]) {
  const path = issue.path.join(".");
  const name = path || "config";

  if (issue.code === "invalid_type" && issue.input === undefined) {
    return `${name} is required`;
  }

  return `${name}: ${issue.message}`;
}

function formatUnexpectedMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
