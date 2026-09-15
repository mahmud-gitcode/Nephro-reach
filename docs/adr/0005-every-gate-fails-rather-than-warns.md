# 5. Every gate fails rather than warns

**Status:** accepted
**Date:** 2026-09-15

## Context

The repository carried 29 lint warnings. Nobody had cleared them, because
nothing required anybody to.

## Decision

Every rule is an error. `npm run verify` runs typecheck, lint, format
check, tests, build and bundle budget, and any one of them failing fails
the whole thing. No `--max-warnings` escape hatch.

Turning a rule off is a deliberate act, made in `eslint.config.mjs` with a
comment saying why. The four inline `eslint-disable` comments that remain
each state what they buy; see CONVENTIONS.md.

## Consequences

The only passing state is zero, which is a state you can tell at a glance.

Two gates in `verify` are unusual and worth naming:

**`audit:controls`** (`scripts/dead-controls.py`) fails on any button that
renders, looks pressable, and does nothing. There were 35. A member
pressing one has no way to tell whether it worked, whether the app is
broken, or whether they mis-clicked — and on a log where the entries are
medical records, "did my delete go through" is not a small question. Five
were made to work; the other thirty say so through `notBuiltYet`.

**`budget`** (`scripts/budget.mjs`) fails when shipped JS exceeds its
budget, set about 10% above the current measurement. A budget with hundreds
of kilobytes of slack is not a gate — it is a number that will be
discovered to have been exceeded some time after it stopped mattering.

The cost is that an unrelated change can be blocked by a pre-existing
problem. That has happened, and each time the pre-existing problem was
worth fixing.

## Revisit if

A gate starts failing for reasons unrelated to the change being made, often
enough that people begin to work around it. That is a signal the gate is
measuring the wrong thing, not that gating is wrong.
