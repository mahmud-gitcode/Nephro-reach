import { describe, expect, it } from "vitest";
import {
  icsFor,
  remindersDue,
  syncExternal,
  type Appointment,
} from "./appointments";

const visit = (over: Partial<Appointment> = {}): Appointment => ({
  id: "va-1",
  date: "2026-10-12",
  start: "10:00",
  end: "",
  title: "Access Follow-Up",
  doctor: "Vascular Access Team",
  location: "Metro Vascular Access Center",
  address: "",
  notes: "",
  source: "vascular-access",
  ...over,
});

describe("appointments from the Vascular Access record", () => {
  it("adds new ones and leaves the list alone when nothing changed", () => {
    const once = syncExternal([], [visit()]);
    expect(once).toHaveLength(1);
    expect(syncExternal(once, [visit()])).toBe(once);
  });

  it("follows a moved visit but keeps the member's attendance", () => {
    const list = [{ ...visit(), attendance: "attended" as const }];
    const moved = syncExternal(list, [visit({ date: "2026-10-14" })]);
    expect(moved[0]).toMatchObject({
      date: "2026-10-14",
      attendance: "attended",
    });
  });

  it("never touches the member's own appointments", () => {
    const own = { ...visit({ id: "appt-1" }), source: undefined };
    expect(syncExternal([own], [visit()])[0]).toBe(own);
  });
});

describe("appointment reminders (client, 2026-10-05)", () => {
  const appt = {
    ...visit({ id: "appt-9", source: undefined }),
    date: "2026-10-12",
    start: "10:00",
    reminder: "1d" as const,
  };

  it("is due from the lead time until the appointment starts", () => {
    const at = (d: number, h: number) => new Date(2026, 9, d, h).getTime();
    expect(remindersDue([appt], at(11, 9))).toEqual([]);
    expect(remindersDue([appt], at(11, 11))).toHaveLength(1);
    expect(remindersDue([appt], at(12, 11))).toEqual([]);
    expect(remindersDue([{ ...appt, reminder: "none" }], at(11, 11))).toEqual(
      [],
    );
  });

  it("writes a calendar file with the reminder as an alarm", () => {
    const ics = icsFor({ ...appt, title: "Access, Follow-Up" }, 0);
    expect(ics).toContain("DTSTART:20261012T100000");
    expect(ics).toContain(String.raw`SUMMARY:Access\, Follow-Up`);
    expect(ics).toContain("TRIGGER:-PT1440M");
    expect(ics.split("\r\n")[0]).toBe("BEGIN:VCALENDAR");
  });
});
