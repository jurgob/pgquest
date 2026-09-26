import pg from "pg";
import { describe, expect, test } from "vitest";
import { runConcurrentSessionSteps } from "../app/sql/run-example";

// These tests need the real dev Postgres (`pnpm run dev:pg`, or the Claude Code on
// the web SessionStart hook), same as `pnpm run build-assets:pgexamples`. CI doesn't
// run one, so they're skipped there.
const devPgAvailable = await (async () => {
  const client = new pg.Client({
    connectionTimeoutMillis: 1000,
    database: "postgres",
    host: process.env.PGQUEST_DEV_PG_HOST ?? "localhost",
    port: Number(process.env.PGQUEST_DEV_PG_PORT ?? 9998),
    user: process.env.PGQUEST_DEV_PG_USER ?? "postgres",
  });
  try {
    await client.connect();
    return true;
  } catch {
    return false;
  } finally {
    await client.end().catch(() => undefined);
  }
})();

const sqlLoad = `
CREATE TABLE accounts (id INTEGER PRIMARY KEY, owner TEXT NOT NULL, balance INTEGER NOT NULL);
INSERT INTO accounts VALUES (1, 'alice', 1000), (2, 'bob', 500);
`;

describe.skipIf(!devPgAvailable)("runConcurrentSessionSteps", () => {
  test("a blocked statement finishes after the commit that releases it", async () => {
    const steps = await runConcurrentSessionSteps({
      queries: [
        {
          pgSessionId: "A",
          query: "BEGIN; UPDATE accounts SET balance = balance - 100 WHERE id = 1;",
        },
        {
          blocks: true,
          pgSessionId: "B",
          query:
            "UPDATE accounts SET balance = balance + 50 WHERE id = 1 RETURNING balance;",
        },
        {
          pgSessionId: "C",
          query: `SELECT locktype, granted FROM pg_locks
            WHERE NOT granted ORDER BY locktype;`,
        },
        { pgSessionId: "A", query: "COMMIT;" },
      ],
      sqlLoad,
    });

    expect(steps[1]).toMatchObject({
      blocks: true,
      output: { rows: [{ balance: 950 }] },
      status: "done",
      unblockedAfter: 3,
    });
    // A row-lock wait shows up as a wait on the holder's transaction id.
    expect(steps[2]).toMatchObject({
      output: { rows: [{ granted: false, locktype: "transactionid" }] },
    });
  });

  test("a queue of waiters is released in order", async () => {
    const steps = await runConcurrentSessionSteps({
      queries: [
        { pgSessionId: "A", query: "BEGIN; SELECT count(*) FROM accounts;" },
        {
          blocks: true,
          pgSessionId: "B",
          query: "ALTER TABLE accounts ADD COLUMN note TEXT;",
        },
        {
          blocks: true,
          pgSessionId: "C",
          query: "SELECT owner FROM accounts WHERE id = 1;",
        },
        { pgSessionId: "A", query: "COMMIT;" },
      ],
      sqlLoad,
    });

    expect(steps[1]).toMatchObject({ status: "done", unblockedAfter: 3 });
    expect(steps[2]).toMatchObject({
      output: { rows: [{ owner: "alice" }] },
      status: "done",
      unblockedAfter: 3,
    });
  });

  test("a deadlock cancels the session that waited first", async () => {
    const steps = await runConcurrentSessionSteps({
      queries: [
        {
          pgSessionId: "A",
          query: "BEGIN; UPDATE accounts SET balance = 1 WHERE id = 1;",
        },
        {
          pgSessionId: "B",
          query: "BEGIN; UPDATE accounts SET balance = 2 WHERE id = 2;",
        },
        {
          blocks: true,
          pgSessionId: "A",
          query: "UPDATE accounts SET balance = 1 WHERE id = 2;",
        },
        {
          blocks: true,
          pgSessionId: "B",
          query: "UPDATE accounts SET balance = 2 WHERE id = 1;",
        },
        { pgSessionId: "A", query: "ROLLBACK;" },
        { pgSessionId: "B", query: "COMMIT;" },
      ],
      sqlLoad,
    });

    expect(steps[2]).toMatchObject({
      message: "deadlock detected",
      status: "error",
      unblockedAfter: 3,
    });
    expect(steps[3]).toMatchObject({ status: "done", unblockedAfter: 3 });
  });

  test("observedBy checkpoints run on their own session", async () => {
    const steps = await runConcurrentSessionSteps({
      queries: [
        {
          observedBy: [
            { pgSessionId: "B", query: "SELECT balance FROM accounts WHERE id = 1;" },
          ],
          pgSessionId: "A",
          query: "BEGIN; UPDATE accounts SET balance = 0 WHERE id = 1;",
        },
        { pgSessionId: "A", query: "COMMIT;" },
      ],
      sqlLoad,
    });

    expect(steps[0]?.observedBy?.[0]).toMatchObject({
      output: { rows: [{ balance: 1000 }] },
    });
  });

  test("a blocks step that doesn't wait fails the build", async () => {
    await expect(
      runConcurrentSessionSteps({
        queries: [{ blocks: true, pgSessionId: "A", query: "SELECT 1;" }],
        sqlLoad,
      }),
    ).rejects.toThrow("finished without waiting for a lock");
  });

  test("a statement still waiting at the end fails the build", async () => {
    await expect(
      runConcurrentSessionSteps({
        queries: [
          {
            pgSessionId: "A",
            query: "BEGIN; UPDATE accounts SET balance = 0 WHERE id = 1;",
          },
          {
            blocks: true,
            pgSessionId: "B",
            query: "UPDATE accounts SET balance = 1 WHERE id = 1;",
          },
        ],
        sqlLoad,
      }),
    ).rejects.toThrow("still waiting for a lock when the transcript ended");
  });
});
