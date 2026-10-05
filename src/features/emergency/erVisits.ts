/* ==========================================================================
   ER visit tracking — the member's weekly answer
   --------------------------------------------------------------------------
   The client (2026-10-05): once a week the member is asked "Have you been
   to the ER this week?" Answering Yes or No — from the notification or on
   the Before the ER page — logs it with the date it was reported, so ER
   visits can be followed month to month.

   A log of what the member says, nothing more: it is never read for
   symptoms or used to advise anything (see beforeTheEr.topics.ts).

   Pure: state in, state out. Storage lives in useErVisits.ts.
   ========================================================================== */

export type ErAnswer = "yes" | "no";

export type ErVisitReport = {
  /** The Monday of the week asked about, YYYY-MM-DD. */
  weekOf: string;
  answer: ErAnswer;
  /** ISO 8601, when the member answered. */
  reportedAt: string;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** The Monday of the week containing `now`, as YYYY-MM-DD. */
export function weekOf(now: number): string {
  const date = new Date(now);
  const back = (date.getDay() + 6) % 7;
  return dayKey(
    new Date(date.getFullYear(), date.getMonth(), date.getDate() - back),
  );
}

export function answerFor(
  log: ErVisitReport[],
  week: string,
): ErVisitReport | undefined {
  return log.find((report) => report.weekOf === week);
}

/** One answer per week: answering again changes that week's answer. */
export function recordAnswer(
  log: ErVisitReport[],
  answer: ErAnswer,
  now: number,
): ErVisitReport[] {
  const week = weekOf(now);
  return [
    ...log.filter((report) => report.weekOf !== week),
    { weekOf: week, answer, reportedAt: new Date(now).toISOString() },
  ].sort((a, b) => b.weekOf.localeCompare(a.weekOf));
}

/** "2026-10" for the month a report was made in. */
function monthOf(report: ErVisitReport): string {
  return dayKey(new Date(report.reportedAt)).slice(0, 7);
}

export function monthKey(now: number, monthsBack = 0): string {
  const date = new Date(now);
  const shifted = new Date(date.getFullYear(), date.getMonth() - monthsBack, 1);
  return dayKey(shifted).slice(0, 7);
}

/** Weeks answered "Yes" in a month, by the date reported. */
export function visitsIn(log: ErVisitReport[], month: string): number {
  return log.filter((r) => r.answer === "yes" && monthOf(r) === month).length;
}

/** The last `count` months, oldest first, with their Yes count. */
export function monthlyVisits(
  log: ErVisitReport[],
  now: number,
  count = 6,
): Array<{ month: string; visits: number }> {
  return Array.from({ length: count }, (_, i) => {
    const month = monthKey(now, count - 1 - i);
    return { month, visits: visitsIn(log, month) };
  });
}

/** The demo patient's history: a few months of weekly answers. */
export function seedErVisits(now: number): ErVisitReport[] {
  const yesWeeks = new Set([3, 9, 10, 18]);
  return Array.from({ length: 20 }, (_, i) => {
    const at = now - (i + 1) * 7 * 86_400_000;
    return {
      weekOf: weekOf(at),
      answer: (yesWeeks.has(i) ? "yes" : "no") as ErAnswer,
      reportedAt: new Date(at).toISOString(),
    };
  });
}
