/* ==========================================================================
   Support (client, 2026-10-07: "All dashboards need a support tab")
   --------------------------------------------------------------------------
   Every dashboard (patient, dialysis center, nephrology office, access
   center, hospital) writes to NephroReach support from its own Support tab.
   All of it lands in the NephroReach team's Support Inbox, together with
   the "Request information for your organization" requests sent from a
   secure share page.

   Phase 11: the tickets live on the server (support.api.ts). What stays
   here is pure: the option lists, the form hint, and the mapping from the
   API's shapes to the screen's.
   ========================================================================== */

import type { UserRole } from "@/features/auth/auth";
import type {
  ApiInfoRequest,
  ApiSupportReply,
  ApiSupportTicket,
  SupportDashboard,
} from "./support.api";

export const SUPPORT_CATEGORIES = [
  { id: "account", en: "Account & sign-in", es: "Cuenta e inicio de sesión" },
  { id: "technical", en: "Technical problem", es: "Problema técnico" },
  {
    id: "billing",
    en: "Billing & subscription",
    es: "Facturación y suscripción",
  },
  { id: "classes", en: "Classes & content", es: "Clases y contenido" },
  { id: "other", en: "Something else", es: "Otra cosa" },
] as const;
export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number]["id"];

export const SUPPORT_STATUSES = ["open", "answered", "resolved"] as const;
export type SupportStatus = (typeof SUPPORT_STATUSES)[number];

export type SupportReply = {
  id: string;
  /** "support" is NephroReach; "requester" is whoever opened the ticket. */
  by: "support" | "requester";
  /** The requester's name in the NephroReach team's view; empty on the
   *  requester's own screen, which shows "You". */
  name: string;
  body: string;
  /** ISO 8601 */
  at: string;
};

export type SupportTicket = {
  /** The server's id (a uuid). */
  id: string;
  /** What the screen prints where the prototype printed SUP-1001: the
   *  start of the server's id (the API has no ticket number). */
  displayId: string;
  subject: string;
  category: SupportCategory;
  message: string;
  status: SupportStatus;
  /** ISO 8601 */
  createdAt: string;
  from: {
    /** The NephroReach team's view only. */
    name: string;
    email: string;
    /** Which dashboard: Patient, Dialysis Center, Nephrology Office… */
    dashboard: string;
    organization?: string;
  };
  /** Only on a ticket read on its own (the list carries none). */
  replies: SupportReply[];
};

/** An organization's "Request information" from a secure share page. */
export type InfoRequest = {
  id: string;
  name: string;
  organization: string;
  email: string;
  phone: string;
  /** ISO 8601 */
  at: string;
  contacted: boolean;
  /** The office that sent the share, when an office sent it. */
  sharedByOrganization: string | null;
  shareKind: string;
};

export type NewTicket = Pick<SupportTicket, "subject" | "category" | "message">;

/** The form hint; the server checks the same limits (3 and 5 characters). */
export function ticketError(
  input: Pick<NewTicket, "subject" | "message">,
): "subject" | "message" | null {
  if (input.subject.trim().length < 3) return "subject";
  if (input.message.trim().length < 5) return "message";
  return null;
}

/** Which Support tab a signed-in role writes from. A caregiver writes from
 *  the patient's portal (the server has no caregiver value). */
const DASHBOARD_FOR_ROLE: Record<UserRole, SupportDashboard> = {
  user: "Patient",
  caregiver: "Patient",
  clinic: "Dialysis Center",
  nephrology: "Nephrology Office",
  access: "Vascular Access Center",
  hospital: "Hospital",
  admin: "NephroReach Admin",
};

const OFFICE_ROLES: readonly UserRole[] = [
  "clinic",
  "nephrology",
  "access",
  "hospital",
];

export function dashboardFor(role: UserRole | undefined): SupportDashboard {
  return role ? DASHBOARD_FOR_ROLE[role] : "Patient";
}

/** The office a ticket is sent for: only in office mode, the office the
 *  user is working in (the server refuses any other). */
export function ticketOrganizationFor(user: {
  role: UserRole;
  organizationId?: string;
}): string | undefined {
  return OFFICE_ROLES.includes(user.role) ? user.organizationId : undefined;
}

const asStatus = (value: string): SupportStatus =>
  (SUPPORT_STATUSES as readonly string[]).includes(value)
    ? (value as SupportStatus)
    : "open";

const asCategory = (value: string): SupportCategory =>
  SUPPORT_CATEGORIES.some((c) => c.id === value)
    ? (value as SupportCategory)
    : "other";

/** The short id printed on a ticket. */
export function displayIdOf(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

export function fromApiReply(
  reply: ApiSupportReply,
  requesterName = "",
): SupportReply {
  const by = reply.side === "support" ? "support" : "requester";
  return {
    id: reply.id,
    by,
    name: by === "requester" ? requesterName : "",
    body: reply.body,
    at: reply.at,
  };
}

export function fromApiTicket(ticket: ApiSupportTicket): SupportTicket {
  const requesterName = ticket.requester?.name ?? ticket.requester?.email ?? "";
  return {
    id: ticket.id,
    displayId: displayIdOf(ticket.id),
    subject: ticket.subject,
    category: asCategory(ticket.category),
    message: ticket.message,
    status: asStatus(ticket.status),
    createdAt: ticket.createdAt,
    from: {
      name: requesterName,
      email: ticket.requester?.email ?? "",
      dashboard: ticket.dashboard,
      organization: ticket.organizationName ?? undefined,
    },
    replies: (ticket.replies ?? []).map((reply) =>
      fromApiReply(reply, requesterName),
    ),
  };
}

export function fromApiInfoRequest(request: ApiInfoRequest): InfoRequest {
  return {
    id: request.id,
    name: request.name,
    organization: request.organization,
    email: request.email,
    phone: request.phone,
    at: request.at,
    contacted: request.contacted,
    sharedByOrganization: request.sharedByOrganizationName,
    shareKind: request.shareKind,
  };
}
