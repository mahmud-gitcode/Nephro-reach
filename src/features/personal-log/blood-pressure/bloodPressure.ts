/* ==========================================================================
   Blood pressure — the member's readings
   --------------------------------------------------------------------------
   Pure: readings in, readings out. The page's status badges, the trend and
   the export are all read from the same list, and a status is worked out
   from the numbers by the thresholds the page's own guide states, never
   typed in.
   ========================================================================== */

export const POSITIONS = ["Sitting", "Standing"] as const;
export type Position = (typeof POSITIONS)[number];

export const SYMPTOMS = [
  "None",
  "Mild headache",
  "Dizzy",
  "Tired",
  "Short breath",
] as const;

export const MEDICATION_STATES = ["Taken", "Late", "Not taken"] as const;
export type MedicationState = (typeof MEDICATION_STATES)[number];

export type BpReading = {
  id: string;
  /** yyyy-mm-dd */
  date: string;
  /** HH:MM, 24-hour */
  time: string;
  systolic: number;
  diastolic: number;
  pulse: number;
  position: Position;
  symptoms: string;
  medication: MedicationState;
  mood?: string;
  notes: string;
  /** A photo taken with the reading, e.g. of the monitor (2026-10-06). */
  photo?: string;
};

export type BpDraft = Omit<BpReading, "id">;

/* The American Heart Association's five categories, the chart the client
   sent (2026-10-12). The guide card and every reading's badge come from this
   one table, so they cannot disagree. A reference, not advice: what to do
   about a reading stays with the member's care team. */
export type BpStatus = "Normal" | "Elevated" | "Stage 1" | "Stage 2" | "Crisis";

export const BP_CATEGORIES: ReadonlyArray<{
  status: BpStatus;
  en: string;
  es: string;
  systolic: string;
  join: "and" | "or" | "and/or";
  diastolic: string;
  tone: "success" | "warning" | "danger";
}> = [
  {
    status: "Normal",
    en: "Normal",
    es: "Normal",
    systolic: "Less than 120",
    join: "and",
    diastolic: "Less than 80",
    tone: "success",
  },
  {
    status: "Elevated",
    en: "Elevated",
    es: "Elevada",
    systolic: "120–129",
    join: "and",
    diastolic: "Less than 80",
    tone: "warning",
  },
  {
    status: "Stage 1",
    en: "High Blood Pressure (Hypertension) Stage 1",
    es: "Presión Arterial Alta (Hipertensión) Etapa 1",
    systolic: "130–139",
    join: "or",
    diastolic: "80–89",
    tone: "warning",
  },
  {
    status: "Stage 2",
    en: "High Blood Pressure (Hypertension) Stage 2",
    es: "Presión Arterial Alta (Hipertensión) Etapa 2",
    systolic: "140 or higher",
    join: "or",
    diastolic: "90 or higher",
    tone: "danger",
  },
  {
    status: "Crisis",
    en: "Severe Hypertension",
    es: "Hipertensión Grave",
    systolic: "Higher than 180",
    join: "and/or",
    diastolic: "Higher than 120",
    tone: "danger",
  },
];

export function categoryOf(status: BpStatus) {
  return BP_CATEGORIES.find((c) => c.status === status) ?? BP_CATEGORIES[0];
}

/** The reading's AHA category. */
export function statusOf(
  reading: Pick<BpReading, "systolic" | "diastolic">,
): BpStatus {
  const { systolic, diastolic } = reading;
  if (systolic > 180 || diastolic > 120) return "Crisis";
  if (systolic >= 140 || diastolic >= 90) return "Stage 2";
  if (systolic >= 130 || diastolic >= 80) return "Stage 1";
  if (systolic >= 120) return "Elevated";
  return "Normal";
}

/** Stage 2 or above — what used to read "High". */
export function isHigh(reading: Pick<BpReading, "systolic" | "diastolic">) {
  const status = statusOf(reading);
  return status === "Stage 2" || status === "Crisis";
}

/* How the member answered "Did I take my blood pressure medication as
   prescribed today?", as a share of the day: Taken counts fully, Late half. */
const TAKEN_SHARE: Record<MedicationState, number> = {
  Taken: 100,
  Late: 50,
  "Not taken": 0,
};

/** For each reading in the trend, that day's medication compliance (%). */
export function complianceTrend(readings: BpReading[]): number[] {
  const points = trend(readings);
  return points.map((point) => {
    const sameDay = readings.filter((r) => r.date === point.date);
    const total = sameDay.reduce(
      (sum, r) => sum + TAKEN_SHARE[r.medication],
      0,
    );
    return Math.round(total / Math.max(sameDay.length, 1));
  });
}

export type BpError =
  "date" | "time" | "systolic" | "diastolic" | "pulse" | "order";

/** The first thing wrong with a draft, or null. Ranges a home cuff can read. */
export function bpError(draft: BpDraft, today: string): BpError | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date) || draft.date > today)
    return "date";
  if (!/^\d{2}:\d{2}$/.test(draft.time)) return "time";
  const within = (n: number, lo: number, hi: number) =>
    Number.isFinite(n) && n >= lo && n <= hi;
  if (!within(draft.systolic, 60, 260)) return "systolic";
  if (!within(draft.diastolic, 30, 160)) return "diastolic";
  if (!within(draft.pulse, 30, 220)) return "pulse";
  if (draft.diastolic >= draft.systolic) return "order";
  return null;
}

/** Newest first. */
export function sortReadings(readings: BpReading[]): BpReading[] {
  return [...readings].sort((a, b) =>
    `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`),
  );
}

/** The list grouped by day, newest day first. */
export function byDay(
  readings: BpReading[],
): Array<{ date: string; readings: BpReading[] }> {
  const groups = new Map<string, BpReading[]>();
  for (const reading of sortReadings(readings)) {
    groups.set(reading.date, [...(groups.get(reading.date) ?? []), reading]);
  }
  return [...groups.entries()].map(([date, list]) => ({
    date,
    readings: list,
  }));
}

export function addReading(
  readings: BpReading[],
  draft: BpDraft,
  now: number,
): BpReading[] {
  return [
    ...readings,
    { ...draft, notes: draft.notes.trim(), id: `bp-${now}` },
  ];
}

export function updateReading(
  readings: BpReading[],
  id: string,
  draft: BpDraft,
): BpReading[] {
  return readings.map((r) =>
    r.id === id ? { ...draft, notes: draft.notes.trim(), id } : r,
  );
}

export function removeReading(readings: BpReading[], id: string): BpReading[] {
  return readings.filter((r) => r.id !== id);
}

/** The last seven readings, oldest first, for the trend. */
export function trend(readings: BpReading[]): BpReading[] {
  return sortReadings(readings).slice(0, 7).reverse();
}

/** The readings as CSV, for Export. */
export function readingsCsv(readings: BpReading[]): string {
  const cell = (value: string | number) => {
    const text = String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const header = [
    "Date",
    "Time",
    "Systolic",
    "Diastolic",
    "Pulse",
    "Status",
    "Position",
    "Symptoms",
    "Medication",
    "Notes",
  ];
  const rows = sortReadings(readings).map((r) =>
    [
      r.date,
      r.time,
      r.systolic,
      r.diastolic,
      r.pulse,
      statusOf(r),
      r.position,
      r.symptoms,
      r.medication,
      r.notes,
    ]
      .map(cell)
      .join(","),
  );
  return [header.join(","), ...rows].join("\n");
}

/* ------------------------------------------------------------------ seed
   The demo patient's readings (lib/data/storage sampleOr): a member who
   registered themselves starts with none. */
function reading(
  id: string,
  date: string,
  time: string,
  systolic: number,
  diastolic: number,
  pulse: number,
  position: Position,
  symptoms: string,
  medication: MedicationState,
): BpReading {
  return {
    id,
    date,
    time,
    systolic,
    diastolic,
    pulse,
    position,
    symptoms,
    medication,
    notes: "",
  };
}

export const SEED_READINGS: BpReading[] = [
  reading(
    "seed-bp-1",
    "2026-05-05",
    "00:00",
    123,
    78,
    72,
    "Sitting",
    "None",
    "Taken",
  ),
  reading(
    "seed-bp-2",
    "2026-05-05",
    "08:15",
    132,
    84,
    76,
    "Standing",
    "Mild headache",
    "Taken",
  ),
  reading(
    "seed-bp-3",
    "2026-05-05",
    "21:30",
    118,
    74,
    70,
    "Sitting",
    "None",
    "Taken",
  ),
  reading(
    "seed-bp-4",
    "2026-05-04",
    "07:45",
    145,
    92,
    81,
    "Sitting",
    "Dizzy",
    "Late",
  ),
  reading(
    "seed-bp-5",
    "2026-05-04",
    "13:20",
    138,
    86,
    78,
    "Standing",
    "Tired",
    "Taken",
  ),
  reading(
    "seed-bp-6",
    "2026-05-04",
    "22:10",
    129,
    80,
    74,
    "Sitting",
    "None",
    "Taken",
  ),
  reading(
    "seed-bp-7",
    "2026-05-03",
    "06:55",
    126,
    79,
    73,
    "Sitting",
    "None",
    "Taken",
  ),
  reading(
    "seed-bp-8",
    "2026-05-03",
    "15:00",
    141,
    89,
    82,
    "Standing",
    "Short breath",
    "Taken",
  ),
  reading(
    "seed-bp-9",
    "2026-05-03",
    "21:05",
    122,
    77,
    71,
    "Sitting",
    "None",
    "Taken",
  ),
];
