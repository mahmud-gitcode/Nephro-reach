import { ORGANIZATIONS } from "@/features/staff/staff";

/* ==========================================================================
   Is the member's dialysis clinic on NephroReach?
   --------------------------------------------------------------------------
   Messaging the care team only works when someone at the clinic is there
   to read it: the client (2026-10-05) wants "Message My Care Team" shown
   only when the member's clinic is enrolled. Members whose clinic is not
   in the network export their logs by email instead.

   Since Phase 4 the member screens read the server's `onNephroReach` flag
   (useClinicEnrollment). This name match on the staff demo list is kept
   only for Share Outside (COLLAB lane) until that screen moves to the API.
   ========================================================================== */

/** The dialysis centers that have a NephroReach portal. */
export const NETWORK_DIALYSIS_CENTERS = ORGANIZATIONS.filter(
  (org) => org.portal === "clinic",
).map((org) => org.name);

export function isNetworkClinic(name: string | null | undefined): boolean {
  const clean = (name ?? "").trim().toLowerCase();
  return (
    clean !== "" &&
    NETWORK_DIALYSIS_CENTERS.some((center) => center.toLowerCase() === clean)
  );
}
