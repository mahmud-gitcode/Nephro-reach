import { readJson, storageKey, writeJson } from "@/lib/data/storage";

/* ==========================================================================
   My Healthcare Team — the people a member shares with
   --------------------------------------------------------------------------
   The client (2026-10-12): a member adds a clinician or caregiver by email,
   NephroReach sends them an invitation, and once they accept they are one
   of the people the member's logs can be sent to. Sharing stays inside the
   network (HIPAA) — no social-media share sheet — so the export pickers
   read their recipients from here rather than from a fixed list.

   In this frontend phase the invitation is not emailed; the member can
   mark it accepted to see how the list behaves once the backend sends it.
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

export function invite(
  list: TeamMember[],
  draft: TeamDraft,
  now: number,
): TeamMember[] {
  return [
    ...list,
    {
      id: `team-${now}`,
      email: draft.email.trim().toLowerCase(),
      name: draft.name.trim(),
      role: draft.role,
      status: "invited",
      invitedAt: new Date(now).toISOString(),
    },
  ];
}

export function accept(list: TeamMember[], id: string): TeamMember[] {
  return list.map((m) => (m.id === id ? { ...m, status: "accepted" } : m));
}

export function removeMember(list: TeamMember[], id: string): TeamMember[] {
  return list.filter((m) => m.id !== id);
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

const KEY = storageKey("healthcare-team");

export async function readTeam(): Promise<TeamMember[]> {
  const stored = await readJson<TeamMember[] | null>(KEY, null);
  return Array.isArray(stored) ? stored : [];
}

export async function writeTeam(list: TeamMember[]): Promise<TeamMember[]> {
  return writeJson(KEY, list);
}
