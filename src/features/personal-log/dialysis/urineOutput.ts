/* ==========================================================================
   Urine output
   --------------------------------------------------------------------------
   Residual kidney function is worth protecting, and a falling output is one
   of the earliest signs it is going. Members are asked to record every
   passing, however small, which is why an entry is a time and a volume
   rather than one figure typed at the end of the day.

   On the management tab rather than the treatment log: it is recorded
   across the whole day, not during a run.
   ========================================================================== */

export interface UrineEntry {
  id: string;
  /** yyyy-mm-dd. */
  date: string;
  /** "HH:MM" on a 24h clock. */
  time: string;
  /** Free text, because members type "200", "200ml" and "abt 200". */
  amountMl: string;
}

export type UrineEntryDraft = Omit<UrineEntry, "id">;

export function emptyUrineDraft(date: string, time: string): UrineEntryDraft {
  return { date, time, amountMl: "" };
}

/** Read a typed volume. Null when there is no number in it at all. */
export function parseMl(value: string): number | null {
  const cleaned = value.replace(",", ".").replace(/[^0-9.]/g, "");
  if (!cleaned) return null;

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function entryError(
  draft: UrineEntryDraft,
  isEs: boolean,
): string | null {
  if (!draft.date) return isEs ? "Elige una fecha." : "Pick a date.";
  if (parseMl(draft.amountMl) === null) {
    return isEs ? "Escribe una cantidad." : "Enter an amount.";
  }
  return null;
}

export function entriesOn(entries: UrineEntry[], date: string): UrineEntry[] {
  return entries
    .filter((entry) => entry.date === date)
    .sort((a, b) => a.time.localeCompare(b.time));
}

/**
 * The day's total in mL.
 *
 * Entries it cannot read are skipped rather than counted as zero: a total
 * that quietly ignores a passing is worse than one built from what is
 * legible, because it reads as a real fall in output.
 */
export function totalOn(entries: UrineEntry[], date: string): number {
  return entriesOn(entries, date).reduce((sum, entry) => {
    const ml = parseMl(entry.amountMl);
    return ml === null ? sum : sum + ml;
  }, 0);
}

/** The dates that have any entry, newest first. */
export function recordedDates(entries: UrineEntry[]): string[] {
  return [...new Set(entries.map((entry) => entry.date))].sort((a, b) =>
    b.localeCompare(a),
  );
}

export function upsertEntry(
  entries: UrineEntry[],
  entry: UrineEntry,
): UrineEntry[] {
  const index = entries.findIndex((item) => item.id === entry.id);
  if (index === -1) return [...entries, entry];

  const next = [...entries];
  next[index] = entry;
  return next;
}

export function removeEntry(entries: UrineEntry[], id: string): UrineEntry[] {
  return entries.filter((entry) => entry.id !== id);
}

/** Read stored entries back, dropping any row that cannot be shown. */
export function normaliseEntries(stored: unknown): UrineEntry[] {
  if (!Array.isArray(stored)) return [];

  return stored.flatMap((value) => {
    if (!value || typeof value !== "object") return [];
    const raw = value as Partial<UrineEntry>;
    if (typeof raw.id !== "string" || typeof raw.date !== "string") return [];

    return [
      {
        id: raw.id,
        date: raw.date,
        time: typeof raw.time === "string" ? raw.time : "",
        amountMl: typeof raw.amountMl === "string" ? raw.amountMl : "",
      },
    ];
  });
}
