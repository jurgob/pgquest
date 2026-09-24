#!/usr/bin/env bash
set -euo pipefail

# Regenerates ONE generated asset the same way `pnpm build` does, then fails if
# that changes anything — i.e. verifies the committed file is what generation
# would actually produce, instead of trusting it silently. One check per
# build-assets:* script (see package.json's build-assets:*:check entries) rather
# than one check for all of them together, so each can be run/scoped
# independently — e.g. only build-assets:sitemap:check needs full git history
# (see .github/workflows/ci.yml), and only build-assets:pgexamples:check ever
# needs a live `pnpm run dev:pg`.
#
# Usage: check-generated-asset.sh <pnpm-script-name> <generated-file-path>

pnpm_script="$1"
generated_path="$2"

pnpm run "$pnpm_script"

if ! git diff --exit-code -- "$generated_path"; then
  echo >&2
  echo "$generated_path is out of date with its sources." >&2
  echo "Run \`pnpm run $pnpm_script\` locally and commit the result." >&2
  exit 1
fi

echo "$generated_path is up to date."
