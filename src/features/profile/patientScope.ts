"use client";

/* ==========================================================================
   Whose records a member screen reads (Phases 4-5; ADR 0007 §2)
   --------------------------------------------------------------------------
   Every member repository call takes a PatientScope and puts its
   `patientId` in the path. The scope comes from the server's
   `GET /me/context` (Phase 2), never from anything the browser stores:
   - a member: their own `patient.id`;
   - a caregiver: the patient of the grant the portal context picked
     (`caregiving[]`; Phase 3 adds switching between several);
   - organizationId is null for both, so no office header is ever sent.

   A hook may be handed an explicit scope instead (an office reading a
   linked patient, or a caregiver switching patients once Phase 3 lands),
   so no repository hard-codes "self".

   No scope (an office or admin context, or a caregiver with no patient)
   reads nothing: the query answers with a 403-shaped error, so the page
   shows the shared "not shared with you" state, never someone's data.
   ========================================================================== */

import { useOptionalAuth } from "@/features/auth/AuthContext";
import type { AuthUser } from "@/features/auth/auth";
import { ApiError } from "@/lib/api/client";
import { patientKey, type PatientScope } from "@/lib/data/queryKeys";

/** The client-side code for "no patient is selected in this context". */
export const NO_PATIENT_CODE = "client.no_patient_scope";

/** The scope a signed-in user's member screens read, or null. */
export function scopeForUser(
  user: Pick<AuthUser, "role" | "patientId"> | null | undefined,
): PatientScope | null {
  if (!user || !user.patientId) return null;
  if (user.role !== "user" && user.role !== "caregiver") return null;
  return { patientId: user.patientId, organizationId: null };
}

/** The explicit scope when one is given, else the signed-in context's. */
export function usePatientScope(explicit?: PatientScope | null) {
  const user = useOptionalAuth()?.user ?? null;
  return explicit === undefined ? scopeForUser(user) : explicit;
}

/** The query key for a feature read; a null scope gets its own key so it
 *  can never share a cache entry with a real patient. */
export function scopedKey(
  scope: PatientScope | null,
  feature: string,
  ...rest: (string | number | boolean | null | Record<string, unknown>)[]
) {
  return scope
    ? patientKey(scope, feature, ...rest)
    : ["patient", "none", feature, ...rest];
}

/** The scope, or the not-shared error a page shows when there is none. */
export function requireScope(scope: PatientScope | null): PatientScope {
  if (!scope)
    throw new ApiError(
      403,
      "No patient is selected for this account.",
      NO_PATIENT_CODE,
    );
  return scope;
}

/** `/patients/<id>` for a scope (ids are server UUIDs; encoded anyway). */
export function patientPath(scope: PatientScope, rest: string): string {
  return `/patients/${encodeURIComponent(scope.patientId)}${rest}`;
}
