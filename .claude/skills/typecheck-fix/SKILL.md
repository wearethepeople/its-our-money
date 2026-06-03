---
name: typecheck-fix
description: Run the project's typecheck command and fix all errors until the build is clean. Triggers for: "run typecheck", "fix type errors", "typecheck issues", "fix tsc errors", "pnpm run typecheck", "npm run typecheck", "typecheck and fix".
user-invocable: true
---

# Typecheck Fix — It's Our Money

Run `npm run typecheck`, triage every error by file, fix them all, and re-run until the command exits 0 with no new errors introduced.

## The command

```bash
npm run typecheck
```

This runs **two steps** internally:

1. `react-router typegen` — regenerates route type files under `.react-router/types/`
2. `tsc --noEmit` — full TypeScript check against the generated types

**Always let typegen finish first.** Some apparent TS errors are phantom — they disappear once typegen has regenerated the route arg types. Run the full command, don't run `tsc` directly.

## Triage order

Fix errors in this priority order:

1. **Route files** (`app/routes/*.tsx`) — most likely to have stale `Route.LoaderArgs` / `Route.ActionArgs` shapes after typegen regenerates
2. **Service files** (`app/services/*.ts`) — Prisma type mismatches after schema changes
3. **Utility files** (`app/utils/*.ts`) — usually straightforward
4. **Component files** (`app/components/**`) — prop type mismatches

## Common error patterns

| Error                                                      | Likely cause                                         | Fix                                                         |
| ---------------------------------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------- |
| `Property 'X' does not exist on type 'Route.LoaderArgs'`   | Stale import from old route type                     | Re-run typegen, then update the import                      |
| `Type 'X' is not assignable to type 'Y'` on a Prisma model | Schema changed without updating service return types | Align the service return type to the Prisma model           |
| `Cannot find module '.react-router/types/...'`             | typegen hasn't run yet                               | Run `npm run typecheck` (not bare `tsc`) to trigger typegen |
| `Object is possibly 'undefined'` in a route loader         | Missing null-check after `prisma.findFirst()`        | Add a guard or use `findFirstOrThrow()`                     |

## What NOT to chase

- **Pre-existing ESLint warnings** — the typecheck command only runs `tsc`, not the linter. Warnings that were already present before your change are out of scope.
- **`.react-router/` generated files** — never edit files under `.react-router/types/`; they are overwritten on every typegen run.

## Done criterion

`npm run typecheck` exits 0 with output that contains no new errors beyond what existed before the session started. If you're unsure what was pre-existing, run it once at the start of the session to establish a baseline.

Always give a succint summation of the problems and the core TypeScript principles at play in plain English.
