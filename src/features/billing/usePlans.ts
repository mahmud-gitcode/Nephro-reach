"use client";

/* ==========================================================================
   Member and organization plans on the admin console (Phase 14.5)
   --------------------------------------------------------------------------
   Read from `/platform/member-plans` and `/platform/organization-plans`,
   filed under platformKey. An empty list is an empty list: there is no
   fallback to sample plans (error ≠ empty ≠ defaults). One plan per call:
   create, edit (the server may answer with a new version), publish, retire.
   The landing page's pricing table has its own public reader
   (subscriptions.ts, D14) and never reads this.
   ========================================================================== */

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { platformKey } from "@/lib/data/queryKeys";
import {
  currentPlans,
  fromApiMemberPlan,
  fromApiOrgPlan,
  toMemberPlanConfiguration,
  toOrgPlanBody,
  toPlanCode,
  versionCount,
  type AdminMemberPlan,
  type AdminOrgPlan,
  type MemberPlanDraft,
  type OrgPlanDraft,
} from "./platformPlans.mappers";
import {
  createMemberPlan,
  createOrgPlan,
  listMemberPlans,
  listOrgPlans,
  setMemberPlanStatus,
  setOrgPlanStatus,
  updateMemberPlan,
  updateOrgPlan,
  type PlanAction,
} from "./platformPlans.repository";

export type { AdminMemberPlan, AdminOrgPlan } from "./platformPlans.mappers";

export const memberPlansKey = platformKey("member-plans");
export const orgPlansKey = platformKey("organization-plans");

/** What a save did, for the confirmation line. */
export type SaveOutcome = "created" | "updated" | "versioned";

export function usePlans() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: memberPlansKey,
    queryFn: listMemberPlans,
  });
  const [outcome, setOutcome] = useState<SaveOutcome | null>(null);

  const all = useMemo(
    () => (query.data ?? []).map(fromApiMemberPlan),
    [query.data],
  );
  const plans = useMemo(
    () =>
      currentPlans(all, (a, b) => a.sortOrder - b.sortOrder).map((plan) => ({
        ...plan,
        earlierVersions: versionCount(plan, all),
      })),
    [all],
  );
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: memberPlansKey });

  const save = useMutation({
    mutationFn: async ({
      plan,
      draft,
    }: {
      plan: AdminMemberPlan | null;
      draft: MemberPlanDraft;
    }): Promise<SaveOutcome> => {
      const configuration = toMemberPlanConfiguration(draft);
      if (!plan) {
        await createMemberPlan({
          code: toPlanCode(draft.name),
          priceCents: draft.priceCents,
          sortOrder: Math.min(plans.length, 10_000),
          configuration,
        });
        return "created";
      }
      const { versioned } = await updateMemberPlan(plan.id, {
        priceCents: draft.priceCents,
        configuration,
      });
      return versioned ? "versioned" : "updated";
    },
    onSuccess: (result) => setOutcome(result),
    onSettled: refresh,
  });

  const status = useMutation({
    mutationFn: ({ planId, action }: { planId: string; action: PlanAction }) =>
      setMemberPlanStatus(planId, action),
    onSettled: refresh,
  });

  return {
    plans,
    isPending: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),

    save: (plan: AdminMemberPlan | null, draft: MemberPlanDraft) => {
      setOutcome(null);
      return save.mutateAsync({ plan, draft });
    },
    isSaving: save.isPending,
    saveError: save.error,
    outcome,
    dismissOutcome: () => setOutcome(null),
    dismissSaveError: () => save.reset(),

    setStatus: (planId: string, action: PlanAction) =>
      status.mutate({ planId, action }),
    statusPendingId: status.isPending ? status.variables?.planId : undefined,
    statusError: status.error,
    dismissStatusError: () => status.reset(),
  };
}

export function useOrgPlans() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: orgPlansKey, queryFn: listOrgPlans });
  const [outcome, setOutcome] = useState<SaveOutcome | null>(null);

  const all = useMemo(
    () => (query.data ?? []).map(fromApiOrgPlan),
    [query.data],
  );
  const plans = useMemo(
    () =>
      currentPlans(all, (a, b) =>
        a.audience === b.audience
          ? a.name.localeCompare(b.name)
          : a.audience.localeCompare(b.audience),
      ).map((plan) => ({ ...plan, earlierVersions: versionCount(plan, all) })),
    [all],
  );
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: orgPlansKey });

  const save = useMutation({
    mutationFn: async ({
      plan,
      draft,
    }: {
      plan: AdminOrgPlan | null;
      draft: OrgPlanDraft;
    }): Promise<SaveOutcome> => {
      const body = toOrgPlanBody(draft);
      if (!plan) {
        await createOrgPlan({ ...body, code: toPlanCode(draft.name) });
        return "created";
      }
      const { versioned } = await updateOrgPlan(plan.id, body);
      return versioned ? "versioned" : "updated";
    },
    onSuccess: (result) => setOutcome(result),
    onSettled: refresh,
  });

  const status = useMutation({
    mutationFn: ({ planId, action }: { planId: string; action: PlanAction }) =>
      setOrgPlanStatus(planId, action),
    onSettled: refresh,
  });

  return {
    plans,
    isPending: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
    save: (plan: AdminOrgPlan | null, draft: OrgPlanDraft) => {
      setOutcome(null);
      return save.mutateAsync({ plan, draft });
    },
    isSaving: save.isPending,
    saveError: save.error,
    outcome,
    dismissOutcome: () => setOutcome(null),
    dismissSaveError: () => save.reset(),
    setStatus: (planId: string, action: PlanAction) =>
      status.mutate({ planId, action }),
    statusPendingId: status.isPending ? status.variables?.planId : undefined,
    statusError: status.error,
    dismissStatusError: () => status.reset(),
  };
}
