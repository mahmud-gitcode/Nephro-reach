import { describe, expect, it } from "vitest";
import {
  fromApiReminder,
  toCreateReminderBody,
  toHHmm,
  toTimes,
  type ApiReminder,
} from "./reminders.mapper";
import { reminderFor, reminderTimes } from "./reminders.rules";

/* Phase 6: reminder times travel as HH:mm (24-hour). Midnight and noon are
 * where a 12-hour clock goes wrong. Synthetic data only. */

describe("toHHmm", () => {
  it.each([
    ["08:00 AM", "08:00"],
    ["12:30 PM", "12:30"],
    ["12:05 AM", "00:05"],
    ["8:15 pm", "20:15"],
    ["11:59 PM", "23:59"],
    ["20:00", "20:00"],
    ["07:30", "07:30"],
  ])("%s → %s", (clock, expected) => {
    expect(toHHmm(clock)).toBe(expected);
  });

  it.each(["", "25:00", "13:00 PM", "0:00 AM", "noon", "8"])(
    "refuses %j",
    (clock) => {
      expect(toHHmm(clock)).toBeNull();
    },
  );
});

describe("toTimes", () => {
  it("merges extra times, drops repeats and blanks, earliest first", () => {
    expect(
      toTimes(["08:00 PM", "08:00 AM", "20:00", "", "bad", "07:30"]),
    ).toEqual(["07:30", "08:00", "20:00"]);
  });
});

const api = (over: Partial<ApiReminder> = {}): ApiReminder => ({
  id: "rem-1",
  patientId: "p-1",
  kind: "MEDICATION",
  medicationId: "med-a",
  title: null,
  times: ["20:00", "08:00"],
  frequency: "Daily",
  channels: ["in_app", "sms", "push"],
  enabled: true,
  notes: null,
  createdAt: "2026-10-01T10:00:00.000Z",
  updatedAt: "2026-10-01T10:00:00.000Z",
  ...over,
});

describe("fromApiReminder", () => {
  it("keeps HH:mm, shows 12-hour times, and names the medication", () => {
    const r = fromApiReminder(api(), (id) => (id === "med-a" ? "Renvela" : ""));
    expect(r.times).toEqual(["08:00", "20:00"]);
    expect(r.time).toBe("08:00 AM");
    expect(r.extraTimes).toEqual(["08:00 PM"]);
    expect(reminderTimes(r)).toEqual(["08:00 AM", "08:00 PM"]);
    expect(r.medicationName).toBe("Renvela");
    expect(r.channels).toEqual(["in_app", "sms"]);
  });

  it("is found by medication id", () => {
    const r = fromApiReminder(api());
    expect(reminderFor([r], "med-a")).toBe(r);
    expect(reminderFor([r], "Renvela")).toBeUndefined();
  });
});

describe("toCreateReminderBody", () => {
  it("is a MEDICATION reminder by id, HH:mm, in the app", () => {
    expect(toCreateReminderBody("med-a", ["08:00", "20:00"])).toEqual({
      kind: "MEDICATION",
      medicationId: "med-a",
      times: ["08:00", "20:00"],
      frequency: "Daily",
      channels: ["in_app"],
      enabled: true,
    });
  });
});
