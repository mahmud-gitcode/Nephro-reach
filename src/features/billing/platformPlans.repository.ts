/* ==========================================================================
   Platform plans repository (Phase 14.5)
   --------------------------------------------------------------------------
   One call per change. The server decides who may: plans READ to list,
   WRITE to create and edit, MANAGE to publish and retire (the UI only
   follows). Platform routes ignore the office header, and none is sent: the
   admin console runs with no active office.
   Nothing is kept in this browser.
   ========================================================================== */

import { api, apiRequest } from "@/lib/api/client";
import type {
  ApiMemberPlan,
  ApiOrgPlan,
  MemberPlanConfigurationBody,
  OrgAudience,
} from "./platformPlans.mappers";

const NO_OFFICE = { organizationId: null } as const;

export type PlanAction = "publish" | "retire";

/* ------------------------------------------------------- member plans */

export function listMemberPlans(): Promise<ApiMemberPlan[]> {
  return api<ApiMemberPlan[]>("/platform/member-plans", NO_OFFICE);
}

export function createMemberPlan(body: {
  code: string;
  priceCents: number;
  sortOrder?: number;
  configuration: MemberPlanConfigurationBody;
}): Promise<ApiMemberPlan> {
  return api<ApiMemberPlan>("/platform/member-plans", {
    ...NO_OFFICE,
    method: "POST",
    body,
  });
}

/** PATCH: the server answers with the SAME plan (changed in place) or a NEW
 *  version (a plan in use whose terms changed). `versioned` tells which. */
export async function updateMemberPlan(
  planId: string,
  body: {
    priceCents?: number;
    sortOrder?: number;
    configuration?: MemberPlanConfigurationBody;
  },
): Promise<{ plan: ApiMemberPlan; versioned: boolean }> {
  const envelope = await apiRequest<ApiMemberPlan>(
    `/platform/member-plans/${encodeURIComponent(planId)}`,
    { ...NO_OFFICE, method: "PATCH", body },
  );
  return {
    plan: envelope.data,
    versioned: envelope.data.id !== planId,
  };
}

export function setMemberPlanStatus(
  planId: string,
  action: PlanAction,
): Promise<ApiMemberPlan> {
  return api<ApiMemberPlan>(
    `/platform/member-plans/${encodeURIComponent(planId)}/${action}`,
    { ...NO_OFFICE, method: "POST" },
  );
}

/* ------------------------------------------------- organization plans */

export type OrgPlanBody = {
  name: string;
  audience: OrgAudience;
  monthlyFeeCents: number;
  configuration: {
    description?: string;
    limits: { patientsIncluded: number };
  };
};

export function listOrgPlans(): Promise<ApiOrgPlan[]> {
  return api<ApiOrgPlan[]>("/platform/organization-plans", NO_OFFICE);
}

export function createOrgPlan(
  body: OrgPlanBody & { code: string },
): Promise<ApiOrgPlan> {
  return api<ApiOrgPlan>("/platform/organization-plans", {
    ...NO_OFFICE,
    method: "POST",
    body,
  });
}

export async function updateOrgPlan(
  planId: string,
  body: Partial<OrgPlanBody>,
): Promise<{ plan: ApiOrgPlan; versioned: boolean }> {
  const envelope = await apiRequest<ApiOrgPlan>(
    `/platform/organization-plans/${encodeURIComponent(planId)}`,
    { ...NO_OFFICE, method: "PATCH", body },
  );
  return { plan: envelope.data, versioned: envelope.data.id !== planId };
}

export function setOrgPlanStatus(
  planId: string,
  action: PlanAction,
): Promise<ApiOrgPlan> {
  return api<ApiOrgPlan>(
    `/platform/organization-plans/${encodeURIComponent(planId)}/${action}`,
    { ...NO_OFFICE, method: "POST" },
  );
}
