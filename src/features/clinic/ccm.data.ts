/* ==========================================================================
   Chronic Care Management (CCM): labels, lists and pure helpers
   --------------------------------------------------------------------------
   A billing-support tracker for a nephrology office: the minutes staff
   spend on each patient in a calendar month, and the CCM requirements
   checked off, so the office knows when a month can be billed.

   Tracking only. Clinical documentation stays in the practice EHR.

   Phase 9: every number and status comes from the API (ccm.repository.ts):
   the month's minutes, pending minutes, the threshold status, open alerts,
   overdue follow-ups, the checklist count and billing blocked are the
   server's. The seeded patients, activities and inbox, the reducers that
   wrote them to `nr:clinic-ccm` (retired) and the client status rules are
   gone. What stays here is display: labels, the client's lists the server
   validates against, dates and the CSV export.
   ========================================================================== */

import { csvCell } from "@/lib/utils/download";
import type { CcmEnrollment } from "./ccm.repository";
import {
  DEFAULT_CONDITIONS,
  conditionLabels,
  type CcmCondition,
} from "./ccmConditions";

/** Minutes of care in a month before it can be billed. Client: 30, not 20.
 *  The server decides the status; this labels the progress bar. */
export const CCM_THRESHOLD_MINUTES = 30;

export const CCM_REQUIREMENTS = [
  {
    id: "eligibility",
    label:
      "CCM eligibility: 2+ chronic conditions expected to last 12+ months, with significant risk",
  },
  { id: "initiating-visit", label: "Initiating visit completed" },
  { id: "consent", label: "CCM consent documented in the medical record" },
  { id: "care-plan", label: "Comprehensive care plan maintained" },
  { id: "access", label: "24/7 access and continuity of care in place" },
  {
    id: "ehr",
    label:
      "Structured health record maintained (problems, medications, allergies)",
  },
  { id: "transitions", label: "Care transitions and coordination managed" },
  { id: "communication", label: "Enhanced communication with the patient" },
] as const;

export type RequirementId = (typeof CCM_REQUIREMENTS)[number]["id"];

/** The client's list for the Activity Type dropdown (2026-09-27), in order. */
export const ACTIVITY_TYPES = [
  "Medication Review / Reconciliation",
  "Patient Communication",
  "Caregiver Communication",
  "Lab / Test Result Review & Follow-Up",
  "BP Review & Follow-Up",
  "Weight / Fluid Review & Follow-Up",
  "Symptom Review & Follow-Up",
  "Patient Education / Self-Management Support",
  "Appointment Coordination",
  "Specialist / Provider Coordination",
  "Dialysis Facility Coordination",
  "Hospital / ER / Care Transition Follow-Up",
  "Home Health / Community Service Coordination",
  "Medical Record Review",
  /* The care plan itself stays in the practice EHR; reviewing it is still
     CCM time. */
  "Care Plan Review / Monitoring",
  /* CKD access / kidney replacement therapy planning (client, 2026-10-01
     and 2026-10-05), the same steps as the Kidney Care checklist. */
  "KRT Education",
  "Modality Discussion",
  "Vascular Access Planning",
  "Vascular Access Referral",
  "Access Appointment Coordination",
  "Transplant Referral / Discussion",
  "Other CCM Activity",
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

/**
 * The Activity Type an alert's follow-up is logged under, by the server's
 * inbox kind (the client's rule, 2026-09-30). The server also sends
 * `activityType` on each item; that wins when present. Only the server's
 * 10 kinds are listed (NEW-4: "Hospital discharge" and "Medication change"
 * existed only in the demo seed).
 */
export const ALERT_ACTIVITY: Record<string, ActivityType> = {
  "Patient message": "Patient Communication",
  "Lab alert": "Lab / Test Result Review & Follow-Up",
  "Side effect": "Medication Review / Reconciliation",
  "Missed doses": "Medication Review / Reconciliation",
  "Blood pressure": "BP Review & Follow-Up",
  "BP symptoms": "BP Review & Follow-Up",
  "Weight change": "Weight / Fluid Review & Follow-Up",
  "Access appointment": "Appointment Coordination",
  "Access concern": "Symptom Review & Follow-Up",
  "Missed appointment": "Appointment Coordination",
};

/** The activity type an inbox item pre-selects: the server's, else ours. */
export function activityTypeFor(item: {
  kind: string;
  activityType: string | null;
}): string {
  return item.activityType ?? ALERT_ACTIVITY[item.kind] ?? "";
}

export const OUTCOMES = [
  "Continue monitoring",
  "Education provided",
  "Medication adjusted",
  "Provider notified",
  "Referral placed",
  "Care plan updated",
] as const;

/* "Ready for Review", not "billable": the threshold is met, and the
   practice decides whether the month is billed. */
export type CcmStatus =
  "Action Needed" | "Below Threshold" | "Ready for Review";
export const CCM_STATUSES: CcmStatus[] = [
  "Action Needed",
  "Below Threshold",
  "Ready for Review",
];

/** The client's warning, word for word, shown where billing is locked. */
export const CCM_BILLING_DEACTIVATED =
  "CCM Billing Deactivated: This patient is currently marked as receiving concurrent ESRD, Home Health, or Hospice services.";

/** Whether an activity's minutes count toward the month's CCM time. Only
 *  "yes" counts; "pending" waits for the practice to decide. */
export type CountsToward = "yes" | "no" | "pending";

export const COUNTS_LABEL: Record<CountsToward, string> = {
  yes: "Yes",
  no: "No",
  pending: "Pending Review",
};

export type RequirementStatus =
  "complete" | "in-progress" | "missing" | "not-applicable";

/* What each status means, in the client's words (2026-10-07). */
export const REQUIREMENT_STATUS_MEANING: Record<RequirementStatus, string> = {
  complete:
    "Practice staff have confirmed this requirement has been satisfied and documented where appropriate.",
  "in-progress":
    "The practice is actively working on satisfying or documenting the requirement.",
  missing: "Practice staff have not confirmed completion; follow-up is needed.",
  "not-applicable":
    "The requirement does not apply in this particular situation. For example, an initiating visit may not be required in every CCM enrollment scenario.",
};

export const CCM_CHECKLIST_DISCLAIMER =
  "Tracking tool only. Statuses are entered by practice staff and do not independently determine Medicare eligibility, compliance, or billability. Supporting clinical documentation remains in the practice EHR.";

/** The checklist item as the server returns it (RequirementResponseDto). */
export type RequirementState = {
  met: boolean;
  inProgress: boolean;
  notApplicable: boolean;
  date: string | null;
  detail: string;
};

/**
 * The full body for PUT …/requirements/{id}: `met` is required, so the
 * whole state is always sent, never a partial (SetRequirementDto). A status
 * change keeps the note; a note change keeps the status. A completed item
 * keeps its date, or takes today.
 */
export function requirementBody(
  current: RequirementState,
  change: { status?: RequirementStatus; detail?: string },
  today: string,
): {
  met: boolean;
  inProgress: boolean;
  notApplicable: boolean;
  date: string | null;
  detail: string;
} {
  const status: RequirementStatus =
    change.status ??
    (current.notApplicable
      ? "not-applicable"
      : current.met
        ? "complete"
        : current.inProgress
          ? "in-progress"
          : "missing");
  return {
    met: status === "complete",
    inProgress: status === "in-progress",
    notApplicable: status === "not-applicable",
    date: status === "complete" ? (current.date ?? today) : null,
    detail: change.detail ?? current.detail,
  };
}

export const ALL = "All";

/* ------------------------------------------------------------ Spanish */

/* Spanish display text for the fixed lists above, keyed by the English.
   The English values stay what the server stores and validates; only what
   is shown changes (ccmText). */
const CCM_TEXT_ES: Record<string, string> = {
  /* statuses */
  "Action Needed": "Requiere acción",
  "Below Threshold": "Por debajo del umbral",
  "Ready for Review": "Listo para revisión",
  /* requirements */
  "CCM eligibility: 2+ chronic conditions expected to last 12+ months, with significant risk":
    "Elegibilidad para CCM: 2 o más afecciones crónicas que se espera que duren 12 meses o más, con riesgo significativo",
  "Initiating visit completed": "Visita inicial completada",
  "CCM consent documented in the medical record":
    "Consentimiento de CCM documentado en el expediente médico",
  "Comprehensive care plan maintained":
    "Plan de atención integral mantenido al día",
  "24/7 access and continuity of care in place":
    "Acceso 24/7 y continuidad de la atención establecidos",
  "Structured health record maintained (problems, medications, allergies)":
    "Expediente de salud estructurado al día (problemas, medicamentos, alergias)",
  "Care transitions and coordination managed":
    "Transiciones y coordinación de la atención gestionadas",
  "Enhanced communication with the patient":
    "Comunicación ampliada con el paciente",
  /* activity types */
  "Medication Review / Reconciliation":
    "Revisión / conciliación de medicamentos",
  "Patient Communication": "Comunicación con el paciente",
  "Caregiver Communication": "Comunicación con el cuidador",
  "Lab / Test Result Review & Follow-Up":
    "Revisión y seguimiento de resultados de laboratorio / pruebas",
  "BP Review & Follow-Up": "Revisión y seguimiento de la presión arterial",
  "Weight / Fluid Review & Follow-Up":
    "Revisión y seguimiento de peso / líquidos",
  "Symptom Review & Follow-Up": "Revisión y seguimiento de síntomas",
  "Patient Education / Self-Management Support":
    "Educación del paciente / apoyo al autocuidado",
  "Appointment Coordination": "Coordinación de citas",
  "Specialist / Provider Coordination":
    "Coordinación con especialistas / proveedores",
  "Dialysis Facility Coordination": "Coordinación con el centro de diálisis",
  "Hospital / ER / Care Transition Follow-Up":
    "Seguimiento de hospital / urgencias / transición de la atención",
  "Home Health / Community Service Coordination":
    "Coordinación de atención médica domiciliaria / servicios comunitarios",
  "Medical Record Review": "Revisión del expediente médico",
  "Care Plan Review / Monitoring": "Revisión / monitoreo del plan de atención",
  "KRT Education": "Educación sobre terapia de reemplazo renal (KRT)",
  "Modality Discussion": "Conversación sobre la modalidad de tratamiento",
  "Vascular Access Planning": "Planificación del acceso vascular",
  "Vascular Access Referral": "Derivación para acceso vascular",
  "Access Appointment Coordination": "Coordinación de citas de acceso vascular",
  "Transplant Referral / Discussion":
    "Derivación / conversación sobre trasplante",
  "Other CCM Activity": "Otra actividad de CCM",
  /* inbox kinds */
  "Patient message": "Mensaje del paciente",
  "Lab alert": "Alerta de laboratorio",
  "Side effect": "Efecto secundario",
  "Missed doses": "Dosis omitidas",
  "Blood pressure": "Presión arterial",
  "BP symptoms": "Síntomas de presión arterial",
  "Weight change": "Cambio de peso",
  "Access appointment": "Cita de acceso vascular",
  "Access concern": "Problema con el acceso vascular",
  "Missed appointment": "Cita perdida",
  /* outcomes */
  "Continue monitoring": "Continuar el monitoreo",
  "Education provided": "Educación brindada",
  "Medication adjusted": "Medicamento ajustado",
  "Provider notified": "Proveedor notificado",
  "Referral placed": "Derivación realizada",
  "Care plan updated": "Plan de atención actualizado",
  /* counts toward */
  Yes: "Sí",
  No: "No",
  "Pending Review": "Pendiente de revisión",
  /* the client's notices */
  [CCM_BILLING_DEACTIVATED]:
    "Facturación de CCM desactivada: este paciente figura actualmente como receptor de servicios concurrentes de ESRD, atención médica domiciliaria o cuidados paliativos (hospicio).",
  [CCM_CHECKLIST_DISCLAIMER]:
    "Solo es una herramienta de seguimiento. El personal del consultorio ingresa los estados, que por sí solos no determinan la elegibilidad para Medicare, el cumplimiento ni la facturabilidad. La documentación clínica de respaldo permanece en el EHR del consultorio.",
  [REQUIREMENT_STATUS_MEANING.complete]:
    "El personal del consultorio confirmó que este requisito se cumplió y se documentó cuando corresponde.",
  [REQUIREMENT_STATUS_MEANING["in-progress"]]:
    "El consultorio está trabajando activamente para cumplir o documentar el requisito.",
  [REQUIREMENT_STATUS_MEANING.missing]:
    "El personal del consultorio no ha confirmado que se haya completado; se necesita seguimiento.",
  [REQUIREMENT_STATUS_MEANING["not-applicable"]]:
    "El requisito no aplica en esta situación en particular. Por ejemplo, es posible que no se requiera una visita inicial en todos los casos de inscripción en CCM.",
};

/** One of this file's fixed labels (a status, requirement, activity type,
 *  inbox kind, outcome or notice) in the reader's language. English, and
 *  any text the list does not hold (a server value), is returned as is. */
export function ccmText(text: string, isEs = false): string {
  if (!isEs) return text;
  return Object.prototype.hasOwnProperty.call(CCM_TEXT_ES, text)
    ? CCM_TEXT_ES[text]
    : text;
}

/* ------------------------------------------------------------------ dates */

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function dayKey(now: number): string {
  const d = new Date(now);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  return dayKey(new Date(y, m - 1, d + days).getTime());
}

/** "2026-09-14" or a timestamp → "2026-09". */
export function monthOf(key: string): string {
  return key.slice(0, 7);
}

const MONTHS_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/** "2026-09" → "September 2026" ("septiembre de 2026" in Spanish). */
export function monthLabel(month: string, isEs = false): string {
  const [y, m] = month.split("-").map(Number);
  return isEs ? `${MONTHS_ES[m - 1]} de ${y}` : `${MONTHS[m - 1]} ${y}`;
}

/** The current month and the two before it, newest first. */
export function recentMonths(now: number, count = 3): string[] {
  const d = new Date(now);
  return Array.from({ length: count }, (_, index) => {
    const at = new Date(d.getFullYear(), d.getMonth() - index, 1);
    return `${at.getFullYear()}-${pad(at.getMonth() + 1)}`;
  });
}

/** "2026-09-14" → "09/14/2026", the US form the office reads. */
export function usDate(key: string): string {
  const [y, m, d] = key.split("-");
  return y && m && d ? `${m}/${d}/${y}` : "—";
}

export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  return `${h % 12 === 0 ? 12 : h % 12}:${pad(m)} ${h >= 12 ? "PM" : "AM"}`;
}

/** Minutes between two HH:MM times on one day; 0 when the end is not later. */
export function durationMinutes(start: string, end: string): number {
  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) return 0;
  return Math.max(0, toMin(end) - toMin(start));
}

/** Age in whole years on a given day. */
export function ageOn(dob: string, today: string): number {
  const [by, bm, bd] = dob.split("-").map(Number);
  const [ty, tm, td] = today.split("-").map(Number);
  return ty - by - (tm < bm || (tm === bm && td < bd) ? 1 : 0);
}

/* ------------------------------------------------------------------ export */

/** A worklist row's display name. */
export function patientName(row: { firstName: string; lastName: string }) {
  return `${row.firstName} ${row.lastName}`.trim();
}

/** The worklist as CSV, one row per patient, for the Export button. The
 *  rows are the server's (a bounded read of the current filter). */
export function worklistCsv(
  rows: CcmEnrollment[],
  month: string,
  library: CcmCondition[] = DEFAULT_CONDITIONS,
): string {
  const header = [
    "Month",
    "Patient",
    "MRN",
    "DOB",
    "Conditions",
    "Provider",
    "Location",
    "Care Manager",
    "Minutes",
    "Requirements Met",
    "Status",
    "Last Activity",
    "Next Follow-Up",
  ];
  const lines = rows.map((row) =>
    [
      monthLabel(month),
      patientName(row),
      row.mrn ?? "",
      row.dateOfBirth ? usDate(row.dateOfBirth.slice(0, 10)) : "",
      conditionLabels(row.conditions, library).join("; "),
      row.providerName,
      row.location,
      row.careManagerName,
      row.minutes,
      `${row.requirementsMet}/${row.requirementsTotal}`,
      row.status,
      row.lastActivityOn ? usDate(row.lastActivityOn) : "",
      row.nextFollowUpOn ? usDate(row.nextFollowUpOn) : "",
    ]
      .map(csvCell)
      .join(","),
  );
  return [header.join(","), ...lines].join("\n");
}
