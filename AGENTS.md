<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# UI rules — read before touching any page

The portal has one design system, taken from the client's reference dashboard (redesign, 2026-09). Every UI change goes through it. A page that invents its own colours, sizes or corners is the mess this project is cleaning up, and the next change will copy it.

## Hard limits

- **Never touch the sidebar** (colour, the large logo, its menu), the **landing page** and its Header/Footer, or the **Login and Registration** pages. All are the client's branded designs and stay as they are.
- The portal font is Roboto; the landing page keeps Lato. Do not change fonts.
- Accessibility floors: text ≥ 12px, tap targets ≥ 44px (small controls 40px), text contrast ≥ 4.5:1, icons and chart shapes ≥ 3:1.

## Build from the system, never around it

1. **Components first.** Use `@/components/ui`: `Card`, `CardHeader`, `KeyCard` (stat cards), `Button`, `Input`, `Select`, `Textarea`, `FormField`, `SearchField`, `DateRangeFilter`, `Table` + `TableThumb`, `Badge`, `Breakdown`, `LineChart`, `BarChart`, `DonutChart` (a whole split into parts), `RingStats` (a row of percentage rings), `ProgressRing` (one ring), `Modal`, `Tabs`, `Alert`, `EmptyState`, `Composer`. If none fits, **stop and ask** — do not hand-build a lookalike.
2. **Tokens only.** Colours: semantic names (`text-fg`, `text-fg-muted`, `bg-surface`, `border-line`, `text-danger`, `bg-success-surface`…). Type: named styles (`text-heading-4`, `text-body-sm`, `text-label-md`, `text-caption`, `text-metric-lg`…). Corners: `rounded-card`, `rounded-card-nested`, `rounded-button`, `rounded-field`, `rounded-status`, `rounded-pill`.
3. **Never** write raw values: no `bg-[#…]`, no `text-slate-500`, no `text-sm` / `text-xl`, no `rounded-lg` / `rounded-[10px]`, no raw `<table>`.
4. Values live in `src/styles/tokens/` — `color.css`, `typography.css`, `spacing.css`, and `canvas.css` (the redesign's values, scoped to `[data-canvas]`: the main column, top bar and modals). To change how something looks everywhere, change the token, not the page.

## Page layout — copy the showcase

`src/features/clinic/ClinicDashboard.tsx` is the template:

- **Header:** `PageTitle`, with quiet status on the left of its action and the page's **one** primary `Button` last.
- **Stat row:** `KeyCard`s in one row on wide screens.
- **Rows** split two-thirds / one-third (`xl:grid-cols-3`, main card `xl:col-span-2`).
- **Wide tables get the full row** and run flush in their card: `Card padding="none"`, the header in `p-card`, no bordered box inside the card, no grey table header. `--table-edge` lines the columns up under the title.
- Card titles are `text-heading-4`. A "⋯" menu is a `ghost` `Button` with `MoreSolid` — only if the menu does something.

## Before you finish

- `npm run ui:rules:check` must pass. It is a ratchet: no file may get worse than `scripts/ui-rules.baseline.json`. After cleaning a page, run `npm run ui:rules:update` to lock the improvement in.
- Look at the result: run the page and check it against the Design System page's **Reference** tab (`/dashboard/design-system`, admin).
