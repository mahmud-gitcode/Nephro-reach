/* ==========================================================================
   Dialysis modality — the shapes and the rules
   --------------------------------------------------------------------------
   Which kind of dialysis this member is on. It belongs to the member, not
   to each session: someone is on peritoneal dialysis or they are not, and
   asking them to pick it again on every entry would be asking a question
   whose answer never changes.

   Before this existed, `treatmentType` was the literal string
   "Hemodialysis", hard-coded in one form with no setter and repeated in
   every seeded row — so home haemodialysis and PD were not merely
   unselectable, they were unrepresentable.

   The three differ in what there is to record, which is why this is a type
   and not a label:

     in-center-hd  a run in a chair at a centre. Has a location and a care
                   team, and a fluid-removal figure against a dry weight.
     home-hd       the same machine and the same measurements, run by the
                   member. No centre, no staff on shift; a care partner
                   instead, and the member cannulates themselves.
     pd            exchanges, not runs. Four or five a day by hand, or
                   overnight on a cycler. Nothing is "between treatments",
                   there is no chair time, and the numbers that matter are
                   fill, dwell, drain and what came out.
   ========================================================================== */

export type DialysisModality = "in-center-hd" | "home-hd" | "pd";

/** How PD is delivered. Only meaningful when the modality is `pd`. */
export type PdSchedule = "capd" | "apd";

export interface ModalityOption {
  value: DialysisModality;
  labelEn: string;
  labelEs: string;
  /**
   * The label shortened for a tab strip on a narrow screen. "Home HD" and
   * "PD" are what members and nurses say out loud anyway.
   */
  shortEn: string;
  shortEs: string;
  /**
   * One line under the label, saying what it means for the log.
   *
   * Used where a member first PICKS their modality (settings, onboarding).
   * The tab strip on the log pages is label-only: once the choice is made,
   * a sentence under each tab is noise on every visit after the first.
   */
  hintEn: string;
  hintEs: string;
}

export const MODALITY_OPTIONS: ModalityOption[] = [
  {
    value: "in-center-hd",
    labelEn: "In-center hemodialysis",
    labelEs: "Hemodiálisis en centro",
    shortEn: "In-center",
    shortEs: "En centro",
    hintEn: "Treatments in a chair at a dialysis center.",
    hintEs: "Tratamientos en un sillón en un centro de diálisis.",
  },
  {
    value: "home-hd",
    labelEn: "Home hemodialysis",
    labelEs: "Hemodiálisis en casa",
    shortEn: "Home HD",
    shortEs: "HD en casa",
    hintEn: "The same machine and measurements, run by you at home.",
    hintEs: "La misma máquina y medidas, realizadas por usted en casa.",
  },
  {
    value: "pd",
    labelEn: "Peritoneal dialysis",
    labelEs: "Diálisis peritoneal",
    shortEn: "PD",
    shortEs: "DP",
    hintEn: "Exchanges through your catheter, by hand or on a cycler.",
    hintEs: "Intercambios por su catéter, a mano o con una cicladora.",
  },
];

export const PD_SCHEDULE_OPTIONS: {
  value: PdSchedule;
  labelEn: string;
  labelEs: string;
}[] = [
  {
    value: "capd",
    labelEn: "By hand during the day (CAPD)",
    labelEs: "A mano durante el día (CAPD)",
  },
  {
    value: "apd",
    labelEn: "Overnight on a cycler (APD)",
    labelEs: "De noche con cicladora (APD)",
  },
];

export const DEFAULT_MODALITY: DialysisModality = "in-center-hd";

export function modalityLabel(
  modality: DialysisModality,
  isEs: boolean,
): string {
  const option = MODALITY_OPTIONS.find((item) => item.value === modality);
  if (!option) return modality;
  return isEs ? option.labelEs : option.labelEn;
}

/** The tab-strip label: the same name, short enough for a phone. */
export function modalityShortLabel(
  modality: DialysisModality,
  isEs: boolean,
): string {
  const option = MODALITY_OPTIONS.find((item) => item.value === modality);
  if (!option) return modality;
  return isEs ? option.shortEs : option.shortEn;
}

export function modalityHint(
  modality: DialysisModality,
  isEs: boolean,
): string {
  const option = MODALITY_OPTIONS.find((item) => item.value === modality);
  if (!option) return "";
  return isEs ? option.hintEs : option.hintEn;
}

/**
 * Whether a chair time applies.
 *
 * A chair time is a slot a unit assigns you — "Monday, Wednesday, Friday at
 * 5:30" — and it only exists because a machine and a nurse are shared. At
 * home, on either haemo or PD, there is no queue to join: the member starts
 * when it suits them, so the page must not ask them what time they are due.
 * They still keep a run time and a reminder.
 */
export function hasChairTime(modality: DialysisModality): boolean {
  return modality === "in-center-hd";
}

/** Haemodialysis of either kind: same machine, same measurements. */
export function isHemodialysis(modality: DialysisModality): boolean {
  return modality === "in-center-hd" || modality === "home-hd";
}

/** Run by the member rather than by staff — so no centre and no shift. */
export function isHomeModality(modality: DialysisModality): boolean {
  return modality === "home-hd" || modality === "pd";
}

/**
 * Whether a treatment record should carry a centre and the staff on shift.
 *
 * A member dialysing in their own front room has neither, and printing
 * "ABC Dialysis Center · Jane Smith, RN" against their session is simply a
 * false record.
 */
export function recordsLocation(modality: DialysisModality): boolean {
  return modality === "in-center-hd";
}

/**
 * Whether the schedule reads as runs between which fluid builds up.
 *
 * False for PD, where exchanges happen every day and the whole idea of an
 * interval "between treatments" — which is how the schedule and the
 * management tab are built — does not apply.
 */
export function hasTreatmentIntervals(modality: DialysisModality): boolean {
  return isHemodialysis(modality);
}

export function isValidModality(value: unknown): value is DialysisModality {
  return MODALITY_OPTIONS.some((option) => option.value === value);
}

export function isValidPdSchedule(value: unknown): value is PdSchedule {
  return PD_SCHEDULE_OPTIONS.some((option) => option.value === value);
}

/** What the member has told us about how they dialyse. */
export interface ModalitySettings {
  modality: DialysisModality;
  /** Only read when `modality` is `pd`. */
  pdSchedule: PdSchedule;
  /** Exchanges a day on CAPD, or cycles a night on APD. */
  exchangesPerDay: number;
  updatedAt: string;
}

export const DEFAULT_MODALITY_SETTINGS: ModalitySettings = {
  modality: DEFAULT_MODALITY,
  pdSchedule: "capd",
  exchangesPerDay: 4,
  updatedAt: "",
};

/**
 * Read anything stored back into a settings object we can trust.
 *
 * Members had no modality until now, so everything already on a device
 * predates the field. An unreadable or absent value reads as in-center HD,
 * which is what every one of those records was implicitly written as.
 */
export function normalizeSettings(stored: unknown): ModalitySettings {
  if (!stored || typeof stored !== "object") return DEFAULT_MODALITY_SETTINGS;
  const raw = stored as Partial<ModalitySettings>;

  const exchanges = Number(raw.exchangesPerDay);

  return {
    modality: isValidModality(raw.modality) ? raw.modality : DEFAULT_MODALITY,
    pdSchedule: isValidPdSchedule(raw.pdSchedule) ? raw.pdSchedule : "capd",
    /* One to ten. A zero would read as "no dialysis at all", and the
       figure only ever drives wording and a count on screen. */
    exchangesPerDay:
      Number.isFinite(exchanges) && exchanges >= 1 && exchanges <= 10
        ? Math.round(exchanges)
        : 4,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : "",
  };
}
