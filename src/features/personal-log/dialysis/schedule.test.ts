import { describe, expect, it } from "vitest";
import {
  addDays,
  appendSchedulePeriod,
  DEFAULT_CHAIR_TIME,
  DEFAULT_DURATION_MINUTES,
  buildSchedulePeriod,
  normaliseSchedulePeriod,
  durationFor,
  prevailingChairTime,
  prevailingDuration,
  reminderTimeFor,
  shiftClock,
  daysForDate,
  formatDuration,
  formatFullDate,
  formatReminder,
  fromDateKey,
  makeIsTreatmentDay,
  nextScheduledDate,
  pad2,
  scheduledOnOrBefore,
  shiftScheduledDate,
  toDateKey,
  treatmentNumberInMonth,
  type SchedulePeriod,
} from "./schedule";

/* None of this had ever been tested, because reaching it meant rendering a
 * 1,857-line dashboard. It decides which days a member is prescribed
 * treatment on and which treatment they are in — so a wrong answer here
 * puts someone in a chair on the wrong day. */

const MWF: SchedulePeriod = {
  fromKey: "2026-01-01",
  days: ["Monday", "Wednesday", "Friday"],
  chairTimes: {},
  reminderLeadMinutes: 0,
  durations: { Monday: 240 },
};

const TTS: SchedulePeriod = {
  fromKey: "2026-06-15",
  days: ["Tuesday", "Thursday", "Saturday"],
  chairTimes: {},
  reminderLeadMinutes: 0,
  durations: { Monday: 240 },
};

// June 2026: the 1st is a Monday.
const june = (day: number) => new Date(2026, 5, day);

describe("date keys", () => {
  it("pads a key to yyyy-mm-dd so keys sort as dates", () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(pad2(7)).toBe("07");
  });

  it("round-trips a key back to the same local day", () => {
    const date = new Date(2026, 5, 19);
    expect(toDateKey(fromDateKey(toDateKey(date)))).toBe("2026-06-19");
  });

  it("does not drift across a month or year boundary", () => {
    expect(toDateKey(addDays(new Date(2026, 11, 31), 1))).toBe("2027-01-01");
    expect(toDateKey(addDays(new Date(2026, 2, 1), -1))).toBe("2026-02-28");
  });
});

describe("which days are treatment days", () => {
  it("uses the schedule in force on that date", () => {
    const periods = [MWF, TTS];
    // Before the change: Monday/Wednesday/Friday.
    expect(daysForDate(periods, june(10))).toEqual([
      "Monday",
      "Wednesday",
      "Friday",
    ]);
    // On and after the change: Tuesday/Thursday/Saturday.
    expect(daysForDate(periods, june(20))).toEqual([
      "Tuesday",
      "Thursday",
      "Saturday",
    ]);
  });

  it("takes effect on the effective date itself, not the day after", () => {
    expect(daysForDate([MWF, TTS], june(15))).toEqual([
      "Tuesday",
      "Thursday",
      "Saturday",
    ]);
  });

  it("keeps history: a past date is not re-judged by a newer schedule", () => {
    const isTreatmentDay = makeIsTreatmentDay([MWF, TTS]);
    // June 10 2026 is a Wednesday — a treatment day under the old schedule
    // and not under the new one. It was run, so it stays a treatment day.
    expect(isTreatmentDay(june(10))).toBe(true);
    // June 17 is also a Wednesday, but after the change.
    expect(isTreatmentDay(june(17))).toBe(false);
  });
});

describe("walking the schedule", () => {
  const isTreatmentDay = makeIsTreatmentDay([MWF]);

  it("finds the next treatment day strictly after the one given", () => {
    // June 1 2026 is a Monday and is itself a treatment day.
    expect(toDateKey(nextScheduledDate(june(1), isTreatmentDay))).toBe(
      "2026-06-03",
    );
  });

  it("finds the most recent treatment day, counting today", () => {
    expect(toDateKey(scheduledOnOrBefore(june(3), isTreatmentDay))).toBe(
      "2026-06-03",
    );
    // Thursday the 4th falls back to Wednesday the 3rd.
    expect(toDateKey(scheduledOnOrBefore(june(4), isTreatmentDay))).toBe(
      "2026-06-03",
    );
  });

  it("steps forward and back by treatments, not by days", () => {
    expect(toDateKey(shiftScheduledDate(june(1), 2, isTreatmentDay))).toBe(
      "2026-06-05",
    );
    expect(toDateKey(shiftScheduledDate(june(5), -2, isTreatmentDay))).toBe(
      "2026-06-01",
    );
  });

  it("returns to where it started after stepping out and back", () => {
    const out = shiftScheduledDate(june(8), 3, isTreatmentDay);
    expect(toDateKey(shiftScheduledDate(out, -3, isTreatmentDay))).toBe(
      "2026-06-08",
    );
  });

  it("gives up after two months rather than looping forever", () => {
    // Nobody is prescribed nothing, but an empty schedule must not hang.
    const never = makeIsTreatmentDay([
      {
        fromKey: "2026-01-01",
        days: [],
        chairTimes: {},
        reminderLeadMinutes: 0,
        durations: { Monday: 240 },
      },
    ]);
    expect(toDateKey(nextScheduledDate(june(1), never))).toBe("2026-06-08");
    expect(toDateKey(scheduledOnOrBefore(june(1), never))).toBe("2026-06-01");
  });
});

describe("numbering a treatment within its month", () => {
  const isTreatmentDay = makeIsTreatmentDay([MWF]);

  it("counts treatments from the first of the month", () => {
    // June 2026 Mondays/Wednesdays/Fridays: 1, 3, 5, 8, ...
    expect(treatmentNumberInMonth(june(1), isTreatmentDay)).toBe(1);
    expect(treatmentNumberInMonth(june(5), isTreatmentDay)).toBe(3);
    expect(treatmentNumberInMonth(june(8), isTreatmentDay)).toBe(4);
  });

  it("restarts the count in a new month", () => {
    expect(treatmentNumberInMonth(new Date(2026, 6, 1), isTreatmentDay)).toBe(
      1,
    );
  });

  it("never reports treatment zero", () => {
    // A Sunday is not a treatment day, but the card still needs a number.
    expect(treatmentNumberInMonth(june(7), isTreatmentDay)).toBeGreaterThan(0);
  });
});

describe("formatting", () => {
  it("shows a 12-hour clock in English and a 24-hour clock in Spanish", () => {
    expect(formatReminder("07:30", false)).toBe("7:30 AM");
    expect(formatReminder("13:05", false)).toBe("1:05 PM");
    expect(formatReminder("13:05", true)).toBe("13:05");
  });

  it("shows midnight and noon as 12, not 0", () => {
    expect(formatReminder("00:15", false)).toBe("12:15 AM");
    expect(formatReminder("12:00", false)).toBe("12:00 PM");
  });

  it("returns an unparseable time unchanged rather than showing NaN", () => {
    expect(formatReminder("not a time", false)).toBe("not a time");
  });

  it("shows a session length in hours and minutes", () => {
    expect(formatDuration(240)).toBe("4h 00m");
    expect(formatDuration(215)).toBe("3h 35m");
  });

  it("writes the full date in the member's language", () => {
    expect(formatFullDate(june(19), false)).toBe("Friday, Jun 19, 2026");
    expect(formatFullDate(june(19), true)).toBe("Viernes, Jun 19, 2026");
  });
});

describe("building a schedule period from the form", () => {
  const draft = {
    days: ["Friday", "Monday"],
    chairTimes: { Monday: "06:00" },
    reminderLeadMinutes: 0,
    durations: { Monday: 240 },
  };

  it("puts the days back in week order, however they were tapped", () => {
    expect(buildSchedulePeriod(draft, "2026-06-15").days).toEqual([
      "Monday",
      "Friday",
    ]);
  });

  it("gives every prescribed day a reminder, defaulting the new ones", () => {
    const period = buildSchedulePeriod(draft, "2026-06-15");
    expect(period.chairTimes).toEqual({ Monday: "06:00", Friday: "07:30" });
  });

  it("drops reminders for days no longer prescribed", () => {
    const period = buildSchedulePeriod(
      { ...draft, chairTimes: { ...draft.chairTimes, Sunday: "09:00" } },
      "2026-06-15",
    );
    expect(period.chairTimes.Sunday).toBeUndefined();
  });

  it("keeps a length per day, not one for the week", () => {
    // A prescription can run four hours on Monday and three and a half on
    // Friday; one shared number reported the wrong length for every day
    // that differed.
    const period = buildSchedulePeriod(
      {
        ...draft,
        days: ["Monday", "Friday"],
        durations: { Monday: 240, Friday: 210 },
      },
      "2026-06-15",
    );
    expect(period.durations).toEqual({ Monday: 240, Friday: 210 });
    expect(durationFor(period, "Monday")).toBe(240);
    expect(durationFor(period, "Friday")).toBe(210);
  });

  it("clamps a length nobody could be prescribed", () => {
    const at = (minutes: number) =>
      buildSchedulePeriod(
        { ...draft, days: ["Monday"], durations: { Monday: minutes } },
        "2026-06-15",
      ).durations.Monday;

    expect(at(0)).toBe(15);
    expect(at(99 * 60)).toBe(12 * 60);
    expect(at(NaN)).toBe(DEFAULT_DURATION_MINUTES);
  });

  it("gives a day with no length the usual run", () => {
    const period = buildSchedulePeriod(
      { ...draft, days: ["Monday", "Friday"], durations: { Monday: 210 } },
      "2026-06-15",
    );
    expect(period.durations.Friday).toBe(DEFAULT_DURATION_MINUTES);
  });
});

describe("appending a schedule period", () => {
  const later: SchedulePeriod = {
    fromKey: "2026-06-15",
    days: ["Tuesday"],
    chairTimes: {},
    reminderLeadMinutes: 0,
    durations: { Monday: 240 },
  };

  it("keeps the periods that came before it", () => {
    const next = appendSchedulePeriod([MWF], later);
    expect(next).toEqual([MWF, later]);
  });

  it("replaces a period that started on the same day", () => {
    const sameDay = { ...later, days: ["Thursday"] };
    const next = appendSchedulePeriod([MWF, later], sameDay);
    expect(next).toEqual([MWF, sameDay]);
  });

  it("never drops the first period, so history always has a schedule", () => {
    // Applying a change from the very beginning would otherwise leave the
    // list empty and every past treatment without a schedule to belong to.
    const fromTheStart = { ...later, fromKey: "2025-01-01" };
    const next = appendSchedulePeriod([MWF], fromTheStart);
    expect(next).toHaveLength(2);
    expect(next[0]).toBe(MWF);
  });
});

describe("chair time and the reminder that follows it", () => {
  const period = {
    fromKey: "2026-01-01",
    days: ["Monday"],
    chairTimes: { Monday: "05:30" },
    reminderLeadMinutes: 60,
    durations: { Monday: 240 },
  };

  it("reminds an hour before the chair time, not at a time of its own", () => {
    // A chair time that moves has to take its reminder with it; storing
    // both independently is how somebody is reminded for a slot they no
    // longer have.
    expect(reminderTimeFor(period, "Monday")).toBe("04:30");
  });

  it("reminds at the chair time when no lead is set", () => {
    expect(
      reminderTimeFor({ ...period, reminderLeadMinutes: 0 }, "Monday"),
    ).toBe("05:30");
  });

  it("wraps back past midnight rather than going negative", () => {
    // An early chair time with a long lead lands on the previous evening.
    expect(shiftClock("00:30", 60)).toBe("23:30");
    expect(shiftClock("05:30", 120)).toBe("03:30");
  });

  it("leaves a time it cannot read alone", () => {
    expect(shiftClock("not-a-time", 60)).toBe("not-a-time");
  });

  it("reads a record written before chair time existed", () => {
    // The old `reminders` map held the time members had to be there, so it
    // becomes the chair time with no lead. Nothing shifts until they edit.
    const old = {
      fromKey: "2026-01-01",
      days: ["Monday"],
      reminders: { Monday: "05:30" },
      durations: { Monday: 240 },
    } as unknown as SchedulePeriod & { reminders: Record<string, string> };

    const fixed = normaliseSchedulePeriod(old);
    expect(fixed.chairTimes).toEqual({ Monday: "05:30" });
    expect(fixed.reminderLeadMinutes).toBe(0);
    expect(reminderTimeFor(fixed, "Monday")).toBe("05:30");
  });

  it("keeps a chair time for every day the member adds", () => {
    const built = buildSchedulePeriod(
      {
        days: ["Monday", "Friday"],
        chairTimes: { Monday: "05:30" },
        reminderLeadMinutes: 60,
        durations: { Monday: 240 },
      },
      "2026-02-01",
    );
    expect(built.chairTimes).toEqual({
      Monday: "05:30",
      Friday: DEFAULT_CHAIR_TIME,
    });
  });
});

describe("the slot a new day joins", () => {
  it("takes the time the other days already run", () => {
    // "Monday, Wednesday, Friday at 5:30" is one chair time, not three.
    expect(prevailingChairTime({ Monday: "05:30", Wednesday: "05:30" })).toBe(
      "05:30",
    );
  });

  it("falls back to the default when nothing is set yet", () => {
    expect(prevailingChairTime({})).toBe(DEFAULT_CHAIR_TIME);
  });

  it("does not let one odd day out spread to the rest", () => {
    // A member who runs late on Fridays should not have every new day
    // inherit the exception.
    expect(
      prevailingChairTime({
        Monday: "05:30",
        Wednesday: "05:30",
        Friday: "13:00",
      }),
    ).toBe("05:30");
  });

  it("ignores blank entries left by an older record", () => {
    expect(prevailingChairTime({ Monday: "", Wednesday: "06:00" })).toBe(
      "06:00",
    );
  });
});

describe("reading a schedule written before per-day lengths", () => {
  it("spreads one shared length across every prescribed day", () => {
    const old = {
      fromKey: "2026-01-01",
      days: ["Monday", "Friday"],
      chairTimes: { Monday: "05:30", Friday: "05:30" },
      reminderLeadMinutes: 0,
      durationMinutes: 240,
    } as unknown as SchedulePeriod & { durationMinutes: number };

    expect(normaliseSchedulePeriod(old).durations).toEqual({
      Monday: 240,
      Friday: 240,
    });
  });

  it("gives a new day the length the others already run", () => {
    expect(prevailingDuration({ Monday: 210, Wednesday: 210 })).toBe(210);
    expect(prevailingDuration({})).toBe(DEFAULT_DURATION_MINUTES);
  });
});
