import { describe, expect, it } from "vitest";
import {
  icsFor,
  notCopiedYet,
  remindersDue,
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
  /* The server copies each booked access visit into the member's list
     (sourceAccessAppointmentId); the access read shows the rest. */
  it("shows an access visit once: the server copy wins", () => {
    const copy = visit({ id: "appt-uuid-1", sourceId: "1" });
    expect(notCopiedYet([copy], [visit()])).toEqual([]);
  });

  it("shows an access visit the server has not copied yet", () => {
    const other = visit({ id: "va-2" });
    expect(notCopiedYet([], [visit(), other])).toEqual([visit(), other]);
  });

  it("never hides an access visit behind the member's own appointment", () => {
    const own = { ...visit({ id: "appt-1" }), source: undefined };
    expect(notCopiedYet([own], [visit()])).toEqual([visit()]);
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
