import type { Page } from "@/lib/api/paging";

/* ==========================================================================
   Bounded travel lists (QA round 1, M1)
   --------------------------------------------------------------------------
   The travel lists read one bounded page (ADR 0007: a screen never asks for
   "everything"). When the server says it holds more than that page, the
   screen says so ("the newest N of T") instead of passing a part off as
   the whole; search and the status filter (server-side, spec 045) narrow
   the list to what is wanted. Every route here pages by offset, so the
   server's `total` is known.
   ========================================================================== */

/** How much of a list one read holds. */
export type ListCount = { loaded: number; total: number };

/** What one page read holds, and the server's total. */
export function countOf(page: Page<unknown>): ListCount {
  const p = page.pagination;
  const loaded = page.items.length;
  if (p?.mode === "offset") return { loaded, total: Math.max(loaded, p.total) };
  /* A cursor page has no total; one more than read says "there is more". */
  return { loaded, total: p?.hasNext ? loaded + 1 : loaded };
}

/** Several reads shown as one list (the past tab: ended plus closed). */
export function sumCounts(...counts: (ListCount | undefined)[]): ListCount {
  return counts.reduce<ListCount>(
    (a, b) => ({
      loaded: a.loaded + (b?.loaded ?? 0),
      total: a.total + (b?.total ?? 0),
    }),
    { loaded: 0, total: 0 },
  );
}

/** Only the part of a list: null when the read holds all of it. */
export function partial(count: ListCount | undefined): ListCount | null {
  return count && count.total > count.loaded ? count : null;
}
