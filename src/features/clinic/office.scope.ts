"use client";

/* ==========================================================================
   Which office an office screen reads (Phase 8; ADR 0007 §2, §6)
   --------------------------------------------------------------------------
   Every office repository call takes the organization id of the office the
   user picked in the portal picker (`/me/context` memberships, FE-ORG
   Phase 3), never a demo organization or anything kept in the browser. The
   `X-Organization-Id` header itself is sent by the API client only in
   office mode (`switchPortalContext` -> `setActiveOrganization`); this hook
   only names the office for paths and query keys.

   Outside office mode (a patient, a caregiver, the platform admin) there is
   no office: a read answers with a 403-shaped error, so the page shows the
   shared "no access" state, never another context's data.
   ========================================================================== */

import { useOptionalAuth } from "@/features/auth/AuthContext";
import { ApiError } from "@/lib/api/client";
import { orgKey } from "@/lib/data/queryKeys";

/** The client-side code for "this context is not an office". */
export const NO_OFFICE_CODE = "client.no_office_scope";

export type OfficeScope = { organizationId: string | null };

/** The office in use, or null outside office mode. */
export function useOfficeScope(): OfficeScope {
  const auth = useOptionalAuth();
  const choice = auth?.choice ?? null;
  return {
    organizationId:
      choice?.kind === "office" ? choice.membership.organizationId : null,
  };
}

/** The office id, or the no-access error a page shows when there is none. */
export function requireOffice(organizationId: string | null): string {
  if (!organizationId)
    throw new ApiError(403, "No office is selected.", NO_OFFICE_CODE);
  return organizationId;
}

/** An office query key; no office gets its own key so it never shares a
 *  cache entry with a real office. */
export function officeKey(
  organizationId: string | null,
  feature: string,
  ...rest: (string | number | boolean | null | Record<string, unknown>)[]
) {
  return organizationId
    ? orgKey(organizationId, feature, ...rest)
    : ["org", "none", feature, ...rest];
}

/** `/organizations/<id>` for an office (ids are server UUIDs; encoded anyway). */
export function officePath(organizationId: string, rest: string): string {
  return `/organizations/${encodeURIComponent(organizationId)}${rest}`;
}
