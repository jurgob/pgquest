# pgquest

Web-based PostgreSQL playground built around PGlite. The current first step is a
small CLI that runs SQL examples from `cli_examples/`.

## Commands

```sh
pnpm cli
pnpm all
```

`pnpm cli` runs the example SQL files and prints the migration, seed, query,
result, and query plan.

`pnpm all` runs the fast project checks:

```sh
pnpm lint && pnpm format && pnpm typecheck && pnpm test
```

Agents should run `pnpm all` before committing. It is the local equivalent of the
fast checks that the CLI workflow is expected to pass.

## Quality Bar

Keep the code as strict as practical:

- Prefer precise TypeScript types over broad types.
- Avoid `unknown` unless it is strictly needed at a boundary.
- Use branded types when plain primitives are too easy to mix up.
- Use `neverthrow` for explicit fallible flows instead of throwing for expected
  validation/control-flow cases.
- Use `ts-pattern` when it makes branching over shapes clearer and exhaustive.
- Keep `tsconfig.json` strict and prefer tightening it over weakening checks.

## SQL Examples

Each example in `cli_examples/` is a `.sql.ts` module:

```ts
export const migration = `...`;
export const seed = `...`;
export default `SELECT ...`;
```

`migration` and `seed` are optional. The default export is the query the CLI runs
and explains.
