import { examples as exampleOneExamples } from "../../cli_examples/example1.sql";
import { examples as exampleTwoExamples } from "../../cli_examples/example2a.sql";
import type { SqlExample } from "../../cli_examples/types";

export const sqlExamples: readonly SqlExample[] = [
  ...exampleOneExamples,
  ...exampleTwoExamples,
].filter((example) => Boolean(example.database_init));
