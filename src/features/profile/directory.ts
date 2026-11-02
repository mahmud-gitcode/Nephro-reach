"use client";

/* ==========================================================================
   The office directory (`GET /directory/organizations`, Phase 4)
   --------------------------------------------------------------------------
   The offices on NephroReach a member can pick for their care offices and
   home dialysis clinic: id, name, type, address and time zone only
   (phone and email are decision D24). It replaces the staff demo list
   (`ORGANIZATIONS`) as the pick list. Picking a dialysis center links the
   clinic by id; the server refuses a center the patient is not actively
   cared for at, and the page shows its message.
   ========================================================================== */

import { useQuery } from "@tanstack/react-query";
import { fetchPage } from "@/lib/api/paging";
import type { OrganizationType } from "@/features/auth/auth.types";

export type DirectoryOffice = {
  id: string;
  name: string;
  type: OrganizationType;
  address: string | null;
  timeZone: string | null;
};

export const directoryKey = ["directory", "organizations"] as const;

export async function listDirectory(): Promise<DirectoryOffice[]> {
  const page = await fetchPage<DirectoryOffice>("/directory/organizations", {
    limit: 150,
  });
  return page.items;
}

/** Which directory type each care-office kind is picked from. */
export const DIRECTORY_TYPE: Record<string, OrganizationType | null> = {
  dialysis: "DIALYSIS_CENTER",
  vascular: "ACCESS_CENTER",
  nephrology: "NEPHROLOGY_OFFICE",
  transplant: "TRANSPLANT_CENTER",
  primaryCare: null,
};

export function officesOfKind(
  directory: readonly DirectoryOffice[],
  kind: string,
): DirectoryOffice[] {
  const type = DIRECTORY_TYPE[kind] ?? null;
  return type ? directory.filter((office) => office.type === type) : [];
}

export function useDirectory() {
  const query = useQuery({ queryKey: directoryKey, queryFn: listDirectory });
  return {
    offices: query.data ?? [],
    isPending: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
  };
}
