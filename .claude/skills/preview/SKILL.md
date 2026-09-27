---
name: preview
description: Build a static snapshot of the site from the current working tree (committed or not) and publish it as a private claude.ai Artifact named after the branch, updating the same Artifact on every run. Use when asked to preview, render, or show the site from a remote/web session.
---

# Branch preview

Publishes the working tree as a private Artifact titled `pgquest/<branch>`.
Re-running it updates that same Artifact, so its link stays stable for the branch.
Nothing needs to be committed.

## Steps

1. Build:

   ```sh
   pnpm run build:static-preview
   ```

   This refreshes `app/generated/lesson-sql-results.json` (only new or changed
   examples are recomputed) and writes `build/preview/index.html` plus
   `build/preview/preview.json` (`title`, `branch`, `commit`).
   To name the preview something else, set `PGQUEST_PREVIEW_NAME`.

2. Check what will be published. The page is generated from this repo's lessons,
   and the only script in it is the inline hash router from
   `scripts/build-static-preview.tsx`. Confirm that with:

   ```sh
   grep -o '<script[^>]*>' build/preview/index.html | sort | uniq -c
   ```

   Expect exactly one bare `<script>`. Anything else means something unexpected
   got into the build; stop and investigate before publishing.

3. Find the existing Artifact: call the Artifact tool with `action: "list"` and look
   for a row whose title is exactly the `title` from `preview.json`.
   - **Found:** `action: "read"` on its URL (a publish to an Artifact this session
     hasn't read is refused), then publish `build/preview/index.html` with that `url`.
     Don't pass `icon`.
   - **Not found:** publish `build/preview/index.html` without a `url`, with
     `icon: "book"` and `description: "Static preview of the pgquest <branch> branch"`.

4. Reply with the link and the commit from the banner (and whether it included
   uncommitted changes).

## What the preview is

- One self-contained HTML file: every page is prerendered into a `<template>`, and
  links between pages become `#p-<page>` hashes, so it works inside the Artifact
  frame without knowing its base path.
- Lesson example results come from `app/generated/lesson-sql-results.json`, and
  session transcripts from `app/generated/postgres-examples.json`. No PGlite runs.
- Left out, because they need PGlite in the browser: Try Yourself, exercises,
  playground, search and the database viewer (links to them open a "Not in this
  preview" page). Client-only interactivity shows its initial state.
- Artifacts are private until the user shares them.
