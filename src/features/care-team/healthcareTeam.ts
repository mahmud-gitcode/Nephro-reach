/* ==========================================================================
   My Healthcare Team — the people a member shares with
   --------------------------------------------------------------------------
   The client (2026-10-12): a member adds a clinician or caregiver by email,
   NephroReach sends them an invitation, and once they accept they are one
   of the people the member's logs can be sent to. Sharing stays inside the
   network (HIPAA) — no social-media share sheet — so the export pickers
   read their recipients from here rather than from a fixed list.

   The team lives on the API (`/patients/:id/care-team-contacts`, Phase 4).
   Invitations are not emailed yet, and the member can no longer mark
   someone as accepted on their behalf (INT-14; the API refuses it, spec
   040): every contact stays "invited" until a real invitation flow lets the
   person accept for themselves, so the share pickers have no recipients.
   ========================================================================== */

export const TEAM_ROLES = [
  { value: "nurse", en: "Dialysis nurse", es: "Enfermera de diálisis" },
  { value: "nephrologist", en: "Nephrologist", es: "Nefrólogo" },
  { value: "dietitian", en: "Dietitian", es: "Dietista" },
  { value: "social-worker", en: "Social worker", es: "Trabajador social" },
  {
    value: "primary-care",
    en: "Primary care doctor",
    es: "Médico de cabecera",
  },
  { value: "caregiver", en: "Caregiver", es: "Cuidador" },
  { value: "other", en: "Other", es: "Otro" },
] as const;
export type TeamRole = (typeof TEAM_ROLES)[number]["value"];

export type TeamMember = {
  id: string;
  email: string;
  name: string;
  role: TeamRole;
  status: "invited" | "accepted";
  invitedAt: string;
};

export function roleLabel(role: TeamRole, isEs: boolean): string {
  const found = TEAM_ROLES.find((r) => r.value === role);
  return found ? (isEs ? found.es : found.en) : role;
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export type TeamDraft = { email: string; name: string; role: TeamRole };

export type TeamError = "email" | "duplicate";

export function teamError(
  list: TeamMember[],
  draft: TeamDraft,
): TeamError | null {
  const email = draft.email.trim().toLowerCase();
  if (!isEmail(email)) return "email";
  if (list.some((m) => m.email === email)) return "duplicate";
  return null;
}

/** `GET /patients/:id/care-team-contacts` row. */
export type ApiTeamMember = {
  id: string;
  patientId: string;
  name: string;
  email: string;
  role: string;
  status: string;
  invitedAt: string;
};

export function fromApiTeamMember(row: ApiTeamMember): TeamMember {
  const role = TEAM_ROLES.some((r) => r.value === row.role)
    ? (row.role as TeamRole)
    : "other";
  return {
    id: row.id,
    email: row.email,
    name: row.name ?? "",
    role,
    status: row.status === "accepted" ? "accepted" : "invited",
    invitedAt: row.invitedAt,
  };
}

/** `POST /patients/:id/care-team-contacts`: trimmed, email lower-case,
 *  no empty name. */
export function toInviteBody(draft: TeamDraft): {
  email: string;
  name?: string;
  role: TeamRole;
} {
  const name = draft.name.trim();
  return {
    email: draft.email.trim().toLowerCase(),
    ...(name ? { name } : {}),
    role: draft.role,
  };
}

/** Who a log can be sent to: only people who accepted the invitation. */
export function recipients(list: TeamMember[]): TeamMember[] {
  return list.filter((m) => m.status === "accepted");
}

/** How a recipient reads in a picker: "Nurse Wilson · Dialysis nurse". */
export function recipientLabel(member: TeamMember, isEs: boolean): string {
  const who = member.name || member.email;
  return `${who} · ${roleLabel(member.role, isEs)}`;
}
