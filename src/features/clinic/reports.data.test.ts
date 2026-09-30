import { describe, expect, it } from "vitest";
import {
  ALL_MEMBERS_LABEL,
  ALL_PROGRAMS_LABEL,
  engagementMonths,
  engagementSeries,
  isImprovement,
  memberActivityCsv,
  outcomes,
  percentChange,
  reportRows,
  rosterReport,
} from "./reports.data";
import { roster } from "./members.data";

const all = { program: ALL_PROGRAMS_LABEL, status: ALL_MEMBERS_LABEL };

describe("the report reads the clinic's roster", () => {
  it("counts the same members every other clinic page does", () => {
    const report = rosterReport(reportRows(roster, all));
    expect(report.total).toBe(roster.length);
    expect(report.kpis.find((k) => k.id === "members")!.value).toBe(
      String(roster.length),
    );
  });

  it("splits by program and status into shares that add to 100%", () => {
    const report = rosterReport(reportRows(roster, all));
    const sum = (rows: { pct: number }[]) =>
      rows.reduce((total, row) => total + row.pct, 0);
    expect(sum(report.byProgram)).toBe(100);
    expect(sum(report.byStatus)).toBe(100);
  });

  it("follows the program and member-type filters", () => {
    const program = roster[0].program;
    const rows = reportRows(roster, { program, status: "On Track" });
    expect(rows.length).toBeGreaterThan(0);
    expect(
      rows.every((m) => m.program === program && m.status === "On Track"),
    ).toBe(true);
    expect(rosterReport(rows).byProgram).toHaveLength(1);
  });

  it("exports one CSV row per member plus a header", () => {
    expect(memberActivityCsv(roster)).toHaveLength(roster.length + 1);
  });
});

describe("the sample panels", () => {
  it.each([
    ["Hospitalizations", -38],
    ["ER Visits", -40],
    ["Completed Program", 29],
    ["Active Members", 11],
  ])("%s change is computed: %i%%", (label, expected) => {
    const row = outcomes.find((o) => o.label === label)!;
    expect(percentChange(row.thisMonth, row.lastMonth)).toBe(expected);
  });

  it("counts a fall in ER visits as an improvement", () => {
    expect(isImprovement(-40, true)).toBe(true);
    expect(isImprovement(12)).toBe(true);
    expect(isImprovement(-5)).toBe(false);
  });

  it("gives every engagement series a point per month", () => {
    for (const series of engagementSeries)
      expect(series.points).toHaveLength(engagementMonths.length);
  });
});
