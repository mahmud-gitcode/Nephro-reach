/* ==========================================================================
   Support (client, 2026-10-07: "All dashboards need a support tab")
   --------------------------------------------------------------------------
   Every dashboard — patient, dialysis center, nephrology office, access
   center — writes to NephroReach support from its own Support tab. All of
   it lands in one place, the admin's Support Inbox, together with the
   "Request information for your organization" requests sent from a secure
   share page.

   Pure: state in, state out. Storage lives in useSupport.ts.
   ========================================================================== */

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

export type SupportStatus = "open" | "answered" | "resolved";

export type SupportReply = {
  /** "support" is NephroReach; "requester" is whoever opened the ticket. */
  by: "support" | "requester";
  name: string;
  body: string;
  /** ISO 8601 */
  at: string;
};

export type SupportTicket = {
  id: string;
  subject: string;
  category: SupportCategory;
  message: string;
  status: SupportStatus;
  /** ISO 8601 */
  createdAt: string;
  from: {
    name: string;
    email: string;
    /** Which dashboard: Patient, Dialysis Center, Nephrology Office… */
    dashboard: string;
    organization?: string;
  };
  replies: SupportReply[];
};

export type SupportState = {
  tickets: SupportTicket[];
  /** Organization requests (from secure shares) the admin has followed
   *  up, by "shareId|at". */
  contacted: string[];
};

export const EMPTY_SUPPORT: SupportState = { tickets: [], contacted: [] };

export type NewTicket = Pick<
  SupportTicket,
  "subject" | "category" | "message" | "from"
>;

export function openTicket(
  state: SupportState,
  input: NewTicket,
  now: number,
): SupportState {
  const ticket: SupportTicket = {
    ...input,
    subject: input.subject.trim(),
    message: input.message.trim(),
    id: `SUP-${String(state.tickets.length + 1001)}`,
    status: "open",
    createdAt: new Date(now).toISOString(),
    replies: [],
  };
  return { ...state, tickets: [ticket, ...state.tickets] };
}

/** A reply from support marks the ticket answered; one from the requester
 *  opens it again for support. */
export function replyToTicket(
  state: SupportState,
  id: string,
  reply: Omit<SupportReply, "at">,
  now: number,
): SupportState {
  const body = reply.body.trim();
  if (!body) return state;
  return {
    ...state,
    tickets: state.tickets.map((t) =>
      t.id === id
        ? {
            ...t,
            status: reply.by === "support" ? "answered" : "open",
            replies: [
              ...t.replies,
              { ...reply, body, at: new Date(now).toISOString() },
            ],
          }
        : t,
    ),
  };
}

export function setTicketStatus(
  state: SupportState,
  id: string,
  status: SupportStatus,
): SupportState {
  return {
    ...state,
    tickets: state.tickets.map((t) => (t.id === id ? { ...t, status } : t)),
  };
}

/** One person's tickets, newest first. */
export function ticketsFrom(
  state: SupportState,
  email: string,
): SupportTicket[] {
  const me = email.trim().toLowerCase();
  return state.tickets.filter((t) => t.from.email.toLowerCase() === me);
}

export function toggleContacted(
  state: SupportState,
  key: string,
): SupportState {
  return {
    ...state,
    contacted: state.contacted.includes(key)
      ? state.contacted.filter((k) => k !== key)
      : [...state.contacted, key],
  };
}

export function ticketError(
  input: Pick<NewTicket, "subject" | "message">,
): "subject" | "message" | null {
  if (input.subject.trim().length < 3) return "subject";
  if (input.message.trim().length < 5) return "message";
  return null;
}
