"use client";

/* ==========================================================================
   Messaging hooks (Phase 11, ADR 0007)
   --------------------------------------------------------------------------
   - Lists and threads are paged reads under keys that name the patient and
     the office context (`patientKey` / `orgKey`), so a caregiver switching
     patients or staff switching offices never sees the other's cache.
   - Every change is one call for one thread, then a refetch of what it
     touched: the server's answer (ids, unread counts, its after-hours
     reply) is what shows. No optimistic writes.
   - A failed send rejects, so the composer keeps the draft.
   ========================================================================== */

import { useCallback, useMemo } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useOptionalAuth } from "@/features/auth/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  requireScope,
  scopedKey,
  usePatientScope,
} from "@/features/profile/patientScope";
import { ApiError } from "@/lib/api/client";
import { nextPageParams, type PageParams } from "@/lib/api/paging";
import { uploadFile } from "@/lib/api/upload";
import { orgKey, type PatientScope } from "@/lib/data/queryKeys";
import * as api from "./messaging.api";
import * as map from "./messaging.mappers";
import type {
  Attachment,
  CareTeamContact,
  Conversation,
  InboxFilter,
  Message,
  MessageCategory,
} from "./messaging.types";

/** Conversations per page. A member has one thread per office and
 *  category, so one page is nearly always all of them; "load more" covers
 *  the rest. The office inbox pages the same way. */
const LIST_PAGE: PageParams = { limit: 50 };
/** Messages per page, newest first. */
const THREAD_PAGE: PageParams = { limit: 30 };

const NO_OFFICE_CODE = "client.no_office_context";

/** The office the signed-in staff member is working in, or null. */
export function useActiveOffice(): {
  organizationId: string | null;
  contact: CareTeamContact;
  permissions: Record<string, number> | undefined;
} {
  const user = useOptionalAuth()?.user ?? null;
  const organizationId =
    user && user.role !== "user" && user.role !== "caregiver"
      ? (user.organizationId ?? null)
      : null;
  const name = user?.org ?? "";
  return useMemo(
    () => ({
      organizationId,
      contact: { name, role: "", kind: "facility" as const },
      permissions: user?.orgPermissions,
    }),
    [organizationId, name, user?.orgPermissions],
  );
}

function requireOffice(organizationId: string | null): string {
  if (!organizationId)
    throw new ApiError(403, "No office is selected.", NO_OFFICE_CODE);
  return organizationId;
}

function officeKey(organizationId: string | null, ...rest: unknown[]) {
  return organizationId
    ? orgKey(organizationId, "conversations", ...(rest as []))
    : ["org", "none", "conversations", ...rest];
}

function pagedState(query: {
  isPending: boolean;
  error: unknown;
  isError: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  refetch: () => unknown;
  fetchNextPage: () => unknown;
}) {
  return {
    isPending: query.isPending,
    error: query.error,
    isError: query.isError,
    refetch: () => void query.refetch(),
    hasMore: query.hasNextPage,
    loadMore: () => void query.fetchNextPage(),
    isLoadingMore: query.isFetchingNextPage,
  };
}

/* ------------------------------------------------------------- the lists */

/** The patient's threads (the patient, or a caregiver with `messages`). */
export function useMemberInbox(explicitScope?: PatientScope | null) {
  const scope = usePatientScope(explicitScope);
  const { language } = useLanguage();
  const isEs = language === "ES";
  const query = useInfiniteQuery({
    queryKey: scopedKey(scope, "conversations"),
    queryFn: ({ pageParam }) =>
      api.listMemberConversations(requireScope(scope), pageParam),
    initialPageParam: LIST_PAGE,
    getNextPageParam: (last, _pages, params) =>
      nextPageParams(last.pagination, params),
  });
  const conversations = useMemo(
    () =>
      (query.data?.pages ?? [])
        .flatMap((page) => page.items)
        .map((row) => map.fromMemberConversation(row, isEs)),
    [query.data, isEs],
  );
  return { scope, conversations, ...pagedState(query) };
}

/** One slice of the office inbox, filtered by the server. */
export function useOfficeInbox(
  organizationId: string | null,
  inbox: InboxFilter,
  office: CareTeamContact,
  filter: { patientId?: string } = {},
) {
  const query = useInfiniteQuery({
    queryKey: officeKey(organizationId, {
      inbox,
      patientId: filter.patientId ?? null,
    }),
    queryFn: ({ pageParam }) =>
      api.listOfficeConversations(requireOffice(organizationId), pageParam, {
        inbox,
        patientId: filter.patientId,
      }),
    initialPageParam: LIST_PAGE,
    getNextPageParam: (last, _pages, params) =>
      nextPageParams(last.pagination, params),
  });
  const conversations = useMemo(
    () =>
      (query.data?.pages ?? [])
        .flatMap((page) => page.items)
        .map((row) => map.fromOfficeConversation(row, office)),
    [query.data, office],
  );
  return { conversations, ...pagedState(query) };
}

/** How many threads are in one slice of the office inbox (the server's
 *  total, one row read). 0 while unknown. */
export function useOfficeInboxCount(
  organizationId: string | null,
  inbox: InboxFilter,
) {
  const query = useQuery({
    queryKey: officeKey(organizationId, "count", inbox),
    queryFn: () =>
      api.listOfficeConversations(
        requireOffice(organizationId),
        { limit: 1 },
        { inbox },
      ),
    enabled: Boolean(organizationId),
  });
  const pagination = query.data?.pagination;
  return pagination?.mode === "offset" ? pagination.total : 0;
}

/* ------------------------------------------------------------- a thread */

export type ThreadTarget =
  | { kind: "member"; scope: PatientScope | null }
  | { kind: "office"; organizationId: string | null };

function threadKey(target: ThreadTarget, conversationId: string) {
  return target.kind === "member"
    ? scopedKey(target.scope, "conversation", conversationId, "messages")
    : target.organizationId
      ? orgKey(
          target.organizationId,
          "conversation",
          conversationId,
          "messages",
        )
      : ["org", "none", "conversation", conversationId, "messages"];
}

/** A thread's messages, oldest first, read newest page first. */
export function useThread(target: ThreadTarget, conversationId: string | null) {
  const query = useInfiniteQuery({
    queryKey: threadKey(target, conversationId ?? ""),
    queryFn: ({ pageParam }) =>
      target.kind === "member"
        ? api.listMemberMessages(
            requireScope(target.scope),
            conversationId!,
            pageParam,
          )
        : api.listOfficeMessages(
            requireOffice(target.organizationId),
            conversationId!,
            pageParam,
          ),
    initialPageParam: THREAD_PAGE,
    getNextPageParam: (last, _pages, params) =>
      nextPageParams(last.pagination, params),
    enabled: Boolean(conversationId),
  });
  const messages: Message[] = useMemo(
    () =>
      (query.data?.pages ?? [])
        .flatMap((page) => page.items)
        .map(map.fromApiMessage)
        .reverse(),
    [query.data],
  );
  return { messages, ...pagedState(query) };
}

/** A sent file's short-lived link, asked for when it is opened. */
export function useAttachmentLink(target: ThreadTarget) {
  return useCallback(
    (conversationId: string, messageId: string) =>
      target.kind === "member"
        ? api.memberAttachmentLink(
            requireScope(target.scope),
            conversationId,
            messageId,
          )
        : api.officeAttachmentLink(
            requireOffice(target.organizationId),
            conversationId,
            messageId,
          ),
    [target],
  );
}

async function contentOf(body: string, attachment?: Attachment) {
  const text = body.trim();
  const attachmentFileId = attachment?.file
    ? await uploadFile(attachment.file)
    : undefined;
  return {
    ...(text ? { body: text } : {}),
    ...(attachmentFileId ? { attachmentFileId } : {}),
  };
}

/* ----------------------------------------------------- the patient's side */

/** Start, send and read on the patient's side. */
export function useMemberMessaging(explicitScope?: PatientScope | null) {
  const scope = usePatientScope(explicitScope);
  const queryClient = useQueryClient();
  const refreshList = () =>
    queryClient.invalidateQueries({
      queryKey: scopedKey(scope, "conversations"),
    });
  const refreshThread = (conversationId: string) =>
    queryClient.invalidateQueries({
      queryKey: scopedKey(scope, "conversation", conversationId),
    });

  const send = useMutation({
    mutationFn: async (input: {
      conversationId: string;
      body: string;
      attachment?: Attachment;
    }) =>
      api.sendMemberMessage(
        requireScope(scope),
        input.conversationId,
        await contentOf(input.body, input.attachment),
      ),
    onSuccess: (_result, input) =>
      Promise.all([refreshThread(input.conversationId), refreshList()]),
  });

  const start = useMutation({
    mutationFn: async (input: {
      organizationId: string;
      category: MessageCategory;
      body: string;
      attachment?: Attachment;
    }) =>
      api.startMemberConversation(requireScope(scope), {
        organizationId: input.organizationId,
        category: input.category,
        ...(await contentOf(input.body, input.attachment)),
      }),
    /* The server posts its after-hours reply on a start too but leaves it
       out of the answer: refetch the thread so it shows. */
    onSuccess: (conversation) =>
      Promise.all([refreshThread(conversation.id), refreshList()]),
  });

  const read = useMutation({
    mutationFn: (conversationId: string) =>
      api.markMemberRead(requireScope(scope), conversationId),
    onSuccess: refreshList,
  });

  return {
    scope,
    send,
    start,
    markRead: read.mutate,
    writeError: send.error ?? start.error ?? read.error,
    isSending: send.isPending || start.isPending,
    clearWriteError: () => {
      send.reset();
      start.reset();
      read.reset();
    },
  };
}

/** The offices the patient may write to (ACTIVE care relationships). */
export function useMessageRecipients(explicitScope?: PatientScope | null) {
  const scope = usePatientScope(explicitScope);
  const { language } = useLanguage();
  const isEs = language === "ES";
  const query = useQuery({
    queryKey: scopedKey(scope, "care-relationships", "messaging"),
    queryFn: () =>
      api.listCareRelationships(requireScope(scope), { limit: 150 }),
  });
  const offices = useMemo(
    () => map.messageableOffices(query.data?.items ?? [], isEs),
    [query.data, isEs],
  );
  return {
    offices,
    isPending: query.isPending,
    error: query.error,
    refetch: () => void query.refetch(),
  };
}

/* ------------------------------------------------------ the office's side */

/** Start, reply, read state, flag and archive on the office's side. */
export function useOfficeMessaging(organizationId: string | null) {
  const queryClient = useQueryClient();
  const refreshList = () =>
    queryClient.invalidateQueries({ queryKey: officeKey(organizationId) });
  const refreshThread = (conversationId: string) =>
    organizationId
      ? queryClient.invalidateQueries({
          queryKey: orgKey(organizationId, "conversation", conversationId),
        })
      : Promise.resolve();

  const send = useMutation({
    mutationFn: async (input: {
      conversationId: string;
      body: string;
      attachment?: Attachment;
    }) =>
      api.sendOfficeReply(
        requireOffice(organizationId),
        input.conversationId,
        await contentOf(input.body, input.attachment),
      ),
    onSuccess: (_result, input) =>
      Promise.all([refreshThread(input.conversationId), refreshList()]),
  });

  const start = useMutation({
    mutationFn: async (input: {
      patientId: string;
      category?: MessageCategory;
      body: string;
      attachment?: Attachment;
    }) =>
      api.startOfficeConversation(requireOffice(organizationId), {
        patientId: input.patientId,
        ...(input.category ? { category: input.category } : {}),
        ...(await contentOf(input.body, input.attachment)),
      }),
    onSuccess: (conversation) =>
      Promise.all([refreshThread(conversation.id), refreshList()]),
  });

  const state = useMutation({
    mutationFn: (
      input:
        | { conversationId: string; read: boolean }
        | { conversationId: string; flagged?: boolean; archived?: boolean },
    ) => {
      const org = requireOffice(organizationId);
      if ("read" in input)
        return input.read
          ? api.markOfficeRead(org, input.conversationId)
          : api.markOfficeUnread(org, input.conversationId);
      const { conversationId, ...patch } = input;
      return api.updateOfficeConversation(org, conversationId, patch);
    },
    onSuccess: refreshList,
  });

  const { mutate } = state;
  return {
    send,
    start,
    markRead: (conversationId: string) =>
      mutate({ conversationId, read: true }),
    markUnread: (conversationId: string) =>
      mutate({ conversationId, read: false }),
    /** The explicit value, never a toggle. */
    setFlagged: (conversationId: string, flagged: boolean) =>
      mutate({ conversationId, flagged }),
    setArchived: (conversationId: string, archived: boolean) =>
      mutate({ conversationId, archived }),
    writeError: send.error ?? start.error ?? state.error,
    isSending: send.isPending || start.isPending,
    clearWriteError: () => {
      send.reset();
      start.reset();
      state.reset();
    },
  };
}

/** The office's patients it may write to (its roster, by patient id). */
export function useOfficeRecipients(organizationId: string | null) {
  const query = useQuery({
    queryKey: organizationId
      ? orgKey(organizationId, "roster", "messaging")
      : ["org", "none", "roster"],
    queryFn: () =>
      api.listRoster(requireOffice(organizationId), { limit: 150 }),
    enabled: Boolean(organizationId),
  });
  const patients = useMemo(
    () => map.rosterRecipients(query.data?.items ?? []),
    [query.data],
  );
  return {
    patients,
    isPending: query.isPending,
    error: query.error,
    hasMore: query.data?.pagination?.hasNext ?? false,
  };
}

/** The office's private note on a patient (the inbox rail). */
export function useClinicNote(
  organizationId: string | null,
  patientId: string | null,
) {
  const queryClient = useQueryClient();
  const queryKey =
    organizationId && patientId
      ? orgKey(organizationId, "clinic-note", patientId)
      : ["org", "none", "clinic-note"];
  const query = useQuery({
    queryKey,
    queryFn: () => api.getClinicNote(requireOffice(organizationId), patientId!),
    enabled: Boolean(organizationId && patientId),
  });
  const save = useMutation({
    mutationFn: (body: string) => {
      const org = requireOffice(organizationId);
      const text = body.trim();
      if (text) return api.saveClinicNote(org, patientId!, text);
      return query.data
        ? api.deleteClinicNote(org, patientId!)
        : Promise.resolve(null);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });
  return {
    note: query.data?.body ?? "",
    isPending: query.isPending,
    error: query.error,
    save,
  };
}

/** Thread lists of either side, by id: the open conversation with its
 *  loaded messages. */
export function withMessages(
  conversation: Conversation | null,
  messages: Message[],
): Conversation | null {
  return conversation ? { ...conversation, messages } : null;
}

/**
 * The level the signed-in context holds on a patient area: a patient
 * holds everything; a caregiver what the patient's grant gives (D1). The
 * UI only hides with it; the server decides.
 */
export function usePatientAreaLevel(area: "messages" | "sharing"): number {
  const auth = useOptionalAuth();
  const user = auth?.user;
  if (!user) return 0;
  if (user.role === "user") return 3;
  if (user.role !== "caregiver") return 0;
  const grant = auth?.context?.caregiving.find(
    (g) => g.grantId === user.caregivingGrantId,
  );
  const level = grant?.permissions?.[area];
  return typeof level === "number" ? level : 0;
}
