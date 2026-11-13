import type {
  AccessRecord,
  AccessReferral,
} from "@/features/vascular-access/vascularAccess.data";

/* ==========================================================================
   CKD access / kidney replacement therapy (KRT) planning
   --------------------------------------------------------------------------
   The client (2026-10-01): a section on the CCM checklist where the
   nephrology office marks where a patient is in planning for dialysis or
   transplant: education, the modality talk, access planning and referral,
   the access visit, and transplant referral. Each item is Yes / No / N/A.

   Practice-entered tracking only. NephroReach never decides when a patient
   medically needs an access; it records what the practice marks, shows it
   as milestones at a glance, and, once the practice has placed a vascular
   referral, follows its operational progress at the access center:
   Referral → Appointment scheduled → Appointment completed → Procedure
   scheduled → Procedure completed.

   Pure: state in, state out. Stored inside the CCM store (useCcm.ts).
   ========================================================================== */

export const KRT_ITEMS = [
  { id: "krtEducation", label: "KRT education completed" },
  { id: "modalityDiscussion", label: "Modality discussion documented" },
  { id: "accessPlanning", label: "Vascular access planning initiated" },
  { id: "accessReferral", label: "Vascular/access referral placed" },
  { id: "accessAppointment", label: "Access appointment scheduled" },
  { id: "planningCompleted", label: "Access planning completed" },
  { id: "transplantReferral", label: "Transplant referral discussed/placed" },
] as const;
export type KrtItemId = (typeof KRT_ITEMS)[number]["id"];

/** The checklist items' labels in Spanish, for display only. */
export const KRT_ITEM_LABEL_ES: Record<KrtItemId, string> = {
  krtEducation: "Educación sobre TRR completada",
  modalityDiscussion: "Conversación sobre la modalidad documentada",
  accessPlanning: "Planificación del acceso vascular iniciada",
  accessReferral: "Derivación vascular/de acceso realizada",
  accessAppointment: "Cita de acceso programada",
  planningCompleted: "Planificación del acceso completada",
  transplantReferral: "Derivación a trasplante conversada/realizada",
};

export const KRT_ANSWERS = ["Yes", "No", "N/A"] as const;
export type KrtAnswer = (typeof KRT_ANSWERS)[number];

/** Display text for an answer; the stored value stays English. */
export const KRT_ANSWER_LABEL_ES: Record<KrtAnswer, string> = {
  Yes: "Sí",
  No: "No",
  "N/A": "N/A",
};

export const ACCESS_TYPE_CHOICES = [
  "AV fistula",
  "AV graft",
  "PD catheter",
  "Other",
  "Not determined",
] as const;
export type AccessTypeChoice = (typeof ACCESS_TYPE_CHOICES)[number];

/** Display text for an access type; the stored value stays English. */
export const ACCESS_TYPE_LABEL_ES: Record<AccessTypeChoice, string> = {
  "AV fistula": "Fístula AV",
  "AV graft": "Injerto AV",
  "PD catheter": "Catéter de DP",
  Other: "Otro",
  "Not determined": "No determinado",
};

export type KidneyCarePlan = {
  /** Unanswered items are absent. */
  answers: Partial<Record<KrtItemId, KrtAnswer>>;
  accessType?: AccessTypeChoice;
  /** The practice has documented this planning in its EHR. */
  ehrDocumented: boolean;
  /** YYYY-MM-DD, set on every change. */
  updatedOn?: string;
  updatedBy?: string;
};

export const EMPTY_PLAN: KidneyCarePlan = { answers: {}, ehrDocumented: false };

export type KidneyCareChange = Partial<
  Pick<KidneyCarePlan, "accessType" | "ehrDocumented">
> & { answers?: Partial<Record<KrtItemId, KrtAnswer | undefined>> };

/** Applies one edit and stamps who made it, and when. */
export function updatePlan(
  plan: KidneyCarePlan | undefined,
  change: KidneyCareChange,
  today: string,
  by: string,
): KidneyCarePlan {
  const current = plan ?? EMPTY_PLAN;
  const answers = { ...current.answers };
  for (const [id, answer] of Object.entries(change.answers ?? {})) {
    if (answer) answers[id as KrtItemId] = answer;
    else delete answers[id as KrtItemId];
  }
  return {
    ...current,
    ...(change.accessType !== undefined
      ? { accessType: change.accessType }
      : {}),
    ...(change.ehrDocumented !== undefined
      ? { ehrDocumented: change.ehrDocumented }
      : {}),
    answers,
    updatedOn: today,
    updatedBy: by,
  };
}

/* ------------------------------------------------------- access progress */

/** The access center's visits that are procedures rather than visits. */
export const PROCEDURE_APPOINTMENTS = [
  "Access Placement Surgery",
  "PD Catheter Placement",
  "Fistulogram",
  "Catheter Exchange",
];

export const PROGRESS_STEPS = [
  "Referral",
  "Appointment scheduled",
  "Appointment completed",
  "Procedure scheduled",
  "Procedure completed",
] as const;
export type ProgressStep = (typeof PROGRESS_STEPS)[number];

/** Display text for a progress step. */
export const PROGRESS_STEP_LABEL_ES: Record<ProgressStep, string> = {
  Referral: "Derivación",
  "Appointment scheduled": "Cita programada",
  "Appointment completed": "Cita completada",
  "Procedure scheduled": "Procedimiento programado",
  "Procedure completed": "Procedimiento completado",
};

/**
 * How far the referral has got at the access center, as the number of
 * steps reached (0–5). Read from the shared access record: it reflects
 * what the access center has booked and completed, not a clinical call.
 */
export function accessProgress(
  plan: KidneyCarePlan | undefined,
  referrals: AccessReferral[],
  record: AccessRecord | undefined,
): number {
  const referred =
    plan?.answers.accessReferral === "Yes" ||
    referrals.some((r) => r.kind !== "General Message");
  if (!referred) return 0;
  const appointments = record?.appointments ?? [];
  const isProcedure = (title: string) => PROCEDURE_APPOINTMENTS.includes(title);
  const visits = appointments.filter((a) => !isProcedure(a.title));
  const procedures = appointments.filter((a) => isProcedure(a.title));
  if (procedures.some((a) => a.completed)) return 5;
  if (procedures.length > 0) return 4;
  if (visits.some((a) => a.completed)) return 3;
  if (visits.length > 0) return 2;
  return 1;
}

/* ------------------------------------------------------------ milestones */

export type MilestoneState = "done" | "partial" | "todo" | "na";

export type Milestone = { label: string; state: MilestoneState };

function fromAnswer(answer: KrtAnswer | undefined): MilestoneState {
  if (answer === "Yes") return "done";
  if (answer === "N/A") return "na";
  return "todo";
}

/** "Kidney Care Milestones": the plan at a glance. */
export function milestones(
  plan: KidneyCarePlan | undefined,
  progress: number,
  isEs = false,
): Milestone[] {
  const a = plan?.answers ?? {};
  const planning: MilestoneState =
    a.planningCompleted === "Yes"
      ? "done"
      : a.accessPlanning === "Yes"
        ? "partial"
        : fromAnswer(a.accessPlanning);
  const appointment: MilestoneState =
    progress >= 3
      ? "done"
      : progress === 2 || a.accessAppointment === "Yes"
        ? "partial"
        : a.accessAppointment === "N/A"
          ? "na"
          : "todo";
  return [
    {
      label: isEs ? "Educación sobre la ERC" : "CKD education",
      state: fromAnswer(a.krtEducation),
    },
    {
      label: isEs ? "Educación sobre la modalidad" : "Modality education",
      state: fromAnswer(a.modalityDiscussion),
    },
    {
      label: isEs
        ? "Planificación del acceso iniciada"
        : "Access planning initiated",
      state: planning,
    },
    {
      label: isEs ? "Derivación vascular" : "Vascular referral",
      state: progress >= 1 ? "done" : fromAnswer(a.accessReferral),
    },
    {
      label: isEs
        ? "Cita de acceso completada"
        : "Access appointment completed",
      state: appointment,
    },
    {
      label: isEs ? "Evaluación para trasplante" : "Transplant evaluation",
      state: fromAnswer(a.transplantReferral),
    },
  ];
}
