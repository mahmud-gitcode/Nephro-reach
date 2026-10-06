/* ==========================================================================
   Team messages — staff to staff, inside one office
   --------------------------------------------------------------------------
   The client (2026-10-06): a nurse can message the physicians. Patients do
   not message physicians directly (messaging.rules memberCanMessage); the
   nurse brings them in here.

   Frontend only: one list in the browser, each message tagged with its
   office, so one office never reads another's. With a server this becomes
   a staff thread per pair of accounts.
   ========================================================================== */

export type TeamMessage = {
  id: string;
  /** The office's name, as on the signed-in user. */
  org: string;
  from: string;
  fromRole: string;
  to: string;
  body: string;
  /** ISO 8601 */
  sentAt: string;
  read?: boolean;
};

/** What one person sees: what they sent and what was sent to them. The
 *  office's own login (no name match) sees the whole office. */
export function messagesFor(
  all: TeamMessage[],
  org: string,
  me: string,
  owner: boolean,
): TeamMessage[] {
  return all
    .filter((m) => m.org === org && (owner || m.from === me || m.to === me))
    .sort((a, b) => b.sentAt.localeCompare(a.sentAt));
}

export function sendTeamMessage(
  all: TeamMessage[],
  message: Omit<TeamMessage, "id" | "sentAt" | "read">,
  now: Date,
): TeamMessage[] {
  return [
    ...all,
    {
      ...message,
      id: `tm-${now.getTime()}-${all.length}`,
      sentAt: now.toISOString(),
      read: false,
    },
  ];
}

export function markTeamRead(
  all: TeamMessage[],
  org: string,
  me: string,
): TeamMessage[] {
  return all.map((m) =>
    m.org === org && m.to === me && !m.read ? { ...m, read: true } : m,
  );
}
