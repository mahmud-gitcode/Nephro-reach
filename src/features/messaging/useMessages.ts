"use client";

import { useMemo } from "react";
import { useOptionalAuth } from "@/features/auth/AuthContext";
import type { NewConversation } from "./messaging.rules";
import type {
  Attachment,
  Conversation,
  MessageAuthor,
} from "./messaging.types";
import {
  useActiveOffice,
  useMemberInbox,
  useOfficeInbox,
} from "./useConversations";

/* ==========================================================================
   @deprecated A temporary, READ-ONLY adapter (Phase 11)
   --------------------------------------------------------------------------
   Messaging moved to the API (useConversations.ts). This keeps the
   prototype hook's exported name and shape so files in other lanes compile
   unchanged until their owners switch:
   - features/clinic/ClinicCheckIns.tsx, useMemberFeed.ts (OFFICE Phase 9):
     use `useOfficeInbox` / `useOfficeMessaging(org).start`;
   - features/clinic/ClinicReports.tsx (EDU-BIZ Phase 14): `useOfficeInbox`.

   It reads the signed-in context's own threads from the server (the
   office's inbox in office mode, the patient's otherwise; never by name),
   each with only its newest message. It writes NOTHING: every write
   function THROWS `MessagingWriteUnavailableError`, because the old ones
   found threads by a member's name (INT-13) and that cannot be mapped to
   the API safely. A write must never look done when nothing was sent (QA
   round 1, M1): NewMessageModal shows the error and stays open. Nothing
   is read from or written to browser storage.
   ========================================================================== */

const noop = () => undefined;

/** Thrown by every write of the deprecated adapter. */
export class MessagingWriteUnavailableError extends Error {
  readonly code = "messaging.write_unavailable";
  constructor() {
    super(
      "This message was not sent: sending from this screen is not available yet. Write to the patient from Messages.",
    );
    this.name = "MessagingWriteUnavailableError";
  }
}

function unavailable(): never {
  throw new MessagingWriteUnavailableError();
}

/** @deprecated See above: read-only; use the hooks in useConversations.ts. */
export function useMessages() {
  const role = useOptionalAuth()?.user?.role;
  const office = useActiveOffice();
  const isMember = role === "user" || role === "caregiver";
  /* Only the signed-in side's inbox is read; the other is switched off. */
  const member = useMemberInbox(undefined, { enabled: isMember });
  const officeInbox = useOfficeInbox(
    isMember ? null : office.organizationId,
    "all",
    office.contact,
    { enabled: !isMember },
  );
  const read = isMember ? member : officeInbox;
  const conversations: Conversation[] = useMemo(
    () =>
      read.conversations.map((c) => ({
        ...c,
        messages: c.last ? [c.last] : [],
      })),
    [read.conversations],
  );

  return {
    conversations,
    isLoading: read.isPending,
    error: read.error,
    writeError: null as unknown,
    isSending: false,
    clearWriteError: noop,
    /** @deprecated Throws. Use `useOfficeMessaging(org).send`. */
    sendMessage: (
      _conversationId: string,
      _body: string,
      _author?: MessageAuthor,
      _attachment?: Attachment,
      _autoReply?: string,
    ): void => unavailable(),
    /** @deprecated Throws. Use `useOfficeMessaging(org).start` (by patient id). */
    startConversation: (_input: NewConversation, _autoReply?: string): void =>
      unavailable(),
    /** @deprecated Throws. Use `useOfficeMessaging(org).markRead`. */
    markRead: (_conversationId: string): void => unavailable(),
    /** @deprecated Throws. Use `useOfficeMessaging(org).markUnread`. */
    markUnread: (_conversationId: string): void => unavailable(),
    /** @deprecated Throws. Use `useOfficeMessaging(org).setFlagged`. */
    toggleFlag: (_conversationId: string): void => unavailable(),
    /** @deprecated Throws. Use `useOfficeMessaging(org).setArchived`. */
    setArchived: (_conversationId: string, _archived: boolean): void =>
      unavailable(),
    /** @deprecated Throws. Use `useClinicNote`. */
    setPatientNotes: (_conversationId: string, _notes: string): void =>
      unavailable(),
  };
}
