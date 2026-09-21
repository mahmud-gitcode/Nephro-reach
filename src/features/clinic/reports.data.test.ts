import { describe, expect, it } from "vitest";
import {
  engagementMonths,
  engagementSeries,
  isImprovement,
  kpis,
  memberStatus,
  membersByProgram,
  membersTotal,
  outcomes,
  percentChange,
} from "./reports.data";

describe("outcome changes are computed, and land on the client's figures", () => {
  it.each([
    ["Hospitalizations", -38],
    ["ER Visits", -40],
    ["Completed Program", 29],
    ["Active Members", 11],
  ])("%s: %i%%", (label, expected) => {
    const row = outcomes.find((o) => o.label === label)!;
    expect(percentChange(row.thisMonth, row.lastMonth)).toBe(expected);
  });

  it("agree with the cards above them", () => {
    const er = outcomes.find((o) => o.label === "ER Visits")!;
    const erCard = kpis.find((k) => k.id === "er")!;
    expect(String(er.thisMonth)).toBe(erCard.value);
    expect(percentChange(er.thisMonth, er.lastMonth)).toBe(erCard.change);

    // 228 active of 248 members is the 92% on the Active card.
    const active = outcomes.find((o) => o.label === "Active Members")!;
    expect(Math.round((active.thisMonth / membersTotal) * 100)).toBe(92);
  });
});

describe("which way is good", () => {
  it("counts a fall in ER visits as an improvement", () => {
    expect(isImprovement(-40, true)).toBe(true);
    expect(isImprovement(12)).toBe(true);
    expect(isImprovement(-5)).toBe(false);
  });
});

describe("the charts", () => {
  it("shares add to 100%", () => {
    const sum = (rows: { pct: number }[]) =>
      rows.reduce((total, row) => total + row.pct, 0);
    expect(sum(membersByProgram)).toBe(100);
    expect(sum(memberStatus)).toBe(100);
  });

  it("gives every engagement series a point per month", () => {
    for (const series of engagementSeries)
      expect(series.points).toHaveLength(engagementMonths.length);
  });

  /* Pinned as given — see the header of reports.data.ts. */
  it("reports 248 members, against 23 enrolled elsewhere in the portal", () => {
    expect(membersTotal).toBe(248);
  });
});
