# NephroReach

A care platform for people on dialysis: the 21-day education journey, the
personal logs they keep between appointments, transport, and the community
board. Plus the admin side that curates the curriculum and moderates what
members post.

This repository is the frontend. **There is no backend yet** — see
[Where the data comes from](#where-the-data-comes-from), which is the one
section to read before writing any feature code.

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
```

Node 22. The app is Next.js 16 (App Router, Turbopack), React 19,
TypeScript in strict mode, and Tailwind CSS v4.

```bash
npm run verify       # everything below, in order — run before pushing
```

| Command                           | What it does                                       |
| --------------------------------- | -------------------------------------------------- |
| `npm run typecheck`               | `tsc --noEmit`                                     |
| `npm run lint`                    | ESLint over every source file (see the note below) |
| `npm run format` / `format:check` | Prettier, same file walk                           |
| `npm run test` / `test:watch`     | Vitest + Testing Library + axe                     |
| `npm run build`                   | production build                                   |
| `npm run budget`                  | fails if shipped JS grows past its budget          |
| `npm run audit:controls`          | fails on any control that renders but does nothing |

**Why lint and format go through `scripts/`.** This repository lives in a
OneDrive folder, and OneDrive's reparse points make `readdir(…, {
withFileTypes: true })` report several source directories as _files_. Tools
that walk the tree themselves silently skip them: `eslint .` once reported
"0 problems" while looking at 42 of 110 files. `scripts/source-files.mjs`
walks with `stat` instead and hands the tools an explicit list. Do not
replace these with a bare `eslint .` — it will pass by looking at nothing.

## Where the data comes from

Every feature reads and writes through a repository, and every repository
function returns a Promise. Today the bytes come from `localStorage`. In
about a month they come from an API, and on that day only the bodies of
the repository functions change.

```
src/features/<feature>/
  <thing>.types.ts        the shape — the file the API will edit
  <thing>.seed.ts         demo content, deletable in one commit
  <thing>.rules.ts        pure domain logic, where there is any
  <thing>.repository.ts   the only file that knows where data lives
  use<Thing>.ts           the seam: a list and four booleans
```

The hook returns `{ data, isPending, error, refetch, …mutations }`, built
on TanStack Query. The screen renders it through `AsyncSection`, which owns
the order of the four states:

```tsx
<AsyncSection
  pending={isPending}
  error={error}
  isEmpty={rides.length === 0}
  onRetry={refetch}
  skeleton={<RidesSkeleton />}
  empty={<EmptyState … />}
>
  {rides.map(…)}
</AsyncSection>
```

That order is not cosmetic. **Error wins over loading, and over empty.** A
read that failed must never render as "you have nothing saved" — on a log
of medical records that reads as data loss.

Two files are deliberately still synchronous, and say so in their headers:
`features/reviews/reviews.ts` and `features/billing/subscriptions.ts`. The
marketing site reads from both, has no `QueryClient` above it, and is not
part of this work. They are readers only; every write goes through the
hooks, which fire `REVIEWS_EVENT` so those readers stay current.

## Layout

```
src/
  app/                  routes only — a page is state, layout, and
                        which piece goes where
  components/ui/        the design system. One import: "@/components/ui"
  components/layout/    the dashboard shell and its navigation
  features/<name>/      everything else, grouped by what it is for
  lib/data/             the storage adapter and the QueryClient
  styles/tokens/        colour, spacing, type — see CONVENTIONS.md
```

A page over about 800 lines usually means a feature is living in the
routes folder. Five files are still over it; `CONVENTIONS.md` lists each
one and why it stays.

## Conventions, and the decisions behind them

- [`CONVENTIONS.md`](./CONVENTIONS.md) — how to add a screen, a component,
  a colour, a test.
- [`docs/adr/`](./docs/adr/) — the decisions that would otherwise be
  re-litigated: why a query library, why tokens in three layers, why the
  lint walk is ours.

## What is not built

- **No backend, no real auth.** `features/auth` is a stand-in. Anything
  that looks like a permission check is a UI affordance, not a control.
- **Controls that need a feature that does not exist** are disabled and say
  so through `lib/utils/notBuiltYet`. `grep notBuiltYet` is the to-do list.
- **Some panels show fixed numbers.** The fluid tracker's five charts and
  the treatment analytics tab do not yet read the member's own entries.
  Each carries a `NOTE` saying so. They are waiting on a decision, not on
  an implementation.
- **The fluid tracker does not persist.** It is the one log still holding
  its entries in component state.
