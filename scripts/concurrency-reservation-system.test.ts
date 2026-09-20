import { PGlite } from "@electric-sql/pglite";
import { expect, test } from "vitest";
import {
  databaseInit,
  databaseInitExpiredHold,
  databaseInitGraceHold,
  holdLimitQuery,
  refreshWithLimitQuery,
} from "../cli_examples/concurrency-reservation-system.sql";

test("the hold-limit transaction inserts below the limit and rejects at the limit", async () => {
  const db = new PGlite();
  try {
    await db.exec(databaseInit.query);
    await db.exec(holdLimitQuery);
    // Copy the successful hold to A1 so Grace has reached the two-seat limit.
    await db.exec(`INSERT INTO reservation
      SELECT event_id, 1, user_id, status, holding_date, reservation_date
      FROM reservation WHERE seat_id = 2`);
    await db.exec(holdLimitQuery.replace(", 2,", ", 3,"));
    expect(
      (await db.query("SELECT seat_id FROM reservation ORDER BY seat_id")).rows,
    ).toEqual([{ seat_id: 1 }, { seat_id: 2 }]);
  } finally {
    await db.close();
  }
});

test("expired holds do not consume the limit and can be taken over", async () => {
  const db = new PGlite();
  try {
    await db.exec(databaseInitExpiredHold.query);
    await db.exec(holdLimitQuery);
    await db.exec(`INSERT INTO reservation
      SELECT event_id, 1, user_id, status,
        statement_timestamp() - interval '60 seconds', reservation_date
      FROM reservation WHERE seat_id = 2`);
    await db.exec(holdLimitQuery.replace(", 2,", ", 3,"));
    const result = await db.query(`SELECT seat_id FROM reservation
      WHERE holding_date > statement_timestamp() - interval '30 seconds'
      ORDER BY seat_id`);
    expect(result.rows).toEqual([{ seat_id: 2 }, { seat_id: 3 }]);
  } finally {
    await db.close();
  }
});

test("the refresh transaction extends a live hold but does not revive an expired one", async () => {
  const db = new PGlite();
  try {
    await db.exec(databaseInitGraceHold.query);
    await db.exec(
      "UPDATE reservation SET holding_date = statement_timestamp() - interval '10 seconds'",
    );
    const before = await db.query("SELECT holding_date FROM reservation");
    await db.exec(refreshWithLimitQuery);
    const after = await db.query("SELECT holding_date FROM reservation");
    expect(after.rows).not.toEqual(before.rows);
    await db.exec(
      "UPDATE reservation SET holding_date = statement_timestamp() - interval '60 seconds'",
    );
    const expired = await db.query("SELECT holding_date FROM reservation");
    await db.exec(refreshWithLimitQuery);
    expect((await db.query("SELECT holding_date FROM reservation")).rows).toEqual(
      expired.rows,
    );
  } finally {
    await db.close();
  }
});
