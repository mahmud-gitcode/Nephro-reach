# 2. TanStack Query rather than a hook of our own

**Status:** accepted
**Date:** 2026-09-15

## Context

Having decided on an async data layer (ADR 1), something had to manage it.
The obvious cheap option was a `useAsync` hook of our own — perhaps forty
lines.

## Decision

Take the dependency. `@tanstack/react-query`, one `QueryProvider` mounted
in the dashboard layout.

## Consequences

Loading and error states are the easy half, and a hand-written hook does
them fine. The half that gets written badly is everything after: request
de-duplication, invalidating the right caches after a write, not refetching
a list four times because four components asked for it, keeping a
mutation's pending state honest when two fire at once.

Those are solved problems, and the solution is a small share of a budget
that currently has about 72 KB of headroom. Writing our own would have
looked clever for a week.

It also fixed a bug immediately: `useJourneyProgress` held its own
`useState`, so two components mounting it held two copies that drifted
apart — the day list and the player each had their own idea of what was
finished. One cache, one answer, however many components ask.

The `QueryClient` is created inside `useState`, never at module scope: at
module scope one client is shared across every request on the server, which
leaks one user's cached data into another's render.

## Revisit if

The bundle budget comes under real pressure _and_ this is measured to be a
meaningful share of it. Measure before acting — `npm run budget` prints the
largest chunks.
