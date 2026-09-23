#!/usr/bin/env bash
set -euo pipefail

# Regenerates app/generated/*.json the same way `pnpm build` does, then fails if
# that changes anything — i.e. verifies the committed files are what generation
# would actually produce, instead of just re-generating and trusting it silently.
#
# Each generator has its own hash-based cache (see scripts/build-postgres-examples.ts
# in particular), so this is cheap when nothing changed: it reuses the committed
# output rather than recomputing it. build-assets:pgexamples only needs a live
# `pnpm run dev:pg` if the cache actually misses — i.e. if something was changed
# without regenerating and committing the result, which is exactly the case this
# script exists to catch.

pnpm run build-assets:pgexamples
pnpm run build-assets:search-index
pnpm run build-assets:sitemap

if ! git diff --exit-code -- app/generated; then
  echo >&2
  echo "app/generated/*.json is out of date with its sources." >&2
  echo "Run the build-assets:* scripts locally and commit the result." >&2
  exit 1
fi

echo "Generated assets are up to date."
