/* ==========================================================================
   Peritoneal dialysis — one exchange
   --------------------------------------------------------------------------
   A PD member does not have treatments with gaps between them; they have
   four or five exchanges a day, every day. So this is its own record rather
   than a variant of the haemodialysis session, whose fields (chair time,
   fluid removed against a dry weight, the staff on shift) describe
   something that does not happen here.

   What is recorded is what the member can actually see: how much went in,
   how long it dwelled, how much came out, what strength bag was used, and
   what the drained fluid looked like.

   Ultrafiltration is NOT asked for. It is drain minus fill, and a member
   copying out a subtraction they have already made by hand is a second
   chance to get it wrong. It is computed.
   ========================================================================== */

/** Glucose strength of the bag, as printed on it. */
export type DextroseStrength = "1.5" | "2.5" | "4.25" | "icodextrin" | "other";

/**
 * What the drained fluid looked like.
 *
 * This is the one field on this form that is not bookkeeping. Cloudy
 * effluent is the classic first sign of peritonitis, and a PD member is
 * usually taught to call their unit the same day they see it. The log says
 * so rather than filing it as one more value in a row.
 */
export type EffluentClarity = "clear" | "cloudy" | "bloody" | "fibrin";

export interface PdExchange {
  id: string;
  /** ISO `yyyy-mm-dd` of the day the exchange was done. */
  date: string;
  /** Clock time it was started, as the member reads it back. */
  startTime: string;
  dextrose: DextroseStrength;
  /** Millilitres in. */
  fillMl: number;
  /** Millilitres out. */
  drainMl: number;
  /** Minutes the fluid stayed in. */
  dwellMinutes: number;
  clarity: EffluentClarity;
  /** Whether the catheter exit site looked normal. */
  exitSiteOk: boolean;
  notes: string;
  savedAt: string;
}

export type PdExchangeDraft = Omit<PdExchange, "id" | "savedAt">;

export const DEXTROSE_OPTIONS: {
  value: DextroseStrength;
  labelEn: string;
  labelEs: string;
}[] = [
  { value: "1.5", labelEn: "1.5%", labelEs: "1.5 %" },
  { value: "2.5", labelEn: "2.5%", labelEs: "2.5 %" },
  { value: "4.25", labelEn: "4.25%", labelEs: "4.25 %" },
  { value: "icodextrin", labelEn: "Icodextrin", labelEs: "Icodextrina" },
  { value: "other", labelEn: "Other", labelEs: "Otra" },
];

export const CLARITY_OPTIONS: {
  value: EffluentClarity;
  labelEn: string;
  labelEs: string;
  /** True when seeing it should send the member to their unit. */
  urgent: boolean;
}[] = [
  { value: "clear", labelEn: "Clear", labelEs: "Transparente", urgent: false },
  { value: "cloudy", labelEn: "Cloudy", labelEs: "Turbio", urgent: true },
  {
    value: "bloody",
    labelEn: "Blood-stained",
    labelEs: "Con sangre",
    urgent: true,
  },
  {
    value: "fibrin",
    labelEn: "Fibrin strands",
    labelEs: "Hebras de fibrina",
    urgent: false,
  },
];

export function dextroseLabel(value: DextroseStrength, isEs: boolean): string {
  const option = DEXTROSE_OPTIONS.find((item) => item.value === value);
  if (!option) return value;
  return isEs ? option.labelEs : option.labelEn;
}

export function clarityLabel(value: EffluentClarity, isEs: boolean): string {
  const option = CLARITY_OPTIONS.find((item) => item.value === value);
  if (!option) return value;
  return isEs ? option.labelEs : option.labelEn;
}

/** Whether this appearance is one to tell the unit about today. */
export function isUrgentClarity(value: EffluentClarity): boolean {
  return CLARITY_OPTIONS.find((item) => item.value === value)?.urgent ?? false;
}

/**
 * Fluid pulled off by one exchange: out minus in.
 *
 * Negative is a real answer, not an error — fluid retained rather than
 * removed is exactly what a member and their unit need to see, so it is
 * never clamped to zero.
 */
export function ultrafiltrationMl(exchange: {
  fillMl: number;
  drainMl: number;
}): number {
  return Math.round(exchange.drainMl - exchange.fillMl);
}

export function exchangesOn(
  exchanges: PdExchange[],
  date: string,
): PdExchange[] {
  return exchanges
    .filter((exchange) => exchange.date === date)
    .sort((a, b) => a.savedAt.localeCompare(b.savedAt));
}

/** Total fluid removed across a day, the figure a unit asks for. */
export function dailyUltrafiltrationMl(
  exchanges: PdExchange[],
  date: string,
): number {
  return exchangesOn(exchanges, date).reduce(
    (total, exchange) => total + ultrafiltrationMl(exchange),
    0,
  );
}

/** Exchanges on this day whose appearance should be reported. */
export function urgentExchangesOn(
  exchanges: PdExchange[],
  date: string,
): PdExchange[] {
  return exchangesOn(exchanges, date).filter((exchange) =>
    isUrgentClarity(exchange.clarity),
  );
}

export type PdExchangeError =
  "missing-fill" | "missing-drain" | "missing-dwell" | "missing-time";

export function exchangeError(draft: PdExchangeDraft): PdExchangeError | null {
  if (!draft.startTime.trim()) return "missing-time";
  if (!(draft.fillMl > 0)) return "missing-fill";
  /* Zero drain is a real and alarming reading, so only a missing or
     negative one is refused. */
  if (!(draft.drainMl >= 0)) return "missing-drain";
  if (!(draft.dwellMinutes > 0)) return "missing-dwell";
  return null;
}

export function upsertExchange(
  exchanges: PdExchange[],
  exchange: PdExchange,
): PdExchange[] {
  const index = exchanges.findIndex((item) => item.id === exchange.id);
  if (index === -1) return [...exchanges, exchange];
  const next = [...exchanges];
  next[index] = exchange;
  return next;
}

export function removeExchange(
  exchanges: PdExchange[],
  id: string,
): PdExchange[] {
  return exchanges.filter((exchange) => exchange.id !== id);
}
