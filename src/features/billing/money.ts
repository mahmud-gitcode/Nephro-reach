/* ==========================================================================
   Money on the platform consoles (Phase 14, ADR 0007)
   --------------------------------------------------------------------------
   The API keeps every amount in whole cents (priceCents, monthlyFeeCents,
   amountCents). Cents go in and come out; dollars exist only on screen.
   - Display: formatCents, always with the cents ($19.95, never $20).
   - Input: parseDollars reads the text the admin typed digit by digit, so
     "4.99" is 499 and never 498.99999 cents. Anything that is not a plain
     amount with at most two decimals is refused (null), never guessed.
   - Bounds: the API accepts 0 ≤ cents ≤ 100,000,000 ($1,000,000).
   ========================================================================== */

export const MAX_CENTS = 100_000_000;

/** "$1,995.00" from 199500 (the currency the server sent, USD default).
 *  `isEs` formats for Spanish readers (es-US); English is the default. */
export function formatCents(
  cents: number,
  currency = "USD",
  isEs = false,
): string {
  const safe = Number.isFinite(cents) ? Math.trunc(cents) : 0;
  return (safe / 100).toLocaleString(isEs ? "es-US" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const AMOUNT = /^\$?\s*(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?$/;

/** Whole cents from typed dollars ("4.99", "$1,995", "10.5"), or null when
 *  the text is not an amount the API would accept. */
export function parseDollars(text: string): number | null {
  const match = AMOUNT.exec(text.trim());
  if (!match) return null;
  const whole = Number(match[1].replace(/,/g, ""));
  const fraction = Number((match[2] ?? "").padEnd(2, "0"));
  if (!Number.isSafeInteger(whole)) return null;
  const cents = whole * 100 + fraction;
  return cents <= MAX_CENTS ? cents : null;
}

/** The input text for an amount: 499 → "4.99", 199500 → "1995.00". */
export function centsToInput(cents: number): string {
  const safe = Math.max(0, Math.trunc(cents));
  return `${Math.trunc(safe / 100)}.${String(safe % 100).padStart(2, "0")}`;
}

/** A calendar day from the API (YYYY-MM-DD) as text, without a time-zone
 *  shift: "2026-12-31" is Dec 31 everywhere. */
export function formatDay(
  day: string | null | undefined,
  isEs = false,
): string {
  if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return "—";
  const [y, m, d] = day.split("-").map(Number);
  const locale = isEs ? "es-US" : "en-US";
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(locale, {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** An instant from the API (ISO) as a local date, or "—". */
export function formatInstant(
  iso: string | null | undefined,
  isEs = false,
): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(isEs ? "es-US" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
