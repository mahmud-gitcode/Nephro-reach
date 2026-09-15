import { describe, expect, it } from "vitest";
import {
  canSave,
  checkInError,
  currentStreak,
  emptyCheckIn,
  findByDate,
  isValidIso,
  recentDays,
  relativeDayLabel,
  removeCheckIn,
  sortByDate,
  summarise,
  todayIso,
  toggleSymptom,
  upsertCheckIn,
} from "./checkIn.rules";
import type { BetweenTreatmentCheckIn } from "./checkIn.types";

/* The interval model these rules replace filed entries under "Day 2
 * (Interdialytic)" of a numbered gap. Everything below is about the two ways
 * a date-keyed log can still lose someone's day: filing it under the wrong
 * one, or stacking two entries where there should be one. */

const NOW = new Date(2026, 8, 15, 10, 0, 0); // Tue 15 Sep 2026, local

function entry(
  date: string,
  patch: Partial<BetweenTreatmentCheckIn> = {},
): BetweenTreatmentCheckIn {
  return { ...emptyCheckIn(date), ...patch };
}

describe("dates", () => {
  it("reads today in the member's own timezone, not UTC", () => {
    // A member in UTC-5 checking in at 8pm is still on the 15th. Going
    // through toISOString() here would file it under the 16th.
    const evening = new Date(2026, 8, 15, 20, 30, 0);
    expect(todayIso(evening)).toBe("2026-09-15");
  });

  it("rejects anything that is not a real calendar day", () => {
    expect(isValidIso("2026-09-15")).toBe(true);
    expect(isValidIso("2026-02-30")).toBe(false);
    expect(isValidIso("15-09-2026")).toBe(false);
    expect(isValidIso("")).toBe(false);
  });

  it("says Today and Yesterday before it says a date", () => {
    expect(relativeDayLabel("2026-09-15", false, NOW)).toBe("Today");
    expect(relativeDayLabel("2026-09-14", false, NOW)).toBe("Yesterday");
    expect(relativeDayLabel("2026-09-15", true, NOW)).toBe("Hoy");
    expect(relativeDayLabel("2026-09-10", false, NOW)).toContain("Sep");
  });

  it("will not accept a day that has not happened", () => {
    expect(checkInError(entry("2026-09-16"), NOW)).toBe("future-date");
    expect(canSave(entry("2026-09-16"), NOW)).toBe(false);
    expect(canSave(entry("2026-09-15"), NOW)).toBe(true);
    expect(canSave(entry("2026-09-01"), NOW)).toBe(true);
  });
});

describe("one check-in per day", () => {
  it("edits the day in place rather than stacking a second entry", () => {
    const first = [entry("2026-09-14", { feeling: "good" })];
    const next = upsertCheckIn(
      first,
      entry("2026-09-14", { feeling: "rough", notes: "Cramping all evening." }),
    );

    expect(next).toHaveLength(1);
    expect(next[0].feeling).toBe("rough");
    expect(next[0].notes).toBe("Cramping all evening.");
  });

  it("keeps the list newest first however it was added", () => {
    let list: BetweenTreatmentCheckIn[] = [];
    list = upsertCheckIn(list, entry("2026-09-10"));
    list = upsertCheckIn(list, entry("2026-09-14"));
    list = upsertCheckIn(list, entry("2026-09-12"));

    expect(list.map((item) => item.date)).toEqual([
      "2026-09-14",
      "2026-09-12",
      "2026-09-10",
    ]);
  });

  it("finds and removes by date", () => {
    const list = sortByDate([entry("2026-09-14"), entry("2026-09-13")]);
    expect(findByDate(list, "2026-09-13")).toBeDefined();
    expect(removeCheckIn(list, "2026-09-13")).toHaveLength(1);
    expect(findByDate(removeCheckIn(list, "2026-09-13"), "2026-09-13")).toBe(
      undefined,
    );
  });

  it("toggles a symptom on and back off", () => {
    expect(toggleSymptom([], "Fatigue")).toEqual(["Fatigue"]);
    expect(toggleSymptom(["Fatigue"], "Fatigue")).toEqual([]);
  });
});

describe("the summary", () => {
  const list = [
    entry("2026-09-15", { feeling: "rough", symptoms: ["Fatigue", "Nausea"] }),
    entry("2026-09-14", { feeling: "okay", symptoms: ["Fatigue"] }),
    entry("2026-09-13", { feeling: "good", missedTreatment: true }),
  ];

  it("counts what the header shows", () => {
    const summary = summarise(list, NOW);
    expect(summary.logged).toBe(3);
    expect(summary.missedTreatments).toBe(1);
    expect(summary.byFeeling).toEqual({ good: 1, okay: 1, rough: 1 });
    expect(summary.topSymptom).toBe("Fatigue");
  });

  it("has no top symptom when nothing was ever logged", () => {
    expect(summarise([], NOW).topSymptom).toBeNull();
  });

  it("counts a streak back from today", () => {
    expect(currentStreak(list, NOW)).toBe(3);
  });

  it("does not reset the streak just because today is not logged yet", () => {
    // Otherwise every member sees "0-day streak" each morning until they
    // open the app, which reads as having lost their run.
    const yesterdayBack = [entry("2026-09-14"), entry("2026-09-13")];
    expect(currentStreak(yesterdayBack, NOW)).toBe(2);
  });

  it("breaks the streak on a real gap", () => {
    const gapped = [entry("2026-09-15"), entry("2026-09-13")];
    expect(currentStreak(gapped, NOW)).toBe(1);
  });
});

describe("the 14-day strip", () => {
  it("keeps unlogged days as gaps instead of closing them up", () => {
    const days = recentDays(
      [entry("2026-09-15"), entry("2026-09-09")],
      14,
      NOW,
    );

    expect(days).toHaveLength(14);
    expect(days[days.length - 1].date).toBe("2026-09-15");
    expect(days[days.length - 1].entry).not.toBeNull();
    expect(days.filter((day) => day.entry !== null)).toHaveLength(2);
  });

  it("runs oldest to newest so it reads left to right", () => {
    const days = recentDays([], 5, NOW);
    expect(days[0].date).toBe("2026-09-11");
    expect(days[4].date).toBe("2026-09-15");
  });
});
