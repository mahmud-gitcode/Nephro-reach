/* ==========================================================================
   Share Outside NephroReach
   --------------------------------------------------------------------------
   The client (2026-10-05, replacing the earlier free-recipient dashboard):

     1. A NephroReach member chooses "Share Outside NephroReach".
     2. They pick exactly what to send: a message, referral information,
        an appointment request, a document or photo.
     3. They enter the recipient's contact.
     4. The recipient gets a secure link — not access to any portal.
     5. After verifying, they can view or download only what was shared.
     6. That page offers "Learn more about NephroReach" and "Request
        information for your organization".
     7. Ongoing communication and tools come with an organisational
        account, as a paying customer.

   Frontend phase: the link is shown to the member instead of being
   emailed, verification is the recipient confirming the email it was
   sent to, and everything lives in this browser. The email, real identity
   checks and server-side access come with the backend. Every step is
   logged on the share.

   Pure: state in, state out. Storage lives in useShares.ts.
   ========================================================================== */

export const SHARE_KINDS = [
  { id: "message", en: "Message", es: "Mensaje" },
  {
    id: "referral",
    en: "Referral information",
    es: "Información de referencia",
  },
  { id: "appointment", en: "Appointment request", es: "Solicitud de cita" },
  { id: "document", en: "Document or photo", es: "Documento o foto" },
] as const;
export type ShareKind = (typeof SHARE_KINDS)[number]["id"];

export type ShareAttachment = {
  name: string;
  /** MIME type, e.g. "image/jpeg", "application/pdf". */
  type: string;
  /** Data URL. Images are shrunk first; other files are size-capped. */
  dataUrl: string;
};

export type ShareEvent =
  | "shared"
  | "notified"
  | "opened"
  | "verified"
  | "downloaded"
  | "info-requested";

export type ShareLogEntry = { event: ShareEvent; by: string; at: string };

export type InfoRequest = {
  name: string;
  organization: string;
  email: string;
  phone: string;
  /** ISO 8601 */
  at: string;
};

export type OutsideShare = {
  id: string;
  /** The secret part of the link. */
  token: string;
  patientName: string;
  kind: ShareKind;
  recipientEmail: string;
  /** Optional: the office's name, as the member knows it. */
  recipientOrg: string;
  subject: string;
  body: string;
  attachment?: ShareAttachment;
  /** ISO 8601 */
  sharedAt: string;
  /** Who opened it, once verified. */
  verifiedBy?: { name: string; organization: string; at: string };
  infoRequests: InfoRequest[];
  log: ShareLogEntry[];
};

export type SharesState = { shares: OutsideShare[] };

/** Largest file a member may attach (images are shrunk before this). */
export const MAX_ATTACHMENT_BYTES = 1_500_000;

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export type NewShare = Pick<
  OutsideShare,
  | "patientName"
  | "kind"
  | "recipientEmail"
  | "recipientOrg"
  | "subject"
  | "body"
  | "attachment"
>;

/** A share and its link; the recipient is notified (logged). */
export function createShare(
  state: SharesState,
  input: NewShare,
  token: string,
  now: number,
): SharesState {
  const at = new Date(now).toISOString();
  const share: OutsideShare = {
    ...input,
    id: `share-${now}`,
    token,
    recipientEmail: input.recipientEmail.trim().toLowerCase(),
    recipientOrg: input.recipientOrg.trim(),
    subject: input.subject.trim(),
    body: input.body.trim(),
    sharedAt: at,
    infoRequests: [],
    log: [
      { event: "shared", by: input.patientName, at },
      { event: "notified", by: "NephroReach", at },
    ],
  };
  return { shares: [...state.shares, share] };
}

export function shareByToken(
  state: SharesState,
  token: string,
): OutsideShare | undefined {
  return state.shares.find((s) => s.token === token);
}

export function sharesForPatient(
  state: SharesState,
  patientName: string,
): OutsideShare[] {
  return state.shares
    .filter((s) => s.patientName === patientName)
    .sort((a, b) => b.sharedAt.localeCompare(a.sharedAt));
}

function update(
  state: SharesState,
  id: string,
  change: (share: OutsideShare) => OutsideShare,
): SharesState {
  return { shares: state.shares.map((s) => (s.id === id ? change(s) : s)) };
}

function logged(
  share: OutsideShare,
  event: ShareEvent,
  by: string,
  now: number,
): OutsideShare {
  return {
    ...share,
    log: [...share.log, { event, by, at: new Date(now).toISOString() }],
  };
}

/** The link was opened (before verification). */
export function recordOpened(
  state: SharesState,
  id: string,
  now: number,
): SharesState {
  return update(state, id, (s) => logged(s, "opened", "Recipient", now));
}

/**
 * The recipient confirms the address it was sent to. Only then is the
 * shared item shown. Returns null when the address does not match.
 */
export function verifyRecipient(
  state: SharesState,
  id: string,
  input: { email: string; name: string; organization: string },
  now: number,
): SharesState | null {
  const share = state.shares.find((s) => s.id === id);
  if (!share) return null;
  if (input.email.trim().toLowerCase() !== share.recipientEmail) return null;
  const name = input.name.trim();
  return update(state, id, (s) =>
    logged(
      {
        ...s,
        verifiedBy: {
          name,
          organization: input.organization.trim(),
          at: new Date(now).toISOString(),
        },
      },
      "verified",
      name || s.recipientEmail,
      now,
    ),
  );
}

export function recordDownload(
  state: SharesState,
  id: string,
  now: number,
): SharesState {
  return update(state, id, (s) =>
    logged(s, "downloaded", s.verifiedBy?.name || "Recipient", now),
  );
}

export function requestInfo(
  state: SharesState,
  id: string,
  request: Omit<InfoRequest, "at">,
  now: number,
): SharesState {
  return update(state, id, (s) =>
    logged(
      {
        ...s,
        infoRequests: [
          ...s.infoRequests,
          { ...request, at: new Date(now).toISOString() },
        ],
      },
      "info-requested",
      request.name || request.email,
      now,
    ),
  );
}

export type ShareStatus = "sent" | "opened" | "viewed";

/** What the member sees about their share. */
export function shareStatus(share: OutsideShare): ShareStatus {
  if (share.verifiedBy) return "viewed";
  if (share.log.some((l) => l.event === "opened")) return "opened";
  return "sent";
}

export const SHARE_LOG_LABEL: Record<ShareEvent, string> = {
  shared: "Shared by the member",
  notified: "Secure link sent to the recipient (no content in the notice)",
  opened: "Link opened",
  verified: "Recipient verified and viewed",
  downloaded: "Attachment downloaded",
  "info-requested": "Requested information about NephroReach",
};

/** The page a share's link opens. */
export function shareLink(token: string): string {
  return `/secure/${token}`;
}
