import { describe, expect, it } from "vitest";
import { getDayAndDate, parseDayAndDate } from "./record.format";

/* Record dates are display strings, so the weekday has to be recovered from
 * whichever shape arrived. These tests exist because a hand-written map of
 * twelve June 2026 dates was removed from in front of the parser — they
 * check the parser really does cover what the map used to claim. */

describe("getDayAndDate", () => {
  it("takes the weekday from a string that already carries one", () => {
    expect(getDayAndDate("Friday, Jun 19, 2026", false)).toEqual({
      day: "Friday",
      date: "Jun 19, 2026",
    });
  });

  it("works the weekday out when the string has none", () => {
    expect(getDayAndDate("Jun 19, 2026", false).day).toBe("Friday");
    expect(getDayAndDate("Jun 22, 2026", false).day).toBe("Monday");
  });

  it("agrees with the map it replaced, across the whole run of dates", () => {
    // The twelve entries the old DATE_TO_DAY_MAP hard-coded.
    const was: Record<string, string> = {
      "Jun 19, 2026": "Friday",
      "Jun 20, 2026": "Saturday",
      "Jun 21, 2026": "Sunday",
      "Jun 22, 2026": "Monday",
      "Jun 23, 2026": "Tuesday",
      "Jun 24, 2026": "Wednesday",
      "Jun 25, 2026": "Thursday",
      "Jun 26, 2026": "Friday",
      "Jun 27, 2026": "Saturday",
      "Jun 28, 2026": "Sunday",
      "Jun 29, 2026": "Monday",
      "Jun 30, 2026": "Tuesday",
    };
    for (const [date, day] of Object.entries(was)) {
      expect(getDayAndDate(date, false).day).toBe(day);
    }
  });

  it("keeps working past the dates the map stopped at", () => {
    // The map ended on Jun 30. The parser does not.
    expect(getDayAndDate("Jul 1, 2026", false).day).toBe("Wednesday");
    expect(getDayAndDate("Jan 1, 2027", false).day).toBe("Friday");
  });

  it("gives the weekday in Spanish when asked", () => {
    expect(getDayAndDate("Jun 19, 2026", true).day).toBe("Viernes");
  });

  it("shows a dash rather than 'Invalid Date' for something unreadable", () => {
    expect(getDayAndDate("sometime next week", false).day).toBe("-");
  });
});

describe("parseDayAndDate", () => {
  it("splits on the first comma, keeping it with the weekday", () => {
    expect(parseDayAndDate("Friday, Jun 19")).toEqual({
      day: "Friday,",
      date: "Jun 19",
    });
  });

  it("returns the whole string as the day when there is no comma", () => {
    expect(parseDayAndDate("Friday")).toEqual({ day: "Friday", date: "" });
  });
});
