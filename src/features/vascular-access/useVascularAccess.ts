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

/** Bump when AccessRecord changes shape, so old data re-seeds.
 *  Version 2: one three-way conversation per record, and ride requests
 *  with a confirm step. Version 3: the demo patient's record carries the
 *  one MRN they have everywhere (lib/data/demoIdentity). Version 5: the
 *  workflow status set (No Active Concern ... Closed) and staff
 *  referrals. */
const VERSION = 5;

type StoredEnvelope = { version: number; records: unknown; referrals: unknown };

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
    !!r.conversation &&
    Array.isArray(r.conversation.messages)
  );
}

async function readState(): Promise<AccessState> {
  const stored = await readJson<Partial<StoredEnvelope> | null>(KEY, null);
  if (
    stored &&
    stored.version === VERSION &&
    Array.isArray(stored.records) &&
    stored.records.every(isRecord) &&
    Array.isArray(stored.referrals)
  ) {
    return {
      records: stored.records,
      referrals: stored.referrals as rules.AccessReferral[],
    };
  }
  const seeded = rules.seedAccessState(Date.now());
  await writeJson(KEY, { version: VERSION, ...seeded });
  return seeded;
}

export const vascularAccessKey = ["vascular-access"] as const;

const EMPTY: AccessState = { records: [], referrals: [] };

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
    referrals: rules.referralsOf(state),
    isPending: query.isPending,
    isFetching: query.isFetching,
    error: query.error,
    updatedAt: query.dataUpdatedAt,
    refetch: () => void query.refetch(),
    /** A change that did not reach storage. */
    writeError: write.error,
    isSaving: write.isPending,
    clearWriteError: write.reset,

    addRecord: (
      patient: { memberName: string; mrn: string },
      overview: rules.AccessOverview,
    ) => run((s) => rules.addAccessRecord(s, patient, overview)),
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
    editConcern: (
      mrn: string,
      concernId: string,
      change: Pick<rules.AccessConcern, "kinds" | "detail" | "imageUrl">,
    ) => run((s) => rules.editConcern(s, mrn, concernId, change, Date.now())),
    resendConcern: (mrn: string, concernId: string) =>
      run((s) => rules.resendConcern(s, mrn, concernId, Date.now())),
    deleteConcern: (mrn: string, concernId: string) =>
      run((s) => rules.deleteConcern(s, mrn, concernId)),
    reviewConcern: (mrn: string, concernId: string) =>
      run((s) => rules.reviewConcern(s, mrn, concernId)),
    requestTransport: (mrn: string, details: rules.TransportDetails) =>
      run((s) => rules.requestTransport(s, mrn, details, Date.now())),
    acknowledgeTransport: (mrn: string, requestId: string) =>
      run((s) => rules.acknowledgeTransport(s, mrn, requestId, Date.now())),
    confirmTransport: (
      mrn: string,
      requestId: string,
      confirmation: rules.TransportConfirmation,
      confirmedBy?: string,
    ) =>
      run((s) =>
        rules.confirmTransport(
          s,
          mrn,
          requestId,
          confirmation,
          Date.now(),
          confirmedBy,
        ),
      ),
    cancelTransport: (
      mrn: string,
      requestId: string,
      by: "member" | "dialysis",
    ) => run((s) => rules.cancelTransport(s, mrn, requestId, by, Date.now())),
    sendMessage: (
      mrn: string,
      author: rules.AccessParty,
      authorName: string,
      body: string,
      options?: { imageUrl?: string; private?: boolean },
    ) =>
      run((s) =>
        rules.sendAccessMessage(
          s,
          mrn,
          author,
          authorName,
          body,
          Date.now(),
          options,
        ),
      ),
    setMessagePrivate: (
      mrn: string,
      messageId: string,
      isPrivate: boolean,
      by: rules.AccessParty,
    ) => run((s) => rules.setMessagePrivate(s, mrn, messageId, isPrivate, by)),
    setDialysisCanPost: (
      mrn: string,
      allowed: boolean,
      by: rules.AccessParty,
    ) => run((s) => rules.setDialysisCanPost(s, mrn, allowed, by)),
    markConversationRead: (mrn: string, reader: rules.AccessParty) =>
      run((s) => rules.markConversationRead(s, mrn, reader)),
    sendReferral: (input: rules.ReferralInput) =>
      run((s) => rules.sendReferral(s, input, Date.now())),
    setReferralStatus: (
      id: string,
      status: Exclude<rules.ReferralStatus, "New">,
      by: string,
    ) => run((s) => rules.setReferralStatus(s, id, status, by, Date.now())),
    replyToReferral: (
      id: string,
      author: rules.ReferralReply["author"],
      authorName: string,
      body: string,
    ) =>
      run((s) =>
        rules.replyToReferral(s, id, author, authorName, body, Date.now()),
      ),
  };
}

export type VascularAccessStore = ReturnType<typeof useVascularAccess>;
