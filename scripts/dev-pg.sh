#!/usr/bin/env bash
set -euo pipefail

# Spins up a real, local Postgres server for authoring multi-session lesson
# transcripts (see app/sql/run-example.ts's runConcurrentSessionSteps) — genuine
# concurrent connections against one live database, not a PGlite workaround.
#
# Data lives OUTSIDE the repo, under the OS temp dir — not just gitignored, but
# outside the tree entirely, because `turbo watch` (which runs this) treats any
# change under the repo root as a signal to re-evaluate tasks, itself included.
# With the data dir inside the repo, initdb's own writes were enough to make turbo
# restart this very task mid-startup, over and over. Both TCP and the unix socket
# are scoped to that directory, so this never touches any Postgres already
# installed/running on the machine.
#
# Wiped and re-initialized on EVERY start, not just the first — this cluster holds
# nothing worth keeping between sessions (runConcurrentSessionSteps creates and
# drops its own throwaway database per transcript run), and a Postgres cluster's
# transaction-id counter is global across every database in it, so leaving old data
# around means xmin/xmax keep climbing forever across runs, and any database a
# crashed/interrupted run failed to drop stays orphaned indefinitely. A fresh
# cluster each session costs a couple of seconds and avoids both.
pgdata="${TMPDIR:-/tmp}/pgquest-dev-pg-data"
port="${PGQUEST_DEV_PG_PORT:-9998}"

rm -rf "$pgdata"

echo "Initializing dev Postgres data directory at $pgdata..."
initdb --auth=trust --username=postgres -D "$pgdata" >/dev/null

echo "Starting dev Postgres on port $port (data dir: $pgdata)..."
exec postgres -D "$pgdata" -p "$port" -k "$pgdata"
