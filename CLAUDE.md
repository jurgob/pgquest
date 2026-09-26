# Claude Code

Read AGENT.md first; everything there applies.

## Git

- Never put "claude" in branch names. In Claude Code on the web the session is
  assigned a `claude/<slug>` branch; don't push to it. Push the work to the same
  slug without the prefix instead (e.g. `claude/postgres-lock-types-lesson-d7v9tp`
  becomes `postgres-lock-types-lesson`), and open PRs from that branch.
- No Claude attribution anywhere: no `Co-Authored-By: Claude` or `Claude-Session`
  trailers in commits, no "Generated with Claude Code" line in PR bodies, no
  Claude author on commits. The SessionStart hook sets the repo's git author.
