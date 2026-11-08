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
   each with only its newest message. It writes NOTHING: the write
   functions are no-ops, because the old ones found threads by a member's
   name (INT-13) and that cannot be mapped to the API safely. Nothing is
   read from or written to browser storage.
   ========================================================================== */

const noop = () => undefined;

/** @deprecated See above: read-only; use the hooks in useConversations.ts. */
export function useMessages() {
  const role = useOptionalAuth()?.user?.role;
  const office = useActiveOffice();
  const isMember = role === "user" || role === "caregiver";
  const member = useMemberInbox(isMember ? undefined : null);
  const officeInbox = useOfficeInbox(
    isMember ? null : office.organizationId,
    "all",
    office.contact,
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
    /** @deprecated No-op. Use `useOfficeMessaging(org).send`. */
    sendMessage: (
      _conversationId: string,
      _body: string,
      _author?: MessageAuthor,
      _attachment?: Attachment,
      _autoReply?: string,
    ): void => undefined,
    /** @deprecated No-op. Use `useOfficeMessaging(org).start` (by patient id). */
    startConversation: (_input: NewConversation, _autoReply?: string): void =>
      undefined,
    markRead: (_conversationId: string): void => undefined,
    markUnread: (_conversationId: string): void => undefined,
    toggleFlag: (_conversationId: string): void => undefined,
    setArchived: (_conversationId: string, _archived: boolean): void =>
      undefined,
    setPatientNotes: (_conversationId: string, _notes: string): void =>
      undefined,
  };
}
