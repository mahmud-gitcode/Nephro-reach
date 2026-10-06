"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import * as rules from "./shares";
import type { SharesState } from "./shares";

/* ==========================================================================
   Share Outside NephroReach — storage
   --------------------------------------------------------------------------
   One shared key: the member writes a share, and the recipient's link page
   (no NephroReach login) reads it. With a server, the link's token is
   checked there and only that one item is ever returned.
   ========================================================================== */

const KEY = storageKey("outside-shares");

function isState(value: unknown): value is SharesState {
  return (
    !!value &&
    typeof value === "object" &&
    Array.isArray((value as Partial<SharesState>).shares)
  );
}

async function readState(): Promise<SharesState> {
  const stored = await readJson<unknown>(KEY, null);
  return isState(stored) ? stored : { shares: [] };
}

export const sharesKey = ["outside-shares"] as const;

export function useShares() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: sharesKey, queryFn: readState });
  const write = useMutation({
    mutationFn: async (
      transform: (s: SharesState) => SharesState | null,
    ): Promise<SharesState | null> => {
      const next = transform(await readState());
      if (!next) return null;
      await writeJson(KEY, next);
      return next;
    },
    onSuccess: (state) => {
      if (state) queryClient.setQueryData(sharesKey, state);
    },
  });
  const state = useMemo(() => query.data ?? { shares: [] }, [query.data]);
  const run = write.mutateAsync;

  return {
    state,
    isPending: query.isPending,
    isSaving: write.isPending,
    saveError: write.error,
    /** Resolves to the new share's link token. */
    create: async (input: rules.NewShare) => {
      const token = crypto.randomUUID().replace(/-/g, "");
      await run((s) => rules.createShare(s, input, token, Date.now()));
      return token;
    },
    opened: (id: string) => run((s) => rules.recordOpened(s, id, Date.now())),
    /** Resolves to false when the address does not match. */
    verify: async (
      id: string,
      input: { email: string; name: string; organization: string },
    ) =>
      (await run((s) => rules.verifyRecipient(s, id, input, Date.now()))) !==
      null,
    downloaded: (id: string) =>
      run((s) => rules.recordDownload(s, id, Date.now())),
    requestInfo: (id: string, request: Omit<rules.InfoRequest, "at">) =>
      run((s) => rules.requestInfo(s, id, request, Date.now())),
  };
}
