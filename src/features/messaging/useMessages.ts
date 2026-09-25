"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import * as rules from "./messaging.rules";
import type {
  Conversation,
  MessageAuthor,
  MessagingState,
} from "./messaging.types";

/* ==========================================================================
   Messages — stored in this browser
   --------------------------------------------------------------------------
   Through the same async adapter as every other feature, so a server can
   take over without the screens changing.

   Unlike the learner record this one *is* seeded: an empty inbox teaches a
   client nothing about the screen, and there is no member typing back. The
   seed is written on first read so a reply the clinic sends survives a
   reload alongside it.
   ========================================================================== */

const KEY = storageKey("messaging");

/**
 * The shape number of what is in storage.
 *
 * Bump this whenever `Conversation` or `Message` changes in a way that
 * older stored data cannot satisfy, and the next read re-seeds instead of
 * handing the screen a record from the previous shape.
 *
 * Version 1 had `program` on the conversation and no `patient` at all.
 * Version 2 moved the programme into a full patient record and added
 * `flagged`, `archived` and attachments. Checking only that
 * `conversations` was an array was not enough to tell those apart — v1
 * data passed that test and then crashed the thread header reaching for
 * `patient.status`. A shape this file owns needs a number, not a guess.
 *
 * Version 3 opened the store to the member portal: every thread gained a
 * `contact` naming its care-team end and a `category`, `patient` became
 * optional, and the member's own threads joined the seed. A v2 record has
 * no `contact`, so the member inbox would have rendered a column of blank
 * names off it.
 */
const VERSION = 3;

/** What actually sits in storage: the state plus its shape number. */
type StoredEnvelope = { version: number; conversations: unknown };

/**
 * The fields the screen dereferences without checking.
 *
 * The version number catches a shape change Claude made; this catches the
 * rest — a write cut short by a closing tab, a record edited by hand in
 * devtools. Storage is the one boundary where data arrives without having
 * been through the type system.
 */
function isConversation(value: unknown): value is Conversation {
  if (!value || typeof value !== "object") return false;
  const c = value as Partial<Conversation>;
  return (
    typeof c.id === "string" &&
    typeof c.memberName === "string" &&
    Array.isArray(c.messages) &&
    /* `contact` is checked and `patient` is not, which is the inversion
       version 3 introduced: every thread has two ends, but only the ones
       the clinic holds carry a chart. */
    !!c.contact &&
    typeof c.contact === "object" &&
    typeof (c.contact as { name?: unknown }).name === "string" &&
    typeof c.category === "string"
  );
}

async function readState(): Promise<MessagingState> {
  const stored = await readJson<Partial<StoredEnvelope> | null>(KEY, null);
  if (
    stored &&
    typeof stored === "object" &&
    stored.version === VERSION &&
    Array.isArray(stored.conversations) &&
    stored.conversations.every(isConversation)
  ) {
    return { conversations: stored.conversations };
  }
  /* First visit, or storage holding a shape this version cannot read.
     Either way the seed is the safe answer, and writing it now means the
     ids stay put for the rest of the session. */
  const seeded = rules.seedState(Date.now());
  await writeJson(KEY, { version: VERSION, ...seeded });
  return seeded;
}

export const messagesKey = ["messaging", "conversations"] as const;

const EMPTY: MessagingState = { conversations: [] };

export function useMessages() {
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: messagesKey, queryFn: readState });

  const write = useMutation({
    mutationFn: async (
      transform: (current: MessagingState) => MessagingState,
    ) => {
      const next = transform(await readState());
      /* The envelope goes back with the version on it, or the next read
         would decide its own write was unreadable and re-seed over it. */
      await writeJson(KEY, { version: VERSION, ...next });
      return next;
    },
    onSuccess: (state) => queryClient.setQueryData(messagesKey, state),
  });

  const { mutate } = write;
  /* Writes go to storage, and storage can refuse — a full quota, a private
     window, a browser that has blocked site data. A reply that silently
     failed to save is worse than one that never sent, because the clinic
     believes the patient has it. */
  const writeError = write.error;
  const state = useMemo(() => query.data ?? EMPTY, [query.data]);

  const sendMessage = useCallback(
    (conversationId: string, body: string, author: MessageAuthor = "clinic") =>
      mutate((current) =>
        rules.appendMessage(current, conversationId, body, author, Date.now()),
      ),
    [mutate],
  );

  const markRead = useCallback(
    (conversationId: string) =>
      mutate((current) => rules.markRead(current, conversationId)),
    [mutate],
  );

  const markUnread = useCallback(
    (conversationId: string) =>
      mutate((current) => rules.markUnread(current, conversationId)),
    [mutate],
  );

  const toggleFlag = useCallback(
    (conversationId: string) =>
      mutate((current) => rules.toggleFlag(current, conversationId)),
    [mutate],
  );

  const setArchived = useCallback(
    (conversationId: string, archived: boolean) =>
      mutate((current) => rules.setArchived(current, conversationId, archived)),
    [mutate],
  );

  return {
    conversations: state.conversations,
    isLoading: query.isPending,
    error: query.error,
    /** A failed write — a reply that did not reach storage. */
    writeError,
    isSending: write.isPending,
    clearWriteError: write.reset,
    sendMessage,
    markRead,
    markUnread,
    toggleFlag,
    setArchived,
  };
}
