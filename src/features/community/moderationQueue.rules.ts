import type { HeldItem } from "./community.types";

/* ==========================================================================
   Moderation queue — pure rules
   --------------------------------------------------------------------------
   The server holds every post, orders the pending page (level 1 first, then
   oldest) and records each decision (Phase 12). What is left here only
   reads a loaded page: the order within it, and what still waits.

   Nothing here decides whether text is publishable — that is the server's
   screen, with moderation.ts as the composer's hint.
   ========================================================================== */

/**
 * Level 1 first, then oldest first inside each level.
 *
 * A possible emergency must not sit behind yesterday's name-calling just
 * because the name-calling arrived earlier. The server sends the pending
 * page in this order already; sorting again keeps a merged "load more"
 * page in the same order.
 */
export function pendingItems(items: HeldItem[]): HeldItem[] {
  return items
    .filter((item) => item.status === "pending")
    .sort(
      (a, b) => a.level - b.level || a.submittedAt.localeCompare(b.submittedAt),
    );
}

/** How many level 1 findings are still waiting, in the loaded page(s). */
export function urgentPendingCount(items: HeldItem[]): number {
  return items.reduce(
    (total, item) =>
      item.status === "pending" && item.level === 1 ? total + 1 : total,
    0,
  );
}

export function pendingCount(items: HeldItem[]): number {
  return items.reduce(
    (total, item) => (item.status === "pending" ? total + 1 : total),
    0,
  );
}
