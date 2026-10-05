import { describe, expect, it } from "vitest";
import { cleanTimes, dueCheck } from "./bpReminders";

const at = (h: number, m = 0) => new Date(2026, 9, 5, h, m);

describe("blood pressure check reminders", () => {
  it("sorts and de-duplicates times", () => {
    expect(cleanTimes(["20:00", "08:00", "08:00", "bad"])).toEqual([
      "08:00",
      "20:00",
    ]);
  });

  it("asks once a time has passed, until a reading is logged after it", () => {
    const times = ["08:00", "20:00"];
    expect(dueCheck(times, [], at(7))).toBeNull();
    expect(dueCheck(times, [], at(9))).toBe("08:00");
    expect(
      dueCheck(times, [{ date: "2026-10-05", time: "08:30" }], at(9)),
    ).toBeNull();
    expect(
      dueCheck(times, [{ date: "2026-10-05", time: "08:30" }], at(21)),
    ).toBe("20:00");
  });
});
