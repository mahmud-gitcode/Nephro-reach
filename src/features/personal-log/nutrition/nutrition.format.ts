/* Small helpers, out of the page so they can be tested without rendering
   1,300 lines of it. */

export function toNumber(value: string) {
  const parsed = parseFloat(value.replace(/,/g, ""));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
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
