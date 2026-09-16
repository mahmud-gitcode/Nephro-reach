import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import { normaliseTrips } from "./trip.rules";
import { samplePastTrips, sampleTrip } from "./trip.seed";
import type { TripRequest } from "./trip.types";

/* ==========================================================================
   Travel dialysis — storage
   --------------------------------------------------------------------------
   An empty log reads as placeholder trips.

   Frontend phase: there is no backend and no real member behind any of this
   yet, so the screens are built and reviewed against sample content the way
   the rest of the app is. Eight panels that each need a trip to describe are
   unreadable without one.

   The day the API lands, the fallback below becomes the request that fetches
   nothing, `trip.seed.ts` goes, and no screen above here changes.
   ========================================================================== */

const KEY = storageKey("travel-trip-requests");

export async function listTrips(): Promise<TripRequest[]> {
  const stored = await readJson<Partial<TripRequest>[] | null>(KEY, null);

  /* Trips written by an older version of the app are missing fields the
     screens now read. Filling them here means nothing downstream has to
     guard, and one stale record cannot take the page down. */
  const trips = Array.isArray(stored) ? normaliseTrips(stored) : [];

  return trips.length > 0
    ? trips
    : normaliseTrips([sampleTrip(), ...samplePastTrips()]);
}

export async function saveTrips(trips: TripRequest[]): Promise<TripRequest[]> {
  return writeJson(KEY, trips);
}
