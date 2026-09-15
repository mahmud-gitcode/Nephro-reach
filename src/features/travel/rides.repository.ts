import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import { SEED_RIDES } from "./rides.seed";
import type { RideContact, RideDraft } from "./rides.types";

/* ==========================================================================
   Rides — the repository
   --------------------------------------------------------------------------
   The only place that knows where a member's saved drivers live. Today that
   is this device; in a month it is an endpoint, and only the four bodies
   below change.

   The rules about the data live here too, not in the page. "Exactly one
   contact is primary" was previously spread across three handlers in the
   page component — add, edit and delete each re-derived it, and delete got
   it subtly wrong by mutating the array it had just filtered. Written once,
   it cannot disagree with itself.
   ========================================================================== */

const KEY = storageKey("rides");

/** Only one primary survives, and a non-empty list always has one. */
function withSinglePrimary(
  rides: RideContact[],
  preferredId?: string,
): RideContact[] {
  if (rides.length === 0) return rides;

  const chosen =
    rides.find((ride) => ride.id === preferredId && ride.isPrimary)?.id ??
    rides.find((ride) => ride.isPrimary)?.id ??
    rides[0].id;

  return rides.map((ride) => ({ ...ride, isPrimary: ride.id === chosen }));
}

/** Older saves repeated the word "primary" in the note as well as the flag. */
function migrate(ride: RideContact): RideContact {
  return ride.isPrimary && ride.note && /primary/i.test(ride.note)
    ? { ...ride, note: undefined }
    : ride;
}

export async function listRides(): Promise<RideContact[]> {
  /* The fallback is null rather than the seed so that "never saved" and
     "saved, then emptied" stay different answers. Conflating them hands a
     member back a demo contact they deliberately deleted. */
  const stored = await readJson<RideContact[] | null>(KEY, null);
  if (!Array.isArray(stored)) return SEED_RIDES;
  return withSinglePrimary(stored.map(migrate));
}

export async function createRide(draft: RideDraft): Promise<RideContact[]> {
  const current = await listRides();
  const ride: RideContact = {
    id: crypto.randomUUID(),
    name: draft.name.trim(),
    phone: draft.phone.trim(),
    note: draft.note?.trim() || undefined,
    // The first contact saved is the primary one whether they ticked it or not.
    isPrimary: draft.isPrimary || current.length === 0,
  };
  const next = withSinglePrimary([...current, ride], ride.id);
  return writeJson(KEY, next);
}

export async function updateRide(
  id: string,
  draft: RideDraft,
): Promise<RideContact[]> {
  const current = await listRides();
  const updated = current.map((ride) =>
    ride.id === id
      ? {
          ...ride,
          name: draft.name.trim(),
          phone: draft.phone.trim(),
          note: draft.note?.trim() || undefined,
          isPrimary: Boolean(draft.isPrimary),
        }
      : ride,
  );
  return writeJson(KEY, withSinglePrimary(updated, id));
}

export async function deleteRide(id: string): Promise<RideContact[]> {
  const current = await listRides();
  const next = withSinglePrimary(current.filter((ride) => ride.id !== id));
  return writeJson(KEY, next);
}
