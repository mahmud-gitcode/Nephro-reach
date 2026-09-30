/* ==========================================================================
   CCM conditions — the library and a patient's list
   --------------------------------------------------------------------------
   The client's list (2026-09-30) for a nephrology-focused CCM dashboard:
   broad enough for the chronic conditions that drive care-management work,
   short enough that staff are not scrolling through hundreds of diagnoses.

   Not a fixed list. The defaults live here so a new clinic starts with
   them, but the clinic's Administrator manages its own library: turns off
   what the practice never sees and adds what it does. Anything still
   missing goes in as "Other" on the patient.

   A patient's conditions are stored as library ids ("ckd-4"), or as the
   typed text for an "Other" entry. The worklist shows the short names of
   the first two, most important first, and "+N" for the rest; the patient
   record carries the full list.
   ========================================================================== */

export const CONDITION_GROUPS = [
  "Kidney / Renal",
  "Cardiovascular",
  "Endocrine / Metabolic",
  "CKD-Related",
  "Other Chronic Conditions",
] as const;
export type ConditionGroup = (typeof CONDITION_GROUPS)[number];

export type CcmCondition = {
  id: string;
  /** The full name, for the patient record and the export. */
  label: string;
  /** The worklist's abbreviation. */
  short: string;
  group: ConditionGroup;
  /** Temporary rather than chronic (AKI): listed, but it does not count
   *  toward the two chronic conditions CCM needs. */
  secondary?: boolean;
  /** Added by the clinic, so the clinic may delete it. */
  custom?: boolean;
  /** Offered in the dropdown. Turning one off never removes it from a
   *  patient who already has it. */
  active: boolean;
};

const c = (
  id: string,
  label: string,
  short: string,
  group: ConditionGroup,
  secondary = false,
): CcmCondition => ({
  id,
  label,
  short,
  group,
  active: true,
  ...(secondary ? { secondary: true } : {}),
});

/** In priority order: the worklist shows conditions in this order, so the
 *  kidney stage leads and a gout diagnosis never pushes CHF off the row. */
export const DEFAULT_CONDITIONS: CcmCondition[] = [
  c("ckd-1", "Chronic Kidney Disease (CKD) Stage 1", "CKD 1", "Kidney / Renal"),
  c("ckd-2", "CKD Stage 2", "CKD 2", "Kidney / Renal"),
  c("ckd-3a", "CKD Stage 3a", "CKD 3a", "Kidney / Renal"),
  c("ckd-3b", "CKD Stage 3b", "CKD 3b", "Kidney / Renal"),
  c("ckd-4", "CKD Stage 4", "CKD 4", "Kidney / Renal"),
  c("ckd-5", "CKD Stage 5 — Not on Dialysis", "CKD 5", "Kidney / Renal"),
  c(
    "eskd",
    "End-Stage Kidney Disease (ESKD) / Dialysis",
    "ESKD",
    "Kidney / Renal",
  ),
  c("aki", "Acute Kidney Injury (AKI)", "AKI", "Kidney / Renal", true),
  c(
    "proteinuria",
    "Proteinuria / Albuminuria",
    "Proteinuria",
    "Kidney / Renal",
  ),
  c("nephrotic", "Nephrotic Syndrome", "Nephrotic", "Kidney / Renal"),
  c("pkd", "Polycystic Kidney Disease", "PKD", "Kidney / Renal"),

  c(
    "chf",
    "Congestive Heart Failure / Heart Failure (CHF/HF)",
    "CHF",
    "Cardiovascular",
  ),
  c("htn", "Hypertension (HTN)", "HTN", "Cardiovascular"),
  c(
    "resistant-htn",
    "Resistant Hypertension",
    "Resistant HTN",
    "Cardiovascular",
  ),
  c("cad", "Coronary Artery Disease (CAD)", "CAD", "Cardiovascular"),
  c("afib", "Atrial Fibrillation", "AFib", "Cardiovascular"),
  c("pad", "Peripheral Arterial Disease (PAD)", "PAD", "Cardiovascular"),

  c("t2dm", "Type 2 Diabetes", "T2DM", "Endocrine / Metabolic"),
  c("t1dm", "Type 1 Diabetes", "T1DM", "Endocrine / Metabolic"),
  c("obesity", "Obesity", "Obesity", "Endocrine / Metabolic"),
  c("hyperlipidemia", "Hyperlipidemia", "HLD", "Endocrine / Metabolic"),
  c("gout", "Gout", "Gout", "Endocrine / Metabolic"),
  c("thyroid", "Thyroid Disorder", "Thyroid", "Endocrine / Metabolic"),

  c("anemia-ckd", "Anemia of CKD", "Anemia", "CKD-Related"),
  c("shpt", "Secondary Hyperparathyroidism", "SHPT", "CKD-Related"),
  c(
    "ckd-mbd",
    "CKD-Mineral and Bone Disorder (CKD-MBD)",
    "CKD-MBD",
    "CKD-Related",
  ),
  c("hyperkalemia", "Hyperkalemia", "HyperK", "CKD-Related"),
  c("metabolic-acidosis", "Metabolic Acidosis", "Met. Acidosis", "CKD-Related"),

  c("copd", "COPD", "COPD", "Other Chronic Conditions"),
  c("asthma", "Asthma", "Asthma", "Other Chronic Conditions"),
  c("liver", "Chronic Liver Disease", "CLD", "Other Chronic Conditions"),
  c(
    "dementia",
    "Dementia / Cognitive Impairment",
    "Dementia",
    "Other Chronic Conditions",
  ),
  c("depression", "Depression", "Depression", "Other Chronic Conditions"),
  c("anxiety", "Anxiety", "Anxiety", "Other Chronic Conditions"),
  c(
    "oa-pain",
    "Osteoarthritis / Chronic Pain",
    "OA/Pain",
    "Other Chronic Conditions",
  ),
];

/** Older free-text entries, read as the library condition they meant. */
const ALIASES: Record<string, string> = {
  "ckd 3": "ckd-3a",
  dm: "t2dm",
  diabetes: "t2dm",
  anemia: "anemia-ckd",
  hf: "chf",
};

/* ----------------------------------------------------------- the library */

/** What the clinic has changed: its own additions, and the defaults it
 *  switched off. The defaults themselves stay in code, so a correction to
 *  one reaches every clinic. */
export type ConditionLibraryState = {
  custom: CcmCondition[];
  inactive: string[];
};

export const EMPTY_LIBRARY: ConditionLibraryState = {
  custom: [],
  inactive: [],
};

/** Defaults then the clinic's own, each with whether it is offered. */
export function libraryOf(state: ConditionLibraryState): CcmCondition[] {
  const off = new Set(state.inactive);
  return [...DEFAULT_CONDITIONS, ...state.custom].map((condition) => ({
    ...condition,
    active: !off.has(condition.id),
  }));
}

export type ConditionDraft = {
  label: string;
  short: string;
  group: ConditionGroup;
};

/** Why a new library condition cannot be added, or null. */
export function conditionDraftError(
  draft: ConditionDraft,
  library: CcmCondition[],
): string | null {
  const label = draft.label.trim();
  if (label.length < 2) return "Enter the condition's name.";
  if (draft.short.trim().length > 16)
    return "Keep the short name to 16 characters.";
  const taken = library.some(
    (condition) => condition.label.toLowerCase() === label.toLowerCase(),
  );
  if (taken) return "That condition is already in the library.";
  return null;
}

export function addLibraryCondition(
  state: ConditionLibraryState,
  draft: ConditionDraft,
): ConditionLibraryState {
  const label = draft.label.trim();
  return {
    ...state,
    custom: [
      ...state.custom,
      {
        id: `custom:${label}`,
        label,
        short: draft.short.trim() || label,
        group: draft.group,
        custom: true,
        active: true,
      },
    ],
  };
}

export function setConditionActive(
  state: ConditionLibraryState,
  id: string,
  active: boolean,
): ConditionLibraryState {
  const inactive = state.inactive.filter((other) => other !== id);
  return { ...state, inactive: active ? inactive : [...inactive, id] };
}

/** Only the clinic's own additions can be deleted; a default can be
 *  turned off instead. Patients who have it keep it. */
export function removeLibraryCondition(
  state: ConditionLibraryState,
  id: string,
): ConditionLibraryState {
  return {
    custom: state.custom.filter((condition) => condition.id !== id),
    inactive: state.inactive.filter((other) => other !== id),
  };
}

/* ------------------------------------------------------ a patient's list */

export type ResolvedCondition = {
  /** What is stored on the patient. */
  value: string;
  label: string;
  short: string;
  /** Position in the library; "Other" entries sort after it. */
  rank: number;
  secondary: boolean;
  other: boolean;
};

/**
 * What a stored value means: a library condition by id, short name, full
 * name or an old alias; otherwise an "Other" entry shown as typed. A
 * clinic condition that was deleted from the library still reads as its
 * name, which is kept in its id.
 */
export function resolveCondition(
  value: string,
  library: CcmCondition[] = DEFAULT_CONDITIONS,
): ResolvedCondition {
  const key = value.trim().toLowerCase();
  const target = ALIASES[key] ?? key;
  const index = library.findIndex(
    (condition) =>
      condition.id.toLowerCase() === target ||
      condition.short.toLowerCase() === target ||
      condition.label.toLowerCase() === target,
  );
  if (index >= 0) {
    const condition = library[index];
    return {
      value,
      label: condition.label,
      short: condition.short,
      rank: index,
      secondary: Boolean(condition.secondary),
      other: false,
    };
  }
  const text = value.startsWith("custom:") ? value.slice(7) : value.trim();
  return {
    value,
    label: text,
    short: text,
    rank: library.length,
    secondary: false,
    other: true,
  };
}

/** A patient's conditions, most important first. */
export function sortedConditions(
  values: string[],
  library: CcmCondition[] = DEFAULT_CONDITIONS,
): ResolvedCondition[] {
  return values
    .map((value) => resolveCondition(value, library))
    .sort((a, b) => a.rank - b.rank || a.label.localeCompare(b.label));
}

/** Full names, for the patient record and the export. */
export function conditionLabels(
  values: string[],
  library: CcmCondition[] = DEFAULT_CONDITIONS,
): string[] {
  return sortedConditions(values, library).map((c) => c.label);
}

/**
 * The worklist's line: the short names of the first `shown` conditions,
 * and how many more there are — "CKD 4 · HTN" and 2 → "CKD 4 · HTN +2".
 */
export function conditionSummary(
  values: string[],
  library: CcmCondition[] = DEFAULT_CONDITIONS,
  shown = 2,
): { text: string; more: number; full: string } {
  const sorted = sortedConditions(values, library);
  return {
    text: sorted
      .slice(0, shown)
      .map((c) => c.short)
      .join(" · "),
    more: Math.max(0, sorted.length - shown),
    full: sorted.map((c) => c.label).join(", "),
  };
}

/** Chronic conditions only — what CCM's "two or more" counts. */
export function chronicCount(
  values: string[],
  library: CcmCondition[] = DEFAULT_CONDITIONS,
): number {
  return sortedConditions(values, library).filter((c) => !c.secondary).length;
}

/** Whether a patient has a library condition, however it was stored. */
export function hasCondition(
  values: string[],
  id: string,
  library: CcmCondition[] = DEFAULT_CONDITIONS,
): boolean {
  return values.some((value) => {
    const resolved = resolveCondition(value, library);
    return !resolved.other && library[resolved.rank]?.id === id;
  });
}
