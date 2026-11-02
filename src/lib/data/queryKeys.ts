/* ==========================================================================
   Query keys (ADR 0007)
   --------------------------------------------------------------------------
   Every cached read of patient data is filed under whose data it is and in
   which context it was read: the patient id AND the organization id (null
   in patient or caregiver mode). Without both, a staff member switching
   offices, or a caregiver switching patients, would see the previous
   context's cached answer for a moment, or after a 403 (INT-6, INT-10).

   Shape: ["patient", patientId, "org", organizationId | "self", feature, ...rest]
          ["org", organizationId, feature, ...rest]

   The leading parts come first so one call can drop everything about a
   patient (`patientScopeKey`) or an office (`orgScopeKey`).
   ========================================================================== */

export type PatientScope = {
  patientId: string;
  /** The office the call is made as, or null for the patient/caregiver. */
  organizationId: string | null;
};

type KeyPart = string | number | boolean | null | Record<string, unknown>;

/** Marks patient/caregiver mode in a key, so it can never equal an id. */
export const SELF_CONTEXT = "self";

function requireId(value: string, what: string): string {
  if (typeof value !== "string" || value.trim() === "")
    throw new Error(`A query key needs a ${what}.`);
  return value;
}

/** Everything cached about one patient in one context. */
export function patientScopeKey(scope: PatientScope) {
  return [
    "patient",
    requireId(scope.patientId, "patientId"),
    "org",
    scope.organizationId === null
      ? SELF_CONTEXT
      : requireId(scope.organizationId, "organizationId"),
  ] as const;
}

/** The key for one patient-data read. */
export function patientKey(
  scope: PatientScope,
  feature: string,
  ...rest: KeyPart[]
) {
  return [...patientScopeKey(scope), requireId(feature, "feature"), ...rest];
}

/** Everything cached about one office. */
export function orgScopeKey(organizationId: string) {
  return ["org", requireId(organizationId, "organizationId")] as const;
}

/** The key for an office-level read (roster, lab imports, alerts). */
export function orgKey(
  organizationId: string,
  feature: string,
  ...rest: KeyPart[]
) {
  return [
    ...orgScopeKey(organizationId),
    requireId(feature, "feature"),
    ...rest,
  ];
}
