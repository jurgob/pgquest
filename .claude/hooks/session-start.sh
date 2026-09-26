#!/bin/bash
set -euo pipefail

# SessionStart hook for Claude Code on the web: installs JS deps and boots the
# dev Postgres server that build-assets:pgexamples (runConcurrentSessionSteps in
# app/sql/run-example.ts) connects to on port 9998 — the same server
# `pnpm run dev:pg` provides locally.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# Commit as the repo owner rather than the remote image's default
# "Claude <noreply@anthropic.com>" identity (repo-local config wins over global).
git config user.name "Jurgo Boemo"
git config user.email "jurgo.boemo@gmail.com"

# Node from .nvmrc (the image's default Node doesn't match it) and pnpm pinned by
# package.json's packageManager, via corepack.
export NVM_DIR="${NVM_DIR:-/opt/nvm}"
set +u
# shellcheck disable=SC1091
. "$NVM_DIR/nvm.sh" --no-use
nvm install >/dev/null
nvm use >/dev/null
set -u
node_bin="$(dirname "$(command -v node)")"
corepack enable pnpm
corepack install
echo "Using Node $(node --version), pnpm $(pnpm --version)."

# Also runs the `prepare` script, which installs husky (core.hooksPath=.husky/_),
# so .husky/pre-push gates every `git push` from the remote session on `pnpm all`.
pnpm install

# The remote image ships Postgres binaries outside PATH.
pg_bin="$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -n1)"
if [ -z "$pg_bin" ]; then
  echo "No Postgres install found under /usr/lib/postgresql" >&2
  exit 1
fi
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  echo "export PATH=\"$node_bin:$pg_bin:\$PATH\"" >> "$CLAUDE_ENV_FILE"
fi

port="${PGQUEST_DEV_PG_PORT:-9998}"
pgdata="/tmp/pgquest-session-pg-data"

if "$pg_bin/pg_isready" -h localhost -p "$port" -q; then
  echo "Dev Postgres already running on port $port."
  exit 0
fi

# initdb/postgres refuse to run as root, so run the cluster as the `postgres`
# OS user when we are root.
as_pg() {
  if [ "$(id -u)" = "0" ]; then
    runuser -u postgres -- "$@"
  else
    "$@"
  fi
}

rm -rf "$pgdata"
mkdir -p "$pgdata"
[ "$(id -u)" = "0" ] && chown postgres:postgres "$pgdata"

as_pg "$pg_bin/initdb" --auth=trust --username=postgres -D "$pgdata" >/dev/null
as_pg "$pg_bin/pg_ctl" -D "$pgdata" -l "$pgdata/server.log" -w \
  -o "-p $port -k $pgdata -c listen_addresses=localhost" start

echo "Dev Postgres running on localhost:$port (data dir: $pgdata)."
