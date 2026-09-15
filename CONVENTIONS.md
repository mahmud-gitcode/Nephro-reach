# Conventions

How to add things here, and the reasoning where the reasoning is not
obvious. Everything in this file came out of fixing the same problem more
than once.

## Colour

Never write a hex value, a `rgb()`, or a Tailwind palette class like
`bg-slate-200` in a component. Three layers, and you use the third:

1. **Primitives** — `--color-gray-500`, `--color-danger-600`. The ramps.
2. **Semantics** — `--surface`, `--fg-muted`, `--line`, `--danger-surface`.
   These are what change between light and dark; dark mode is a token swap,
   not a second set of components.
3. **Utilities** — `bg-surface`, `text-fg-muted`, `border-line`. What you
   type.

If the colour you want has no token, add a semantic one rather than
reaching down a layer. A component that names a primitive cannot be
re-themed.

Compliance is not yet total, and pretending otherwise would make this
document useless. Outside the marketing site there are eleven raw palette
classes left: six in `login` and `registration`, which were migrated for
colour but never finished, and five in the landing-page `Header`, which is
out of scope by decision. The design-system gallery uses palette values
deliberately — it is showing them.

**Status colour and categorical colour are different things.** Status —
success, warning, danger — says good or bad. Categorical — `cat-1` through
`cat-8` — says only "these differ", and is for chart series where one
series is not better than another. Using danger red for "series 2" tells a
member their potassium reading is bad when it is merely second in the
legend.

## Components

Import from `@/components/ui`, never from a file inside it. The internal
layout is free to change; the entry point is not.

**Before writing a control, check whether the design system has it.** Step
7 found four local copies of things `components/ui` already owned — a
sparkline, a progress bar, a month grid, and a segmented choice, written
three separate times. Every one of them had lost its accessibility on the
way: bare `<svg>` with no label, a `div` with a width percentage and no
`role="progressbar"`, day cells named "1" to "31".

The pattern is reliable enough to state as a rule: **a control written
inline is usually a control the design system has already solved, and the
inline copy is the one missing its semantics.**

When a component genuinely is new, it belongs in `components/ui` if two
features would use it, and in `features/<name>/` if one would.

### Accessibility is part of the component's contract, not a later pass

- Anything that conveys a value needs an accessible name. `Progress`,
  `Sparkline`, `BarChart`, `DonutChart` and `LineChart` all _require_ a
  `label` prop, because a bar with no name is a decorative stripe.
- A chart carries its data twice: the drawing, and a visually-hidden
  `<table>`. On a health log the numbers _are_ the content.
- A group of buttons where one is chosen is a `radiogroup`, not a row of
  buttons. Use `SegmentedChoice`.
- `title=` is a tooltip, not a name. Use `aria-label`.
- Every new component gets an axe test. This is not ceremony:
  `MonthCalendar` failed its own axe test on the day it was written,
  because its grid cells had no rows.

## Adding a screen that reads data

Follow `features/travel/` — it is the smallest complete example.

1. `rides.types.ts` — the shape.
2. `rides.seed.ts` — demo rows, in their own file so deleting them later is
   one commit.
3. `rides.rules.ts` — the domain rules, as pure functions. Anything with an
   invariant ("exactly one contact is primary") goes here, not in an event
   handler. Take `now` as a parameter so tests are not at the mercy of the
   clock.
4. `rides.repository.ts` — `list`, `save`. The only file that knows where
   data lives.
5. `useRides.ts` — `useQuery` + `useMutation`, returning data and four
   booleans.
6. The screen renders it through `AsyncSection`.

**Distinguish "never saved" from "saved, then emptied."** Read with a
`null` fallback, not the seed. Falling back to the seed on an empty array
hands a member back demo rows they deliberately deleted.

**Claim success only after the write returns.** Several forms used to show
"Saved successfully!" and close, then attempt the write and swallow its
failure. On a medication reminder or a lab result, that is telling someone
their record is safe when it is not.

## Tests

Tests live beside the code: `thing.test.ts` next to `thing.ts`.

What is worth testing, in order:

1. **Pure rules.** Date arithmetic, clamping, invariants, moderation
   checks. These are cheap to test and expensive to get wrong. Most of the
   bugs found during this work were here, unreachable because they lived
   inside a 1,800-line component.
2. **Component semantics** — what a screen reader gets. `getByRole`, not
   `getByTestId`; if the test can find it, so can assistive technology.
3. **Not** the markup. No snapshot tests; they fail on every visual change
   and pass on every real one.

Write the test that would have caught the bug, and say in a comment what
the bug was. A test named `it("works")` teaches nobody anything.

## Files and size

A page is state, layout, and which piece goes where. When it grows past
roughly 800 lines, something is living in the routes folder that belongs in
`features/`.

This is a smell, not a law. Five files are deliberately over it:

| File                                             | Lines | Why it stays                                                                                        |
| ------------------------------------------------ | ----- | --------------------------------------------------------------------------------------------------- |
| `design-system/page.tsx`                         | 1,985 | The component gallery, one section per component. Splitting it makes it harder to read, not easier. |
| `education/dialysisJourneyData.ts`               | 1,744 | The 21-day curriculum. Content, not code.                                                           |
| `personal-log/dialysis-management/page.tsx`      | 1,244 | Down from 2,240.                                                                                    |
| `personal-log/lab-tracking/page.tsx`             | 1,203 | Down from 1,697.                                                                                    |
| `personal-log/dialysis-management/view/page.tsx` | 859   | Down from 1,405.                                                                                    |

For the last three, what remains is one screen's layout and tab bodies —
markup that reads top to bottom, with no seam that is not arbitrary.
Cutting them further would be splitting for the metric.

## The gate

`npm run verify` is the whole thing, and every part of it fails the build
rather than warning. A warning nobody has to clear is a warning nobody
clears — the repo carried 29 of them before the config was tightened.

Turning a rule off is a real decision: do it in `eslint.config.mjs` with a
comment saying why. There are four inline `eslint-disable` comments in the
source and every one of them says what it is buying — three for `<img>`
where `next/image` cannot help (an SVG, and two user-submitted thumbnail
URLs, which would each need their host declared up front), and one in
`Modal` for the focus trap's key handler. A disable without a reason beside
it is not acceptable in review.

`npm run budget` is part of the gate too, with about 10% of headroom over
the current measurement. Raising it is allowed; raising it without saying
why in the commit message is not.
