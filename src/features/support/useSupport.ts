"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import * as rules from "./support.data";

/* One shared key: every dashboard writes its tickets here and the admin's
   Support Inbox reads them all. With a server, each office reads only its
   own tickets and only NephroReach support reads them all. */
const KEY = storageKey("support-tickets");
export const supportKey = ["support-tickets"] as const;

async function readState(): Promise<rules.SupportState> {
  const stored = await readJson<Partial<rules.SupportState> | null>(KEY, null);
  return {
    tickets: Array.isArray(stored?.tickets) ? stored.tickets : [],
    contacted: Array.isArray(stored?.contacted) ? stored.contacted : [],
  };
}

export function useSupport() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: supportKey, queryFn: readState });
  const write = useMutation({
    mutationFn: async (
      transform: (s: rules.SupportState) => rules.SupportState,
    ) => writeJson(KEY, transform(await readState())),
    onSuccess: (state) => queryClient.setQueryData(supportKey, state),
  });
  const state = useMemo(() => query.data ?? rules.EMPTY_SUPPORT, [query.data]);
  const run = write.mutate;
  return {
    state,
    isPending: query.isPending,
    isSaving: write.isPending,
    saveError: write.error,
    open: (input: rules.NewTicket) =>
      run((s) => rules.openTicket(s, input, Date.now())),
    reply: (id: string, reply: Omit<rules.SupportReply, "at">) =>
      run((s) => rules.replyToTicket(s, id, reply, Date.now())),
    setStatus: (id: string, status: rules.SupportStatus) =>
      run((s) => rules.setTicketStatus(s, id, status)),
    toggleContacted: (key: string) => run((s) => rules.toggleContacted(s, key)),
  };
}
