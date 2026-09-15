# 3. Design tokens in three layers

**Status:** accepted
**Date:** 2026-09-15

## Context

The app mixed raw hex values, Tailwind palette classes (`bg-slate-200`),
and a handful of CSS variables. Dark mode was impossible without touching
every component, and two screens showing "the same" grey used different
greys.

## Decision

Three layers, in `styles/tokens/`:

1. **Primitives** — the ramps. `--color-gray-500`, `--color-danger-600`.
2. **Semantics** — the roles. `--surface`, `--fg-muted`, `--line`.
   Redefined under dark mode; this layer is the _only_ thing that changes.
3. **Utilities** — what components type. `bg-surface`, `text-fg-muted`.

Components may only use layer 3.

## Consequences

Dark mode is a token swap rather than a second set of components.

Two further things fell out of this, both of which are about not lying with
colour:

**The grey ramp was rebuilt.** The original was a straight neutral that
looked muddy against the brand blue. The replacement carries a slight blue
bias (peak chroma 0.028 at hue 262.9°) so it reads as chosen rather than
inherited, and every step was checked for contrast: `gray-600` is 4.97:1 on
white, which is the lightest grey that may carry body text.

**A categorical ramp was added** — `cat-1` through `cat-8`. Before it,
charts with multiple series borrowed status colours, so "series 2" was
rendered in danger red. On a page of blood results, telling a member their
second series is red is telling them something clinical that is not true.

## Revisit if

A second brand or a white-label deployment arrives. The semantic layer is
the seam that would take it; the primitive layer would be swapped wholesale.
