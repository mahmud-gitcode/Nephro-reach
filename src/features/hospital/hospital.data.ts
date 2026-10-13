import { DEMO_MEMBER_EMAIL, DEMO_MEMBER_NAME } from "@/lib/data/demoIdentity";

/* ==========================================================================
   Hospital — kidney education and the move home
   --------------------------------------------------------------------------
   The client (2026-10-13): the hospital enrolls the patient, NephroReach
   delivers the education, hospital staff follow participation, and the
   patient keeps learning after discharge. Hospitals already plan
   discharges and coordinate care, so none of that is rebuilt here.

   Programs are data, not screens: the 3-Day Kidney Failure Crash Course is
   the first, and another program is one more entry in PROGRAMS — "support
   future kidney education programs without requiring a redesign".

   Pure: state in, state out. Storage lives in useHospital.ts.
   ========================================================================== */

export type LessonKind =
  "video" | "presentation" | "activity" | "knowledge-check";

export type ProgramDay = {
  day: number;
  titleEn: string;
  titleEs: string;
  items: Array<{ kind: LessonKind; titleEn: string; titleEs: string }>;
};

export type EducationProgram = {
  id: string;
  nameEn: string;
  nameEs: string;
  summaryEn: string;
  summaryEs: string;
  days: ProgramDay[];
  /** How long the patient keeps access after discharge (program rule). */
  accessDaysAfterDischarge: number;
};

/* The course outline. Each day carries the four kinds of material the
   client listed; the videos, slides, activities and questions themselves
   come from her program content and are added in Class Management. */
const crashDay = (
  day: number,
  titleEn: string,
  titleEs: string,
): ProgramDay => ({
  day,
  titleEn,
  titleEs,
  items: [
    {
      kind: "video",
      titleEn: `Day ${day} video`,
      titleEs: `Video del día ${day}`,
    },
    {
      kind: "presentation",
      titleEn: `Day ${day} presentation`,
      titleEs: `Presentación del día ${day}`,
    },
    {
      kind: "activity",
      titleEn: `Day ${day} interactive activity`,
      titleEs: `Actividad interactiva del día ${day}`,
    },
    {
      kind: "knowledge-check",
      titleEn: `Day ${day} knowledge check`,
      titleEs: `Prueba de conocimientos del día ${day}`,
    },
  ],
});

export const PROGRAMS: EducationProgram[] = [
  {
    id: "crash-3",
    nameEn: "3-Day Kidney Failure Crash Course",
    nameEs: "Curso Intensivo de 3 Días sobre Insuficiencia Renal",
    summaryEn:
      "Structured education for hospitalized kidney patients, started in the hospital and continued at home.",
    summaryEs:
      "Educación estructurada para pacientes renales hospitalizados, que empieza en el hospital y continúa en casa.",
    days: [
      crashDay(
        1,
        "Understanding kidney failure",
        "Entender la insuficiencia renal",
      ),
      crashDay(2, "Your treatment options", "Sus opciones de tratamiento"),
      crashDay(
        3,
        "Going home and what comes next",
        "Volver a casa y lo que sigue",
      ),
    ],
    accessDaysAfterDischarge: 21,
  },
];

export function programById(id: string): EducationProgram | undefined {
  return PROGRAMS.find((p) => p.id === id);
}

export type Diagnosis = "new" | "on-dialysis";
export type EnrollmentStatus = "admitted" | "discharged" | "withdrawn";
export type EducationStatus = "not-started" | "in-progress" | "completed";

export type DayProgress = {
  /** ISO 8601, when the patient finished the day. */
  completedAt?: string;
  /** The day's knowledge check, once taken. */
  knowledgeCheck?: { score: number; total: number; passed: boolean };
};

export type HospitalEnrollment = {
  id: string;
  /** The hospital organisation (staff.ts) — a hospital sees only its own. */
  hospitalId: string;
  patientName: string;
  /** The patient's own NephroReach account: they learn signed in as
   *  themselves (client, 2026-10-13). */
  patientEmail: string;
  mrn: string;
  diagnosis: Diagnosis;
  programId: string;
  /** yyyy-mm-dd */
  enrolledAt: string;
  enrolledBy: string;
  status: EnrollmentStatus;
  /** yyyy-mm-dd, set when discharged. */
  dischargedAt?: string;
  progress: Record<number, DayProgress>;
  /** ISO 8601 */
  lastActivityAt?: string;
};

export type HospitalState = { enrollments: HospitalEnrollment[] };

/* ------------------------------------------------------------- dates */

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return iso(new Date(y, m - 1, d + n));
}

/* ------------------------------------------------------- the patient */

export function daysDone(e: HospitalEnrollment): number {
  return Object.values(e.progress).filter((p) => p.completedAt).length;
}

export function educationStatus(e: HospitalEnrollment): EducationStatus {
  const program = programById(e.programId);
  const done = daysDone(e);
  if (program && done >= program.days.length) return "completed";
  return done > 0 || e.lastActivityAt ? "in-progress" : "not-started";
}

export function percentDone(e: HospitalEnrollment): number {
  const total = programById(e.programId)?.days.length ?? 0;
  return total ? Math.round((daysDone(e) / total) * 100) : 0;
}

/**
 * When the patient's access ends: open while admitted, then the program's
 * days after discharge (21 for the crash course), closed on withdrawal.
 * Null while admitted — access does not run out in the hospital.
 */
export function accessUntil(e: HospitalEnrollment): string | null {
  if (e.status === "admitted") return null;
  if (e.status === "withdrawn") return e.dischargedAt ?? e.enrolledAt;
  const days = programById(e.programId)?.accessDaysAfterDischarge ?? 0;
  return addDays(e.dischargedAt ?? e.enrolledAt, days);
}

export function hasAccess(e: HospitalEnrollment, today: string): boolean {
  if (e.status === "withdrawn") return false;
  const until = accessUntil(e);
  return until === null || today <= until;
}

/* ------------------------------------------------------- the hospital */

export type HospitalSummary = {
  enrolled: number;
  inProgress: number;
  completed: number;
  notStarted: number;
  /** Enrolled and not finished. */
  incomplete: number;
  newlyDiagnosed: number;
  onDialysis: number;
};

export function summarise(list: HospitalEnrollment[]): HospitalSummary {
  const status = list.map(educationStatus);
  const completed = status.filter((s) => s === "completed").length;
  return {
    enrolled: list.length,
    inProgress: status.filter((s) => s === "in-progress").length,
    completed,
    notStarted: status.filter((s) => s === "not-started").length,
    incomplete: list.length - completed,
    newlyDiagnosed: list.filter((e) => e.diagnosis === "new").length,
    onDialysis: list.filter((e) => e.diagnosis === "on-dialysis").length,
  };
}

export function forHospital(
  state: HospitalState,
  hospitalId: string,
): HospitalEnrollment[] {
  return state.enrollments.filter((e) => e.hospitalId === hospitalId);
}

export type ActivityEvent = {
  id: string;
  /** ISO date or date-time; sorts newest first. */
  at: string;
  patientName: string;
  kind: "enrolled" | "day-completed" | "course-completed" | "discharged";
  day?: number;
};

/** Enrollment and education activity, newest first. */
export function recentActivity(
  list: HospitalEnrollment[],
  limit = 8,
): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  for (const e of list) {
    events.push({
      id: `${e.id}-enrolled`,
      at: e.enrolledAt,
      patientName: e.patientName,
      kind: "enrolled",
    });
    const total = programById(e.programId)?.days.length ?? 0;
    for (const [day, p] of Object.entries(e.progress)) {
      if (!p.completedAt) continue;
      events.push({
        id: `${e.id}-day-${day}`,
        at: p.completedAt,
        patientName: e.patientName,
        kind: Number(day) === total ? "course-completed" : "day-completed",
        day: Number(day),
      });
    }
    if (e.dischargedAt) {
      events.push({
        id: `${e.id}-discharged`,
        at: e.dischargedAt,
        patientName: e.patientName,
        kind: "discharged",
      });
    }
  }
  return events.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}

export type MonthRow = {
  /** yyyy-mm */
  month: string;
  enrolled: number;
  started: number;
  completed: number;
  /** Completed as a share of enrolled that month, 0–100. */
  completionPct: number;
};

/** Monthly participation, by the month each patient was enrolled. */
export function monthlyReport(list: HospitalEnrollment[]): MonthRow[] {
  const byMonth = new Map<string, HospitalEnrollment[]>();
  for (const e of list) {
    const key = e.enrolledAt.slice(0, 7);
    byMonth.set(key, [...(byMonth.get(key) ?? []), e]);
  }
  return [...byMonth.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([month, rows]) => {
      const completed = rows.filter(
        (e) => educationStatus(e) === "completed",
      ).length;
      return {
        month,
        enrolled: rows.length,
        started: rows.filter((e) => educationStatus(e) !== "not-started")
          .length,
        completed,
        completionPct: rows.length
          ? Math.round((completed / rows.length) * 100)
          : 0,
      };
    });
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** The patient list as CSV, for a report download. */
export function enrollmentsCsv(list: HospitalEnrollment[]): string {
  const header = [
    "Patient",
    "MRN",
    "Diagnosis",
    "Program",
    "Enrolled",
    "Enrollment status",
    "Education status",
    "Days completed",
    "Access until",
  ];
  const rows = list.map((e) => [
    e.patientName,
    e.mrn,
    e.diagnosis === "new" ? "Newly diagnosed" : "On dialysis",
    programById(e.programId)?.nameEn ?? e.programId,
    e.enrolledAt,
    e.status,
    educationStatus(e),
    daysDone(e),
    accessUntil(e) ?? "While admitted",
  ]);
  return [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
}

export function monthlyCsv(rows: MonthRow[]): string {
  const header = ["Month", "Enrolled", "Started", "Completed", "Completion %"];
  return [
    header,
    ...rows.map((r) => [
      r.month,
      r.enrolled,
      r.started,
      r.completed,
      r.completionPct,
    ]),
  ]
    .map((r) => r.map(csvCell).join(","))
    .join("\n");
}

/* ----------------------------------------------------------- changes */

export type EnrollmentDraft = {
  patientName: string;
  patientEmail: string;
  mrn: string;
  diagnosis: Diagnosis;
  programId: string;
  enrolledAt: string;
};

export type EnrollmentError = "name" | "email" | "mrn" | "duplicate";

export function enrollmentError(
  list: HospitalEnrollment[],
  draft: EnrollmentDraft,
): EnrollmentError | null {
  if (!draft.patientName.trim()) return "name";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.patientEmail.trim()))
    return "email";
  if (!draft.mrn.trim()) return "mrn";
  const email = draft.patientEmail.trim().toLowerCase();
  if (
    list.some(
      (e) =>
        e.patientEmail === email &&
        e.programId === draft.programId &&
        e.status !== "withdrawn",
    )
  )
    return "duplicate";
  return null;
}

export function enroll(
  state: HospitalState,
  hospitalId: string,
  draft: EnrollmentDraft,
  by: string,
  now: number,
): HospitalState {
  return {
    enrollments: [
      ...state.enrollments,
      {
        id: `henr-${now}`,
        hospitalId,
        patientName: draft.patientName.trim(),
        patientEmail: draft.patientEmail.trim().toLowerCase(),
        mrn: draft.mrn.trim(),
        diagnosis: draft.diagnosis,
        programId: draft.programId,
        enrolledAt: draft.enrolledAt,
        enrolledBy: by,
        status: "admitted",
        progress: {},
      },
    ],
  };
}

export function updateEnrollment(
  state: HospitalState,
  id: string,
  change: Partial<
    Pick<
      HospitalEnrollment,
      "status" | "dischargedAt" | "programId" | "diagnosis"
    >
  >,
): HospitalState {
  return {
    enrollments: state.enrollments.map((e) => {
      if (e.id !== id) return e;
      const next = { ...e, ...change };
      /* A new program starts from its own first day. */
      if (change.programId && change.programId !== e.programId) {
        next.progress = {};
      }
      if (change.status === "admitted") delete next.dischargedAt;
      return next;
    }),
  };
}

/** The patient finished a day (from their own classroom). */
export function completeDay(
  state: HospitalState,
  id: string,
  day: number,
  now: number,
  knowledgeCheck?: DayProgress["knowledgeCheck"],
): HospitalState {
  const at = new Date(now).toISOString();
  return {
    enrollments: state.enrollments.map((e) =>
      e.id === id
        ? {
            ...e,
            lastActivityAt: at,
            progress: {
              ...e.progress,
              [day]: {
                ...e.progress[day],
                completedAt: e.progress[day]?.completedAt ?? at,
                ...(knowledgeCheck ? { knowledgeCheck } : {}),
              },
            },
          }
        : e,
    ),
  };
}

/** A member's own active hospital courses, by their account email. */
export function enrollmentsForMember(
  state: HospitalState,
  email: string,
): HospitalEnrollment[] {
  const mine = email.trim().toLowerCase();
  return state.enrollments.filter(
    (e) => e.patientEmail === mine && e.status !== "withdrawn",
  );
}

/* -------------------------------------------------------------- seed */

/** Sample patients for the demo hospital, dated from today. */
export function seedHospital(now: number): HospitalState {
  const today = iso(new Date(now));
  const at = (days: number, hour = 10) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  };
  const base = {
    hospitalId: "riverside-general",
    programId: "crash-3",
    enrolledBy: "Grace Nolan, RN",
  };
  const done = (...days: Array<[number, number]>) =>
    Object.fromEntries(
      days.map(([day, offset]) => [
        day,
        {
          completedAt: at(offset),
          knowledgeCheck: { score: 4, total: 5, passed: true },
        },
      ]),
    );
  const rows: HospitalEnrollment[] = [
    {
      ...base,
      id: "henr-seed-1",
      patientName: DEMO_MEMBER_NAME,
      patientEmail: DEMO_MEMBER_EMAIL,
      mrn: "223344",
      diagnosis: "new",
      enrolledAt: addDays(today, -4),
      status: "discharged",
      dischargedAt: addDays(today, -2),
      progress: done([1, -3]),
      lastActivityAt: at(-3),
    },
    {
      ...base,
      id: "henr-seed-2",
      patientName: "Maria Gonzalez",
      patientEmail: "maria.gonzalez@example.com",
      mrn: "558201",
      diagnosis: "new",
      enrolledAt: addDays(today, -1),
      status: "admitted",
      progress: {},
    },
    {
      ...base,
      id: "henr-seed-3",
      patientName: "Robert Chen",
      patientEmail: "robert.chen@example.com",
      mrn: "558377",
      diagnosis: "on-dialysis",
      enrolledAt: addDays(today, -9),
      status: "discharged",
      dischargedAt: addDays(today, -6),
      progress: done([1, -8], [2, -7], [3, -6]),
      lastActivityAt: at(-6),
    },
    {
      ...base,
      id: "henr-seed-4",
      patientName: "Denise Walker",
      patientEmail: "denise.walker@example.com",
      mrn: "558412",
      diagnosis: "new",
      enrolledAt: addDays(today, -3),
      status: "admitted",
      progress: done([1, -2], [2, -1]),
      lastActivityAt: at(-1),
      enrolledBy: "Tasha Greene, LCSW",
    },
    {
      ...base,
      id: "henr-seed-5",
      patientName: "Samuel Brooks",
      patientEmail: "samuel.brooks@example.com",
      mrn: "557990",
      diagnosis: "on-dialysis",
      enrolledAt: addDays(today, -40),
      status: "discharged",
      dischargedAt: addDays(today, -36),
      progress: done([1, -39]),
      lastActivityAt: at(-39),
    },
    {
      ...base,
      id: "henr-seed-6",
      patientName: "Angela Price",
      patientEmail: "angela.price@example.com",
      mrn: "557812",
      diagnosis: "new",
      enrolledAt: addDays(today, -35),
      status: "discharged",
      dischargedAt: addDays(today, -31),
      progress: done([1, -34], [2, -33], [3, -32]),
      lastActivityAt: at(-32),
      enrolledBy: "Omar Haddad",
    },
    {
      ...base,
      id: "henr-seed-7",
      patientName: "Luis Ramirez",
      patientEmail: "luis.ramirez@example.com",
      mrn: "558509",
      diagnosis: "on-dialysis",
      enrolledAt: today,
      status: "admitted",
      progress: {},
    },
  ];
  return { enrollments: rows };
}
