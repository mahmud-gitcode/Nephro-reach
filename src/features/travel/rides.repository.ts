import { api } from "@/lib/api/client";
import { fetchPage } from "@/lib/api/paging";
import type { PatientScope } from "@/lib/data/queryKeys";
import { patientPath } from "@/features/profile/patientScope";
import type { RideContact, RideDraft } from "./rides.types";

/* ==========================================================================
   Rides — the repository (Phase 8; ADR 0007)
   --------------------------------------------------------------------------
   `/patients/:patientId/ride-contacts`: one call per server operation. The
   server keeps exactly one primary contact, in one transaction (the first
   one saved is primary), so this file no longer rewrites the whole list to
   enforce it; after every write the hook re-reads the list. No sample
   contact and no browser storage: the retired `nr:rides` store is purged.
   ========================================================================== */

export type ApiRideContact = {
  id: string;
  patientId: string;
  name: string;
  phone: string;
  note: string | null;
  isPrimary: boolean;
  createdAt: string;
};

/** A member keeps a few drivers; one bounded page. */
export const RIDE_WINDOW = 50;

const path = (scope: PatientScope, rest = "") =>
  patientPath(scope, `/ride-contacts${rest}`);

export function toRide(raw: ApiRideContact): RideContact {
  return {
    id: raw.id,
    name: raw.name,
    phone: raw.phone,
    note: raw.note ?? undefined,
    isPrimary: raw.isPrimary,
  };
}

export async function listRides(scope: PatientScope): Promise<RideContact[]> {
  const page = await fetchPage<ApiRideContact>(path(scope), {
    limit: RIDE_WINDOW,
  });
  return page.items.map(toRide);
}

export const createRide = (scope: PatientScope, draft: RideDraft) =>
  api<ApiRideContact>(path(scope), {
    method: "POST",
    body: {
      name: draft.name.trim(),
      phone: draft.phone.trim(),
      ...(draft.note?.trim() ? { note: draft.note.trim() } : {}),
      ...(draft.isPrimary ? { isPrimary: true } : {}),
    },
  });

/** A cleared note is sent as null, so the server clears it. */
export const updateRide = (scope: PatientScope, id: string, draft: RideDraft) =>
  api<ApiRideContact>(path(scope, `/${encodeURIComponent(id)}`), {
    method: "PATCH",
    body: {
      name: draft.name.trim(),
      phone: draft.phone.trim(),
      note: draft.note?.trim() ? draft.note.trim() : null,
      isPrimary: Boolean(draft.isPrimary),
    },
  });

export const deleteRide = (scope: PatientScope, id: string) =>
  api<unknown>(path(scope, `/${encodeURIComponent(id)}`), {
    method: "DELETE",
  });
