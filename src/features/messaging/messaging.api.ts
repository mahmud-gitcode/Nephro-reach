/* ==========================================================================
   Messaging: the API repository (Phase 11, ADR 0007)
   --------------------------------------------------------------------------
   One function per server operation.

   - The patient side is `/patients/:patientId/conversations`: the patient,
     or a caregiver with the `messages` area, writes to an OFFICE that cares
     for the patient (an ACTIVE care relationship), never to a person. The
     office header is never sent on these calls.
   - The office side is `/organizations/:organizationId/conversations`,
     read in office mode (the client sends X-Organization-Id): the server
     shows an office only its own patients' threads.
   - Files go through /files first (uploadFile), and only the file id is
     sent. Downloads are short-lived links asked for on demand.
   ========================================================================== */

import { api } from "@/lib/api/client";
import { fetchPage, type PageParams } from "@/lib/api/paging";
import type { PatientScope } from "@/lib/data/queryKeys";
import type { InboxFilter, MessageCategory } from "./messaging.types";

export type ApiMessageAttachment = {
  id: string;
  name: string | null;
  contentType: string;
  size: number | null;
};

export type ApiMessage = {
  id: string;
  conversationId: string;
  /** MEMBER: the patient or a caregiver; OFFICE: staff or NephroReach. */
  side: "MEMBER" | "OFFICE";
  authorKind: string;
  authorId: string | null;
  body: string;
  automated: boolean;
  sentAt: string;
  attachment: ApiMessageAttachment | null;
};

export type ApiMemberConversation = {
  id: string;
  patientId: string;
  organizationId: string;
  organizationName: string;
  organizationType: string;
  category: string;
  subject: string | null;
  unread: number;
  archived: boolean;
  lastMessageAt: string | null;
  lastMessage: ApiMessage | null;
  createdAt: string;
};

export type ApiOfficeConversation = {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  mrn: string | null;
  category: string;
  subject: string | null;
  assignedToId: string | null;
  unread: number;
  flagged: boolean;
  archived: boolean;
  lastReadAt: string | null;
  escalatedAt: string | null;
  lastMessageAt: string | null;
  lastMessage: ApiMessage | null;
  createdAt: string;
};

export type ApiSendResult = {
  message: ApiMessage;
  /** NephroReach's after-hours reply, when the office is closed. */
  automatedReply: ApiMessage | null;
};

export type ApiAttachmentLink = { url: string; expiresIn: number };

/** The member's offices: `GET /patients/:id/care-relationships`. */
export type ApiCareRelationship = {
  organizationId: string;
  organizationName: string;
  organizationType: string;
  status: string;
};

/** A patient on the office's roster: `GET /organizations/:id/patients`. */
export type ApiRosterPatient = {
  patientId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  mrn: string | null;
  status: string;
  startedOn: string;
};

export type ApiClinicNote = {
  id: string;
  patientId: string;
  body: string;
  updatedById: string;
  createdAt: string;
  updatedAt: string;
};

export type MessageBody = { body?: string; attachmentFileId?: string };

const seg = (value: string) => encodeURIComponent(value);
/* Patient-side calls never carry the office header (ADR 0007 §6). */
const NO_OFFICE = { organizationId: null } as const;

const patientConversations = (scope: PatientScope) =>
  `/patients/${seg(scope.patientId)}/conversations`;
const officeConversations = (organizationId: string) =>
  `/organizations/${seg(organizationId)}/conversations`;

/* ------------------------------------------------------------ patient side */

export const listMemberConversations = (
  scope: PatientScope,
  params: PageParams,
  filter: { category?: MessageCategory } = {},
) =>
  fetchPage<ApiMemberConversation>(patientConversations(scope), params, {
    ...NO_OFFICE,
    query: { category: filter.category },
  });

/** Newest first: the first page is the latest messages. */
export const listMemberMessages = (
  scope: PatientScope,
  conversationId: string,
  params: PageParams,
) =>
  fetchPage<ApiMessage>(
    `${patientConversations(scope)}/${seg(conversationId)}/messages`,
    params,
    NO_OFFICE,
  );

/** Into the thread already shared with that office, or a new one. */
export const startMemberConversation = (
  scope: PatientScope,
  body: MessageBody & {
    organizationId: string;
    category?: MessageCategory;
    subject?: string;
  },
) =>
  api<ApiMemberConversation>(patientConversations(scope), {
    ...NO_OFFICE,
    method: "POST",
    body,
  });

export const sendMemberMessage = (
  scope: PatientScope,
  conversationId: string,
  body: MessageBody,
) =>
  api<ApiSendResult>(
    `${patientConversations(scope)}/${seg(conversationId)}/messages`,
    { ...NO_OFFICE, method: "POST", body },
  );

export const markMemberRead = (scope: PatientScope, conversationId: string) =>
  api<unknown>(`${patientConversations(scope)}/${seg(conversationId)}/read`, {
    ...NO_OFFICE,
    method: "POST",
  });

export const memberAttachmentLink = (
  scope: PatientScope,
  conversationId: string,
  messageId: string,
) =>
  api<ApiAttachmentLink>(
    `${patientConversations(scope)}/${seg(conversationId)}/messages/${seg(messageId)}/attachment`,
    NO_OFFICE,
  );

export const listCareRelationships = (
  scope: PatientScope,
  params: PageParams,
) =>
  fetchPage<ApiCareRelationship>(
    `/patients/${seg(scope.patientId)}/care-relationships`,
    params,
    NO_OFFICE,
  );

/* ------------------------------------------------------------- office side */

export const listOfficeConversations = (
  organizationId: string,
  params: PageParams,
  filter: {
    inbox?: InboxFilter;
    category?: MessageCategory;
    patientId?: string;
  } = {},
) =>
  fetchPage<ApiOfficeConversation>(
    officeConversations(organizationId),
    params,
    {
      organizationId,
      query: {
        inbox: filter.inbox,
        category: filter.category,
        patientId: filter.patientId,
      },
    },
  );

export const listOfficeMessages = (
  organizationId: string,
  conversationId: string,
  params: PageParams,
) =>
  fetchPage<ApiMessage>(
    `${officeConversations(organizationId)}/${seg(conversationId)}/messages`,
    params,
    { organizationId },
  );

export const startOfficeConversation = (
  organizationId: string,
  body: MessageBody & {
    patientId: string;
    category?: MessageCategory;
    subject?: string;
  },
) =>
  api<ApiOfficeConversation>(officeConversations(organizationId), {
    organizationId,
    method: "POST",
    body,
  });

export const sendOfficeReply = (
  organizationId: string,
  conversationId: string,
  body: MessageBody,
) =>
  api<ApiMessage>(
    `${officeConversations(organizationId)}/${seg(conversationId)}/messages`,
    { organizationId, method: "POST", body },
  );

export const markOfficeRead = (
  organizationId: string,
  conversationId: string,
) =>
  api<unknown>(
    `${officeConversations(organizationId)}/${seg(conversationId)}/read`,
    { organizationId, method: "POST" },
  );

export const markOfficeUnread = (
  organizationId: string,
  conversationId: string,
) =>
  api<unknown>(
    `${officeConversations(organizationId)}/${seg(conversationId)}/unread`,
    { organizationId, method: "POST" },
  );

/** Flag or archive one thread: always the explicit value, never a toggle. */
export const updateOfficeConversation = (
  organizationId: string,
  conversationId: string,
  patch: { flagged?: boolean; archived?: boolean },
) =>
  api<ApiOfficeConversation>(
    `${officeConversations(organizationId)}/${seg(conversationId)}`,
    { organizationId, method: "PATCH", body: patch },
  );

export const officeAttachmentLink = (
  organizationId: string,
  conversationId: string,
  messageId: string,
) =>
  api<ApiAttachmentLink>(
    `${officeConversations(organizationId)}/${seg(conversationId)}/messages/${seg(messageId)}/attachment`,
    { organizationId },
  );

export const listRoster = (organizationId: string, params: PageParams) =>
  fetchPage<ApiRosterPatient>(
    `/organizations/${seg(organizationId)}/patients`,
    params,
    { organizationId },
  );

const clinicNotePath = (organizationId: string, patientId: string) =>
  `/organizations/${seg(organizationId)}/patients/${seg(patientId)}/clinic-note`;

/** The office's private note on a patient (the inbox rail); null if none. */
export const getClinicNote = (organizationId: string, patientId: string) =>
  api<ApiClinicNote | null>(clinicNotePath(organizationId, patientId), {
    organizationId,
  });

export const saveClinicNote = (
  organizationId: string,
  patientId: string,
  body: string,
) =>
  api<ApiClinicNote>(clinicNotePath(organizationId, patientId), {
    organizationId,
    method: "PUT",
    body: { body },
  });

export const deleteClinicNote = (organizationId: string, patientId: string) =>
  api<unknown>(clinicNotePath(organizationId, patientId), {
    organizationId,
    method: "DELETE",
  });
