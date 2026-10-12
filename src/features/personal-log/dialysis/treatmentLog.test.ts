import { describe, expect, it } from "vitest";
import type { SchedulePeriod } from "./schedule";
import {
  attendanceOf,
  durationLabel,
  fluidRemovedKg,
  minutesBetween,
  missedEntry,
  monthSummary,
  recentSessions,
  uncharted,
} from "./treatmentLog";

const MWF: SchedulePeriod[] = [
  {
    fromKey: "0000-01-01",
    days: ["Monday", "Wednesday", "Friday"],
    chairTimes: { Monday: "05:30", Wednesday: "06:00", Friday: "05:30" },
    reminderLeadMinutes: 60,
    durations: { Monday: 240, Wednesday: 210, Friday: 240 },
  },
];

/* 2026-10-12 is a Monday. */
const TODAY = "2026-10-12";

describe("treatment sessions from the schedule", () => {
  it("lists prescribed days, newest first, with chair time and length", () => {
    const sessions = recentSessions(MWF, [], TODAY, 7);
    expect(sessions.map((s) => s.date)).toEqual([
      "2026-10-12",
      "2026-10-09",
      "2026-10-07",
    ]);
    expect(sessions[2]).toMatchObject({
      chairTime: "06:00",
      durationMinutes: 210,
    });
  });

  it("asks about past days with nothing charted", () => {
    const missed = missedEntry("2026-10-09", "in-center-hd", 1);
    const makeUp = {
      ...missedEntry("2026-10-10", "in-center-hd", 2),
      status: "rescheduled" as const,
      makeupFor: "2026-10-07",
    };
    expect(uncharted(MWF, [missed, makeUp], TODAY).map((s) => s.date)).toEqual(
      [],
    );
    expect(uncharted(MWF, [], TODAY).map((s) => s.date)).toEqual([
      "2026-10-09",
      "2026-10-07",
    ]);
  });
});

describe("the numbers a treatment carries", () => {
  it("works out the run length and the fluid removed", () => {
    expect(minutesBetween("07:30", "11:45")).toBe(255);
    expect(minutesBetween("23:00", "01:00")).toBe(120);
    expect(durationLabel(255)).toBe("4h 15m");
    expect(fluidRemovedKg("74.7", "72.4")).toBe(2.3);
    expect(fluidRemovedKg("", "72")).toBeNull();
  });

  it("counts the month", () => {
    const missed = missedEntry("2026-10-09", "in-center-hd", 1);
    const attended = {
      ...missedEntry("2026-10-07", "in-center-hd", 2),
      status: "attended" as const,
      arrivedLate: "Yes" as const,
    };
    expect(attendanceOf(attended)).toBe("Arrived Late");
    expect(monthSummary([missed, attended], "2026-10")).toMatchObject({
      attended: 1,
      missed: 1,
      arrivedLate: 1,
    });
  });
});
