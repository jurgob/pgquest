import { readServerConfig } from "../app/config/config.server";
import { captureCliErrors, runCli } from "./config-cli";

await runCli(() =>
  captureCliErrors(async () => {
    await readServerConfig();
  }),
);
