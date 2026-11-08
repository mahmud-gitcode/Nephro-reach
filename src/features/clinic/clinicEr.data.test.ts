import { describe, expect, it } from "vitest";
import type { ErSummaryRow } from "./checkInNotices.repository";
import {
  last90Days,
  monthWindows,
  officeErWeeks,
  patientsWithVisits,
} from "./clinicEr.data";

const row = (over: Partial<ErSummaryRow>): ErSummaryRow => ({
  patientId: "p-1",
  firstName: "Test",
  lastName: "Patient",
  mrn: "000001",
  from: "2026-10-01",
  to: "2026-10-31",
  weeksInWindow: 4,
  weeksAnswered: 4,
  erVisitWeeks: 0,
  lastErVisitWeekOf: null,
  lastAnsweredAt: null,
  ...over,
});

const page = (items: ErSummaryRow[], total = items.length) => ({
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

describe("office ER visits from the server summary", () => {
  it("builds month windows, oldest first, the last ending today", () => {
    const now = new Date(2026, 10, 3).getTime();
    const months = monthWindows(now, 3);
    expect(months.map((m) => m.month)).toEqual([
      "2026-09",
      "2026-10",
      "2026-11",
    ]);
    expect(months[0]).toMatchObject({ from: "2026-09-01", to: "2026-09-30" });
    expect(months[2]).toMatchObject({ from: "2026-11-01", to: "2026-11-03" });
  });

  it("gives a 90-day window ending today", () => {
    expect(last90Days(new Date(2026, 10, 3).getTime())).toEqual({
      from: "2026-08-06",
      to: "2026-11-03",
    });
  });

  it("totals only a whole list, never a counted page", () => {
    const rows = [
      row({ erVisitWeeks: 2 }),
      row({ patientId: "p-2", erVisitWeeks: 1 }),
    ];
    expect(officeErWeeks(page(rows))).toBe(3);
    expect(officeErWeeks(page(rows, 300))).toBeNull();
    expect(officeErWeeks(undefined)).toBeNull();
  });

  it("lists patients with a reported visit, most first", () => {
    const list = patientsWithVisits([
      row({ patientId: "a", erVisitWeeks: 0 }),
      row({ patientId: "b", erVisitWeeks: 1, lastErVisitWeekOf: "2026-10-05" }),
      row({ patientId: "c", erVisitWeeks: 3 }),
    ]);
    expect(list.map((r) => r.patientId)).toEqual(["c", "b"]);
  });
});
