# Changelog

Notable changes to PgQuest, newest first.

## 2026-09-27

- Added a changelog page at `/changelog`, linked from the header next to search,
  plus a header link to the license page.
- New lesson: Finding and fixing slow queries, built around an app's endpoints with
  deterministic planner statistics.
- Lesson examples are now precomputed at build time, so pages show results before
  the in-browser database has loaded.
- PGlite extensions load only for the databases that actually create them, making
  most lessons start faster.

## 2026-09-26

- New lesson: Postgres locks, with a table of lock scopes and session transcripts
  that wait on real locks. It is marked as a draft while it gets reviewed.

## 2026-09-24

- New lesson: MVCC, with concurrent session transcripts recorded against a real
  Postgres server.

## 2026-09-23

- The insert/update/delete lesson now covers UPSERT and how MVCC and VACUUM relate
  to updates and deletes.

## 2026-09-21

- New lesson: Transaction isolation levels.
- Added `/llms.txt`, a sitemap, and a license page: lesson content is CC BY 4.0 and
  open to reuse by people and AI systems alike.

## 2026-09-20

- Added the search and feedback pages.
- Redesigned the header navigation into a two-column layout of icons and lesson
  numbers.
- Published the concurrency reservation system lesson, including hold limits
  enforced with transaction advisory locks.

## 2026-09-19

- Reworked the concurrency reservation lesson around the full hold, reserve, and
  expire flow, with timelines that show each approach's lock window.

## 2026-09-18

- New lesson: Building a concurrency-safe reservation system.

## 2026-09-17

- New lesson: Introduction to JOIN, and more examples in the join types lesson.

## 2026-09-16

- Added a database viewer for inspecting the tables behind each example.
- Added `/health` and `/ping` endpoints for uptime monitoring.
