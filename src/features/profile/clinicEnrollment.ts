import { ORGANIZATIONS } from "@/features/staff/staff";

/* ==========================================================================
   Is the member's dialysis clinic on NephroReach?
   --------------------------------------------------------------------------
   Messaging the care team only works when someone at the clinic is there
   to read it: the client (2026-10-05) wants "Message My Care Team" shown
   only when the member's clinic is enrolled. Members whose clinic is not
   in the network export their logs by email instead.

   The member's dialysis center is the one on their profile (the same
   record the travel planner uses). It is "enrolled" when it is one of the
   dialysis centers with a NephroReach portal. With a server, the clinic's
   own enrollment of the patient decides this.
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
