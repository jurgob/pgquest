import { SQL_EXAMPLE_IDS, type SqlExample } from "./types";

const EVENT_ID = "33333333-3333-3333-3333-333333333333";
const ADA_ID = "11111111-1111-1111-1111-111111111111";
const GRACE_ID = "22222222-2222-2222-2222-222222222222";
const BOB_ID = "44444444-4444-4444-4444-444444444444";

// A hold lives for 30 seconds. Expiry is a rule, not a delete: a hold only
// counts while holding_date is newer than this window.
const HOLD_TTL = "interval '30 seconds'";

// ---- Schema, table by table (seats scoped to the event, no counter) ----
const userTable = `CREATE TABLE "user" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL
);`;

const eventTable = `CREATE TABLE event (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  name TEXT NOT NULL,
  seat_number INTEGER NOT NULL
);`;

const seatTable = `CREATE TABLE seat (
  id SERIAL PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES event (id),
  label TEXT NOT NULL
);`;

// One row per (event, seat). status 'H' = holding, 'R' = reserved.
const reservationTable = `CREATE TABLE reservation (
  event_id UUID NOT NULL REFERENCES event (id),
  seat_id INTEGER NOT NULL REFERENCES seat (id),
  user_id UUID NOT NULL REFERENCES "user" (id),
  status CHAR(1) NOT NULL CHECK (status IN ('H', 'R')),
  holding_date TIMESTAMPTZ,
  reservation_date TIMESTAMPTZ,
  PRIMARY KEY (event_id, seat_id)
);`;

const holdIndex = `CREATE INDEX reservation_live_hold_lookup
ON reservation (event_id, user_id, holding_date)
WHERE status = 'H';`;

export const migration = `${userTable}

${eventTable}

${seatTable}

${reservationTable}

${holdIndex}
`;

export const seed = `INSERT INTO "user" (id, name)
VALUES
  ('${ADA_ID}', 'Ada'),
  ('${GRACE_ID}', 'Grace'),
  ('${BOB_ID}', 'Bob');

INSERT INTO event (id, name, seat_number)
VALUES ('${EVENT_ID}', 'Concert Night', 3);

INSERT INTO seat (event_id, label)
VALUES
  ('${EVENT_ID}', 'A1'),
  ('${EVENT_ID}', 'A2'),
  ('${EVENT_ID}', 'A3');
`;

// Seed a hold on seat A2 (seat id 2) for a user, aged by `ageSeconds`.
// ageSeconds >= 30 makes it already expired.
const seedHoldOnSeatTwo = (userId: string, ageSeconds: number) =>
  `INSERT INTO reservation (event_id, seat_id, user_id, status, holding_date)
VALUES ('${EVENT_ID}', 2, '${userId}', 'H', statement_timestamp() - interval '${ageSeconds} seconds');`;

export const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.concurrencyReservationSystemDatabaseInit,
  name: "Reservation database",
  description:
    "user, event, per-event seat, reservation. Concert Night has seats A1-A3, none held.",
  query: `${migration}\n${seed}`,
};

export const databaseInitLiveHold: SqlExample = {
  id: SQL_EXAMPLE_IDS.concurrencyReservationSystemDatabaseInitLiveHold,
  name: "Reservation database (A2 held by Ada)",
  description: "Ada holds seat A2, held just now — a live, non-expired hold.",
  query: `${databaseInit.query}\n${seedHoldOnSeatTwo(ADA_ID, 0)}`,
};

export const databaseInitExpiredHold: SqlExample = {
  id: SQL_EXAMPLE_IDS.concurrencyReservationSystemDatabaseInitExpiredHold,
  name: "Reservation database (A2 hold expired)",
  description: "Ada's hold on A2 is 60s old — past the 30s window, so it's expired.",
  query: `${databaseInit.query}\n${seedHoldOnSeatTwo(ADA_ID, 60)}`,
};

export const databaseInitGraceHold: SqlExample = {
  id: SQL_EXAMPLE_IDS.concurrencyReservationSystemDatabaseInitGraceHold,
  name: "Reservation database (A2 held by Grace)",
  description: "Grace holds seat A2, live — ready to be confirmed into a reservation.",
  query: `${databaseInit.query}\n${seedHoldOnSeatTwo(GRACE_ID, 0)}`,
};

// ---- Operations ----

// Hold: take the seat if free, or take over an EXPIRED hold — atomically.
// The unique key and conflict-row lock protect this seat, not the per-user limit.
const holdQueryFor = (
  userId: string,
) => `INSERT INTO reservation (event_id, seat_id, user_id, status, holding_date)
VALUES ('${EVENT_ID}', 2, '${userId}', 'H', statement_timestamp())
ON CONFLICT (event_id, seat_id) DO UPDATE
  SET user_id = EXCLUDED.user_id, holding_date = statement_timestamp(), status = 'H'
  WHERE reservation.status = 'H'
    AND reservation.holding_date <= statement_timestamp() - ${HOLD_TTL}
RETURNING *;
`;

export const holdQuery = holdQueryFor(GRACE_ID);

// Same hold attempt, made by a different user — so "rejected" and "takeover"
// below aren't both just Grace acting twice in a row.
export const holdRejectedQuery = holdQueryFor(BOB_ID);

// Reserve (confirm H -> R): only if I still hold it and it hasn't expired.
export const reserveQuery = `UPDATE reservation
SET status = 'R', reservation_date = statement_timestamp()
WHERE event_id = '${EVENT_ID}' AND seat_id = 2 AND user_id = '${GRACE_ID}'
  AND status = 'H'
  AND holding_date > statement_timestamp() - ${HOLD_TTL}
RETURNING *;
`;

// Send these commands separately on the same connection. The statement after
// the lock gets a fresh READ COMMITTED snapshot and statement timestamp.
const lockUserEvent = `BEGIN ISOLATION LEVEL READ COMMITTED;
-- Use the same namespace, UUID order, and hash seed in every hold/refresh path.
SELECT pg_advisory_xact_lock(hashtextextended(
  'reservation-hold:' || '${EVENT_ID}'::uuid::text
    || ':' || '${GRACE_ID}'::uuid::text,
  0
));`;

// Refresh must use the same lock as hold acquisition: extending a hold can
// change whether a concurrent hold request counts it as live.
export const refreshQuery = `UPDATE reservation
SET holding_date = statement_timestamp()
WHERE event_id = '${EVENT_ID}' AND seat_id = 2 AND user_id = '${GRACE_ID}'
  AND status = 'H'
  AND holding_date > statement_timestamp() - ${HOLD_TTL}
RETURNING *;
`;

export const refreshWithLimitQuery = `${lockUserEvent}

${refreshQuery}
COMMIT;
`;

// Available = no reservation row, or a hold that has already expired.
export const listAvailableQuery = `SELECT seat.id, seat.label
FROM seat
LEFT JOIN reservation
  ON reservation.event_id = seat.event_id AND reservation.seat_id = seat.id
WHERE seat.event_id = '${EVENT_ID}'
  AND (
    reservation.seat_id IS NULL
    OR (reservation.status = 'H' AND reservation.holding_date <= statement_timestamp() - ${HOLD_TTL})
  )
ORDER BY seat.id;
`;

// Limit = 2. The count and write run AFTER acquiring the coordination lock,
// and the lock stays held until the write commits.
export const holdLimitQuery = `${lockUserEvent}

INSERT INTO reservation (event_id, seat_id, user_id, status, holding_date)
SELECT '${EVENT_ID}', 2, '${GRACE_ID}', 'H', statement_timestamp()
WHERE (
  SELECT count(*) FROM (
    SELECT 1 FROM reservation
    WHERE event_id = '${EVENT_ID}' AND user_id = '${GRACE_ID}'
      AND status = 'H'
      AND holding_date > statement_timestamp() - ${HOLD_TTL}
    LIMIT 2
  ) AS live_holds
) < 2
ON CONFLICT (event_id, seat_id) DO UPDATE
  SET user_id = EXCLUDED.user_id,
      holding_date = EXCLUDED.holding_date, status = 'H'
  WHERE reservation.status = 'H'
    AND reservation.holding_date <= statement_timestamp() - ${HOLD_TTL}
RETURNING *;
COMMIT;
`;

export const database_inits = [
  databaseInit,
  databaseInitLiveHold,
  databaseInitExpiredHold,
  databaseInitGraceHold,
] as const;

export const examples: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.concurrencyReservationSystemHold,
    name: "Hold a free seat",
    description: "A2 is free, so the INSERT wins and Grace holds it.",
    database_init: databaseInit,
    query: holdQuery,
  },
  {
    id: SQL_EXAMPLE_IDS.concurrencyReservationSystemHoldRejected,
    name: "Hold a live-held seat",
    description: "A2 is held by Ada and not expired — Bob's attempt is blocked, 0 rows.",
    database_init: databaseInitLiveHold,
    query: holdRejectedQuery,
  },
  {
    id: SQL_EXAMPLE_IDS.concurrencyReservationSystemHoldTakeover,
    name: "Take over an expired hold",
    description: "Ada's hold on A2 has expired, so Grace takes it over in one statement.",
    database_init: databaseInitExpiredHold,
    query: holdQuery,
  },
  {
    id: SQL_EXAMPLE_IDS.concurrencyReservationSystemReserve,
    name: "Reserve a seat you hold",
    description: "Grace holds A2 and confirms it — the hold flips to a reservation.",
    database_init: databaseInitGraceHold,
    query: reserveQuery,
  },
  {
    id: SQL_EXAMPLE_IDS.concurrencyReservationSystemReserveRejected,
    name: "Reserve a seat you do not hold",
    description: "Ada holds A2, so Grace's confirm matches nothing — 0 rows.",
    database_init: databaseInitLiveHold,
    query: reserveQuery,
  },
  {
    id: SQL_EXAMPLE_IDS.concurrencyReservationSystemListAvailable,
    name: "List available seats",
    description: "A2 is live-held by Ada, so only A1 and A3 come back.",
    database_init: databaseInitLiveHold,
    query: listAvailableQuery,
  },
  {
    id: SQL_EXAMPLE_IDS.concurrencyReservationSystemHoldLimit,
    name: "Per-user hold limit (advisory lock)",
    description:
      "Lock the user/event pair, check the two-seat limit, and take A2 before committing.",
    database_init: databaseInit,
    query: holdLimitQuery,
  },
];

export const exercises: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.concurrencyReservationSystemExerciseListAvailable,
    name: "Exercise 1",
    description:
      "List the seats available for Concert Night: no reservation row, or a hold that has already expired.",
    database_init: databaseInitExpiredHold,
    query: listAvailableQuery,
  },
  {
    id: SQL_EXAMPLE_IDS.concurrencyReservationSystemExerciseRefresh,
    name: "Exercise 2",
    description:
      "Refresh Grace's hold on seat A2 — push holding_date to statement_timestamp(), but only while the hold is still hers and not expired. Return the row.",
    database_init: databaseInitGraceHold,
    ignoreColumns: ["holding_date"],
    query: refreshQuery,
  },
];
