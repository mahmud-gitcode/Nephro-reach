import { describe, expect, it } from "vitest";
import {
  attendanceTrend,
  classDate,
  classesOn,
  formatClassDate,
  registrationSources,
  summary,
  upcomingClasses,
} from "./liveClass.data";

describe("class dates", () => {
  it("parse as the local day, not UTC midnight", () => {
    // new Date("2026-09-12") is the 11th west of Greenwich.
    expect(classDate("2026-09-12").getDate()).toBe(12);
    expect(formatClassDate("2026-09-12")).toBe("Sep 12, 2026");
  });

  it("put three classes in September and two in October", () => {
    expect(classesOn(2026, 8, 12)[0].topic).toBe("Renal Diet Basics");
    expect(classesOn(2026, 8, 13)).toHaveLength(0);
    const sept = upcomingClasses.filter(
      (c) => classDate(c.date).getMonth() === 8,
    );
    expect(sept).toHaveLength(3);
  });
});

describe("the client's figures", () => {
  it("sources add to 100%", () => {
    expect(registrationSources.reduce((sum, s) => sum + s.pct, 0)).toBe(100);
  });

  it("average attendance is this month's bar, and last month's is August", () => {
    expect(attendanceTrend.at(-1)?.value).toBe(summary.averageAttendancePct);
    expect(attendanceTrend.at(-2)?.value).toBe(summary.lastMonthAttendancePct);
  });

  it("no class is booked past its capacity", () => {
    for (const item of upcomingClasses)
      expect(item.registered).toBeLessThanOrEqual(item.capacity);
  });

  /* Pinned as given — see the header of liveClass.data.ts. */
  it("says 5 upcoming this month against 3 scheduled in September", () => {
    expect(summary.upcomingThisMonth).toBe(5);
  });
});
