/* ==========================================================================
   Reviews — the synchronous reader
   --------------------------------------------------------------------------
   The portal reads and writes reviews through useReviews(), which is async
   and goes through the repository like every other feature.

   This file is what the marketing site uses. It is deliberately still
   synchronous: that page is outside the portal, has no QueryClient above it,
   and is not ours to change. So it gets a read and an event to listen to,
   and nothing else. Writes live in useReviews(), which fires REVIEWS_EVENT
   after every one so this reader stays current.

   Nothing inside the portal should import from here.
   ========================================================================== */
import { REVIEWS_KEY } from "./reviews.repository";
import { approvedReviews } from "./reviews.rules";
import { INITIAL_REVIEWS } from "./reviews.seed";
import type { Review } from "./reviews.types";

export type { Review } from "./reviews.types";
export { INITIAL_REVIEWS } from "./reviews.seed";

/** Dispatched on window after any write, so open readers can re-read. */
export const REVIEWS_EVENT = "nr-reviews-changed";

export function getReviews(): Review[] {
  if (typeof window === "undefined") return INITIAL_REVIEWS;
  try {
    const raw = window.localStorage.getItem(REVIEWS_KEY);
    if (!raw) return INITIAL_REVIEWS;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Review[]) : INITIAL_REVIEWS;
  } catch (cause) {
    console.error("Could not read reviews.", cause);
    return INITIAL_REVIEWS;
  }
}

export function getApprovedReviews(): Review[] {
  return approvedReviews(getReviews());
}
