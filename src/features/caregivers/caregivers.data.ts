/* ==========================================================================
   Caregivers — the rules
   --------------------------------------------------------------------------
   The client's spec (2026-09-13, confirmed 2026-10-13): a caregiver is not
   an organization. They are one person the patient invites, they sign in
   with their own account so everything they do is theirs, and the patient
   — never a clinic — decides what they may see. The private journal is off
   unless the patient turns it on. Billing and account settings are never
   shared.

   First version: the caregiver can see; acting for the patient comes next.
   Pure functions: state in, state out.
   ========================================================================== */

export type CaregiverPermission =
  | "schedule"
  | "medications"
  | "appointments"
  | "labs"
  | "education"
  | "journal";

export const CAREGIVER_PERMISSIONS: {
  id: CaregiverPermission;
  label: string;
  description: string;
}[] = [
  {
    id: "schedule",
    label: "Dialysis schedule",
    description: "Treatment days and chair times.",
  },
  {
    id: "medications",
    label: "Medications",
    description: "The medication list, doses and how often.",
  },
  {
    id: "appointments",
    label: "Appointments",
    description: "Upcoming and past appointments.",
  },
  {
    id: "labs",
    label: "Lab results",
    description: "Results the care team uploads.",
  },
  {
    id: "education",
    label: "Education",
    description: "Progress in the 21-Day course.",
  },
  {
    id: "journal",
    label: "Private journal",
    description: "Notes written during the course. Off unless you share it.",
  },
];

/** What a new invite starts with: everything but the journal. */
export const DEFAULT_PERMISSIONS: CaregiverPermission[] = [
  "schedule",
  "medications",
  "appointments",
  "labs",
  "education",
];

export const RELATIONSHIPS = [
  "Spouse / partner",
  "Son",
  "Daughter",
  "Parent",
  "Sibling",
  "Friend",
  "Professional caregiver",
  "Other",
] as const;

export type GrantStatus = "pending" | "active" | "removed";

export type CaregiverActivity = {
  /** ISO 8601 */
  at: string;
  action: string;
};

export type CaregiverGrant = {
  id: string;
  patientEmail: string;
  patientName: string;
  caregiverEmail: string;
  caregiverName: string;
  relationship: string;
  status: GrantStatus;
  permissions: CaregiverPermission[];
  invitedAt: string;
  acceptedAt?: string;
  removedAt?: string;
  /** Newest first, kept short. With a server this is the audit log. */
  activity: CaregiverActivity[];
};

export type CaregiverState = { grants: CaregiverGrant[] };

export type InviteDraft = {
  caregiverName: string;
  caregiverEmail: string;
  relationship: string;
  permissions: CaregiverPermission[];
};

const ACTIVITY_LIMIT = 50;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normEmail = (email: string) => email.trim().toLowerCase();

export type InviteError = "name" | "email" | "self" | "duplicate";

export function inviteError(
  state: CaregiverState,
  patientEmail: string,
  draft: InviteDraft,
): InviteError | null {
  if (!draft.caregiverName.trim()) return "name";
  const email = normEmail(draft.caregiverEmail);
  if (!EMAIL.test(email)) return "email";
  if (email === normEmail(patientEmail)) return "self";
  const taken = state.grants.some(
    (g) =>
      g.status !== "removed" &&
      normEmail(g.patientEmail) === normEmail(patientEmail) &&
      normEmail(g.caregiverEmail) === email,
  );
  return taken ? "duplicate" : null;
}

function withActivity(grant: CaregiverGrant, action: string, at: string) {
  return {
    ...grant,
    activity: [{ at, action }, ...grant.activity].slice(0, ACTIVITY_LIMIT),
  };
}

function change(
  state: CaregiverState,
  id: string,
  apply: (grant: CaregiverGrant) => CaregiverGrant,
): CaregiverState {
  return {
    grants: state.grants.map((g) => (g.id === id ? apply(g) : g)),
  };
}

export function invite(
  state: CaregiverState,
  patient: { email: string; name: string },
  draft: InviteDraft,
  now: number,
): { state: CaregiverState; grant: CaregiverGrant } {
  const at = new Date(now).toISOString();
  const grant: CaregiverGrant = {
    id: `cg-${now.toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    patientEmail: normEmail(patient.email),
    patientName: patient.name,
    caregiverEmail: normEmail(draft.caregiverEmail),
    caregiverName: draft.caregiverName.trim(),
    relationship: draft.relationship,
    status: "pending",
    permissions: [...draft.permissions],
    invitedAt: at,
    activity: [{ at, action: "Invited" }],
  };
  return { state: { grants: [...state.grants, grant] }, grant };
}

export function accept(
  state: CaregiverState,
  id: string,
  now: number,
): CaregiverState {
  const at = new Date(now).toISOString();
  return change(state, id, (g) =>
    g.status === "pending"
      ? withActivity({ ...g, status: "active", acceptedAt: at }, "Accepted", at)
      : g,
  );
}

/** A declined invite and a removed caregiver end the same way. */
export function remove(
  state: CaregiverState,
  id: string,
  now: number,
  action = "Removed",
): CaregiverState {
  const at = new Date(now).toISOString();
  return change(state, id, (g) =>
    withActivity({ ...g, status: "removed", removedAt: at }, action, at),
  );
}

export function setPermission(
  state: CaregiverState,
  id: string,
  permission: CaregiverPermission,
  on: boolean,
  now: number,
): CaregiverState {
  const at = new Date(now).toISOString();
  const label =
    CAREGIVER_PERMISSIONS.find((p) => p.id === permission)?.label ?? permission;
  return change(state, id, (g) => {
    const has = g.permissions.includes(permission);
    if (has === on) return g;
    const permissions = on
      ? [...g.permissions, permission]
      : g.permissions.filter((p) => p !== permission);
    return withActivity(
      { ...g, permissions },
      `${label} ${on ? "shared" : "turned off"}`,
      at,
    );
  });
}

export function logActivity(
  state: CaregiverState,
  id: string,
  action: string,
  now: number,
): CaregiverState {
  return change(state, id, (g) =>
    withActivity(g, action, new Date(now).toISOString()),
  );
}

/** The patient's caregivers, current ones first. */
export function grantsForPatient(
  state: CaregiverState,
  patientEmail: string,
): CaregiverGrant[] {
  const email = normEmail(patientEmail);
  return state.grants.filter(
    (g) => normEmail(g.patientEmail) === email && g.status !== "removed",
  );
}

/** The patients a caregiver looks after, and invites still waiting. */
export function grantsForCaregiver(
  state: CaregiverState,
  caregiverEmail: string,
): CaregiverGrant[] {
  const email = normEmail(caregiverEmail);
  return state.grants.filter(
    (g) => normEmail(g.caregiverEmail) === email && g.status !== "removed",
  );
}

export function activeGrant(
  state: CaregiverState,
  caregiverEmail: string,
  patientEmail: string | null,
): CaregiverGrant | undefined {
  if (!patientEmail) return undefined;
  return grantsForCaregiver(state, caregiverEmail).find(
    (g) =>
      g.status === "active" &&
      normEmail(g.patientEmail) === normEmail(patientEmail),
  );
}

export const can = (
  grant: CaregiverGrant | undefined,
  permission: CaregiverPermission,
) =>
  !!grant &&
  grant.status === "active" &&
  grant.permissions.includes(permission);
