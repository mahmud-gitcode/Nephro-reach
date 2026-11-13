import type { SeriesTone } from "@/components/ui";

/* ==========================================================================
   Office reports: API shapes and what the page shows (Phase 14)
   --------------------------------------------------------------------------
   For the signed-in office only (the organization is a fixed label). Every
   figure is the server's: GET /organizations/:org/reports/<report> returns
   aggregate counts (no names, no MRNs). Nothing here counts a page of rows
   or shows a sample figure; a widget without a server source says "No data
   yet". Months come as "YYYY-MM".
   ========================================================================== */

/* ---------------------------------------------------------------- the API */

export type MonthCount = { month: string; count: number };
export type KeyCount = { key: string; count: number };

export type RosterReport = {
  activePatients: number;
  endedRelationships: number;
  newLinksPerMonth: MonthCount[];
};

export type ProgramsReport = {
  totalEnrollments: number;
  byStatus: KeyCount[];
  withCourse: number;
  courseCompleted: number;
  courseCompletionPercent: number;
};

export type CheckInNoticesReport = {
  delivered: number;
  seen: number;
  seenRatePercent: number;
  perMonth: { month: string; delivered: number; seen: number }[];
};

export type MessagesReport = {
  fromMembers: number;
  fromOffice: number;
  perMonth: { month: string; fromMembers: number; fromOffice: number }[];
  conversationsReplied: number;
  medianFirstReplyMinutes: number | null;
};

export type CcmReport = {
  month: string;
  thresholdMinutes: number;
  totalMinutes: number;
  countedMinutes: number;
  pendingMinutes: number;
  activities: number;
  patients: number;
  patientsAtThreshold: number;
};

export type TravelReport = { total: number; byStatus: KeyCount[] };

/* ------------------------------------------------------------- the screen */

/** "2026-10" -> "Oct". An unexpected value shows as given. */
export function monthLabel(month: string, isEs = false): string {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return month;
  return new Date(y, m - 1, 1).toLocaleDateString(isEs ? "es-US" : "en-US", {
    month: "short",
  });
}

/** "2026-10" -> "October 2026". */
export function longMonth(month: string, isEs = false): string {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return month;
  return new Date(y, m - 1, 1).toLocaleDateString(isEs ? "es-US" : "en-US", {
    month: "long",
    year: "numeric",
  });
}

/** Chronological, oldest first, as the charts draw them. */
export function byMonth<T extends { month: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => a.month.localeCompare(b.month));
}

const STATUS_LABELS: Record<string, string> = {
  enrolled: "Enrolled",
  "pending-start": "Pending Start",
  "not-started": "Not Started",
  withdrawn: "Withdrawn",
  completed: "Completed",
  admitted: "Admitted",
  discharged: "Discharged",
};

const STATUS_LABELS_ES: Record<string, string> = {
  enrolled: "Inscrito",
  "pending-start": "Inicio pendiente",
  "not-started": "Sin iniciar",
  withdrawn: "Retirado",
  completed: "Completado",
  admitted: "Admitido",
  discharged: "Dado de alta",
};

export function programStatusLabel(key: string, isEs = false): string {
  return (isEs ? STATUS_LABELS_ES : STATUS_LABELS)[key] ?? key;
}

const SHARE_TONES: SeriesTone[] = [
  "cat-1",
  "cat-2",
  "cat-3",
  "cat-4",
  "cat-5",
  "cat-6",
];

export type ShareRow = { label: string; pct: number; tone: SeriesTone };

/** Counts as whole-percent shares of their total (0 when empty). */
export function shares(rows: { label: string; count: number }[]): ShareRow[] {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  return rows.map((row, i) => ({
    label: row.label,
    pct: total ? Math.round((row.count / total) * 100) : 0,
    tone: SHARE_TONES[i % SHARE_TONES.length],
  }));
}

/** Smallest "nice" axis top at or above the largest value. */
export function axisMax(values: number[]): number {
  const max = Math.max(0, ...values);
  if (max <= 5) return 5;
  const step = 10 ** Math.floor(Math.log10(max));
  return Math.ceil(max / step) * step;
}

/** The reports an office can download as the server's audited CSV. */
export const EXPORTS: {
  report:
    | "roster"
    | "programs"
    | "check-in-notices"
    | "messages"
    | "lab-imports"
    | "travel"
    | "ccm";
  label: string;
  labelEs: string;
  nephrologyOnly?: boolean;
}[] = [
  {
    report: "roster",
    label: "Member Roster Report",
    labelEs: "Informe de la lista de miembros",
  },
  {
    report: "programs",
    label: "Program Completion Report",
    labelEs: "Informe de finalización de programas",
  },
  {
    report: "check-in-notices",
    label: "Check-In Compliance Report",
    labelEs: "Informe de cumplimiento de registros",
  },
  {
    report: "messages",
    label: "Messages Report",
    labelEs: "Informe de mensajes",
  },
  {
    report: "lab-imports",
    label: "Lab Imports Report",
    labelEs: "Informe de importaciones de laboratorio",
  },
  { report: "travel", label: "Travel Report", labelEs: "Informe de viajes" },
  {
    report: "ccm",
    label: "CCM Report",
    labelEs: "Informe de CCM",
    nephrologyOnly: true,
  },
];

/** The per-member files the prototype built in the browser. They have no
 *  audited server source (B14-4), so they are shown but not available. */
export const PER_MEMBER_REPORTS = [
  "Member Engagement Report",
  "Open Questions Report",
  "Live Class Attendance Report",
  "Member Activity Export (CSV)",
] as const;

/** PER_MEMBER_REPORTS in Spanish, in the same order. */
export const PER_MEMBER_REPORTS_ES = [
  "Informe de participación de miembros",
  "Informe de preguntas abiertas",
  "Informe de asistencia a clases en vivo",
  "Exportación de actividad de miembros (CSV)",
] as const;
