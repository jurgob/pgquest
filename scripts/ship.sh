#!/usr/bin/env bash
set -euo pipefail

pnpm all
git add -A

if git diff --cached --quiet; then
  echo "No changes to commit."
  exit 0
fi

if [[ $# -gt 0 ]]; then
  commit_message="$*"
else
  temporary_message="$(mktemp)"
  trap 'rm -f "$temporary_message"' EXIT
  prompt="Inspect the staged git diff. Return only one concise imperative commit subject, no quotes, no markdown, and no period at the end."
  codex_args=(
    codex exec
    --ephemeral
    --sandbox read-only
    --output-last-message "$temporary_message"
    -C "$(pwd)"
  )

  if ! "${codex_args[@]}" --model "${CODEX_COMMIT_MODEL:-codex-mini-latest}" "$prompt" >/dev/null 2>&1; then
    rm -f "$temporary_message"
    "${codex_args[@]}" "$prompt" >/dev/null
  fi

  commit_message="$(head -n 1 "$temporary_message" | sed 's/^[[:space:]]*//; s/[[:space:]]*$//')"
fi

if [[ -z "$commit_message" ]]; then
  echo "Could not generate a commit message." >&2
  exit 1
fi

git commit -m "$commit_message"
git push
