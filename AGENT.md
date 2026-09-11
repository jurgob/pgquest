# Agent Notes

Check the README.

## Verification And Shipping

- Run \`pnpm all\` for the complete project verification. Do not replace it with a partial set of checks.
- If \`pnpm all\` fails because files need formatting or lint fixes, run \`pnpm all:fix\`, then rerun \`pnpm all\`.
- When asked to commit and push, run \`pnpm all\` first. If it passes, commit the current changes and push without asking for separate permission.
- Use \`pnpm ship "Commit message"\` to run the same verification, commit, and push workflow. Without a message, it generates one with the configured low-cost Codex model.
