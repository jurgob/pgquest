import { SQL_EXAMPLE_IDS, type SqlExample } from "./types";

const EVENT_ID = "33333333-3333-3333-3333-333333333333";
const ADA_ID = "11111111-1111-1111-1111-111111111111";
const GRACE_ID = "22222222-2222-2222-2222-222222222222";

export const migration = `
CREATE TABLE "user" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL
);

CREATE TABLE seat (
  id SERIAL PRIMARY KEY,
  label TEXT NOT NULL
);

CREATE TABLE event (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  name TEXT NOT NULL,
  seat_available INTEGER NOT NULL
);

CREATE TABLE reservation (
  event_id UUID NOT NULL REFERENCES event (id),
  seat_id INTEGER NOT NULL REFERENCES seat (id),
  user_id UUID NOT NULL REFERENCES "user" (id),
  status CHAR(1) NOT NULL CHECK (status IN ('H', 'R')),
  holding_date TIMESTAMPTZ,
  reservation_date TIMESTAMPTZ,
  PRIMARY KEY (event_id, seat_id)
);
`;

export const seed = `
INSERT INTO "user" (id, name)
VALUES
  ('${ADA_ID}', 'Ada'),
  ('${GRACE_ID}', 'Grace');

INSERT INTO seat (label)
VALUES ('A1'), ('A2'), ('A3');

INSERT INTO event (id, name, seat_available)
VALUES ('${EVENT_ID}', 'Concert Night', 1);
`;

export const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.concurrencyReservationSystemDatabaseInit,
  name: "Concurrency reservation system database",
  description:
    "Creates user, seat, event, and reservation. Concert Night has 1 seat left.",
  query: `${migration}\n${seed}`,
};

const finalStateQuery = `
-- Just returning something to visualize the result.
SELECT
  seat_available,
  (SELECT count(*) FROM reservation WHERE event_id = '${EVENT_ID}') AS holds
FROM event
WHERE id = '${EVENT_ID}';
`;

export const rollbackDemoQuery = `
BEGIN;
-- Operation 1: succeeds, for now.
UPDATE event SET seat_available = seat_available - 1 WHERE id = '${EVENT_ID}';
-- Operation 2: fails — seat 1 already has a reservation row (Ada's hold).
INSERT INTO reservation (event_id, seat_id, user_id, status, holding_date)
VALUES ('${EVENT_ID}', 1, '${GRACE_ID}', 'H', now());
COMMIT;
`;

export const naiveHoldQuery = `
-- The booking transaction happens between BEGIN and COMMIT.
BEGIN;
-- Plain read, no lock — the app decides "seat available" from this snapshot alone.
SELECT seat_available FROM event WHERE id = '${EVENT_ID}';
UPDATE event SET seat_available = seat_available - 1 WHERE id = '${EVENT_ID}';
INSERT INTO reservation (event_id, seat_id, user_id, status, holding_date)
VALUES ('${EVENT_ID}', 1, '${ADA_ID}', 'H', now());
COMMIT;
${finalStateQuery}`;

export const insertHoldQuery = `
INSERT INTO reservation (event_id, seat_id, user_id, status, holding_date)
VALUES ('${EVENT_ID}', 2, '${GRACE_ID}', 'H', now())
RETURNING *;
`;

export const insertConflictQuery = `
INSERT INTO reservation (event_id, seat_id, user_id, status, holding_date)
VALUES ('${EVENT_ID}', 1, '${GRACE_ID}', 'H', now())
RETURNING *;
`;

export const insertWithLockQuery = `
BEGIN;
-- Lock the seat row so only one transaction at a time decides its fate.
SELECT * FROM seat WHERE id = 2 FOR UPDATE;
-- Check while holding that lock: is this seat already held or reserved?
SELECT * FROM reservation WHERE event_id = '${EVENT_ID}' AND seat_id = 2;
-- No row found — app code proceeds. If one had come back, it would raise its
-- own "seat unavailable" error right here instead of attempting the insert.
INSERT INTO reservation (event_id, seat_id, user_id, status, holding_date)
VALUES ('${EVENT_ID}', 2, '${ADA_ID}', 'H', now());
COMMIT;
-- Just returning something to visualize the result.
SELECT * FROM reservation WHERE event_id = '${EVENT_ID}' AND seat_id = 2;
`;

export const displayCountQuery = `
SELECT seat_available FROM event WHERE id = '${EVENT_ID}';
`;

export const databaseInitWithHold: SqlExample = {
  id: SQL_EXAMPLE_IDS.concurrencyReservationSystemDatabaseInitWithHold,
  name: "Concurrency reservation system database (seat 1 held)",
  description: "Same database, but Ada already holds seat 1.",
  query: `${databaseInit.query}\n${naiveHoldQuery}`,
};

export const database_inits = [databaseInit, databaseInitWithHold] as const;

export const examples: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.concurrencyReservationSystemRollbackDemo,
    name: "A failed operation rolls back the whole transaction",
    description: "Operation 1 succeeds, operation 2 fails — both get undone.",
    database_init: databaseInitWithHold,
    query: rollbackDemoQuery,
  },
  {
    id: SQL_EXAMPLE_IDS.concurrencyReservationSystemNaiveHold,
    name: "Naive hold (no FOR UPDATE)",
    description: "Reads seat_available, then decides to write — two open steps.",
    database_init: databaseInit,
    query: naiveHoldQuery,
  },
  {
    id: SQL_EXAMPLE_IDS.concurrencyReservationSystemInsertHold,
    name: "Insert hold (relies on the primary key)",
    description: "No SELECT, no counter — just insert the hold for the known seat.",
    database_init: databaseInit,
    query: insertHoldQuery,
  },
  {
    id: SQL_EXAMPLE_IDS.concurrencyReservationSystemInsertConflict,
    name: "Insert hold on an already-held seat",
    description: "The primary key rejects it outright — no locking needed.",
    database_init: databaseInitWithHold,
    query: insertConflictQuery,
  },
  {
    id: SQL_EXAMPLE_IDS.concurrencyReservationSystemInsertWithLock,
    name: "Insert hold with an early check",
    description: "Lock the seat, check first, then insert — a cleaner failure path.",
    database_init: databaseInit,
    query: insertWithLockQuery,
  },
  {
    id: SQL_EXAMPLE_IDS.concurrencyReservationSystemDisplayCount,
    name: "Quick display count",
    description: 'Fine for a "seats left" badge — not for deciding a hold.',
    database_init: databaseInit,
    query: displayCountQuery,
  },
];

export const exercises: SqlExample[] = [
  {
    id: SQL_EXAMPLE_IDS.concurrencyReservationSystemExerciseListAvailable,
    name: "Exercise 1",
    description:
      "List every seat for Concert Night that has no reservation row yet (available seats).",
    database_init: databaseInit,
    query: `
SELECT seat.id, seat.label
FROM seat
LEFT JOIN reservation
  ON reservation.seat_id = seat.id AND reservation.event_id = '${EVENT_ID}'
WHERE reservation.seat_id IS NULL
ORDER BY seat.id;
`,
  },
  {
    id: SQL_EXAMPLE_IDS.concurrencyReservationSystemExerciseReserve,
    name: "Exercise 2",
    description:
      "Turn Ada's hold on seat 1 into a permanent reservation (status 'R') and return the row.",
    database_init: databaseInitWithHold,
    query: `
UPDATE reservation
SET status = 'R', reservation_date = now()
WHERE event_id = '${EVENT_ID}' AND seat_id = 1 AND user_id = '${ADA_ID}' AND status = 'H'
RETURNING *;
`,
  },
];
