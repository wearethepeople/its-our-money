# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev            # start dev server with MSW mocks on port 3000
npm run dev:no-mocks   # dev server without mocks

npm run typecheck      # react-router typegen + tsc
npm run lint           # eslint
npm run test           # vitest (watch)
npm run test -- --run  # vitest single run
npx vitest app/utils/auth.server.test.ts  # run a single test file

npm run test:e2e:dev   # Playwright UI mode
npm run test:e2e:run   # Playwright headless (builds first)

npx prisma migrate dev --name <name>   # create + apply a migration
npx prisma studio                       # browse the DB
npx prisma db seed                      # seed via prisma/seed.ts
```

## Architecture

Built on [epic-stack](https://github.com/epicweb-dev/epic-stack): React Router v7, Express, SQLite via Prisma, Tailwind
v4, Vitest, Playwright.

### Path aliases (tsconfig.json)

- `@/ui/*` → `app/components/ui/*`
- `@/*` → `app/*`

Files with `.server.ts` are server-only. Files with `.client.tsx` are client-only.

## Search Commands

- ALWAYS use `rg` instead of `grep`
- ripgrep automatically excludes node_modules and gitignored files

### Application domain

**It's Our Money** is an anonymous budget-allocation tool. Visitors allocate weights across US federal outlay functions,
compare their allocation to the actual OMB budget, and optionally publish their result.

**User flow:** `/` → `/allocate/:year` → `/juxtapose` → optionally `/s/:publicId` (shared view)

There are no user accounts. Participants are created automatically on first interaction and identified via a session
cookie backed by the `Session` DB table.

### Data model (Prisma / SQLite)

- `Participant` — anonymous identity, created on first action
- `Session` — cookie-backed DB session linked to a Participant
- `ParticipantAllocation` — one per participant; has `publicId` when published
- `ParticipantAllocationItem` — per-function allocation weight stored as **basis points** (`weightBps`, 1–10000 where
  10000 = 100%)
- `RecoveryToken` — allows session recovery via email

### Budget data

- Static OMB outlay data lives in `app/constants/omb-budgets/` as JSON
- `app/constants/budget-functions.ts` — the 21 `OutlayFunction` entries; those with `allocatable !== false` (18 total)
  are user-facing
- `app/utils/budget-data.ts` — `getOmbBudgetByCodeForYear()` returns per-function basis points from the static JSON;
  `getFunctionDetailsById()` looks up a function by id
- `app/utils/normalize-weights.ts` — `normalizeToBasisPoints()` converts arbitrary weights to integer basis points
  summing to exactly 10,000 (largest-remainder method)

### Grouping schemes

- `app/constants/grouping-schemes.ts` — `GroupingScheme` type, `FLAT_LIST_SCHEME`, `PUBLIC_DOMAIN_SCHEME` (7 groups).
  Adding a new scheme is purely additive here; no data-model changes needed.
- `app/components/view-scheme-toggle.tsx` — shared toggle driven by `SCHEMES` constant

### Services

Server-side business logic lives in `app/services/` as TypeScript namespaces:

- `AllocationService` — CRUD for allocations, publish/unpublish, `zipAllocationWithUsFiscalBudget()` pairs participant
  weights with actual OMB percentages
- `ParticipantService` — create participant, look up by session
- `RecoveryTokenService` — token creation and validation

### Session utilities

- `app/utils/session.server.ts` — cookie management, DB session records
- `app/utils/participant-session.server.ts` — `getParticipantBySession()` (read-only) and
  `getOrCreateParticipantSession()` (write; callers **must** forward the returned `headers` in their response)

### Forms

Forms use [conform](https://conform.guide/) + Zod schemas. The `ConformSlider` component (
`app/components/ui/conform-slider.tsx`) integrates a range input with conform field metadata.

### Icons

Icons are an SVG spritesheet. Use the `<Icon name="..." />` component (`app/components/ui/icon.tsx`). Add new icons via
`npx sly add` (see `docs/icons.md`).
