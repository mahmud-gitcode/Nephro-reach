import { describe, expect, it } from "vitest";
import {
  addReading,
  bpError,
  byDay,
  readingsCsv,
  removeReading,
  statusOf,
  trend,
  updateReading,
  type BpDraft,
} from "./bloodPressure";

const draft: BpDraft = {
  date: "2026-09-29",
  time: "08:00",
  systolic: 128,
  diastolic: 78,
  pulse: 70,
  position: "Sitting",
  symptoms: "None",
  medication: "Taken",
  notes: "",
};

describe("blood pressure", () => {
  it("reads status from the page's guide", () => {
    expect(statusOf({ systolic: 145, diastolic: 80 })).toBe("High");
    expect(statusOf({ systolic: 120, diastolic: 91 })).toBe("High");
    expect(statusOf({ systolic: 132, diastolic: 78 })).toBe("Elevated");
    expect(statusOf({ systolic: 125, diastolic: 82 })).toBe("Elevated");
    expect(statusOf({ systolic: 118, diastolic: 74 })).toBe("Normal");
  });

  it("refuses impossible or future readings", () => {
    expect(bpError(draft, "2026-09-30")).toBeNull();
    expect(bpError({ ...draft, date: "2026-10-01" }, "2026-09-30")).toBe(
      "date",
    );
    expect(bpError({ ...draft, systolic: 20 }, "2026-09-30")).toBe("systolic");
    expect(bpError({ ...draft, diastolic: 130 }, "2026-09-30")).toBe("order");
  });

  it("adds, edits and deletes", () => {
    let list = addReading([], draft, 1);
    list = addReading(list, { ...draft, time: "20:00", systolic: 150 }, 2);
    expect(byDay(list)[0].readings.map((r) => r.time)).toEqual([
      "20:00",
      "08:00",
    ]);
    list = updateReading(list, list[0].id, { ...draft, systolic: 131 });
    expect(list[0].systolic).toBe(131);
    list = removeReading(list, list[1].id);
    expect(list).toHaveLength(1);
  });

  it("exports CSV and trends the last seven, oldest first", () => {
    const list = Array.from(
      { length: 9 },
      (_, i) =>
        addReading([], { ...draft, date: `2026-09-${String(10 + i)}` }, i)[0],
    );
    expect(trend(list).map((r) => r.date)[0]).toBe("2026-09-12");
    expect(readingsCsv(list).split("\n")).toHaveLength(10);
  });
});
