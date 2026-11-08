/* ==========================================================================
   Outside shares: the API repository (Phase 11, ADR 0007)
   --------------------------------------------------------------------------
   - The sender's side: `/patients/:id/outside-shares` (the patient, or a
     caregiver whose grant includes `sharing`; no office header) and
     `/organizations/:id/outside-shares` (an office, in office mode). The
     server never returns the link: it emails it to the recipient only.
   - The recipient's side: the public `/shared/:token` routes. The client
     sends them without cookies, the office header, the cache or a Referer
     (client.ts P-1), and the share session only as `x-share-session`.
   ========================================================================== */

import { api, apiRequest } from "@/lib/api/client";
import { fetchPage, type PageParams } from "@/lib/api/paging";
import type { PatientScope } from "@/lib/data/queryKeys";
import type { ShareKind, ShareStatus } from "./shares";

export type ApiShareEvent = {
  id: string;
  event: string;
  by: string;
  at: string;
};

export type ApiShareReply = {
  id: string;
  authorName: string;
  body: string;
  at: string;
};

export type ApiShareFile = {
  originalName: string | null;
  contentType: string;
  size: number | null;
};

/** A share as its sender sees it. Never the link. */
export type ApiOutsideShare = {
  id: string;
  kind: ShareKind;
  patientId: string | null;
  recipientEmail: string;
  recipientOrg: string;
  subject: string;
  body: string;
  attachment: (ApiShareFile & { id: string }) | null;
  maxReplies: number;
  expiresAt: string | null;
  sharedAt: string;
  sharedById: string;
  verifiedName: string | null;
  verifiedOrg: string | null;
  verifiedAt: string | null;
  revokedAt: string | null;
  revokedById: string | null;
  status: ShareStatus;
  events: ApiShareEvent[];
  replies: ApiShareReply[];
};

/** Exactly one recipient: an email, or one of the patient's healthcare-team
 *  contacts (the server refuses both or neither). */
export type NewPatientShare = {
  kind: ShareKind;
  recipientEmail: string;
  recipientOrg?: string;
  subject?: string;
  body?: string;
  fileId?: string;
};

export type NewOfficeShare = NewPatientShare & { patientId?: string };

/** Whose shares: the patient's, or the office's. */
export type ShareOwner =
  | { kind: "patient"; scope: PatientScope }
  | { kind: "office"; organizationId: string };

const seg = (value: string) => encodeURIComponent(value);

function ownerPath(owner: ShareOwner): string {
  return owner.kind === "patient"
    ? `/patients/${seg(owner.scope.patientId)}/outside-shares`
    : `/organizations/${seg(owner.organizationId)}/outside-shares`;
}

/* Patient-side calls never carry the office header (ADR 0007 §6). */
const headerFor = (owner: ShareOwner) => ({
  organizationId: owner.kind === "office" ? owner.organizationId : null,
});

export const listShares = (owner: ShareOwner, params: PageParams) =>
  fetchPage<ApiOutsideShare>(ownerPath(owner), params, headerFor(owner));

/** The new share and the server's message for the sender ("A secure link
 *  was sent to the recipient..."); never the link itself. */
export async function createShare(
  owner: ShareOwner,
  body: NewPatientShare | NewOfficeShare,
): Promise<{ share: ApiOutsideShare; message: string }> {
  const answer = await apiRequest<ApiOutsideShare>(ownerPath(owner), {
    ...headerFor(owner),
    method: "POST",
    body,
  });
  const message = Array.isArray(answer.message)
    ? answer.message.join(" ")
    : answer.message;
  return { share: answer.data, message };
}

export const revokeShare = (owner: ShareOwner, shareId: string) =>
  api<unknown>(`${ownerPath(owner)}/${seg(shareId)}/revoke`, {
    ...headerFor(owner),
    method: "POST",
  });

/* --------------------------------------------- the recipient (public) */

/** What anyone holding the link sees before verifying: never the body. */
export type ApiSharedLink = {
  kind: ShareKind;
  sharedByName: string;
  fromOrganization: boolean;
  subject: string;
  sharedAt: string;
  expiresAt: string | null;
};

export type ApiSharedContent = ApiSharedLink & {
  body: string;
  recipientOrg: string;
  attachment: ApiShareFile | null;
  replies: ApiShareReply[];
  maxReplies: number;
  repliesLeft: number;
  verifiedName: string;
  verifiedOrg: string | null;
};

const sharedPath = (token: string, rest = "") => `/shared/${seg(token)}${rest}`;

export const getSharedLink = (token: string) =>
  api<ApiSharedLink>(sharedPath(token));

export const requestSharedCode = (token: string) =>
  api<{ sentTo: string; expiresIn: number }>(
    sharedPath(token, "/verification-code"),
    { method: "POST" },
  );

export const verifySharedLink = (
  token: string,
  body: { code: string; name: string; organization?: string },
) =>
  api<{ sessionToken: string; expiresIn: number }>(
    sharedPath(token, "/verify"),
    { method: "POST", body },
  );

export const getSharedContent = (token: string, session: string) =>
  api<ApiSharedContent>(sharedPath(token, "/content"), {
    shareSession: session,
  });

export const getSharedAttachment = (token: string, session: string) =>
  api<{ url: string; expiresIn: number }>(sharedPath(token, "/attachment"), {
    shareSession: session,
  });

export const replyToShare = (token: string, session: string, body: string) =>
  api<ApiShareReply>(sharedPath(token, "/replies"), {
    method: "POST",
    body: { body },
    shareSession: session,
  });

export const requestInfoFromShare = (
  token: string,
  session: string,
  body: { name: string; organization?: string; email: string; phone?: string },
) =>
  api<unknown>(sharedPath(token, "/info-requests"), {
    method: "POST",
    body,
    shareSession: session,
  });
