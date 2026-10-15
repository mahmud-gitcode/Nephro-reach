/* ==========================================================================
   Caregivers — the rules
   --------------------------------------------------------------------------
   A caregiver is one person a patient invites. They sign in with their own
   account and can then do everything the patient can in NephroReach — for
   that patient — except invite other caregivers (decision, 2026-10-14;
   replaces the first, view-only version). One caregiver can look after
   several patients and switches between them.

   Pure functions: state in, state out.
   ========================================================================== */

export const RELATIONSHIPS = [
  "Spouse / partner",
  "Son",
  "Daughter",
  "Parent",
  "Grandchild",
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

/** The patient's caregivers, removed ones left out. */
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
