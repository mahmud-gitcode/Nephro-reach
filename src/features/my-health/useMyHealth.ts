"use client";

/* ==========================================================================
   The member's allergies and medical history, from the API (Phase 4)
   --------------------------------------------------------------------------
   Two collections, one mutation per server operation (ADR 0007 §1); every
   write invalidates its list, so what shows is what the server kept. No
   sample record: a member with no allergies sees an empty table.
   ========================================================================== */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { PatientScope } from "@/lib/data/queryKeys";
import {
  requireScope,
  scopedKey,
  usePatientScope,
} from "@/features/profile/patientScope";
import { usePagedList } from "@/features/profile/usePagedList";
import {
  changedFields,
  fromApiAllergy,
  fromApiCondition,
  toAllergyBody,
  toConditionBody,
} from "./health.mapper";
import {
  createAllergy,
  createCondition,
  listAllergies,
  listConditions,
  PROFILE_LIST_PAGE,
  removeAllergy,
  removeCondition,
  updateAllergy,
  updateCondition,
} from "./health.repository";
import type { AllergyRow, HistoryRow } from "./health.types";

type Edit<T> = { before: T; next: Omit<T, "id"> };

export function useMyHealth(explicitScope?: PatientScope | null) {
  const scope = usePatientScope(explicitScope);
  const queryClient = useQueryClient();
  const allergyKey = scopedKey(scope, "allergies");
  const conditionKey = scopedKey(scope, "medical-conditions");

  const allergies = usePagedList({
    scope,
    queryKey: allergyKey,
    params: PROFILE_LIST_PAGE,
    fetch: listAllergies,
    map: fromApiAllergy,
  });
  const history = usePagedList({
    scope,
    queryKey: conditionKey,
    params: PROFILE_LIST_PAGE,
    fetch: listConditions,
    map: fromApiCondition,
  });

  const refreshAllergies = () =>
    queryClient.invalidateQueries({ queryKey: allergyKey });
  const refreshConditions = () =>
    queryClient.invalidateQueries({ queryKey: conditionKey });

  const addAllergy = useMutation({
    mutationFn: (row: Omit<AllergyRow, "id">) =>
      createAllergy(requireScope(scope), toAllergyBody(row)),
    onSuccess: refreshAllergies,
  });
  const editAllergy = useMutation({
    mutationFn: ({ before, next }: Edit<AllergyRow>) =>
      updateAllergy(
        requireScope(scope),
        before.id,
        changedFields(toAllergyBody(before), toAllergyBody(next)),
      ),
    onSuccess: refreshAllergies,
  });
  const deleteAllergy = useMutation({
    mutationFn: (id: string) => removeAllergy(requireScope(scope), id),
    onSuccess: refreshAllergies,
  });

  const addCondition = useMutation({
    mutationFn: (row: Omit<HistoryRow, "id">) =>
      createCondition(requireScope(scope), toConditionBody(row)),
    onSuccess: refreshConditions,
  });
  const editCondition = useMutation({
    mutationFn: ({ before, next }: Edit<HistoryRow>) =>
      updateCondition(
        requireScope(scope),
        before.id,
        changedFields(toConditionBody(before), toConditionBody(next)),
      ),
    onSuccess: refreshConditions,
  });
  const deleteCondition = useMutation({
    mutationFn: (id: string) => removeCondition(requireScope(scope), id),
    onSuccess: refreshConditions,
  });

  return {
    allergies: allergies.items,
    history: history.items,
    allergiesRead: allergies,
    historyRead: history,
    addAllergy,
    editAllergy,
    deleteAllergy,
    addCondition,
    editCondition,
    deleteCondition,
  };
}
