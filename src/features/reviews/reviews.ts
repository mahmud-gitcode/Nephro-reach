/* ==========================================================================
   Reviews: the marketing site's reader (Phase 12)
   --------------------------------------------------------------------------
   The landing banner (features/landing-page/Testimonials.tsx, protected UI)
   reads approved reviews synchronously and listens for REVIEWS_EVENT. That
   contract stays exactly as it was; only the source changed:

   - the source is `GET /public/reviews` (public, throttled), read once per
     page load into a module cache, never localStorage;
   - the request carries no credentials: a signed-in visitor's cookies never
     travel with a public read, and the reply holds no email, no status and
     nothing pending;
   - until the reply arrives, and when it fails, the reader returns [] and the
     banner shows its own dictionary defaults, as it does for an empty list.
     A sample review is never presented as a member's words;
   - one retry at most, so a down API is not hammered by every visitor.

   Nothing inside the portal should import from here except the moderation
   hook, which drops the cache after a decision.
   ========================================================================== */
import { buildUrl } from "@/lib/api/client";
import { fromApiPublicReview, type ApiPublicReview } from "./reviews.api";
import type { Review } from "./reviews.types";

export type { Review } from "./reviews.types";

/** Dispatched on window when the reader has new data, so open readers can
 *  re-read. In memory only: nothing is stored. */
export const REVIEWS_EVENT = "nr-reviews-changed";

/** How many approved reviews the banner shows (it is a carousel). */
export const PUBLIC_REVIEWS_LIMIT = 12;

let cache: Review[] | null = null;
let inflight: Promise<void> | null = null;

function isPublicReview(row: unknown): row is ApiPublicReview {
  const r = row as Partial<ApiPublicReview> | null;
  return (
    !!r &&
    typeof r.id === "string" &&
    typeof r.authorName === "string" &&
    typeof r.role === "string" &&
    typeof r.rating === "number" &&
    typeof r.comment === "string"
  );
}

async function fetchOnce(): Promise<Review[]> {
  const res = await fetch(
    buildUrl("/public/reviews", { page: 1, limit: PUBLIC_REVIEWS_LIMIT }),
    {
      method: "GET",
      credentials: "omit",
      headers: { Accept: "application/json" },
    },
  );
  if (!res.ok) throw new Error(`Reviews read failed (${res.status})`);
  const body = (await res.json()) as { data?: unknown } | null;
  const rows = Array.isArray(body?.data) ? body.data : [];
  return rows.filter(isPublicReview).map(fromApiPublicReview);
}

function load(): void {
  if (inflight || typeof window === "undefined") return;
  inflight = (async () => {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        cache = await fetchOnce();
        window.dispatchEvent(new Event(REVIEWS_EVENT));
        return;
      } catch {
        /* Nothing sensitive to log; the banner keeps its defaults. */
      }
    }
  })();
}

/** Approved reviews from the API, or [] until (and unless) they arrive. */
export function getReviews(): Review[] {
  if (cache) return cache;
  load();
  return [];
}

export function getApprovedReviews(): Review[] {
  return getReviews().filter((review) => review.status === "approved");
}

/** After a moderation decision (and between tests): the next read asks the
 *  server again. */
export function invalidatePublicReviews(): void {
  cache = null;
  inflight = null;
}
