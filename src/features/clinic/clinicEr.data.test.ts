import { describe, expect, it } from "vitest";
import {
  clinicErReports,
  clinicMonthly,
  patientsWithVisits,
  visitsInMonth,
} from "./clinicEr.data";

const NOW = new Date(2026, 9, 6, 12).getTime();
const linked = { name: "John Taylor", mrn: "223344" };

describe("ER visits on the clinic dashboard", () => {
  it("counts the linked patient's Yes answers with the rest of the roster", () => {
    const log = [
      {
        weekOf: "2026-09-28",
        answer: "yes" as const,
        reportedAt: new Date(2026, 9, 2).toISOString(),
      },
      {
        weekOf: "2026-09-21",
        answer: "no" as const,
        reportedAt: new Date(2026, 8, 25).toISOString(),
      },
    ];
    const reports = clinicErReports(linked, log, NOW);
    expect(reports.filter((r) => r.mrn === "223344")).toHaveLength(1);
    expect(reports.length).toBeGreaterThan(1);
    expect(reports[0].reportedAt >= reports.at(-1)!.reportedAt).toBe(true);
  });

  it("totals by month and lists the patients with visits", () => {
    const reports = [
      { name: "A", mrn: "1", reportedAt: new Date(2026, 9, 1).toISOString() },
      { name: "A", mrn: "1", reportedAt: new Date(2026, 9, 3).toISOString() },
      { name: "B", mrn: "2", reportedAt: new Date(2026, 8, 10).toISOString() },
    ];
    expect(visitsInMonth(reports, "2026-10")).toBe(2);
    expect(clinicMonthly(reports, NOW, 2)).toEqual([
      { month: "2026-09", visits: 1 },
      { month: "2026-10", visits: 2 },
    ]);
    const since = new Date(2026, 8, 1).getTime();
    expect(
      patientsWithVisits(reports, since).map((p) => [p.mrn, p.visits]),
    ).toEqual([
      ["1", 2],
      ["2", 1],
    ]);
  });
});
