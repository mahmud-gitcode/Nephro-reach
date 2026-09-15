import { describe, expect, it } from "vitest";
import { formatTo12Hour, formatTo24Hour } from "./reminders.time";

/* A reminder is stored the way a member reads it and set by an <input
 * type="time"> that speaks 24-hour. Midnight and noon are where this goes
 * wrong: both are hour 12 on a display clock, but 0 and 12 on a 24-hour
 * one. A medication reminder twelve hours out is a missed dose. */

describe("formatTo12Hour", () => {
  it("keeps a morning time in the morning", () => {
    expect(formatTo12Hour("07:30")).toBe("07:30 AM");
  });

  it("turns an afternoon time into PM", () => {
    expect(formatTo12Hour("13:05")).toBe("01:05 PM");
    expect(formatTo12Hour("23:45")).toBe("11:45 PM");
  });

  it("calls midnight 12 AM, not 0 AM", () => {
    expect(formatTo12Hour("00:00")).toBe("12:00 AM");
  });

  it("calls noon 12 PM, not 0 PM", () => {
    expect(formatTo12Hour("12:00")).toBe("12:00 PM");
  });

  it("falls back rather than printing NaN for something unreadable", () => {
    expect(formatTo12Hour("not a time")).toBe("08:00 AM");
  });
});

describe("formatTo24Hour", () => {
  it("keeps a morning time in the morning", () => {
    expect(formatTo24Hour("07:30 AM")).toBe("07:30");
  });

  it("adds twelve to an afternoon time", () => {
    expect(formatTo24Hour("01:05 PM")).toBe("13:05");
  });

  it("maps 12 AM to hour zero", () => {
    expect(formatTo24Hour("12:00 AM")).toBe("00:00");
  });

  it("leaves 12 PM at hour twelve", () => {
    expect(formatTo24Hour("12:00 PM")).toBe("12:00");
  });

  it("falls back rather than guessing at an unreadable time", () => {
    expect(formatTo24Hour("")).toBe("08:00");
    expect(formatTo24Hour("half past three")).toBe("08:00");
  });
});

describe("round trip", () => {
  it("returns every hour of the day to where it started", () => {
    // The whole point of the pair: setting a reminder and reopening the
    // form must show the same time.
    for (let hour = 0; hour < 24; hour++) {
      const time = `${String(hour).padStart(2, "0")}:15`;
      expect(formatTo24Hour(formatTo12Hour(time))).toBe(time);
    }
  });
});
