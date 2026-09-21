import type { BadgeTone, SeriesTone } from "@/components/ui";
import { patients, type Patient } from "./enrollment.data";

/* ==========================================================================
   Member curriculum progress — demo data
   --------------------------------------------------------------------------
   The same twenty-three people as Enroll Patients: the client's eight named
   members, then the fifteen filler patients from that roster, with their
   MRNs looked up from it rather than retyped. One clinic, one roster —
   searching an MRN here finds the same person it finds there.

   Two kinds of figure live in this file and they do not agree:

   - The roster below is what the table, its filters and its pagination
     count. Progress is derived from the day, never typed: the client's
     own rows follow day ÷ length exactly (Day 14 of 21 is 67%, Day 1 of
     21 is 5%), so a typed number could only drift from it.
   - The summary cards and side panels are the client's figures, verbatim.
     They do not reconcile with each other or with a 23-row roster — the
     status panel alone adds up to 33 against a heading of 23. They are
     shown as given until the client says which numbers are right;
     `curriculumProgress.data.test.ts` pins them so nobody "fixes" one quietly.
   ========================================================================== */

export const JOURNEY = "Journey to Dialysis";
export const CRASH = "Crash Dialysis";
export const LIBRARY = "Education Library";

export type Program = typeof JOURNEY | typeof CRASH | typeof LIBRARY;

export type ProgressStatus =
  "In Progress" | "Completed" | "Needs Follow-Up" | "Not Started";

export const statusTone: Record<ProgressStatus, BadgeTone> = {
  "In Progress": "info",
  Completed: "success",
  "Needs Follow-Up": "warning",
  "Not Started": "neutral",
};

/** Length in days for the two courses, in modules for the library. */
const LENGTH: Record<Program, number> = {
  [JOURNEY]: 21,
  [CRASH]: 5,
  [LIBRARY]: 8,
};

/* Module titles by position. The client named eleven of them across the
   eight rows; the rest are written to fill the gaps. */
const MODULES: Record<Program, Record<number, string>> = {
  [JOURNEY]: {
    1: "Life on Dialysis",
    3: "Understanding Kidney Failure",
    5: "Choosing a Treatment",
    8: "Transplant Options",
    10: "Coping and Support",
    12: "Medications in Dialysis",
    14: "Diet and Fluid Management",
    17: "Working with Your Care Team",
    19: "Travel and Dialysis",
    21: "Access Options",
  },
  [CRASH]: {
    1: "Your First Treatment",
    2: "Understanding Your Access",
    3: "Treatment Day Prep",
    4: "Diet and Fluid Basics",
    5: "What to Expect",
  },
  [LIBRARY]: {
    4: "Lab Results Explained",
  },
};

export type MemberProgress = {
  name: string;
  mrn: string;
  program: Program;
  module: string;
  /** Position in the program: a day for the courses, a module for the library. */
  step: number;
  length: number;
  progress: number;
  status: ProgressStatus;
  lastActivity: string;
};

type Row = [
  name: string,
  program: Program,
  step: number,
  status: ProgressStatus,
  lastActivity: string,
];

/* The eight as specified, then the fifteen filler patients in roster order.
   Filler statuses are 5 / 5 / 2 / 3, which with the named eight makes
   3 Needs Follow-Up — the one status count that can match the client's. */
const rows: Row[] = [
  ["John D. Smith", JOURNEY, 14, "In Progress", "Today"],
  ["Mary S. Johnson", CRASH, 3, "In Progress", "2 days ago"],
  ["Robert L. Davis", JOURNEY, 21, "Completed", "1 day ago"],
  ["Angela T. Brown", JOURNEY, 12, "In Progress", "Today"],
  ["James K. Wilson", CRASH, 5, "Completed", "3 days ago"],
  ["Patricia M. Allen", JOURNEY, 8, "Needs Follow-Up", "5 days ago"],
  ["David R. Carter", LIBRARY, 4, "In Progress", "2 days ago"],
  ["Lisa W. Thomas", JOURNEY, 1, "Not Started", "1 week ago"],

  ["Denise H. Parker", JOURNEY, 21, "Completed", "1 day ago"],
  ["Charles B. Reed", JOURNEY, 21, "Completed", "4 days ago"],
  ["Gloria N. Hayes", CRASH, 5, "Completed", "1 week ago"],
  ["Marcus E. Bell", JOURNEY, 10, "In Progress", "Today"],
  ["Yolanda P. Cruz", JOURNEY, 5, "Needs Follow-Up", "6 days ago"],
  ["Henry O. Freeman", CRASH, 5, "Completed", "2 days ago"],
  ["Sandra L. Boyd", JOURNEY, 3, "Needs Follow-Up", "1 week ago"],
  ["Victor A. Nunez", JOURNEY, 17, "In Progress", "1 day ago"],
  ["Ruth M. Coleman", CRASH, 4, "In Progress", "Today"],
  ["Alvin T. Barnes", JOURNEY, 21, "Completed", "5 days ago"],
  ["Teresa J. Fields", JOURNEY, 12, "In Progress", "2 days ago"],
  ["Nathan R. Webb", JOURNEY, 19, "In Progress", "1 day ago"],
  ["Camille D. Ortiz", JOURNEY, 1, "Not Started", "2 weeks ago"],
  ["Gerald F. Moss", CRASH, 1, "Not Started", "10 days ago"],
  ["Brenda K. Vaughn", JOURNEY, 1, "Not Started", "2 weeks ago"],
];

function mrnFor(name: string): string {
  const patient = patients.find((p) => p.name === name);
  if (!patient) throw new Error(`${name} is not on the enrollment roster.`);
  return patient.mrn;
}

export const members: MemberProgress[] = rows.map(
  ([name, program, step, status, lastActivity]) => ({
    name,
    mrn: mrnFor(name),
    program,
    module: MODULES[program][step],
    step,
    length: LENGTH[program],
    progress: Math.round((step / LENGTH[program]) * 100),
    status,
    lastActivity,
  }),
);

/** "Day 14 of 21", or "Module 4 of 8" for the library; "Not started"
    for a member who has not opened the first one. */
export function stepLabel(member: MemberProgress): string {
  if (member.step === 0) return "Not started";
  const unit = member.program === LIBRARY ? "Module" : "Day";
  return `${unit} ${member.step} of ${member.length}`;
}

const byMrn = new Map(members.map((member) => [member.mrn, member]));

/** The enrollment program "Journey to Dialysis (21-Day)" is the
    curriculum's "Journey to Dialysis". */
function curriculumProgram(enrolled: string): Program {
  if (enrolled.startsWith(CRASH)) return CRASH;
  if (enrolled.startsWith(LIBRARY)) return LIBRARY;
  return JOURNEY;
}

/**
 * The curriculum row for any enrolled patient. The demo members keep their
 * specified rows; anyone enrolled since has not started — step 0, no
 * module, 0% — rather than an invented day.
 */
export function curriculumRowFor(patient: Patient): MemberProgress {
  const existing = byMrn.get(patient.mrn);
  if (existing) return existing;
  const program = curriculumProgram(patient.program);
  return {
    name: patient.name,
    mrn: patient.mrn,
    program,
    module: "Not started",
    step: 0,
    length: LENGTH[program],
    progress: 0,
    status: "Not Started",
    lastActivity: "No activity yet",
  };
}

export const ALL_PROGRAMS = "All Programs";
export const ALL_STATUSES = "All Statuses";

export const programOptions = [ALL_PROGRAMS, JOURNEY, CRASH, LIBRARY];

export const statusOptions = [
  ALL_STATUSES,
  "In Progress",
  "Completed",
  "Needs Follow-Up",
  "Not Started",
];

/** Search covers name and MRN, as the client's placeholder says. */
export function filterMembers(
  list: MemberProgress[],
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

/* --------------------------------------------------------------------------
   The client's figures, verbatim. See the header before changing any.
   -------------------------------------------------------------------------- */

export const summary = {
  activeLearners: 23,
  enrolled: 30,
  averageCompletion: 78,
  completed: 12,
  inProgress: 11,
  notStarted: 7,
};

export type ProgramOverview = {
  name: string;
  progress: number;
  stats: string[];
};

export const programOverview: ProgramOverview[] = [
  {
    name: "Journey to Dialysis (21-Day)",
    progress: 82,
    stats: ["16 Members Enrolled", "12 Completed", "4 In Progress"],
  },
  {
    name: "Crash Dialysis (5-Day)",
    progress: 74,
    stats: ["7 Members Enrolled", "5 Completed", "2 In Progress"],
  },
  {
    name: "Education Library",
    progress: 69,
    stats: ["Accessed by 20 Members", "120 Modules Completed"],
  },
];

export const journeyDetails = {
  name: "Journey to Dialysis (21-Day)",
  description:
    "A step-by-step education program to prepare patients for dialysis and beyond.",
  includes: [
    "21 Self-Paced Modules",
    "Weekly Live Q&A",
    "Printable Resources",
    "Certificates of Completion",
  ],
};

export const moduleBreakdown: {
  label: string;
  value: number;
  tone: SeriesTone;
}[] = [
  { label: "Completed", value: 16, tone: "success" },
  { label: "In Progress", value: 4, tone: "brand" },
  { label: "Not Started", value: 2, tone: "neutral" },
  { label: "Overdue", value: 1, tone: "danger" },
];

export const overallCompletion = 82;

export const recentActivity = [
  {
    name: "John D. Smith",
    action: "Completed",
    subject: "Diet and Fluid Management",
    when: "2 hours ago",
  },
  {
    name: "Mary S. Johnson",
    action: "Completed",
    subject: "Treatment Day Prep",
    when: "5 hours ago",
  },
  {
    name: "Angela T. Brown",
    action: "Watched",
    subject: "Medications in Dialysis",
    when: "1 day ago",
  },
  {
    name: "Robert L. Davis",
    action: "Completed",
    subject: "Program",
    when: "1 day ago",
  },
];

export const membersByStatus: {
  label: ProgressStatus;
  value: number;
  tone: SeriesTone;
}[] = [
  { label: "In Progress", value: 11, tone: "brand" },
  { label: "Completed", value: 12, tone: "success" },
  { label: "Needs Follow-Up", value: 3, tone: "warning" },
  { label: "Not Started", value: 7, tone: "neutral" },
];

/** The heading the client gave the status panel. */
export const membersByStatusHeading = 23;

export const timeToCompletion = [
  { program: JOURNEY, average: "18 Days" },
  { program: CRASH, average: "4 Days" },
  { program: LIBRARY, average: "Varies" },
];
