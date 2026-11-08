/* ==========================================================================
   Share Outside NephroReach — the shapes and labels
   --------------------------------------------------------------------------
   The client (2026-10-05):

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

   Phase 11: shares are the server's (`/patients/:id/outside-shares`,
   `/organizations/:id/outside-shares`, the public `/shared/:token`). The
   link is emailed by the server to the recipient only and never returned
   to the sender (D9 open); the recipient verifies with a code emailed to
   that address. Nothing about a share is kept in the browser.
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
  /* Anything a member can share goes the same way (client, 2026-10-07). */
  { id: "log", en: "Health log", es: "Registro de salud" },
  {
    id: "travel",
    en: "Travel dialysis request",
    es: "Solicitud de diálisis en viaje",
  },
] as const;
export type ShareKind = (typeof SHARE_KINDS)[number]["id"];

/** What an office sends: a member's own logs and travel requests are not
 *  its to share (the server's OFFICE_SHARE_KINDS). */
export const OFFICE_SHARE_KINDS: readonly ShareKind[] = [
  "message",
  "referral",
  "appointment",
  "document",
];

export function kindLabel(kind: string, isEs = false): string {
  const found = SHARE_KINDS.find((k) => k.id === kind);
  if (!found) return kind;
  return isEs ? found.es : found.en;
}

/**
 * A file to send with a share. Another page may hand over what it built in
 * memory (`dataUrl`, e.g. a CSV log); it is turned into a File and uploaded
 * through /files when the share is sent, never stored.
 */
export type ShareAttachment = {
  name: string;
  /** MIME type, e.g. "image/jpeg", "application/pdf". */
  type: string;
  /** The picked file (preferred). */
  file?: File;
  /** @deprecated In-memory content from other lanes' pages; converted to a
   *  File at send. */
  dataUrl?: string;
};

export type ShareEvent =
  | "shared"
  | "notified"
  | "opened"
  | "verified"
  | "downloaded"
  | "info-requested"
  | "replied"
  | "revoked";

/** What the sender sees about a share: the server's `status`. */
export type ShareStatus =
  "sent" | "opened" | "viewed" | "replied" | "expired" | "revoked";

/**
 * How many times the recipient may answer (client, 2026-10-18: "let them
 * reply maybe twice"). Only a label's fallback: the server sends
 * `maxReplies` and `repliesLeft`.
 */
export const MAX_RECIPIENT_REPLIES = 2;

/** A link's secret, as the server makes it (32 random bytes, base64url).
 *  Anything else is refused without asking the server. */
export const SHARE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function isShareToken(value: string): boolean {
  return SHARE_TOKEN_PATTERN.test(value);
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export const SHARE_LOG_LABEL: Record<ShareEvent, string> = {
  shared: "Shared",
  notified: "Secure link sent to the recipient (no content in the notice)",
  opened: "Link opened",
  verified: "Recipient verified and viewed",
  downloaded: "Attachment downloaded",
  "info-requested": "Requested information about NephroReach",
  replied: "Recipient replied",
  revoked: "Sharing stopped",
};

/** The event's label, or the server's word for one this build does not
 *  know yet. */
export function eventLabel(event: string): string {
  return SHARE_LOG_LABEL[event as ShareEvent] ?? event;
}

/** The file to upload for an attachment: the picked File, or one decoded
 *  from another page's in-memory data: URL (decoded here, not fetched, so
 *  the page's connect-src never has to allow data:). */
export function attachmentFile(attachment: ShareAttachment): File {
  if (attachment.file) return attachment.file;
  const match = /^data:([^,]*?),([\s\S]*)$/.exec(attachment.dataUrl ?? "");
  if (!match) throw new Error("No file to send.");
  const [, meta, payload] = match;
  const isBase64 = /;base64$/i.test(meta);
  const bytes = isBase64
    ? Uint8Array.from(atob(payload), (c) => c.charCodeAt(0))
    : new TextEncoder().encode(decodeURIComponent(payload));
  const type = attachment.type || meta.replace(/;base64$/i, "") || "";
  return new File([bytes], attachment.name, { type });
}
