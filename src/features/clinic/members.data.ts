import type { SeriesTone } from "@/components/ui";
import { statusTone, type MemberStatus } from "./clinicDashboard.data";
import { CRASH, JOURNEY, type Patient } from "./enrollment.data";
import { preciseActivity, relativeActivity } from "./enrollment.mapping";

/* ==========================================================================
   Member page — rows from the office roster (Phase 8)
   --------------------------------------------------------------------------
   The same patients as Enroll Patients (the API roster joined with its
   program enrollments). What this page adds per member is derived only
   where there is a source (NEW-2):
   - progress and last activity: the program enrollment's progress;
   - "Not Started": the course progress says so (or there is none yet);
   - "Need Follow-Up": the client's own rule, inactive FOLLOW_UP_AFTER_DAYS
     (client, 2026-10-18);
   - "Completed": the course progress says so;
   - otherwise "On Track".
   "Attention Needed", live classes, check-ins and questions have no source
   yet (BE-3 waits for decision NEW-2): they show "—", never a made-up 0.
   The typed demo table keyed by MRN is deleted.
   ========================================================================== */

/** The statuses this page uses — the dashboard's, minus Completed. */
export const MEMBER_STATUSES = [
  "On Track",
  "Need Follow-Up",
  "Attention Needed",
  "Not Started",
] as const satisfies readonly MemberStatus[];

export type RosterStatus = (typeof MEMBER_STATUSES)[number];

export { statusTone };

type Tracking = {
  /** null: no program, so nothing to say ("—"). */
  status: MemberStatus | null;
  progress: number;
  /** Short, for the table. */
  lastActivity: string;
  /** Precise, for the details panel. */
  lastSeen: string;
  /** No source yet (NEW-2): null shows "—". */
  liveClasses: [attended: number, of: number] | null;
  checkIns: [done: number, of: number] | null;
  questions: { total: number; open: number } | null;
};

export type RosterMember = Pick<
  Patient,
  "id" | "name" | "mrn" | "program" | "enrolledOn"
> &
  Tracking & {
    /** "3 of 21 classes" from the course progress, "—" without one. */
    currentModule: string;
  };

/** Days without activity before a member needs a follow-up (client,
    2026-10-18: "if they've been inactive for 3 days, follow up"). */
export const FOLLOW_UP_AFTER_DAYS = 3;

/** Whole days since "Today", "1 day ago", "6 days ago", "1 week ago";
    null for a member with no activity yet. */
export function daysInactive(lastActivity: string): number | null {
  const text = lastActivity.trim().toLowerCase();
  if (text === "today") return 0;
  const match = /^(\d+)\s+(day|week)s?\s+ago$/.exec(text);
  if (!match) return null;
  return Number(match[1]) * (match[2] === "week" ? 7 : 1);
}

/** The status from the server's facts and the client's follow-up rule. */
export function memberStatusFor(
  patient: Pick<Patient, "programSlug" | "progressStatus" | "lastActivityAt">,
  now = new Date(),
): MemberStatus | null {
  if (!patient.programSlug) return null;
  if (patient.progressStatus === "completed") return "Completed";
  if (!patient.progressStatus || patient.progressStatus === "not-started")
    return "Not Started";
  const days = daysInactive(relativeActivity(patient.lastActivityAt, now));
  return days !== null && days >= FOLLOW_UP_AFTER_DAYS
    ? "Need Follow-Up"
    : "On Track";
}

/** A roster row for an enrolled patient. */
export function rosterMemberFor(
  patient: Patient,
  now = new Date(),
): RosterMember {
  return {
    id: patient.id,
    name: patient.name,
    mrn: patient.mrn,
    program: patient.program,
    enrolledOn: patient.enrolledOn,
    status: memberStatusFor(patient, now),
    progress: patient.progress,
    lastActivity: relativeActivity(patient.lastActivityAt, now),
    lastSeen: preciseActivity(patient.lastActivityAt),
    liveClasses: null,
    checkIns: null,
    questions: null,
    currentModule:
      patient.classesTotal !== null && patient.classesCompleted !== null
        ? `${patient.classesCompleted} of ${patient.classesTotal} classes`
        : "—",
  };
}

/* ----------------------------------------------------------------- counts */

export function countStatus(list: RosterMember[], status: MemberStatus) {
  return list.filter((member) => member.status === status).length;
}

/** Whole percent of the roster, e.g. 18 of 23 is 78. */
export function shareOf(count: number, total: number) {
  return total === 0 ? 0 : Math.round((count / total) * 100);
}

/* Programs are identities, so they take the categorical ramp — the same
   order and tones as Curriculum Progress uses for its programs. */
export type ProgramSlice = { label: string; value: number; tone: SeriesTone };

/** Members per program, for whatever list is on screen. "Other" is
    anything not on the two contracted programs. */
export function programBreakdownOf(list: RosterMember[]): ProgramSlice[] {
  return [
    {
      label: JOURNEY,
      value: list.filter((m) => m.program === JOURNEY).length,
      tone: "cat-6",
    },
    {
      label: CRASH,
      value: list.filter((m) => m.program === CRASH).length,
      tone: "cat-4",
    },
    {
      label: "Other",
      value: list.filter((m) => m.program !== JOURNEY && m.program !== CRASH)
        .length,
      tone: "neutral",
    },
  ];
}

/* ---------------------------------------------------------------- filters */

export const ALL_PROGRAMS = "All Programs";
export const ALL_STATUSES = "All Statuses";
export const programOptions = [ALL_PROGRAMS, JOURNEY, CRASH];
export const statusOptions = [ALL_STATUSES, ...MEMBER_STATUSES];

/** Name or MRN. The client's placeholder also says email, but no member
    has an email on record yet, so searching one could never match. */
export function filterRoster(
  list: RosterMember[],
  filters: { query?: string; program?: string; status?: string },
) {
  const q = (filters.query ?? "").trim().toLowerCase();
  const program = filters.program ?? ALL_PROGRAMS;
  const status = filters.status ?? ALL_STATUSES;
  return list.filter((member) => {
    if (program !== ALL_PROGRAMS && member.program !== program) return false;
    if (status !== ALL_STATUSES && member.status !== status) return false;
    if (!q) return true;
    return (
      member.name.toLowerCase().includes(q) ||
      member.mrn.toLowerCase().includes(q)
    );
  });
}

/* ---------------------------------------------------------- activity feed */

export type ActivityKind = "completed" | "missed" | "attended" | "question";

/** Recent activity has no source yet (NEW-2): the feed is empty, never the
    demo one. */
export type ActivityEvent = {
  /** The patient it is about. */
  patientId: string;
  name: string;
  kind: ActivityKind;
  text: string;
  when: string;
};

export const recentActivity: ActivityEvent[] = [];

/* ------------------------------------------------------- needs attention */

export type AttentionItem = {
  member: RosterMember;
  /** Why they are on the list, most urgent first. */
  reasons: string[];
  /** Lower sorts first. */
  rank: number;
};

const ATTENTION_RANK: Partial<Record<MemberStatus, number>> = {
  "Attention Needed": 0,
  "Need Follow-Up": 2,
  "Not Started": 3,
};

/**
 * Who the clinic should look at today: anyone whose status asks for it,
 * and anyone who missed a check-in in the recent activity. One entry per
 * person — James K. Wilson is both Attention Needed and a missed check-in,
 * and should appear once with both reasons, not twice.
 */
export function needsAttention(
  list: RosterMember[],
  activity: readonly ActivityEvent[],
): AttentionItem[] {
  const byId = new Map<string, AttentionItem>();
  const entry = (member: RosterMember, rank: number) => {
    const existing = byId.get(member.id);
    if (existing) {
      existing.rank = Math.min(existing.rank, rank);
      return existing;
    }
    const created: AttentionItem = { member, reasons: [], rank };
    byId.set(member.id, created);
    return created;
  };

  for (const member of list) {
    const rank = member.status ? ATTENTION_RANK[member.status] : undefined;
    if (rank === undefined) continue;
    const reason =
      member.status === "Not Started"
        ? "Has not started the program"
        : `${member.status} · last active ${member.lastActivity.toLowerCase()}`;
    entry(member, rank).reasons.push(reason);
  }

  for (const event of activity) {
    if (event.kind !== "missed") continue;
    const member = list.find((m) => m.id === event.patientId);
    if (!member) continue;
    entry(member, 1).reasons.unshift(`Missed check-in · ${event.when}`);
  }

  return [...byId.values()].sort(
    (a, b) => a.rank - b.rank || a.member.name.localeCompare(b.member.name),
  );
}
