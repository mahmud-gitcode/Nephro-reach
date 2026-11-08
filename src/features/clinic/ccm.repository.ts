/* ==========================================================================
   Chronic Care Management on the API (Phase 9; ADR 0007 §1)
   --------------------------------------------------------------------------
   One function per server operation under /organizations/{orgId}/ccm. Every
   patient is a `patientId`; an MRN is display text only and never a key.

   The server owns every number and status: the month's minutes, pending
   minutes, the threshold status, open alerts, overdue follow-ups, the
   checklist count, billing blocked. The browser shows them; it no longer
   derives them (the old reducers in ccm.data.ts are gone). The CCM inbox
   is raised hourly by the server from what enrolled patients share; the
   browser never recomputes alerts (D12, INT-18).
   ========================================================================== */

import { api } from "@/lib/api/client";
import { fetchPage, type Page } from "@/lib/api/paging";
import { asOffice, officePath } from "./officeContext";

/* -------------------------------------------------------------- shapes */

export type CcmStatus =
  "Action Needed" | "Below Threshold" | "Ready for Review";

export type RequirementStatus =
  "complete" | "in-progress" | "missing" | "not-applicable";

/** RequirementResponseDto. */
export type CcmRequirement = {
  id: string;
  status: RequirementStatus;
  met: boolean;
  inProgress: boolean;
  notApplicable: boolean;
  date: string | null;
  detail: string;
};

export type KrtAnswer = "Yes" | "No" | "N/A";

/** KidneyCarePlanResponseDto. */
export type CcmKidneyCarePlan = {
  answers: Partial<Record<string, KrtAnswer>>;
  accessType: string | null;
  ehrDocumented: boolean;
  updatedOn: string | null;
  updatedById: string | null;
};

/** EnrollmentMonthResponseDto: a worklist row and the patient detail. */
export type CcmEnrollment = {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  mrn: string | null;
  providerName: string;
  careManagerName: string;
  location: string;
  conditions: string[];
  isOnDialysis: boolean;
  isOnHomeHealthOrHospice: boolean;
  billingBlocked: boolean;
  requirements: CcmRequirement[];
  requirementsMet: number;
  requirementsTotal: number;
  kidneyCarePlan: CcmKidneyCarePlan | null;
  enrolledById: string | null;
  enrolledAt: string;
  updatedAt: string;
  month: string;
  minutes: number;
  pendingMinutes: number;
  remainingMinutes: number;
  status: CcmStatus;
  lastActivityOn: string | null;
  nextFollowUpOn: string | null;
  openAlerts: number;
  overdueFollowUps: number;
};

/** EnrollmentResponseDto: what a write on one enrolment answers (the
 *  record without one month's figures). */
export type CcmEnrollmentRecord = Omit<
  CcmEnrollment,
  | "month"
  | "minutes"
  | "pendingMinutes"
  | "remainingMinutes"
  | "status"
  | "lastActivityOn"
  | "nextFollowUpOn"
  | "openAlerts"
  | "overdueFollowUps"
>;

/** GetEnrollmentSummaryResponseDto. */
export type CcmSummary = {
  month: string;
  enrolled: number;
  billingQueue: number;
  billingDeactivated: number;
  actionNeeded: number;
  belowThreshold: number;
  readyForReview: number;
};

export type StaffRef = {
  id: string;
  name: string | null;
  title: string | null;
};

export type CountsToward = "yes" | "no" | "pending";

/** ActivityResponseDto. */
export type CcmActivityRow = {
  id: string;
  patientId: string;
  type: string;
  activityDate: string;
  minutes: number;
  startTime: string | null;
  endTime: string | null;
  note: string;
  outcome: string;
  countsToward: CountsToward;
  ehrDocumented: boolean;
  staff: StaffRef;
  followUp: {
    date: string;
    task: string;
    done: boolean;
    assignee: StaffRef | null;
  } | null;
  createdAt: string;
  updatedAt: string;
};

/** The 10 kinds the server raises (ccm.constants CCM_INBOX_KINDS). The
 *  seed-only "Hospital discharge" and "Medication change" are not among
 *  them (NEW-4) and are not rendered as kinds of their own. */
export const CCM_INBOX_KINDS = [
  "Patient message",
  "Lab alert",
  "Side effect",
  "Missed doses",
  "Blood pressure",
  "BP symptoms",
  "Weight change",
  "Access appointment",
  "Access concern",
  "Missed appointment",
] as const;
export type CcmInboxKind = (typeof CCM_INBOX_KINDS)[number];

/** InboxItemResponseDto. */
export type CcmInboxItem = {
  id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  mrn: string | null;
  kind: string;
  text: string;
  /** The Activity Type its follow-up is logged under (server-set). */
  activityType: string | null;
  receivedAt: string;
  resolved: boolean;
  resolvedAt: string | null;
  resolvedById: string | null;
};

/** ConditionResponseDto. */
export type CcmConditionRow = {
  id: string;
  entryId: string | null;
  label: string;
  short: string;
  group: string | null;
  secondary: boolean;
  isDefault: boolean;
  active: boolean;
};

export type WorklistQuery = {
  month: string;
  billing?: "queue" | "deactivated";
  status?: CcmStatus;
  provider?: string;
  careManager?: string;
  location?: string;
  condition?: string;
  search?: string;
  sort?: "name" | "nextFollowUp";
  direction?: "asc" | "desc";
  page?: number;
  limit?: number;
};

export type EnrollBody = {
  patientId: string;
  providerName: string;
  careManagerName: string;
  location?: string;
  conditions: string[];
  isOnDialysis?: boolean;
  isOnHomeHealthOrHospice?: boolean;
};

export type EnrollmentPatch = Partial<
  Pick<
    EnrollBody,
    | "providerName"
    | "careManagerName"
    | "location"
    | "conditions"
    | "isOnDialysis"
    | "isOnHomeHealthOrHospice"
  >
>;

/** SetRequirementDto: `met` is always sent (the full state, not a patch). */
export type RequirementBody = {
  met: boolean;
  inProgress?: boolean;
  notApplicable?: boolean;
  date?: string | null;
  detail?: string;
};

export type KidneyCareBody = {
  answers?: Partial<Record<string, KrtAnswer | null>>;
  accessType?: string | null;
  ehrDocumented?: boolean;
};

/** CreateActivityDto. The staff member is the caller (set by the server). */
export type ActivityBody = {
  type: string;
  activityDate: string;
  minutes?: number;
  startTime?: string;
  endTime?: string;
  note?: string;
  outcome: string;
  countsToward?: CountsToward;
  ehrDocumented?: boolean;
  followUp?: { date: string; task: string; assigneeId?: string | null };
};

export type ActivityPatch = {
  ehrDocumented?: boolean;
  followUpDone?: boolean;
};

/* -------------------------------------------------------------- routes */

const ccm = (orgId: string, rest: string) => officePath(orgId, `/ccm${rest}`);
const enrollment = (orgId: string, patientId: string, rest = "") =>
  ccm(orgId, `/enrollments/${encodeURIComponent(patientId)}${rest}`);

export function listWorklist(
  orgId: string,
  q: WorklistQuery,
): Promise<Page<CcmEnrollment>> {
  const { page, limit, ...query } = q;
  return fetchPage<CcmEnrollment>(
    ccm(orgId, "/enrollments"),
    { page: page ?? 1, limit: limit ?? 50 },
    {
      query: {
        ...query,
        search: query.search?.trim() || undefined,
      },
      ...asOffice(orgId),
    },
  );
}

export const getSummary = (orgId: string, month: string) =>
  api<CcmSummary>(ccm(orgId, "/enrollments/summary"), {
    query: { month },
    ...asOffice(orgId),
  });

export const getEnrollment = (
  orgId: string,
  patientId: string,
  month: string,
) =>
  api<CcmEnrollment>(enrollment(orgId, patientId), {
    query: { month },
    ...asOffice(orgId),
  });

export const enroll = (orgId: string, body: EnrollBody) =>
  api<CcmEnrollmentRecord>(ccm(orgId, "/enrollments"), {
    method: "POST",
    body,
    ...asOffice(orgId),
  });

export const updateEnrollment = (
  orgId: string,
  patientId: string,
  patch: EnrollmentPatch,
) =>
  api<CcmEnrollmentRecord>(enrollment(orgId, patientId), {
    method: "PATCH",
    body: patch,
    ...asOffice(orgId),
  });

export const setRequirement = (
  orgId: string,
  patientId: string,
  requirementId: string,
  body: RequirementBody,
) =>
  api<CcmEnrollmentRecord>(
    enrollment(
      orgId,
      patientId,
      `/requirements/${encodeURIComponent(requirementId)}`,
    ),
    { method: "PUT", body, ...asOffice(orgId) },
  );

export const updateKidneyCare = (
  orgId: string,
  patientId: string,
  body: KidneyCareBody,
) =>
  api<CcmEnrollmentRecord>(enrollment(orgId, patientId, "/kidney-care"), {
    method: "PATCH",
    body,
    ...asOffice(orgId),
  });

export const listActivities = (
  orgId: string,
  patientId: string,
  month: string,
) =>
  api<CcmActivityRow[]>(enrollment(orgId, patientId, "/activities"), {
    query: { month },
    ...asOffice(orgId),
  });

export const addActivity = (
  orgId: string,
  patientId: string,
  body: ActivityBody,
) =>
  api<CcmActivityRow>(enrollment(orgId, patientId, "/activities"), {
    method: "POST",
    body,
    ...asOffice(orgId),
  });

export const updateActivity = (
  orgId: string,
  patientId: string,
  activityId: string,
  patch: ActivityPatch,
) =>
  api<CcmActivityRow>(
    enrollment(
      orgId,
      patientId,
      `/activities/${encodeURIComponent(activityId)}`,
    ),
    { method: "PATCH", body: patch, ...asOffice(orgId) },
  );

export function listInbox(
  orgId: string,
  q: {
    status?: "open" | "resolved";
    patientId?: string;
    kind?: CcmInboxKind;
    page?: number;
    limit?: number;
  } = {},
): Promise<Page<CcmInboxItem>> {
  return fetchPage<CcmInboxItem>(
    ccm(orgId, "/inbox"),
    { page: q.page ?? 1, limit: q.limit ?? 25 },
    {
      query: {
        status: q.status ?? "open",
        patientId: q.patientId,
        kind: q.kind,
      },
      ...asOffice(orgId),
    },
  );
}

export const resolveInboxItem = (orgId: string, itemId: string) =>
  api<CcmInboxItem>(
    ccm(orgId, `/inbox/${encodeURIComponent(itemId)}/resolve`),
    { method: "POST", ...asOffice(orgId) },
  );

export const listConditions = (orgId: string) =>
  api<CcmConditionRow[]>(ccm(orgId, "/conditions"), asOffice(orgId));

/** A clinic condition: the server stores its name only (BE-7 open), so
 *  the short name and group typed in the library are not sent. */
export const addCondition = (orgId: string, name: string) =>
  api<CcmConditionRow>(ccm(orgId, "/conditions"), {
    method: "POST",
    body: { name: name.trim() },
    ...asOffice(orgId),
  });

export const setDefaultConditionActive = (
  orgId: string,
  conditionId: string,
  active: boolean,
) =>
  api<CcmConditionRow>(
    ccm(orgId, `/conditions/defaults/${encodeURIComponent(conditionId)}`),
    { method: "PUT", body: { active }, ...asOffice(orgId) },
  );

export const setCustomConditionActive = (
  orgId: string,
  entryId: string,
  active: boolean,
) =>
  api<CcmConditionRow>(
    ccm(orgId, `/conditions/${encodeURIComponent(entryId)}`),
    { method: "PATCH", body: { active }, ...asOffice(orgId) },
  );

export const removeCustomCondition = (orgId: string, entryId: string) =>
  api<unknown>(ccm(orgId, `/conditions/${encodeURIComponent(entryId)}`), {
    method: "DELETE",
    ...asOffice(orgId),
  });

/* -------------------------------------------------- roster (pickers) */

/** A roster row, enough to choose a patient (RosterPatientResponseDto). */
export type RosterPick = {
  patientId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  mrn: string | null;
  status: string;
  sharedAreas: string[];
};

/** The office's ACTIVE roster, one page (pickers in labs and CCM). */
export function listRosterPicks(
  orgId: string,
  q: { search?: string; page?: number; limit?: number } = {},
): Promise<Page<RosterPick>> {
  return fetchPage<RosterPick>(
    officePath(orgId, "/patients"),
    { page: q.page ?? 1, limit: q.limit ?? 150 },
    {
      query: { status: "ACTIVE", search: q.search?.trim() || undefined },
      ...asOffice(orgId),
    },
  );
}

/** A new roster patient (EnrollOrganizationPatientDto), for the CCM form
 *  that adds someone who is not on the roster yet. */
export type NewRosterPatient = {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  mrn?: string | null;
};

export const addRosterPatient = (orgId: string, body: NewRosterPatient) =>
  api<{ patientId?: string; patient?: { id: string } }>(
    officePath(orgId, "/patients"),
    { method: "POST", body, ...asOffice(orgId) },
  );

/** The patient id in the enrollment answer, whichever shape it carries. */
export function enrolledPatientId(
  answer: { patientId?: string; patient?: { id: string } } | null,
): string | null {
  return answer?.patientId ?? answer?.patient?.id ?? null;
}
