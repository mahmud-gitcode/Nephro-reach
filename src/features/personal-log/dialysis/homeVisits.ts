/* ==========================================================================
   Home visits
   --------------------------------------------------------------------------
   A home visit is an appointment — the client said so plainly — which is
   why it sits on the management tab beside the schedule rather than in the
   treatment log. A nurse comes to the member; nothing is being dialysed.

   Who is coming matters as much as when. A biomed engineer coming to check
   the water is a different preparation from a nurse coming to look at an
   exit site, and a member who cannot tell them apart cannot get ready.
   ========================================================================== */

export type VisitProvider = "rn" | "pd-nurse" | "biomed" | "provider";
export type VisitStatus = "scheduled" | "completed" | "missed";

export interface HomeVisit {
  id: string;
  /** yyyy-mm-dd. */
  date: string;
  /** "HH:MM" on a 24h clock, or empty when the time is not settled yet. */
  time: string;
  provider: VisitProvider;
  purpose: string;
  status: VisitStatus;
  /** Whether the member wants a nudge the day before. */
  remind: boolean;
  notes: string;
}

export type HomeVisitDraft = Omit<HomeVisit, "id">;

export const VISIT_PROVIDERS: {
  value: VisitProvider;
  labelEn: string;
  labelEs: string;
}[] = [
  { value: "rn", labelEn: "Nurse (RN)", labelEs: "Enfermera (RN)" },
  { value: "pd-nurse", labelEn: "PD nurse", labelEs: "Enfermera de DP" },
  { value: "biomed", labelEn: "Biomed", labelEs: "Biomédico" },
  { value: "provider", labelEn: "Provider", labelEs: "Proveedor" },
];

export const VISIT_STATUSES: {
  value: VisitStatus;
  labelEn: string;
  labelEs: string;
}[] = [
  { value: "scheduled", labelEn: "Scheduled", labelEs: "Programada" },
  { value: "completed", labelEn: "Completed", labelEs: "Completada" },
  { value: "missed", labelEn: "Missed", labelEs: "Perdida" },
];

export function providerLabel(value: VisitProvider, isEs: boolean): string {
  const option = VISIT_PROVIDERS.find((entry) => entry.value === value);
  if (!option) return value;
  return isEs ? option.labelEs : option.labelEn;
}

export function statusLabel(value: VisitStatus, isEs: boolean): string {
  const option = VISIT_STATUSES.find((entry) => entry.value === value);
  if (!option) return value;
  return isEs ? option.labelEs : option.labelEn;
}

export function emptyVisitDraft(date: string): HomeVisitDraft {
  return {
    date,
    time: "",
    provider: "rn",
    purpose: "",
    status: "scheduled",
    remind: true,
    notes: "",
  };
}

/**
 * Why a draft cannot be saved, or null when it can.
 *
 * Only the date and who is coming are required. A member told "someone will
 * call round on Tuesday" should be able to write that down before they know
 * the hour, rather than being made to invent one.
 */
export function visitError(
  draft: HomeVisitDraft,
  isEs: boolean,
): string | null {
  if (!draft.date) {
    return isEs ? "Elige una fecha." : "Pick a date.";
  }
  if (!VISIT_PROVIDERS.some((entry) => entry.value === draft.provider)) {
    return isEs ? "Elige quién viene." : "Choose who is coming.";
  }
  return null;
}

/** Soonest first among what is still to come, then the past, newest first. */
export function sortVisits(visits: HomeVisit[], todayIso: string): HomeVisit[] {
  const key = (visit: HomeVisit) => `${visit.date} ${visit.time || "00:00"}`;

  const upcoming = visits
    .filter((visit) => visit.date >= todayIso && visit.status === "scheduled")
    .sort((a, b) => key(a).localeCompare(key(b)));

  const rest = visits
    .filter(
      (visit) => !(visit.date >= todayIso && visit.status === "scheduled"),
    )
    .sort((a, b) => key(b).localeCompare(key(a)));

  return [...upcoming, ...rest];
}

/** The next visit still ahead, which is the one worth putting in a heading. */
export function nextVisit(
  visits: HomeVisit[],
  todayIso: string,
): HomeVisit | null {
  const sorted = sortVisits(visits, todayIso);
  const first = sorted[0];
  return first && first.date >= todayIso && first.status === "scheduled"
    ? first
    : null;
}

export function upsertVisit(
  visits: HomeVisit[],
  visit: HomeVisit,
): HomeVisit[] {
  const index = visits.findIndex((entry) => entry.id === visit.id);
  if (index === -1) return [...visits, visit];

  const next = [...visits];
  next[index] = visit;
  return next;
}

export function removeVisit(visits: HomeVisit[], id: string): HomeVisit[] {
  return visits.filter((visit) => visit.id !== id);
}

/** Read stored visits back, dropping any row that is not usable. */
export function normaliseVisits(stored: unknown): HomeVisit[] {
  if (!Array.isArray(stored)) return [];

  return stored.flatMap((value) => {
    if (!value || typeof value !== "object") return [];
    const raw = value as Partial<HomeVisit>;
    if (typeof raw.id !== "string" || typeof raw.date !== "string") return [];

    return [
      {
        id: raw.id,
        date: raw.date,
        time: typeof raw.time === "string" ? raw.time : "",
        provider: VISIT_PROVIDERS.some((entry) => entry.value === raw.provider)
          ? (raw.provider as VisitProvider)
          : "rn",
        purpose: typeof raw.purpose === "string" ? raw.purpose : "",
        status: VISIT_STATUSES.some((entry) => entry.value === raw.status)
          ? (raw.status as VisitStatus)
          : "scheduled",
        remind: raw.remind !== false,
        notes: typeof raw.notes === "string" ? raw.notes : "",
      },
    ];
  });
}
