/* ==========================================================================
   Chronic Care Management (CCM) — shapes, seed and rules
   --------------------------------------------------------------------------
   A billing-support tracker for a nephrology office: the minutes staff
   spend on each patient in a calendar month, and the CCM requirements
   checked off, so the office knows when a month can be billed.

   Tracking only. Clinical documentation stays in the practice EHR.

   Every status and count on the page is derived here from the minutes
   logged, never stored — the client's mockup figures do not reconcile, and
   a status typed in by hand would drift from the time behind it.
   ========================================================================== */

import { patients as roster } from "./enrollment.data";

/** Minutes of care in a month before it can be billed. Client: 30, not 20. */
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
  "Other CCM Activity",
] as const;

export const OUTCOMES = [
  "Continue monitoring",
  "Education provided",
  "Medication adjusted",
  "Provider notified",
  "Referral placed",
  "Care plan updated",
] as const;

export const STAFF = [
  "Jennifer Smith, Care Manager",
  "Nurse Lisa, RN",
  "Dr. Chen, MD",
  "Dr. Patel, MD",
] as const;

export const PROVIDERS = ["Dr. Chen", "Dr. Patel"] as const;
export const LOCATIONS = ["Main Office", "North Clinic"] as const;
export const CARE_MANAGERS = ["Jennifer Smith", "Nurse Lisa"] as const;

/* "Ready for Review", not "billable": the threshold is met, and the
   practice decides whether the month is billed. */
export type CcmStatus =
  "Needs Attention" | "Below Threshold" | "Ready for Review";
export const CCM_STATUSES: CcmStatus[] = [
  "Needs Attention",
  "Below Threshold",
  "Ready for Review",
];

export type CcmPatient = {
  mrn: string;
  name: string;
  /** YYYY-MM-DD */
  dob: string;
  conditions: string[];
  provider: string;
  careManager: string;
  location: string;
};

export type FollowUp = {
  /** YYYY-MM-DD */
  date: string;
  assignee: string;
  task: string;
  done: boolean;
};

/** Whether an activity's minutes count toward the month's CCM time. Only
 *  "yes" counts; "pending" waits for the practice to decide. */
export type CountsToward = "yes" | "no" | "pending";

export const COUNTS_LABEL: Record<CountsToward, string> = {
  yes: "Yes",
  no: "No",
  pending: "Pending Review",
};

export type CcmActivity = {
  id: string;
  mrn: string;
  type: string;
  /** YYYY-MM-DD */
  date: string;
  minutes: number;
  /** HH:MM, when entered as a start and end time. */
  start?: string;
  end?: string;
  /** A short administrative note, never the clinical note, which stays in
   *  the practice EHR. May be empty. */
  note: string;
  outcome: string;
  staff: string;
  counts: CountsToward;
  /** The practice has documented this activity in its EHR. */
  ehrDocumented: boolean;
  followUp?: FollowUp;
};

export type RequirementState = {
  met: boolean;
  /** Started but not complete, e.g. care coordination under way. */
  inProgress?: boolean;
  /** YYYY-MM-DD the requirement was completed. */
  date?: string;
  detail: string;
};

export type RequirementStatus = "complete" | "in-progress" | "missing";

export function requirementStatus(state: RequirementState): RequirementStatus {
  if (state.met) return "complete";
  return state.inProgress ? "in-progress" : "missing";
}

export type InboxItem = {
  id: string;
  mrn: string;
  /** ISO 8601 */
  receivedAt: string;
  kind:
    | "Lab alert"
    | "Patient message"
    | "Hospital discharge"
    | "Medication change";
  text: string;
  resolved: boolean;
};

export type CcmState = {
  activities: CcmActivity[];
  requirements: Record<
    string,
    Partial<Record<RequirementId, RequirementState>>
  >;
  inbox: InboxItem[];
};

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

/** "2026-09" → "September 2026". */
export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
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

/* ------------------------------------------------------------------ reads */

export function activitiesFor(
  state: CcmState,
  mrn: string,
  month: string,
): CcmActivity[] {
  return state.activities
    .filter((a) => a.mrn === mrn && monthOf(a.date) === month)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
}

/** The month's CCM minutes: only activities marked to count. */
export function minutesFor(
  state: CcmState,
  mrn: string,
  month: string,
): number {
  return activitiesFor(state, mrn, month)
    .filter((a) => a.counts === "yes")
    .reduce((sum, a) => sum + a.minutes, 0);
}

/** Minutes logged but waiting on the practice's review. */
export function pendingMinutesFor(
  state: CcmState,
  mrn: string,
  month: string,
): number {
  return activitiesFor(state, mrn, month)
    .filter((a) => a.counts === "pending")
    .reduce((sum, a) => sum + a.minutes, 0);
}

export function remainingMinutes(minutes: number): number {
  return Math.max(0, CCM_THRESHOLD_MINUTES - minutes);
}

export function requirementFor(
  state: CcmState,
  mrn: string,
  id: RequirementId,
): RequirementState {
  return state.requirements[mrn]?.[id] ?? { met: false, detail: "" };
}

export function requirementsMet(state: CcmState, mrn: string): number {
  return CCM_REQUIREMENTS.filter((r) => requirementFor(state, mrn, r.id).met)
    .length;
}

export type FollowUpRow = { activity: CcmActivity; followUp: FollowUp };

export function openFollowUps(state: CcmState, mrn?: string): FollowUpRow[] {
  return state.activities
    .filter((a) => a.followUp && !a.followUp.done && (!mrn || a.mrn === mrn))
    .map((a) => ({ activity: a, followUp: a.followUp! }))
    .sort((a, b) => a.followUp.date.localeCompare(b.followUp.date));
}

/** Open follow-ups overdue or due within the next week. */
export function followUpsDue(state: CcmState, today: string): FollowUpRow[] {
  const horizon = addDays(today, 7);
  return openFollowUps(state).filter((row) => row.followUp.date <= horizon);
}

export function openInbox(state: CcmState, mrn?: string): InboxItem[] {
  return state.inbox
    .filter((item) => !item.resolved && (!mrn || item.mrn === mrn))
    .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
}

/**
 * Needs Attention outranks the minutes: an unresolved alert or an overdue
 * follow-up is something to act on today, whatever the clock says. It only
 * applies to the current month — a past month is judged on its minutes.
 */
export function statusFor(minutes: number, needsAttention: boolean): CcmStatus {
  if (needsAttention) return "Needs Attention";
  return minutes >= CCM_THRESHOLD_MINUTES
    ? "Ready for Review"
    : "Below Threshold";
}

export type WorklistRow = CcmPatient & {
  minutes: number;
  remaining: number;
  met: number;
  status: CcmStatus;
  lastActivity: string | null;
  nextFollowUp: string | null;
  openAlerts: number;
  overdue: number;
};

export function worklist(
  state: CcmState,
  patients: CcmPatient[],
  month: string,
  today: string,
): WorklistRow[] {
  const current = month === monthOf(today);
  return patients.map((patient) => {
    const minutes = minutesFor(state, patient.mrn, month);
    const followUps = openFollowUps(state, patient.mrn);
    const overdue = followUps.filter((row) => row.followUp.date < today).length;
    const openAlerts = openInbox(state, patient.mrn).length;
    const last = state.activities
      .filter((a) => a.mrn === patient.mrn && a.date <= today)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    return {
      ...patient,
      minutes,
      remaining: remainingMinutes(minutes),
      met: requirementsMet(state, patient.mrn),
      status: statusFor(minutes, current && (openAlerts > 0 || overdue > 0)),
      lastActivity: last?.date ?? null,
      nextFollowUp: followUps[0]?.followUp.date ?? null,
      openAlerts,
      overdue,
    };
  });
}

export function countStatus(rows: WorklistRow[], status: CcmStatus): number {
  return rows.filter((row) => row.status === status).length;
}

export type WorklistFilters = {
  query: string;
  provider: string;
  location: string;
  careManager: string;
  status: string;
};

export const ALL = "All";

export function filterWorklist(
  rows: WorklistRow[],
  filters: WorklistFilters,
): WorklistRow[] {
  const q = filters.query.trim().toLowerCase();
  return rows.filter(
    (row) =>
      (filters.provider === ALL || row.provider === filters.provider) &&
      (filters.location === ALL || row.location === filters.location) &&
      (filters.careManager === ALL ||
        row.careManager === filters.careManager) &&
      (filters.status === ALL || row.status === filters.status) &&
      (q === "" ||
        row.name.toLowerCase().includes(q) ||
        row.mrn.includes(q) ||
        usDate(row.dob).includes(q)),
  );
}

export type WorklistSort = {
  key: "name" | "nextFollowUp";
  direction: "asc" | "desc";
};

/** Sorted by name, or by next follow-up with "none" always last. */
export function sortWorklist(
  rows: WorklistRow[],
  sort: WorklistSort,
): WorklistRow[] {
  const sign = sort.direction === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    if (sort.key === "name") return sign * a.name.localeCompare(b.name);
    if (a.nextFollowUp === b.nextFollowUp) return 0;
    if (!a.nextFollowUp) return 1;
    if (!b.nextFollowUp) return -1;
    return sign * a.nextFollowUp.localeCompare(b.nextFollowUp);
  });
}

/** The worklist as CSV, one row per patient, for the Export button. */
export function worklistCsv(rows: WorklistRow[], month: string): string {
  const cell = (value: string | number) => {
    const text = String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
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
      row.name,
      row.mrn,
      usDate(row.dob),
      row.conditions.join("; "),
      row.provider,
      row.location,
      row.careManager,
      row.minutes,
      `${row.met}/${CCM_REQUIREMENTS.length}`,
      row.status,
      row.lastActivity ? usDate(row.lastActivity) : "",
      row.nextFollowUp ? usDate(row.nextFollowUp) : "",
    ]
      .map(cell)
      .join(","),
  );
  return [header.join(","), ...lines].join("\n");
}

/* ----------------------------------------------------------------- writes */

export function addActivity(
  state: CcmState,
  activity: Omit<CcmActivity, "id">,
  now: number,
): CcmState {
  return {
    ...state,
    activities: [...state.activities, { ...activity, id: `ccm-${now}` }],
  };
}

export function setRequirement(
  state: CcmState,
  mrn: string,
  id: RequirementId,
  change: Partial<RequirementState>,
): CcmState {
  const current = requirementFor(state, mrn, id);
  return {
    ...state,
    requirements: {
      ...state.requirements,
      [mrn]: { ...state.requirements[mrn], [id]: { ...current, ...change } },
    },
  };
}

export function setEhrDocumented(
  state: CcmState,
  activityId: string,
  ehrDocumented: boolean,
): CcmState {
  return {
    ...state,
    activities: state.activities.map((a) =>
      a.id === activityId ? { ...a, ehrDocumented } : a,
    ),
  };
}

export function completeFollowUp(
  state: CcmState,
  activityId: string,
): CcmState {
  return {
    ...state,
    activities: state.activities.map((a) =>
      a.id === activityId && a.followUp
        ? { ...a, followUp: { ...a.followUp, done: true } }
        : a,
    ),
  };
}

export function resolveInbox(state: CcmState, itemId: string): CcmState {
  return {
    ...state,
    inbox: state.inbox.map((item) =>
      item.id === itemId ? { ...item, resolved: true } : item,
    ),
  };
}

/* ------------------------------------------------------------------- seed

   The roster's first eight patients, as the nephrology office sees them.
   Activity dates sit inside the current month (and the one before), never
   after today, so the demo reads the same whenever it is opened. */

const PROFILES: Array<Omit<CcmPatient, "name">> = [
  {
    mrn: "123456",
    dob: "1953-04-12",
    conditions: ["CKD 4", "HTN", "DM"],
    provider: "Dr. Chen",
    careManager: "Jennifer Smith",
    location: "Main Office",
  },
  {
    mrn: "789012",
    dob: "1960-06-23",
    conditions: ["CKD 3", "HTN"],
    provider: "Dr. Patel",
    careManager: "Nurse Lisa",
    location: "North Clinic",
  },
  {
    mrn: "345678",
    dob: "1959-11-02",
    conditions: ["CKD 4", "DM"],
    provider: "Dr. Chen",
    careManager: "Nurse Lisa",
    location: "Main Office",
  },
  {
    mrn: "901234",
    dob: "1962-08-30",
    conditions: ["CKD 3", "HTN", "CHF"],
    provider: "Dr. Patel",
    careManager: "Jennifer Smith",
    location: "North Clinic",
  },
  {
    mrn: "567890",
    dob: "1970-01-15",
    conditions: ["CKD 4", "HTN"],
    provider: "Dr. Chen",
    careManager: "Jennifer Smith",
    location: "Main Office",
  },
  {
    mrn: "234567",
    dob: "1966-03-09",
    conditions: ["CKD 3", "DM"],
    provider: "Dr. Patel",
    careManager: "Nurse Lisa",
    location: "Main Office",
  },
  {
    mrn: "890123",
    dob: "1957-12-19",
    conditions: ["CKD 4", "HTN", "Anemia"],
    provider: "Dr. Chen",
    careManager: "Nurse Lisa",
    location: "North Clinic",
  },
  {
    mrn: "456789",
    dob: "1964-05-27",
    conditions: ["CKD 3", "HTN", "Gout"],
    provider: "Dr. Patel",
    careManager: "Jennifer Smith",
    location: "North Clinic",
  },
];

export const CCM_PATIENTS: CcmPatient[] = PROFILES.map((profile) => ({
  ...profile,
  name: roster.find((p) => p.mrn === profile.mrn)?.name ?? `MRN ${profile.mrn}`,
}));

const ALL_MET: RequirementId[] = CCM_REQUIREMENTS.map((r) => r.id);

const REQUIREMENT_DETAILS: Partial<Record<RequirementId, string>> = {
  "initiating-visit": "Completed at enrollment",
  consent: "Signed, on file",
  "care-plan": "Reviewed this quarter",
  access: "On-call process in place",
  ehr: "Up to date",
  transitions: "No recent admissions",
  communication: "Portal and phone",
};

export function seedCcmState(now: number): CcmState {
  const today = dayKey(now);
  const [y, m, d] = today.split("-").map(Number);
  /* A day in this month, never later than today. */
  const thisMonth = (day: number) =>
    `${y}-${pad(m)}-${pad(Math.max(1, Math.min(day, d)))}`;
  const lastMonthAt = new Date(y, m - 2, 1);
  const lastMonth = (day: number) =>
    `${lastMonthAt.getFullYear()}-${pad(lastMonthAt.getMonth() + 1)}-${pad(day)}`;

  let n = 0;
  const act = (
    mrn: string,
    date: string,
    type: string,
    minutes: number,
    staff: string,
    outcome: string,
    note: string,
    followUp?: Omit<FollowUp, "done">,
    extra: Partial<Pick<CcmActivity, "counts" | "ehrDocumented">> = {},
  ): CcmActivity => ({
    id: `seed-${++n}`,
    mrn,
    type,
    date,
    minutes,
    note,
    outcome,
    staff,
    counts: "yes",
    ehrDocumented: true,
    ...extra,
    ...(followUp ? { followUp: { ...followUp, done: false } } : {}),
  });

  const activities: CcmActivity[] = [
    act(
      "123456",
      thisMonth(10),
      "Lab / Test Result Review & Follow-Up",
      10,
      "Nurse Lisa, RN",
      "Provider notified",
      "Reviewed monthly labs; potassium trending up.",
    ),
    act(
      "123456",
      thisMonth(18),
      "Medication Review / Reconciliation",
      12,
      "Dr. Chen, MD",
      "Medication adjusted",
      "Reduced lisinopril dose.",
    ),
    act(
      "123456",
      thisMonth(24),
      "BP Review & Follow-Up",
      12,
      "Nurse Lisa, RN",
      "Continue monitoring",
      "Reviewed home BP readings and called patient.",
      {
        date: addDays(today, 18),
        assignee: "Nurse Lisa, RN",
        task: "Recheck BP and review log",
      },
      { ehrDocumented: false },
    ),
    act(
      "789012",
      thisMonth(6),
      "Patient Communication",
      14,
      "Jennifer Smith, Care Manager",
      "Education provided",
      "Discussed low-sodium diet.",
    ),
    act(
      "789012",
      thisMonth(20),
      "BP Review & Follow-Up",
      14,
      "Nurse Lisa, RN",
      "Continue monitoring",
      "Home readings within goal.",
      undefined,
      { counts: "pending", ehrDocumented: false },
    ),
    act(
      "345678",
      thisMonth(12),
      "Specialist / Provider Coordination",
      12,
      "Nurse Lisa, RN",
      "Referral placed",
      "Referred to vascular surgery for access planning.",
      {
        date: addDays(today, 3),
        assignee: "Nurse Lisa, RN",
        task: "Confirm vascular surgery appointment",
      },
    ),
    act(
      "567890",
      thisMonth(4),
      "Care Plan Review / Monitoring",
      16,
      "Dr. Chen, MD",
      "Care plan updated",
      "Annual care plan review.",
    ),
    act(
      "567890",
      thisMonth(22),
      "Lab / Test Result Review & Follow-Up",
      15,
      "Nurse Lisa, RN",
      "Continue monitoring",
      "eGFR stable.",
    ),
    act(
      "234567",
      thisMonth(15),
      "Medication Review / Reconciliation",
      16,
      "Dr. Patel, MD",
      "Continue monitoring",
      "Reconciled medications after pharmacy change.",
    ),
    act(
      "890123",
      lastMonth(20),
      "Patient Education / Self-Management Support",
      10,
      "Jennifer Smith, Care Manager",
      "Education provided",
      "Anemia and iron supplements.",
      {
        date: addDays(today, -4),
        assignee: "Jennifer Smith, Care Manager",
        task: "Call patient about iron infusion",
      },
    ),
    act(
      "890123",
      thisMonth(9),
      "Lab / Test Result Review & Follow-Up",
      22,
      "Dr. Chen, MD",
      "Provider notified",
      "Hemoglobin 9.1; discussed ESA.",
    ),
    act(
      "456789",
      thisMonth(3),
      "Patient Communication",
      12,
      "Jennifer Smith, Care Manager",
      "Education provided",
      "Gout flare precautions.",
    ),
    act(
      "456789",
      thisMonth(17),
      "Specialist / Provider Coordination",
      18,
      "Jennifer Smith, Care Manager",
      "Continue monitoring",
      "Coordinated with rheumatology.",
      undefined,
      { ehrDocumented: false },
    ),
    act(
      "123456",
      lastMonth(12),
      "BP Review & Follow-Up",
      20,
      "Nurse Lisa, RN",
      "Continue monitoring",
      "Monthly BP review.",
    ),
    act(
      "123456",
      lastMonth(26),
      "Lab / Test Result Review & Follow-Up",
      14,
      "Dr. Chen, MD",
      "Continue monitoring",
      "Labs stable.",
    ),
    act(
      "789012",
      lastMonth(8),
      "Medication Review / Reconciliation",
      18,
      "Dr. Patel, MD",
      "Medication adjusted",
      "Started amlodipine.",
    ),
  ];

  const requirements: CcmState["requirements"] = {};
  const missing: Record<string, RequirementId[]> = {
    "789012": ["care-plan", "transitions"],
    "345678": ["consent", "care-plan", "initiating-visit"],
    "901234": ["consent", "care-plan", "ehr", "transitions"],
    "234567": ["care-plan"],
    "890123": ["transitions"],
  };
  /* Started, not finished: coordination under way this month. */
  const started: Record<string, RequirementId[]> = {
    "789012": ["transitions"],
    "345678": ["care-plan"],
  };
  const enrolled = lastMonth(1);
  for (const patient of CCM_PATIENTS) {
    const gaps = missing[patient.mrn] ?? [];
    const underway = started[patient.mrn] ?? [];
    requirements[patient.mrn] = Object.fromEntries(
      ALL_MET.map((id) => [
        id,
        gaps.includes(id)
          ? { met: false, inProgress: underway.includes(id), detail: "" }
          : {
              met: true,
              date: enrolled,
              detail:
                id === "eligibility"
                  ? patient.conditions.join(", ")
                  : (REQUIREMENT_DETAILS[id] ?? ""),
            },
      ]),
    );
  }

  const hoursAgo = (h: number) => new Date(now - h * 3_600_000).toISOString();
  const inbox: InboxItem[] = [
    {
      id: "seed-in-1",
      mrn: "901234",
      receivedAt: hoursAgo(3),
      kind: "Lab alert",
      text: "Potassium 5.9 mmol/L",
      resolved: false,
    },
    {
      id: "seed-in-2",
      mrn: "789012",
      receivedAt: hoursAgo(20),
      kind: "Patient message",
      text: "Asked whether her BP readings are too high",
      resolved: false,
    },
    {
      id: "seed-in-3",
      mrn: "345678",
      receivedAt: hoursAgo(30),
      kind: "Hospital discharge",
      text: "Discharged after 2-day admission for fluid overload",
      resolved: false,
    },
    {
      id: "seed-in-4",
      mrn: "567890",
      receivedAt: hoursAgo(72),
      kind: "Medication change",
      text: "Pharmacy switched to generic losartan",
      resolved: true,
    },
  ];

  return { activities, requirements, inbox };
}
