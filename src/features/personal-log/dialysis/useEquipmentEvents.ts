"use client";

/* ==========================================================================
   Home machine maintenance history, from the API (Phase 7, new)
   --------------------------------------------------------------------------
   `/patients/:id/dialysis/equipment-events`: disinfections, filter changes,
   service visits and alarms, read as the last 90 days. Logging a
   disinfection or a filter change also moves the home system's "last done"
   date forward on the server, so the home system is refreshed too.
   ========================================================================== */

import { useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { lastDays } from "@/lib/api/paging";
import type { PatientScope } from "@/lib/data/queryKeys";
import {
  requireScope,
  scopedKey,
  usePatientScope,
} from "@/features/profile/patientScope";
import { usePagedList } from "@/features/profile/usePagedList";
import {
  fromApiEquipmentEvent,
  toEquipmentEventBody,
  type EquipmentEventKind,
} from "./homeDialysis.mapper";
import {
  createEquipmentEvent,
  listEquipmentEvents,
  removeEquipmentEvent,
} from "./homeDialysis.repository";
import { homeSystemKey } from "./useHomeHd";

export const EQUIPMENT_EVENTS_FEATURE = "dialysis-equipment-events";

export function useEquipmentEvents(
  explicitScope?: PatientScope | null,
  days = 90,
) {
  const scope = usePatientScope(explicitScope);
  const queryClient = useQueryClient();
  const range = useMemo(() => lastDays(days), [days]);

  const list = usePagedList({
    scope,
    queryKey: scopedKey(scope, EQUIPMENT_EVENTS_FEATURE, "list", range),
    params: { ...range, limit: 50 },
    fetch: listEquipmentEvents,
    map: fromApiEquipmentEvent,
  });

  const refresh = () => {
    void queryClient.invalidateQueries({
      queryKey: scopedKey(scope, EQUIPMENT_EVENTS_FEATURE),
    });
    void queryClient.invalidateQueries({ queryKey: homeSystemKey(scope) });
  };

  const create = useMutation({
    mutationFn: (draft: {
      kind: EquipmentEventKind;
      performedOn: string;
      notes: string;
    }) =>
      createEquipmentEvent(requireScope(scope), toEquipmentEventBody(draft)),
    onSuccess: refresh,
  });
  const drop = useMutation({
    mutationFn: (id: string) => removeEquipmentEvent(requireScope(scope), id),
    onSuccess: refresh,
  });

  const events = useMemo(
    () =>
      [...list.items].sort((a, b) =>
        b.performedOn.localeCompare(a.performedOn),
      ),
    [list.items],
  );
  const { mutateAsync: createAsync } = create;
  const { mutate: dropMutate } = drop;

  return {
    events,
    isPending: list.isPending,
    error: list.error,
    isError: list.isError,
    refetch: list.refetch,
    hasMore: list.hasMore,
    loadMore: list.loadMore,
    isLoadingMore: list.isLoadingMore,
    isSaving: create.isPending || drop.isPending,
    saveError: create.error ?? drop.error,
    dismissSaveError: () => {
      create.reset();
      drop.reset();
    },
    add: useCallback(
      (draft: {
        kind: EquipmentEventKind;
        performedOn: string;
        notes: string;
      }) => createAsync(draft),
      [createAsync],
    ),
    remove: useCallback((id: string) => dropMutate(id), [dropMutate]),
  };
}
