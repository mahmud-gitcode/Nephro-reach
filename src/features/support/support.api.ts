/* ==========================================================================
   Support: the API repository (Phase 11, ADR 0007)
   --------------------------------------------------------------------------
   One function per server operation. The requester's side is the user's
   own tickets (`/me/support-tickets`: the server knows who is asking, so no
   name or email is sent); the NephroReach team's inbox is the platform
   side (`/platform/support-tickets`, `/platform/support-info-requests`),
   which only a platform account with the support permission may read.
   ========================================================================== */

import { api } from "@/lib/api/client";
import { fetchPage, type PageParams } from "@/lib/api/paging";
import type { SupportCategory, SupportStatus } from "./support.data";

/** The `dashboard` values the server accepts (backend SUPPORT_DASHBOARDS). */
export const SUPPORT_DASHBOARDS = [
  "Patient",
  "Dialysis Center",
  "Nephrology Office",
  "Vascular Access Center",
  "Hospital",
  "NephroReach Admin",
] as const;
export type SupportDashboard = (typeof SUPPORT_DASHBOARDS)[number];

export type ApiSupportReply = {
  id: string;
  side: "support" | "requester";
  body: string;
  at: string;
  /** Platform view only. */
  authorId?: string | null;
};

export type ApiSupportTicket = {
  id: string;
  dashboard: string;
  organizationId: string | null;
  organizationName: string | null;
  subject: string;
  category: string;
  message: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  /** Platform view only. */
  requester?: { id: string; name: string | null; email: string | null };
  /** On a single ticket only. */
  replies?: ApiSupportReply[];
};

export type ApiInfoRequest = {
  id: string;
  shareId: string;
  shareKind: string;
  sharedByOrganizationName: string | null;
  name: string;
  organization: string;
  email: string;
  phone: string;
  at: string;
  contacted: boolean;
  contactedAt: string | null;
};

export type NewTicketBody = {
  dashboard: SupportDashboard;
  organizationId?: string;
  subject: string;
  category: SupportCategory;
  message: string;
};

const id = (value: string) => encodeURIComponent(value);

/* The requester (any signed-in account). */
export const listMyTickets = (
  params: PageParams,
  filter: { status?: SupportStatus } = {},
) =>
  fetchPage<ApiSupportTicket>("/me/support-tickets", params, {
    query: { status: filter.status },
  });

export const getMyTicket = (ticketId: string) =>
  api<ApiSupportTicket>(`/me/support-tickets/${id(ticketId)}`);

export const openTicket = (body: NewTicketBody) =>
  api<ApiSupportTicket>("/me/support-tickets", { method: "POST", body });

export const replyToMyTicket = (ticketId: string, body: string) =>
  api<ApiSupportReply>(`/me/support-tickets/${id(ticketId)}/replies`, {
    method: "POST",
    body: { body },
  });

/* The NephroReach team (platform support permission). The office header is
   never sent: these are platform routes. */
const PLATFORM = { organizationId: null } as const;

export const listPlatformTickets = (
  params: PageParams,
  filter: { status?: SupportStatus } = {},
) =>
  fetchPage<ApiSupportTicket>("/platform/support-tickets", params, {
    ...PLATFORM,
    query: { status: filter.status },
  });

export const getPlatformTicket = (ticketId: string) =>
  api<ApiSupportTicket>(`/platform/support-tickets/${id(ticketId)}`, PLATFORM);

export const replyAsSupport = (ticketId: string, body: string) =>
  api<ApiSupportReply>(`/platform/support-tickets/${id(ticketId)}/replies`, {
    ...PLATFORM,
    method: "POST",
    body: { body },
  });

export const setTicketStatus = (ticketId: string, status: SupportStatus) =>
  api<ApiSupportTicket>(`/platform/support-tickets/${id(ticketId)}/status`, {
    ...PLATFORM,
    method: "PATCH",
    body: { status },
  });

export const listInfoRequests = (
  params: PageParams,
  filter: { contacted?: boolean } = {},
) =>
  fetchPage<ApiInfoRequest>("/platform/support-info-requests", params, {
    ...PLATFORM,
    query: { contacted: filter.contacted },
  });

export const setInfoRequestContacted = (
  requestId: string,
  contacted: boolean,
) =>
  api<ApiInfoRequest>(`/platform/support-info-requests/${id(requestId)}`, {
    ...PLATFORM,
    method: "PATCH",
    body: { contacted },
  });
