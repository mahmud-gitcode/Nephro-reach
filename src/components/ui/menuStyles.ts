/* ==========================================================================
   Menu styles
   --------------------------------------------------------------------------
   The floating menu a button opens — the account and language menus in the
   top bar, a post's "⋯" menu. The same card as a dropdown list
   (styles/select.css): a hairline, a 14px corner, 6px of padding, soft
   rounded rows. Position it with `absolute` and a side (`right-0`), and
   give it a width.
   ========================================================================== */

export const menuStyles =
  "absolute z-50 mt-stack-sm rounded-card-nested border border-line bg-surface p-1.5 shadow-(--popover-shadow)";

/* A top-bar menu on a phone: the bar's buttons sit mid-screen, so a menu
   anchored to one runs off the left edge (client, 2026-10-08). Below the
   sm breakpoint it opens full width under the bar instead; from sm up it
   hangs off its button's right edge as before. Pair with a `sm:w-…`. */
export const topBarMenuPlacement =
  "max-sm:fixed max-sm:inset-x-4 max-sm:top-16 max-sm:w-auto sm:right-0";

/* A row. Add its colours: `text-fg hover:bg-surface-sunken`, or
   `text-danger hover:bg-danger-surface` for a destructive one. */
export const menuItemStyles =
  "flex w-full cursor-pointer items-center gap-inline-md rounded-control px-3 py-2.5 text-left text-body-sm transition-colors duration-150 ease-standard focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring";
