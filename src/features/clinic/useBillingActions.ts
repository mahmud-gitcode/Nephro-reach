"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import {
  EMPTY_ACTIONS,
  addChangeRequest,
  markPaid,
  normaliseActions,
  type BillingActions,
  type ChangeTopic,
  type RenewalChoice,
} from "./billing.actions";

/* ==========================================================================
   Contract & Billing — local state for the page's actions
   --------------------------------------------------------------------------
   One key for all four things a clinic can do here: settle an invoice, ask
   for a contract change, choose what happens at renewal. They are written
   together because they are all the same record — this clinic's dealings
   with NephroReach — and splitting them would mean four reads to render one
   page.
   ========================================================================== */

const ACTIONS_KEY = storageKey("clinic-billing-actions");
const QUERY_KEY = ["clinic-billing-actions"];

async function readActions(): Promise<BillingActions> {
  return normaliseActions(await readJson<unknown>(ACTIONS_KEY, null));
}

export function useBillingActions() {
  const queryClient = useQueryClient();

  const actionsQuery = useQuery({
    queryKey: QUERY_KEY,
    queryFn: readActions,
  });

  const write = useMutation({
    mutationFn: async (
      transform: (current: BillingActions) => BillingActions,
    ) => writeJson(ACTIONS_KEY, transform(await readActions())),
    onSuccess: (actions) => queryClient.setQueryData(QUERY_KEY, actions),
  });

  const actions = actionsQuery.data ?? EMPTY_ACTIONS;
  const { mutate } = write;

  return {
    actions,
    paidInvoices: actions.paidInvoices,
    changeRequests: actions.changeRequests,
    renewal: actions.renewal,

    pay: useCallback(
      (invoiceNumbers: string[]) =>
        mutate((current) => markPaid(current, invoiceNumbers)),
      [mutate],
    ),
    requestChange: useCallback(
      (topic: ChangeTopic, detail: string) =>
        mutate((current) => addChangeRequest(current, topic, detail)),
      [mutate],
    ),
    setRenewal: useCallback(
      (renewal: RenewalChoice) =>
        mutate((current) => ({
          ...current,
          renewal,
          updatedAt: new Date().toISOString(),
        })),
      [mutate],
    ),

    isPending: actionsQuery.isPending,
    error: actionsQuery.error,
    isSaving: write.isPending,
    saveError: write.error,
    dismissSaveError: () => write.reset(),
  };
}

export type BillingActionsLog = ReturnType<typeof useBillingActions>;
