/* ==========================================================================
   Team messages — staff to staff, inside one office
   --------------------------------------------------------------------------
   The client (2026-10-06): a nurse can message the physicians. Patients do
   not message physicians directly (messaging.rules memberCanMessage); the
   nurse brings them in here.

   On the API (P15c, INT-P15-1): `/organizations/{orgId}/team-messages`.
   The office is the portal context the user picked, named in the path and
   in `X-Organization-Id`; the server returns only what the caller sent or
   received (the account owner: the whole office) and never another
   office's. Nothing is kept in browser storage (`nr:team-messages` is
   retired and purged, lib/data/legacyPurge).
   ========================================================================== */

import { api } from "@/lib/api/client";
import { fetchPage } from "@/lib/api/paging";
import { asOffice, officePath } from "@/features/clinic/officeContext";

/** `TeamMessageResponseDto`. People are user ids; names come from the
 *  office's staff list when the caller may read it. */
export type ApiTeamMessage = {
  id: string;
  fromId: string;
  toId: string;
  body: string;
  sentAt: string;
  readAt: string | null;
};

/** The newest messages the card lists (one page). */
export const TEAM_MESSAGES_SHOWN = 20;
/** The server's team message body limit (MESSAGING_LIMITS.teamBody). */
export const TEAM_MESSAGE_MAX = 2000;

const base = (orgId: string) => officePath(orgId, "/team-messages");

export const listTeamMessages = (orgId: string) =>
  fetchPage<ApiTeamMessage>(
    base(orgId),
    { page: 1, limit: TEAM_MESSAGES_SHOWN },
    asOffice(orgId),
  );

/** Unread messages to the caller (the badge counts every one, not only
 *  those on the first page). */
export const listUnreadTeamMessages = (orgId: string) =>
  fetchPage<ApiTeamMessage>(
    base(orgId),
    { page: 1, limit: 150 },
    { ...asOffice(orgId), query: { unread: "true" } },
  );

export const sendTeamMessage = (
  orgId: string,
  body: { toId: string; body: string },
) =>
  api<ApiTeamMessage>(base(orgId), {
    method: "POST",
    body,
    ...asOffice(orgId),
  });

export const markTeamMessagesRead = (orgId: string) =>
  api<{ count: number }>(`${base(orgId)}/read`, {
    method: "POST",
    ...asOffice(orgId),
  });

/** A message as the card shows it. */
export type TeamMessageView = {
  id: string;
  fromId: string;
  toId: string;
  from: string;
  fromRole: string | null;
  to: string;
  body: string;
  sentAt: string;
  /** Sent to the caller and not read yet. */
  isNew: boolean;
  /** Sent to the caller (they can reply). */
  toMe: boolean;
};

export type Colleague = { userId: string; name: string; role: string };

export const SOMEONE = "A colleague";

/** Names the people in each message: the caller is themselves, a colleague
 *  from the staff list, anyone else (no staff list for this role, or a
 *  person no longer listed) "A colleague"; never an id. */
export function viewTeamMessages(
  rows: ApiTeamMessage[],
  me: { userId: string; name: string; role: string },
  colleagues: Colleague[],
): TeamMessageView[] {
  const byId = new Map(colleagues.map((c) => [c.userId, c]));
  const nameOf = (id: string) =>
    id === me.userId ? me.name : (byId.get(id)?.name ?? SOMEONE);
  const roleOf = (id: string) =>
    id === me.userId ? me.role : (byId.get(id)?.role ?? null);
  return [...rows]
    .sort((a, b) => b.sentAt.localeCompare(a.sentAt))
    .map((m) => ({
      id: m.id,
      fromId: m.fromId,
      toId: m.toId,
      from: nameOf(m.fromId),
      fromRole: roleOf(m.fromId),
      to: nameOf(m.toId),
      body: m.body,
      sentAt: m.sentAt,
      toMe: m.toId === me.userId,
      isNew: m.toId === me.userId && !m.readAt,
    }));
}

/** Physicians first (they are who a nurse is usually after), then by name. */
export function orderColleagues(colleagues: Colleague[]): Colleague[] {
  return [...colleagues].sort(
    (a, b) =>
      Number(!a.role.startsWith("Physician")) -
        Number(!b.role.startsWith("Physician")) || a.name.localeCompare(b.name),
  );
}
