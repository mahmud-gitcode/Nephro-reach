import type { SeriesTone } from "@/components/ui";
import { statusTone, type MemberStatus } from "./clinicDashboard.data";
import { members as curriculum, stepLabel } from "./curriculumProgress.data";
import {
  CONTRACT_SLOTS,
  CRASH,
  JOURNEY,
  patients,
  type Patient,
} from "./enrollment.data";

/* ==========================================================================
   Member page — demo data
   --------------------------------------------------------------------------
   The same twenty-three people as Enroll Patients. Name, MRN, program and
   enrollment date are read from that roster, never retyped, so the pages
   cannot drift. What this page adds per member — status, progress, last
   activity, and the counts in the details panel — is below, keyed by MRN.

   The client specified eight rows and one details panel (Angela T. Brown).
   The other fifteen are filler, written so the summary lands on the
   client's figures: 18 On Track, 3 Need Follow-Up, 2 Attention Needed,
   0 Not Started. The cards are counted from the roster, not typed, and
   `members.data.test.ts` checks they still land there.

   Where this spec disagrees with an earlier one, this page shows its own
   figures. Progress in particular was specified separately for Enroll
   Patients, Curriculum Progress and here, and the three do not agree
   (Angela: 40%, 57%, 85%).
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
  status: RosterStatus;
  progress: number;
  /** Short, for the table. */
  lastActivity: string;
  /** Precise, for the details panel. */
  lastSeen: string;
  liveClasses: [attended: number, of: number];
  checkIns: [done: number, of: number];
  questions: { total: number; open: number };
};

const t = (
  status: RosterStatus,
  progress: number,
  lastActivity: string,
  lastSeen: string,
  liveClasses: [number, number],
  checkIns: [number, number],
  questions: [total: number, open: number],
): Tracking => ({
  status,
  progress,
  lastActivity,
  lastSeen,
  liveClasses,
  checkIns,
  questions: { total: questions[0], open: questions[1] },
});

/* By MRN. The first eight are the client's; the rest are filler. */
// One member per line, so the block reads as a table.
// prettier-ignore
const tracking: Record<string, Tracking> = {
  "123456": t("On Track", 75, "Today", "Today at 8:02 AM", [3, 3], [3, 3], [0, 0]),
  "789012": t("On Track", 60, "2 days ago", "Sep 19 at 6:10 PM", [2, 3], [2, 3], [1, 0]),
  "345678": t("Need Follow-Up", 40, "4 days ago", "Sep 17 at 11:25 AM", [1, 3], [1, 3], [0, 0]),
  "901234": t("On Track", 85, "Today", "Today at 9:14 AM", [2, 3], [3, 3], [1, 0]),
  "567890": t("Attention Needed", 20, "5 days ago", "Sep 16 at 2:40 PM", [0, 3], [0, 3], [0, 0]),
  "234567": t("On Track", 100, "Today", "Today at 7:48 AM", [3, 3], [3, 3], [2, 0]),
  "890123": t("Need Follow-Up", 55, "3 days ago", "Sep 18 at 4:05 PM", [1, 3], [2, 3], [1, 1]),
  "456789": t("On Track", 30, "1 day ago", "Yesterday at 5:30 PM", [2, 3], [3, 3], [0, 0]),

  "112233": t("On Track", 82, "Today", "Today at 10:20 AM", [3, 3], [3, 3], [1, 0]),
  "223344": t("On Track", 68, "1 day ago", "Yesterday at 3:15 PM", [2, 3], [3, 3], [0, 0]),
  "334455": t("On Track", 45, "2 days ago", "Sep 19 at 1:00 PM", [2, 3], [2, 3], [0, 0]),
  "445566": t("On Track", 51, "Today", "Today at 8:45 AM", [3, 3], [3, 3], [0, 0]),
  "556677": t("Need Follow-Up", 33, "6 days ago", "Sep 15 at 9:30 AM", [1, 3], [1, 3], [0, 0]),
  "667788": t("On Track", 90, "1 day ago", "Yesterday at 7:10 PM", [3, 3], [3, 3], [1, 0]),
  "778899": t("Attention Needed", 27, "1 week ago", "Sep 14 at 12:00 PM", [0, 3], [1, 3], [0, 0]),
  "889900": t("On Track", 62, "2 days ago", "Sep 19 at 10:45 AM", [2, 3], [3, 3], [0, 0]),
  "990011": t("On Track", 74, "Today", "Today at 6:55 AM", [3, 3], [3, 3], [1, 0]),
  "101112": t("On Track", 19, "3 days ago", "Sep 18 at 2:20 PM", [1, 3], [2, 3], [0, 0]),
  "121314": t("On Track", 58, "1 day ago", "Yesterday at 11:40 AM", [2, 3], [3, 3], [0, 0]),
  "131415": t("On Track", 41, "2 days ago", "Sep 19 at 4:30 PM", [2, 3], [2, 3], [0, 0]),
  "141516": t("On Track", 12, "Today", "Today at 9:02 AM", [1, 1], [1, 1], [0, 0]),
  "151617": t("On Track", 10, "1 day ago", "Yesterday at 1:15 PM", [1, 1], [1, 1], [0, 0]),
  "161718": t("On Track", 8, "2 days ago", "Sep 19 at 8:20 AM", [0, 1], [1, 1], [0, 0]),
};

export type RosterMember = Pick<
  Patient,
  "name" | "mrn" | "program" | "enrolledOn"
> &
  Tracking & {
    /** "Day 12 of 21 · Medications in Dialysis", from Curriculum Progress. */
    currentModule: string;
  };

function currentModuleFor(mrn: string): string {
  const row = curriculum.find((member) => member.mrn === mrn);
  return row ? `${stepLabel(row)} · ${row.module}` : "Not started";
}

/** A patient enrolled today has done nothing yet — which is a fact to
    show, not a gap to fill with invented activity. */
const justEnrolled: Tracking = {
  status: "Not Started",
  progress: 0,
  lastActivity: "No activity yet",
  lastSeen: "No activity yet",
  liveClasses: [0, 0],
  checkIns: [0, 0],
  questions: { total: 0, open: 0 },
};

/** A roster row for any enrolled patient, including one added in the
    browser since the demo data was written. */
export function rosterMemberFor(patient: Patient): RosterMember {
  return {
    name: patient.name,
    mrn: patient.mrn,
    program: patient.program,
    enrolledOn: patient.enrolledOn,
    currentModule: currentModuleFor(patient.mrn),
    ...(tracking[patient.mrn] ?? justEnrolled),
  };
}

export const roster: RosterMember[] = patients.map(rosterMemberFor);

/* ----------------------------------------------------------------- counts */

export function countStatus(list: RosterMember[], status: RosterStatus) {
  return list.filter((member) => member.status === status).length;
}

/** Whole percent of the roster, e.g. 18 of 23 is 78. */
export function shareOf(count: number, total = roster.length) {
  return total === 0 ? 0 : Math.round((count / total) * 100);
}

export const allowed = CONTRACT_SLOTS;
export const availableSlots = CONTRACT_SLOTS - roster.length;

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

export const programBreakdown = programBreakdownOf(roster);

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
    return member.name.toLowerCase().includes(q) || member.mrn.includes(q);
  });
}

/* ---------------------------------------------------------- activity feed */

export type ActivityKind = "completed" | "missed" | "attended" | "question";

export const recentActivity: {
  name: string;
  kind: ActivityKind;
  text: string;
  when: string;
}[] = [
  {
    name: "Angela T. Brown",
    kind: "completed",
    text: "completed Day 12",
    when: "Today, 9:14 AM",
  },
  {
    name: "James K. Wilson",
    kind: "missed",
    text: "missed check-in",
    when: "Yesterday, 4:32 PM",
  },
  {
    name: "Mary S. Johnson",
    kind: "attended",
    text: "attended live class",
    when: "Yesterday, 6:10 PM",
  },
  {
    name: "David R. Carter",
    kind: "question",
    text: "submitted a question",
    when: "2 days ago",
  },
  {
    name: "Lisa W. Thomas",
    kind: "completed",
    text: "completed Day 5",
    when: "2 days ago",
  },
];

/* ------------------------------------------------------- needs attention */

export type AttentionItem = {
  member: RosterMember;
  /** Why they are on the list, most urgent first. */
  reasons: string[];
  /** Lower sorts first. */
  rank: number;
};

const ATTENTION_RANK: Partial<Record<RosterStatus, number>> = {
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
  activity: typeof recentActivity,
): AttentionItem[] {
  const byMrn = new Map<string, AttentionItem>();
  const entry = (member: RosterMember, rank: number) => {
    const existing = byMrn.get(member.mrn);
    if (existing) {
      existing.rank = Math.min(existing.rank, rank);
      return existing;
    }
    const created: AttentionItem = { member, reasons: [], rank };
    byMrn.set(member.mrn, created);
    return created;
  };

  for (const member of list) {
    const rank = ATTENTION_RANK[member.status];
    if (rank === undefined) continue;
    const reason =
      member.status === "Not Started"
        ? "Has not started the program"
        : `${member.status} · last active ${member.lastActivity.toLowerCase()}`;
    entry(member, rank).reasons.push(reason);
  }

  for (const event of activity) {
    if (event.kind !== "missed") continue;
    const member = list.find((m) => m.name === event.name);
    if (!member) continue;
    entry(member, 1).reasons.unshift(`Missed check-in · ${event.when}`);
  }

  return [...byMrn.values()].sort(
    (a, b) => a.rank - b.rank || a.member.name.localeCompare(b.member.name),
  );
}
