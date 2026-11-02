"use client";

/* ==========================================================================
   The member's medication list, from the API (Phase 6)
   --------------------------------------------------------------------------
   One page of up to 150 medications, "load more" when the server says there
   is more. One call per add, edit, status change, refill flag or delete;
   each invalidates every medication read (list, reminders, doses, side
   effects, adherence), because a status change moves the schedule and a
   delete takes its reminder and dose log with it. A photo is uploaded
   through /files first and only its id is sent; it opens through the
   medication's own link.
   ========================================================================== */

import { useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadFile } from "@/lib/api/upload";
import type { PatientScope } from "@/lib/data/queryKeys";
import {
  requireScope,
  scopedKey,
  usePatientScope,
} from "@/features/profile/patientScope";
import { usePagedList } from "@/features/profile/usePagedList";
import type {
  Medication,
  MedicationChange,
  MedicationDraft,
  MedicationStatus,
} from "./medicationList";
import {
  fromApiMedication,
  fromApiRevision,
  toCreateBody,
  toUpdateBody,
} from "./medications.mapper";
import {
  createMedication,
  listMedicationHistory,
  listMedications,
  medicationPhotoLink,
  removeMedication,
  updateMedication,
} from "./medicationList.repository";

/** Every medication read of one patient sits under this feature key. */
export const MEDICATIONS_FEATURE = "medications";

export function medicationsKey(scope: PatientScope | null) {
  return scopedKey(scope, MEDICATIONS_FEATURE);
}

/** The medication list (with add, edit, status, refill and remove). */
export function useMedications(explicitScope?: PatientScope | null) {
  const scope = usePatientScope(explicitScope);
  const queryClient = useQueryClient();

  const list = usePagedList({
    scope,
    queryKey: scopedKey(scope, MEDICATIONS_FEATURE, "list"),
    params: { limit: 150 },
    fetch: listMedications,
    map: fromApiMedication,
  });

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: medicationsKey(scope) });

  const create = useMutation({
    mutationFn: async ({
      draft,
      photo,
    }: {
      draft: MedicationDraft;
      photo?: File | null;
    }) => {
      const target = requireScope(scope);
      const photoFileId = photo ? await uploadFile(photo) : undefined;
      return fromApiMedication(
        await createMedication(target, toCreateBody(draft, photoFileId)),
      );
    },
    onSuccess: refresh,
  });
  const change = useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof updateMedication>[2];
    }) =>
      fromApiMedication(await updateMedication(requireScope(scope), id, body)),
    onSuccess: refresh,
  });
  const drop = useMutation({
    mutationFn: (id: string) => removeMedication(requireScope(scope), id),
    onSuccess: refresh,
  });

  const { mutateAsync: createAsync } = create;
  const { mutateAsync: changeAsync, mutate: changeMutate } = change;
  const { mutate: dropMutate } = drop;
  const medications: Medication[] = list.items;

  return {
    medications,
    list,
    isPending: list.isPending,
    error: list.error,
    isError: list.isError,
    refetch: list.refetch,
    saveError: create.error ?? change.error ?? drop.error,
    isSaving: create.isPending || change.isPending || drop.isPending,
    /** Adds one medication; resolves with it (its server id). */
    add: useCallback(
      (draft: MedicationDraft, photo?: File | null) =>
        createAsync({ draft, photo }),
      [createAsync],
    ),
    update: useCallback(
      (id: string, edit: MedicationChange) =>
        changeAsync({ id, body: toUpdateBody(edit) }),
      [changeAsync],
    ),
    setStatus: useCallback(
      (id: string, status: MedicationStatus) =>
        changeMutate({ id, body: { status } }),
      [changeMutate],
    ),
    setNeedsRefill: useCallback(
      (id: string, needsRefill: boolean) =>
        changeMutate({ id, body: { needsRefill } }),
      [changeMutate],
    ),
    remove: useCallback((id: string) => dropMutate(id), [dropMutate]),
    /** The medication's photo link, fetched when the member opens it. */
    photoLink: useCallback(
      (id: string) => medicationPhotoLink(requireScope(scope), id),
      [scope],
    ),
    /** Looks a medication's name up by id ("" when not on the list). */
    nameOf: useMemo(() => {
      const names = new Map(medications.map((m) => [m.id, m.name]));
      return (id: string) => names.get(id) ?? "";
    }, [medications]),
  };
}

/** One medication's change history, newest first, from the server. */
export function useMedicationHistory(
  medicationId: string | null,
  isEs = false,
  explicitScope?: PatientScope | null,
) {
  const scope = usePatientScope(explicitScope);
  const map = useCallback(
    (raw: Parameters<typeof fromApiRevision>[0]) => fromApiRevision(raw, isEs),
    [isEs],
  );
  return usePagedList({
    scope,
    queryKey: scopedKey(scope, MEDICATIONS_FEATURE, medicationId, "history"),
    params: { limit: 50 },
    fetch: (target, params) =>
      listMedicationHistory(target, medicationId ?? "", params),
    map,
    enabled: !!medicationId,
  });
}
