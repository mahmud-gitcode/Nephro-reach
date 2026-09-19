"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getModalitySettings,
  listPdExchanges,
  saveModalitySettings,
  savePdExchanges,
} from "./modality.repository";
import {
  DEFAULT_MODALITY_SETTINGS,
  hasTreatmentIntervals,
  isHemodialysis,
  isHomeModality,
  recordsLocation,
  type DialysisModality,
  type ModalitySettings,
} from "./modality";
import * as pd from "./pdExchange";
import type { PdExchange, PdExchangeDraft } from "./pdExchange";

/* The member's dialysis type, and — when that type is PD — the exchanges
   they have logged. One hook because every screen that asks "which kind of
   dialysis is this?" immediately asks "so what should I show?". */

export const modalityKey = ["dialysis", "modality"] as const;
export const pdExchangesKey = ["dialysis", "pd-exchanges"] as const;

const NO_EXCHANGES: PdExchange[] = [];

export function useDialysisModality() {
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: modalityKey,
    queryFn: getModalitySettings,
  });
  const exchangesQuery = useQuery({
    queryKey: pdExchangesKey,
    queryFn: listPdExchanges,
  });

  const writeSettings = useMutation({
    mutationFn: async (next: ModalitySettings) => saveModalitySettings(next),
    onSuccess: (settings) => queryClient.setQueryData(modalityKey, settings),
  });

  const writeExchanges = useMutation({
    mutationFn: async (transform: (current: PdExchange[]) => PdExchange[]) =>
      savePdExchanges(transform(await listPdExchanges())),
    onSuccess: (exchanges) =>
      queryClient.setQueryData(pdExchangesKey, exchanges),
  });

  const settings = settingsQuery.data ?? DEFAULT_MODALITY_SETTINGS;
  const exchanges = exchangesQuery.data ?? NO_EXCHANGES;

  const { mutate: mutateSettings } = writeSettings;
  const { mutate: mutateExchanges } = writeExchanges;

  const saveSettings = useCallback(
    (patch: Partial<Omit<ModalitySettings, "updatedAt">>) =>
      mutateSettings({
        ...settings,
        ...patch,
        updatedAt: new Date().toISOString(),
      }),
    [mutateSettings, settings],
  );

  const setModality = useCallback(
    (modality: DialysisModality) => saveSettings({ modality }),
    [saveSettings],
  );

  const saveExchange = useCallback(
    (draft: PdExchangeDraft, editId?: string) => {
      const now = Date.now();
      const exchange: PdExchange = {
        ...draft,
        id: editId ?? `pd-${now}-${Math.random().toString(36).slice(2, 7)}`,
        savedAt: new Date(now).toISOString(),
      };
      mutateExchanges((current) => pd.upsertExchange(current, exchange));
    },
    [mutateExchanges],
  );

  const deleteExchange = useCallback(
    (id: string) =>
      mutateExchanges((current) => pd.removeExchange(current, id)),
    [mutateExchanges],
  );

  const modality = settings.modality;

  return {
    settings,
    modality,

    /* Asked often enough by the pages that each one working it out from
       the modality string would be four copies of the same rule. */
    isHemodialysis: useMemo(() => isHemodialysis(modality), [modality]),
    isHome: useMemo(() => isHomeModality(modality), [modality]),
    showsLocation: useMemo(() => recordsLocation(modality), [modality]),
    hasIntervals: useMemo(() => hasTreatmentIntervals(modality), [modality]),

    exchanges,
    exchangesOn: useCallback(
      (date: string) => pd.exchangesOn(exchanges, date),
      [exchanges],
    ),
    dailyUltrafiltrationMl: useCallback(
      (date: string) => pd.dailyUltrafiltrationMl(exchanges, date),
      [exchanges],
    ),
    urgentExchangesOn: useCallback(
      (date: string) => pd.urgentExchangesOn(exchanges, date),
      [exchanges],
    ),

    setModality,
    saveSettings,
    saveExchange,
    deleteExchange,

    isPending: settingsQuery.isPending || exchangesQuery.isPending,
    error: settingsQuery.error ?? exchangesQuery.error,
    refetch: () => {
      void settingsQuery.refetch();
      void exchangesQuery.refetch();
    },
    isSaving: writeSettings.isPending || writeExchanges.isPending,
    saveError: writeSettings.error ?? writeExchanges.error,
    dismissSaveError: () => {
      writeSettings.reset();
      writeExchanges.reset();
    },
  };
}

export type DialysisModalityLog = ReturnType<typeof useDialysisModality>;
