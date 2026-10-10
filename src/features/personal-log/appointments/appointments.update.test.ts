import { describe, expect, it } from "vitest";
import { draftOf, updateAppointment, type Appointment } from "./appointments";

const base: Appointment = {
  id: "a1",
  date: "2026-10-17",
  start: "09:00",
  end: "09:45",
  title: "Dietitian Visit",
  doctor: "Rachel Adams, RD",
  location: "Riverside Dialysis Center",
  address: "",
  notes: "",
  attendance: "attended",
};

describe("editing an appointment", () => {
  it("changes the details the member edits, trimmed", () => {
    const [next] = updateAppointment([base], "a1", {
      ...draftOf(base),
      doctor: "  Dr. Carter ",
      end: "10:00",
    });
    expect(next.doctor).toBe("Dr. Carter");
    expect(next.end).toBe("10:00");
    expect(next.id).toBe("a1");
  });

  it("clears the attendance answer when the visit moves", () => {
    const [moved] = updateAppointment([base], "a1", {
      ...draftOf(base),
      date: "2026-10-20",
    });
    expect(moved.attendance).toBeUndefined();
    const [kept] = updateAppointment([base], "a1", {
      ...draftOf(base),
      notes: "Bring food log",
    });
    expect(kept.attendance).toBe("attended");
  });

  it("never changes a visit the access center owns", () => {
    const owned = { ...base, source: "vascular-access" as const };
    const [same] = updateAppointment([owned], "a1", {
      ...draftOf(owned),
      date: "2026-10-30",
    });
    expect(same.date).toBe("2026-10-17");
  });
});
