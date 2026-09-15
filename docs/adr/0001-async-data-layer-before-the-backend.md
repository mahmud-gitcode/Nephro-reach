# 1. An async data layer before there is a backend

**Status:** accepted
**Date:** 2026-09-15

## Context

The backend is about a month away. The app stored everything in
`localStorage`, synchronously.

That had a consequence nobody had noticed: 40,000 lines of frontend and
three `isLoading` flags between them. No screen had a loading state, no
screen had an error state, and no form guarded against a double submit —
not through oversight, but because synchronous storage never made any of
them necessary. A dozen `catch {}` blocks swallowed write failures, and the
member saw their entry silently not save.

## Decision

Put the async boundary in now, against `localStorage`, and build the states
against it.

Every repository function returns a Promise and `await`s a microtask, so
the boundary is genuinely asynchronous and a component cannot read the
result during its own render. `AsyncSection` owns the order of the four
states — error, then loading, then empty, then content — at every call site.

## Consequences

The day the API lands, the bodies of the repository functions change and
nothing above them does. The alternative was meeting the first Promise on
that day, which would have made it a rewrite of every list and every form.

The cost is real: a microtask of latency that buys nothing today, and
loading states for reads that are instant. Both are the price of the states
existing at all.

## Revisit if

Never, in this direction — but the defaults set in `QueryProvider`
(`staleTime: Infinity`, no refetch on focus, no retries) are all correct
only because the data comes from this device. Every one of them wants
revisiting on the day it comes from a server other people can also write
to. They are commented in place with that note.
