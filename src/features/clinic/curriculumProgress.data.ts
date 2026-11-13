import type { BadgeTone, SeriesTone } from "@/components/ui";
import type { Patient } from "./enrollment.data";
import { relativeActivity } from "./enrollment.mapping";
import {
  FOLLOW_UP_AFTER_DAYS,
  daysInactive,
  statusLabel,
} from "./members.data";

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

export type CourseUnit = "Day" | "Module";

export interface Course {
  /** The curriculum name carried on every member row. */
  id: Program;
  /** The full name, as the clinic's own materials write it. */
  name: string;
  /** Short enough for a tab strip on a phone. */
  shortName: string;
  /** How many days a course runs, or how many modules a library holds. */
  length: number;
  unit: CourseUnit;
}

/**
 * Every course this clinic runs.
 *
 * The one place a course is declared. The tab strip, the program filter,
 * each member's "Day 14 of 21" and the length arithmetic all read from
 * here, so adding a fourth course is one entry rather than four edits in
 * four files — and TypeScript names anything still missing.
 *
 * Twenty-one days is Journey's length, not the page's: nothing below
 * assumes a course is three weeks long, or that there are three courses.
 */
export const COURSES: Course[] = [
  {
    id: JOURNEY,
    name: "Journey to Dialysis (21-Day)",
    shortName: "Journey",
    length: 21,
    unit: "Day",
  },
  {
    id: CRASH,
    name: "Crash Dialysis (5-Day)",
    shortName: "Crash",
    length: 5,
    unit: "Day",
  },
  {
    id: LIBRARY,
    name: "Education Library",
    shortName: "Library",
    length: 8,
    unit: "Module",
  },
];

export function courseFor(id: string): Course | undefined {
  return COURSES.find((course) => course.id === id);
}

export type MemberProgress = {
  /** The server's patientId: the row's identity (never the MRN). */
  id: string;
  name: string;
  mrn: string;
  /** A curriculum name, or a course-backed program's own label. */
  program: Program | string;
  module: string;
  /** Position in the program: a day for the courses, a module for the library. */
  step: number;
  length: number;
  progress: number;
  status: ProgressStatus;
  lastActivity: string;
};

/** "Day 14 of 21", or "Module 4 of 8" for the library; "Not started"
    for a member who has not opened the first one. */
export function stepLabel(member: MemberProgress, isEs = false): string {
  if (member.step === 0) return isEs ? "Sin iniciar" : "Not started";
  const unit = courseFor(member.program)?.unit ?? "Day";
  if (isEs)
    return `${unit === "Module" ? "Módulo" : "Día"} ${member.step} de ${member.length}`;
  return `${unit} ${member.step} of ${member.length}`;
}

/** The enrollment program "Journey to Dialysis (21-Day)" is the
    curriculum's "Journey to Dialysis"; a course-backed program keeps its
    own label. */
function curriculumProgram(enrolled: string): Program | string {
  if (enrolled.startsWith(CRASH)) return CRASH;
  if (enrolled.startsWith(LIBRARY)) return LIBRARY;
  if (enrolled.startsWith(JOURNEY)) return JOURNEY;
  return enrolled;
}

const PROGRESS_STATUS: Record<string, ProgressStatus> = {
  "not-started": "Not Started",
  "in-progress": "In Progress",
  completed: "Completed",
};

/**
 * The curriculum row for an enrolled patient, from the server's course
 * progress (classes completed of the course's classes). "Needs Follow-Up"
 * is the client's own rule: in progress and inactive FOLLOW_UP_AFTER_DAYS.
 * Without a course there is no progress to show: not started, 0%.
 */
export function curriculumRowFor(
  patient: Patient,
  now = new Date(),
): MemberProgress {
  const program = curriculumProgram(patient.program);
  const course = courseFor(program);
  const step = patient.classesCompleted ?? 0;
  const length = patient.classesTotal ?? course?.length ?? 0;
  const lastActivity = relativeActivity(patient.lastActivityAt, now);
  let status: ProgressStatus =
    PROGRESS_STATUS[patient.progressStatus ?? ""] ?? "Not Started";
  const days = daysInactive(lastActivity);
  if (status === "In Progress" && days !== null && days >= FOLLOW_UP_AFTER_DAYS)
    status = "Needs Follow-Up";
  return {
    id: patient.id,
    name: patient.name,
    mrn: patient.mrn,
    program,
    module: step === 0 ? "Not started" : "—",
    step,
    length,
    progress: patient.progress,
    status,
    lastActivity,
  };
}

export const ALL_PROGRAMS = "All Programs";
export const ALL_STATUSES = "All Statuses";

/* Derived, so a course added to COURSES is filterable and tabbable at
   once rather than only once somebody remembers this line. */
export const programOptions = [
  ALL_PROGRAMS,
  ...COURSES.map((course) => course.id),
];

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

export type CurriculumSummary = typeof summary;

/**
 * The five key figures, for one course or for all of them.
 *
 * On All Programs it hands back the client's own numbers untouched — they
 * are verbatim from their mockup and do not reconcile with a 23-row roster
 * (see the header). Narrowed to one course there is no client figure to
 * quote, so it counts the roster instead, which is the only honest answer.
 */
export function summaryFor(
  list: MemberProgress[],
  program: string,
): CurriculumSummary {
  if (program === ALL_PROGRAMS) return summary;

  const inCourse = list.filter((member) => member.program === program);
  const countOf = (status: ProgressStatus) =>
    inCourse.filter((member) => member.status === status).length;

  return {
    /* Someone who has not opened the course yet is enrolled, not learning. */
    activeLearners: inCourse.filter((m) => m.status !== "Not Started").length,
    enrolled: inCourse.length,
    averageCompletion:
      inCourse.length === 0
        ? 0
        : Math.round(
            inCourse.reduce((total, m) => total + m.progress, 0) /
              inCourse.length,
          ),
    completed: countOf("Completed"),
    inProgress: countOf("In Progress"),
    notStarted: countOf("Not Started"),
  };
}

export type ProgramOverview = {
  /** Which course this is about — no name parsing anywhere. */
  id: Program;
  name: string;
  progress: number;
  stats: string[];
};

export const programOverview: ProgramOverview[] = [
  {
    id: JOURNEY,
    name: "Journey to Dialysis (21-Day)",
    progress: 82,
    stats: ["16 Members Enrolled", "12 Completed", "4 In Progress"],
  },
  {
    id: CRASH,
    name: "Crash Dialysis (5-Day)",
    progress: 74,
    stats: ["7 Members Enrolled", "5 Completed", "2 In Progress"],
  },
  {
    id: LIBRARY,
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

/* Spanish for the client's verbatim figures and panel text above. The
   English stays the source (tests pin it); this only changes what a
   Spanish reader sees. Program names are the client's own titles and are
   shown as given. */
const FIGURE_ES: Record<string, string> = {
  "16 Members Enrolled": "16 miembros inscritos",
  "12 Completed": "12 completados",
  "4 In Progress": "4 en curso",
  "7 Members Enrolled": "7 miembros inscritos",
  "5 Completed": "5 completados",
  "2 In Progress": "2 en curso",
  "Accessed by 20 Members": "Consultado por 20 miembros",
  "120 Modules Completed": "120 módulos completados",
  "A step-by-step education program to prepare patients for dialysis and beyond.":
    "Un programa educativo paso a paso para preparar a los pacientes para la diálisis y más allá.",
  "21 Self-Paced Modules": "21 módulos a su propio ritmo",
  "Weekly Live Q&A": "Sesión semanal de preguntas y respuestas en vivo",
  "Printable Resources": "Recursos imprimibles",
  "Certificates of Completion": "Certificados de finalización",
  "18 Days": "18 días",
  "4 Days": "4 días",
  Varies: "Varía",
};

/** A figure, status or panel line in the reader's language. */
export function curriculumText(text: string, isEs = false): string {
  if (!isEs) return text;
  return FIGURE_ES[text] ?? statusLabel(text, true);
}

/** Recent module activity has no source yet (NEW-2): empty, never the demo
    names. */
export const recentActivity: {
  /** The patient it is about. */
  patientId: string;
  name: string;
  action: string;
  subject: string;
  when: string;
}[] = [];

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
