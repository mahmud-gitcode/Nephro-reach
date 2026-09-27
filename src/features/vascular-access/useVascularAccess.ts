"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import * as rules from "./vascularAccess.data";
import type { AccessState } from "./vascularAccess.data";

/* ==========================================================================
   Vascular access — storage
   --------------------------------------------------------------------------
   One store for both portals, like messaging: the member tab and the
   clinic tab are two views of the same records.
   ========================================================================== */

const KEY = storageKey("vascular-access");

/** Bump when AccessRecord changes shape, so old data re-seeds. */
const VERSION = 1;

type StoredEnvelope = { version: number; records: unknown };

function isRecord(value: unknown): value is rules.AccessRecord {
  if (!value || typeof value !== "object") return false;
  const r = value as Partial<rules.AccessRecord>;
  return (
    typeof r.mrn === "string" &&
    typeof r.memberName === "string" &&
    !!r.overview &&
    Array.isArray(r.appointments) &&
    Array.isArray(r.updates) &&
    Array.isArray(r.history) &&
    Array.isArray(r.concerns) &&
    Array.isArray(r.transport) &&
    Array.isArray(r.threads)
  );
}

async function readState(): Promise<AccessState> {
  const stored = await readJson<Partial<StoredEnvelope> | null>(KEY, null);
  if (
    stored &&
    stored.version === VERSION &&
    Array.isArray(stored.records) &&
    stored.records.every(isRecord)
  ) {
    return { records: stored.records };
  }
  const seeded = rules.seedAccessState(Date.now());
  await writeJson(KEY, { version: VERSION, ...seeded });
  return seeded;
}

export const vascularAccessKey = ["vascular-access"] as const;

const EMPTY: AccessState = { records: [] };

export function useVascularAccess() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: vascularAccessKey, queryFn: readState });

  const write = useMutation({
    mutationFn: async (transform: (current: AccessState) => AccessState) => {
      const next = transform(await readState());
      await writeJson(KEY, { version: VERSION, ...next });
      return next;
    },
    onSuccess: (state) => queryClient.setQueryData(vascularAccessKey, state),
  });

  const { mutate } = write;
  const state = useMemo(() => query.data ?? EMPTY, [query.data]);

  const run = useCallback(
    (transform: (current: AccessState) => AccessState) => mutate(transform),
    [mutate],
  );

  return {
    state,
    records: state.records,
    isPending: query.isPending,
    isFetching: query.isFetching,
    error: query.error,
    updatedAt: query.dataUpdatedAt,
    refetch: () => void query.refetch(),
    /** A change that did not reach storage. */
    writeError: write.error,
    isSaving: write.isPending,
    clearWriteError: write.reset,

    editOverview: (mrn: string, overview: Partial<rules.AccessOverview>) =>
      run((s) => rules.editOverview(s, mrn, overview)),
    scheduleAppointment: (
      mrn: string,
      appointment: Omit<rules.AccessAppointment, "id" | "completed">,
    ) => run((s) => rules.scheduleAppointment(s, mrn, appointment, Date.now())),
    completeAppointment: (
      mrn: string,
      appointmentId: string,
      result: string,
      performedBy: string,
    ) =>
      run((s) =>
        rules.completeAppointment(
          s,
          mrn,
          appointmentId,
          result,
          performedBy,
          Date.now(),
        ),
      ),
    reportConcern: (
      mrn: string,
      concern: Pick<rules.AccessConcern, "kinds" | "detail" | "imageUrl">,
    ) => run((s) => rules.reportConcern(s, mrn, concern, Date.now())),
    reviewConcern: (mrn: string, concernId: string) =>
      run((s) => rules.reviewConcern(s, mrn, concernId)),
    requestTransport: (mrn: string, appointmentId: string) =>
      run((s) => rules.requestTransport(s, mrn, appointmentId, Date.now())),
    arrangeTransport: (mrn: string, requestId: string) =>
      run((s) => rules.arrangeTransport(s, mrn, requestId)),
    sendMessage: (
      mrn: string,
      team: rules.AccessTeam,
      author: rules.AccessMessage["author"],
      body: string,
      imageUrl?: string,
    ) =>
      run((s) =>
        rules.sendAccessMessage(
          s,
          mrn,
          team,
          author,
          body,
          Date.now(),
          imageUrl,
        ),
      ),
    markThreadRead: (
      mrn: string,
      team: rules.AccessTeam,
      reader: rules.AccessMessage["author"],
    ) => run((s) => rules.markThreadRead(s, mrn, team, reader)),
  };
}

export type VascularAccessStore = ReturnType<typeof useVascularAccess>;
