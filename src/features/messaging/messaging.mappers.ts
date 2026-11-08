/* ==========================================================================
   Messaging: from the API's shapes to the screen's (Phase 11)
   --------------------------------------------------------------------------
   Pure. The member's thread is named after the OFFICE it is with (the
   server's organizationName); the office's row after the patient (first
   and last name, MRN for display only). No name is ever used to find a
   thread: every call goes by the server's ids.
   ========================================================================== */

import type {
  ApiCareRelationship,
  ApiMemberConversation,
  ApiMessage,
  ApiOfficeConversation,
  ApiRosterPatient,
} from "./messaging.api";
import type {
  CareTeamContact,
  Conversation,
  Message,
  MessageCategory,
} from "./messaging.types";

export function sizeLabel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ORGANIZATION_ROLE: Record<string, { en: string; es: string }> = {
  DIALYSIS_CENTER: {
    en: "Your Dialysis Care Team",
    es: "Tu equipo de diálisis",
  },
  NEPHROLOGY_OFFICE: {
    en: "Your Nephrology Office",
    es: "Tu consultorio de nefrología",
  },
  HOSPITAL: {
    en: "Your Hospital Education Team",
    es: "Tu equipo de educación del hospital",
  },
  ACCESS_CENTER: {
    en: "Your Vascular Access Center",
    es: "Tu centro de acceso vascular",
  },
};

/** The line under an office's name in the member inbox. */
export function organizationRole(type: string, isEs = false): string {
  const role = ORGANIZATION_ROLE[type];
  if (role) return isEs ? role.es : role.en;
  return isEs ? "Tu equipo de atención" : "Your Care Team";
}

export function officeContact(
  organizationName: string,
  organizationType: string,
  isEs = false,
): CareTeamContact {
  return {
    name: organizationName,
    role: organizationRole(organizationType, isEs),
    kind: "facility",
  };
}

const asCategory = (value: string): MessageCategory =>
  value === "appointments" ? "appointments" : "care-team";

export function fromApiMessage(message: ApiMessage): Message {
  return {
    id: message.id,
    author: message.side === "MEMBER" ? "member" : "clinic",
    body: message.body,
    sentAt: message.sentAt,
    automated: message.automated,
    byCaregiver: message.authorKind === "CAREGIVER",
    ...(message.attachment
      ? {
          attachment: {
            id: message.attachment.id,
            name: message.attachment.name ?? "Attachment",
            sizeLabel:
              message.attachment.size === null
                ? ""
                : sizeLabel(message.attachment.size),
            contentType: message.attachment.contentType,
          },
        }
      : {}),
  };
}

/** A thread as the patient's side sees it. */
export function fromMemberConversation(
  row: ApiMemberConversation,
  isEs = false,
): Conversation {
  return {
    id: row.id,
    memberName: "",
    contact: officeContact(row.organizationName, row.organizationType, isEs),
    category: asCategory(row.category),
    unread: row.unread,
    flagged: false,
    archived: row.archived,
    messages: [],
    last: row.lastMessage ? fromApiMessage(row.lastMessage) : null,
    patientId: row.patientId,
    organizationId: row.organizationId,
    subject: row.subject,
  };
}

/** A row of the office inbox, with the office's own state. */
export function fromOfficeConversation(
  row: ApiOfficeConversation,
  office: CareTeamContact,
): Conversation {
  return {
    id: row.id,
    memberName: `${row.firstName} ${row.lastName}`.trim(),
    contact: office,
    category: asCategory(row.category),
    unread: row.unread,
    flagged: row.flagged,
    archived: row.archived,
    patient: row.mrn ? { mrn: row.mrn } : {},
    messages: [],
    last: row.lastMessage ? fromApiMessage(row.lastMessage) : null,
    patientId: row.patientId,
    subject: row.subject,
  };
}

/** The offices a member may write to: ACTIVE care relationships only. */
export function messageableOffices(
  relationships: ApiCareRelationship[],
  isEs = false,
): Array<CareTeamContact & { organizationId: string }> {
  const seen = new Set<string>();
  return relationships
    .filter((r) => r.status === "ACTIVE")
    .filter((r) => {
      if (seen.has(r.organizationId)) return false;
      seen.add(r.organizationId);
      return true;
    })
    .map((r) => ({
      organizationId: r.organizationId,
      ...officeContact(r.organizationName, r.organizationType, isEs),
    }));
}

export type RosterRecipient = {
  patientId: string;
  name: string;
  mrn: string | null;
};

/** The patients an office may write to: its roster, by patient id. */
export function rosterRecipients(rows: ApiRosterPatient[]): RosterRecipient[] {
  return rows
    .filter((r) => r.status === "ACTIVE")
    .map((r) => ({
      patientId: r.patientId,
      name: `${r.firstName} ${r.lastName}`.trim(),
      mrn: r.mrn,
    }));
}
