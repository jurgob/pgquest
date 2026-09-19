import { SQL_EXAMPLE_IDS, type SqlExample } from "./types";

const EVENT_ID = "33333333-3333-3333-3333-333333333333";
const ADA_ID = "11111111-1111-1111-1111-111111111111";
const GRACE_ID = "22222222-2222-2222-2222-222222222222";

// The schema is built table-by-table so each approach can show only the one
// table it changes, and the runnable migration reuses the exact same snippet.
const userTable = `CREATE TABLE "user" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL
);`;

const reservationTable = `CREATE TABLE reservation (
  event_id UUID NOT NULL REFERENCES event (id),
  seat_id INTEGER NOT NULL REFERENCES seat (id),
  user_id UUID NOT NULL REFERENCES "user" (id),
  status CHAR(1) NOT NULL CHECK (status IN ('H', 'R')),
  holding_date TIMESTAMPTZ,
  reservation_date TIMESTAMPTZ,
  PRIMARY KEY (event_id, seat_id)
);`;

// Approach 1 (naive) keeps a seat_available counter on the event.
const eventTableWithCounter = `CREATE TABLE event (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  name TEXT NOT NULL,
  seat_number INTEGER NOT NULL,
  seat_available INTEGER NOT NULL
);`;

// Approach 2 drops the counter — the reservation primary key is the source of truth.
export const eventTableWithoutCounter = `-- Only the event table changes; "user", seat, and reservation stay identical.
CREATE TABLE event (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  name TEXT NOT NULL,
  seat_number INTEGER NOT NULL
);`;

// Approaches 1 and 2 use a single global seat catalog shared by every event.
const seatTableGlobal = `CREATE TABLE seat (
  id SERIAL PRIMARY KEY,
  label TEXT NOT NULL
);`;

// Approach 3 scopes each seat to one event, so locking a seat row blocks only
// that event — not the same seat number in every other event.
export const seatTablePerEvent = `-- Only the seat table changes; "user", event, and reservation stay identical.
CREATE TABLE seat (
  id SERIAL PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES event (id),
  label TEXT NOT NULL
);`;

export const migration = `${userTable}

${eventTableWithCounter}

${seatTableGlobal}

${reservationTable}
`;

const migrationWithoutCounter = `${userTable}

${eventTableWithoutCounter}

${seatTableGlobal}

${reservationTable}
`;

const migrationPerEventSeats = `${userTable}

${eventTableWithoutCounter}

${seatTablePerEvent}

${reservationTable}
`;

const seedUsers = `INSERT INTO "user" (id, name)
VALUES
  ('${ADA_ID}', 'Ada'),
  ('${GRACE_ID}', 'Grace');`;

const seedSeatsGlobal = `INSERT INTO seat (label)
VALUES ('A1'), ('A2'), ('A3');`;

const seedSeatsPerEvent = `INSERT INTO seat (event_id, label)
VALUES
  ('${EVENT_ID}', 'A1'),
  ('${EVENT_ID}', 'A2'),
  ('${EVENT_ID}', 'A3');`;

const seedEventWithCounter = `INSERT INTO event (id, name, seat_number, seat_available)
VALUES ('${EVENT_ID}', 'Concert Night', 3, 1);`;

const seedEventWithoutCounter = `INSERT INTO event (id, name, seat_number)
VALUES ('${EVENT_ID}', 'Concert Night', 3);`;

export const seed = `${seedUsers}

${seedSeatsGlobal}

${seedEventWithCounter}
`;

const seedWithoutCounter = `${seedUsers}

${seedSeatsGlobal}

${seedEventWithoutCounter}
`;

// Per-event seats reference the event, so the event has to be inserted first.
const seedPerEvent = `${seedUsers}

${seedEventWithoutCounter}

${seedSeatsPerEvent}
`;

export const databaseInit: SqlExample = {
  id: SQL_EXAMPLE_IDS.concurrencyReservationSystemDatabaseInit,
  name: "Concurrency reservation system database",
  description:
    "Creates user, seat, event, and reservation. Concert Night has 1 seat left.",
  query: `${migration}\n${seed}`,
};

export const databaseInitWithoutCounter: SqlExample = {
  id: SQL_EXAMPLE_IDS.concurrencyReservationSystemDatabaseInitWithoutCounter,
  name: "Concurrency reservation system database (no counter column)",
  description:
    "The same schema with the event's seat_available counter dropped — reservation rows are the only source of truth.",
  query: `${migrationWithoutCounter}\n${seedWithoutCounter}`,
};

export const databaseInitPerEventSeats: SqlExample = {
  id: SQL_EXAMPLE_IDS.concurrencyReservationSystemDatabaseInitPerEventSeats,
  name: "Concurrency reservation system database (seats scoped to the event)",
  description:
    "No counter, and each seat belongs to one event — so a FOR UPDATE lock on a seat blocks only that event.",
  query: `${migrationPerEventSeats}\n${seedPerEvent}`,
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
-- Exactly the insert-only approach, with one line added: lock this event's seat
-- row first so concurrent holds on it serialize instead of racing. (Seats are
-- scoped to the event now, so this blocks only this event, not seat 2 elsewhere.)
SELECT * FROM seat WHERE id = 2 FOR UPDATE;
INSERT INTO reservation (event_id, seat_id, user_id, status, holding_date)
VALUES ('${EVENT_ID}', 2, '${GRACE_ID}', 'H', now())
RETURNING *;
COMMIT;
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

export const database_inits = [
  databaseInit,
  databaseInitWithHold,
  databaseInitWithoutCounter,
  databaseInitPerEventSeats,
] as const;

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
    name: "Insert hold with a FOR UPDATE lock",
    description: "The same insert, serialized behind a per-event seat-row lock.",
    database_init: databaseInitPerEventSeats,
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
