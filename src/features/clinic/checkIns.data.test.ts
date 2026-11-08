import { describe, expect, it } from "vitest";
import type { CheckInSummaryRow } from "./checkInNotices.repository";
import {
  completionPct,
  officeCheckInTotals,
  truncateWords,
  weekLabel,
  weekWindow,
} from "./checkIns.data";

const row = (over: Partial<CheckInSummaryRow>): CheckInSummaryRow => ({
  patientId: "p-1",
  firstName: "Test",
  lastName: "Patient",
  mrn: null,
  from: "2026-11-01",
  to: "2026-11-03",
  daysInWindow: 3,
  checkInDays: 2,
  completionPercent: 67,
  lastCheckInDate: "2026-11-03",
  ...over,
});

const page = (items: CheckInSummaryRow[], total = items.length) => ({
  items,
  pagination: {
    mode: "offset" as const,
    total,
    page: 1,
    limit: 150,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  },
});

describe("this week", () => {
  it("labels the Sunday-to-Saturday week holding today", () => {
    expect(weekLabel("2026-10-01")).toBe("Sep 27 – Oct 3, 2026");
  });

  it("asks the server for Sunday to today", () => {
    expect(weekWindow("2026-11-03")).toEqual({
      from: "2026-11-01",
      to: "2026-11-03",
    });
  });
});

describe("office totals from the server summary", () => {
  it("sums a whole list", () => {
    const totals = officeCheckInTotals(
      page([row({}), row({ patientId: "p-2", checkInDays: 3 })]),
    );
    expect(totals).toEqual({ checkIns: 5, expected: 6, percent: 83 });
  });

  it("claims no total for a partial list (never counts a page)", () => {
    expect(officeCheckInTotals(page([row({})], 151))).toBeNull();
    expect(officeCheckInTotals(undefined)).toBeNull();
  });

  it("never divides by zero", () => {
    expect(completionPct(0, 0)).toBe(0);
    expect(officeCheckInTotals(page([]))).toEqual({
      checkIns: 0,
      expected: 0,
      percent: 0,
    });
  });
});

describe("truncateWords", () => {
  it("leaves short text alone, and says so", () => {
    expect(truncateWords("Feeling fine", 3)).toEqual({
      text: "Feeling fine",
      truncated: false,
    });
  });

  it("clips to the word limit and flags that there is more", () => {
    expect(truncateWords("one two  three four", 3)).toEqual({
      text: "one two three…",
      truncated: true,
    });
  });
});
