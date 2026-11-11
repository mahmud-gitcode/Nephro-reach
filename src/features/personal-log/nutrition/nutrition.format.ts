/* Small helpers, out of the page so they can be tested without rendering
   1,300 lines of it. */

/** Lenient read for display only (the "= 237 ml" hint, a preset's
 *  highlight): anything unreadable or negative reads as 0. A form must not
 *  send this: it uses `parseAmount` and shows a message instead. */
export function toNumber(value: string) {
  const parsed = parseFloat(value.replace(/,/g, ""));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

/** Strict read of an amount typed into a form. An empty field is 0 (the
 *  field is optional, and 0 is "no goal" on the goals form); "1,200" and
 *  "1.5" are read; anything else (a minus sign, letters, "1.2.3") is null,
 *  so the form can say what is wrong instead of saving 0. */
export function parseAmount(value: string): number | null {
  const text = value.replace(/,/g, "").trim();
  if (text === "") return 0;
  if (!/^(\d+(\.\d*)?|\.\d+)$/.test(text)) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

export type AmountProblem = "not-a-number" | "too-large";

/** Why a typed amount cannot be saved, or null when it can. `max` is the
 *  server's own limit, so the member hears it before a refused save. */
export function amountProblem(
  value: string,
  max: number,
): AmountProblem | null {
  const parsed = parseAmount(value);
  if (parsed === null) return "not-a-number";
  if (parsed > max) return "too-large";
  return null;
}

export function formatNumber(value: number) {
  return Math.round(value).toLocaleString();
}

/** Under 80% is on track, 80-94% is close to the limit, 95%+ is over. */
export function statusForPercent(percent: number) {
  if (percent >= 95) return "over" as const;
  if (percent >= 80) return "near" as const;
  return "within" as const;
}
