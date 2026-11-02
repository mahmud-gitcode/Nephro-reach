"use client";

/* ==========================================================================
   Provider orders and instructions, from the API (Phase 7)
   --------------------------------------------------------------------------
   `/patients/:id/dialysis/provider-orders`, up to 150 a page, newest order
   day first. One call per add, done/undone, reminder dismissal or delete.
   A reminder time is typed as a local wall-clock time and sent as an
   instant with an offset (homeDialysis.mapper.ts says which zone and why).
   ========================================================================== */

import { useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PatientScope } from "@/lib/data/queryKeys";
import {
  requireScope,
  scopedKey,
  usePatientScope,
} from "@/features/profile/patientScope";
import { usePagedList } from "@/features/profile/usePagedList";
import type { ProviderOrder } from "../record/record.types";
import {
  fromApiProviderOrder,
  localStamp,
  toProviderOrderBody,
  type ProviderOrderBody,
} from "./homeDialysis.mapper";
import {
  createProviderOrder,
  listProviderOrders,
  removeProviderOrder,
  updateProviderOrder,
} from "./homeDialysis.repository";

export { localStamp } from "./homeDialysis.mapper";

export const PROVIDER_ORDERS_FEATURE = "dialysis-provider-orders";

/** Orders whose reminder time has come and that are not done yet
 *  (client, 2026-10-12: "what if they forget?"). */
export function ordersDue(orders: ProviderOrder[], now: Date): ProviderOrder[] {
  const stamp = localStamp(now);
  return orders.filter(
    (o) =>
      !o.completed && !o.reminderDone && !!o.remindAt && o.remindAt <= stamp,
  );
}

export type ProviderOrderDraft = {
  date: string;
  order: string;
  /** Local "yyyy-mm-ddTHH:MM", or absent for no reminder. */
  remindAt?: string;
};

/** The member's provider orders and instructions. */
export function useProviderOrders(explicitScope?: PatientScope | null) {
  const scope = usePatientScope(explicitScope);
  const queryClient = useQueryClient();

  const list = usePagedList({
    scope,
    queryKey: scopedKey(scope, PROVIDER_ORDERS_FEATURE, "list"),
    params: { limit: 150 },
    fetch: listProviderOrders,
    map: fromApiProviderOrder,
  });

  const refresh = () =>
    queryClient.invalidateQueries({
      queryKey: scopedKey(scope, PROVIDER_ORDERS_FEATURE),
    });

  const create = useMutation({
    mutationFn: (draft: ProviderOrderDraft) =>
      createProviderOrder(
        requireScope(scope),
        toProviderOrderBody({ ...draft, completed: false }),
      ),
    onSuccess: refresh,
  });
  const change = useMutation({
    mutationFn: ({ id, body }: { id: string; body: ProviderOrderBody }) =>
      updateProviderOrder(requireScope(scope), id, body),
    onSuccess: refresh,
  });
  const drop = useMutation({
    mutationFn: (id: string) => removeProviderOrder(requireScope(scope), id),
    onSuccess: refresh,
  });

  const orders = list.items;
  const { mutateAsync: createAsync } = create;
  const { mutate: changeMutate } = change;
  const { mutate: dropMutate } = drop;
  const byId = useMemo(
    () => new Map(orders.map((o) => [o.id, o] as const)),
    [orders],
  );

  return {
    orders,
    hasMore: list.hasMore,
    loadMore: list.loadMore,
    isPending: list.isPending,
    error: list.error,
    isError: list.isError,
    refetch: list.refetch,
    isSaving: create.isPending || change.isPending || drop.isPending,
    saveError: create.error ?? change.error ?? drop.error,
    dismissSaveError: () => {
      create.reset();
      change.reset();
      drop.reset();
    },
    /** Adds one order; resolves once the server has it. */
    add: useCallback(
      (draft: ProviderOrderDraft) => createAsync(draft),
      [createAsync],
    ),
    toggle: useCallback(
      (id: string) =>
        changeMutate({
          id,
          body: { completed: !(byId.get(id)?.completed ?? false) },
        }),
      [changeMutate, byId],
    ),
    remove: useCallback((id: string) => dropMutate(id), [dropMutate]),
    /** Stops the reminder without marking the order done. */
    dismissReminder: useCallback(
      (id: string) => changeMutate({ id, body: { reminderDone: true } }),
      [changeMutate],
    ),
  };
}
