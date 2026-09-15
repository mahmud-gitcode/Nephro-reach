import { describe, expect, it } from "vitest";
import {
  reminderFor,
  removeReminderFor,
  setReminderTime,
} from "./reminders.rules";
import type { MedicationReminder } from "./reminders.types";

/* Matching a reminder to a medication by name, case-insensitively, was
 * written out at three call sites in the page. Two alarms for one drug is a
 * dosing hazard, not a duplicate row, so the matching is tested here rather
 * than trusted three times. */

const existing: MedicationReminder[] = [
  {
    id: "r1",
    medicationName: "Potassium",
    time: "08:00 AM",
    frequency: "Daily",
    channels: ["in_app"],
    enabled: true,
  },
];

describe("medication reminder rules", () => {
  it("adds a reminder for a medication that has none", () => {
    const next = setReminderTime([], "Norvasc", "07:30 AM", "fixed-id");
    expect(next).toHaveLength(1);
    expect(next[0]).toMatchObject({
      id: "fixed-id",
      medicationName: "Norvasc",
      time: "07:30 AM",
      enabled: true,
    });
  });

  it("moves the existing reminder rather than adding a second one", () => {
    const next = setReminderTime(existing, "Potassium", "09:15 AM");
    expect(next).toHaveLength(1);
    expect(next[0].time).toBe("09:15 AM");
  });

  it("matches the medication whatever the casing or spacing", () => {
    const next = setReminderTime(existing, "  potassium ", "09:15 AM");
    expect(next).toHaveLength(1);
  });

  it("turns a switched-off reminder back on when a time is set", () => {
    const off = [{ ...existing[0], enabled: false }];
    expect(setReminderTime(off, "Potassium", "09:15 AM")[0].enabled).toBe(true);
  });

  it("leaves the other reminders untouched", () => {
    const two = [
      ...existing,
      { ...existing[0], id: "r2", medicationName: "Norvasc" },
    ];
    const next = setReminderTime(two, "Norvasc", "06:00 PM");
    expect(next[0]).toBe(two[0]);
    expect(next[1].time).toBe("06:00 PM");
  });

  it("removes the reminder for a medication, whatever the casing", () => {
    expect(removeReminderFor(existing, "POTASSIUM")).toHaveLength(0);
  });

  it("removes nothing when no reminder matches", () => {
    expect(removeReminderFor(existing, "Calcitriol")).toHaveLength(1);
  });

  it("finds a reminder by medication name", () => {
    expect(reminderFor(existing, "potassium")?.id).toBe("r1");
    expect(reminderFor(existing, "Calcitriol")).toBeUndefined();
  });
});
