import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import { normaliseTrips } from "./trip.rules";
import type { TripRequest } from "./trip.types";

/* ==========================================================================
   Travel dialysis — storage
   --------------------------------------------------------------------------
   No seed. A member who has never asked to travel has no trips, and showing
   them a confirmed placement they never requested would be worse than
   showing them nothing.
   ========================================================================== */

const KEY = storageKey("travel-trip-requests");

export async function listTrips(): Promise<TripRequest[]> {
  const stored = await readJson<Partial<TripRequest>[] | null>(KEY, null);
  /* Trips written by an older version of the app are missing fields the
     screens now read. Filling them here means nothing downstream has to
     guard, and one stale record cannot take the page down. */
  return Array.isArray(stored) ? normaliseTrips(stored) : [];
}

export async function saveTrips(trips: TripRequest[]): Promise<TripRequest[]> {
  return writeJson(KEY, trips);
}
