"use client";

import { useMemo } from "react";
import { isApiError } from "@/lib/api/client";
import { canLevel } from "@/features/permissions/permissionMap";
import { useAdminContext } from "@/features/staff/useStaffAccounts";

/* ==========================================================================
   The office a Phase 9 screen reads as (ADR 0007 §6)
   --------------------------------------------------------------------------
   Labs, check-in notices, ER and check-in summaries and CCM are office
   reads: the organization comes from the portal context the user picked
   (GET /me/context membership), never from a URL, a demo organisation or a
   name. Every call names it twice: in the path (/organizations/{orgId}/…)
   and in `X-Organization-Id`, so a stale tab can never read one office
   while the API client is set to another. Outside office mode there is no
   organization and these hooks read nothing.

   The levels only hide and disable controls; the server decides every
   request (a 403 is shown as "no access", never as empty).
   ========================================================================== */

export type OfficeContext = {
  /** The active office, or null outside office mode. */
  orgId: string | null;
  /** Whether the active membership holds `level` on an office resource. */
  can: (resource: string, level: 1 | 2 | 3) => boolean;
};

export function useOfficeOrg(): OfficeContext {
  const { orgId, permissions } = useAdminContext();
  return useMemo(
    () => ({
      orgId: permissions?.kind === "office" ? orgId : null,
      can: (resource, level) => canLevel(permissions, resource, level),
    }),
    [orgId, permissions],
  );
}

/** `/organizations/<id><rest>` (ids are server UUIDs; encoded anyway). */
export function officePath(orgId: string, rest: string): string {
  return `/organizations/${encodeURIComponent(orgId)}${rest}`;
}

/** The request options that pin a call to one office. */
export function asOffice(orgId: string) {
  return { organizationId: orgId } as const;
}

/** Thrown by a query that ran without an office (never sent to the API). */
export function requireOffice(orgId: string | null): string {
  if (!orgId) throw new Error("No office is open.");
  return orgId;
}

/** What a failed write says to staff: the server's own message (it never
 *  carries another patient's data), "no access" for a 403. */
export function actionErrorText(error: unknown): string {
  if (isApiError(error)) {
    if (error.status === 403)
      return "You do not have access to do that in this office.";
    if (error.status === 404)
      return "That record is no longer available to this office.";
    return error.messages.join(" ") || error.message;
  }
  if (error instanceof RangeError) return error.message;
  return "That did not save. Try again.";
}
