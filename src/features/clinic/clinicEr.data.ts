import { monthKey, type ErVisitReport } from "@/features/emergency/erVisits";

/* ==========================================================================
   ER visits across a clinic's patients
   --------------------------------------------------------------------------
   The client (2026-10-05): the weekly "Have you been to the ER this week?"
   answers feed the clinic's tracking dashboard, so the office sees ER
   visits for all its patients, month to month.

   The linked demo patient's answers are their real log (read the same way
   the clinic reads their other data, clinic/useMemberFeed). The rest of
   the roster has sample answers until each patient's log comes from the
   server.
   ========================================================================== */

export type PatientErReport = {
  name: string;
  mrn: string;
  /** ISO 8601, when the patient answered Yes. */
  reportedAt: string;
};

/** Sample Yes answers for other roster patients, in weeks ago. */
const SAMPLE: Array<{ name: string; mrn: string; weeksAgo: number[] }> = [
  { name: "Mary S. Johnson", mrn: "789012", weeksAgo: [1, 9, 17] },
  { name: "John D. Smith", mrn: "123456", weeksAgo: [4, 13] },
  { name: "Angela T. Brown", mrn: "901234", weeksAgo: [2, 6, 20] },
  { name: "James K. Wilson", mrn: "567890", weeksAgo: [11] },
  { name: "Robert L. Davis", mrn: "345678", weeksAgo: [7, 15, 22] },
];

/** Every Yes answer across the clinic's patients, newest first. */
export function clinicErReports(
  linked: { name: string; mrn: string },
  linkedLog: ErVisitReport[],
  now: number,
): PatientErReport[] {
  const week = 7 * 86_400_000;
  const sample = SAMPLE.flatMap((p) =>
    p.weeksAgo.map((w) => ({
      name: p.name,
      mrn: p.mrn,
      reportedAt: new Date(now - w * week).toISOString(),
    })),
  );
  const own = linkedLog
    .filter((r) => r.answer === "yes")
    .map((r) => ({
      name: linked.name,
      mrn: linked.mrn,
      reportedAt: r.reportedAt,
    }));
  return [...own, ...sample].sort((a, b) =>
    b.reportedAt.localeCompare(a.reportedAt),
  );
}

function monthOf(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function visitsInMonth(
  reports: PatientErReport[],
  month: string,
): number {
  return reports.filter((r) => monthOf(r.reportedAt) === month).length;
}

/** The last `count` months, oldest first, with the clinic's total. */
export function clinicMonthly(
  reports: PatientErReport[],
  now: number,
  count = 6,
): Array<{ month: string; visits: number }> {
  return Array.from({ length: count }, (_, i) => {
    const month = monthKey(now, count - 1 - i);
    return { month, visits: visitsInMonth(reports, month) };
  });
}

/** Patients with an ER visit in the window, most visits first. */
export function patientsWithVisits(
  reports: PatientErReport[],
  since: number,
): Array<{ name: string; mrn: string; visits: number; latest: string }> {
  const byMrn = new Map<
    string,
    { name: string; mrn: string; visits: number; latest: string }
  >();
  for (const r of reports) {
    if (new Date(r.reportedAt).getTime() < since) continue;
    const entry = byMrn.get(r.mrn) ?? {
      name: r.name,
      mrn: r.mrn,
      visits: 0,
      latest: r.reportedAt,
    };
    entry.visits += 1;
    if (r.reportedAt > entry.latest) entry.latest = r.reportedAt;
    byMrn.set(r.mrn, entry);
  }
  return [...byMrn.values()].sort(
    (a, b) => b.visits - a.visits || b.latest.localeCompare(a.latest),
  );
}
