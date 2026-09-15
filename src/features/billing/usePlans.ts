"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listPlans, savePlans } from "./subscriptions.repository";
import type { SubscriptionPlan } from "./subscriptions";

export type { SubscriptionPlan } from "./subscriptions";

export const plansKey = ["billing", "subscription-plans"] as const;

/** The subscription plans an admin edits and the pricing page renders. */
export function usePlans() {
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: plansKey, queryFn: listPlans });

  const write = useMutation({
    mutationFn: (plans: SubscriptionPlan[]) => savePlans(plans),
    onSuccess: (plans) => queryClient.setQueryData(plansKey, plans),
  });

  return {
    plans: query.data ?? [],
    isPending: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),

    save: (plans: SubscriptionPlan[]) => write.mutateAsync(plans),
    isSaving: write.isPending,
    saveError: write.error,
    dismissSaveError: () => write.reset(),
  };
}
