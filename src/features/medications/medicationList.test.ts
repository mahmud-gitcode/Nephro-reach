import { describe, expect, it } from "vitest";
import {
  SEED_MEDICATIONS,
  addMedication,
  doseRows,
  medicationError,
  reminderClock,
  type MedicationDraft,
} from "./medicationList";
import type { MedicationReminder } from "./reminders.types";

const draft: MedicationDraft = {
  name: "Renvela",
  dose: "800 mg",
  route: "PO",
  frequency: "With meals",
  purpose: "Phosphorus binder",
  startDate: "2026-09-01",
  endDate: "",
  provider: "",
  pharmacy: "",
  instructions: "Take with food",
};

describe("the medication list", () => {
  it("adds a medication in the list's own shape", () => {
    const [added] = addMedication([], draft, "2026-09-30", 1);
    expect(added).toMatchObject({
      name: "Renvela",
      frequencyEn: "With meals",
      frequencyEs: "Con las comidas",
      startDate: "09/01/2026",
      endDate: "---",
      status: "Active",
    });
  });

  it("marks one that has ended as stopped, and one as needed as PRN", () => {
    expect(
      addMedication([], { ...draft, endDate: "2026-09-10" }, "2026-09-30", 1)[0]
        .status,
    ).toBe("Stopped");
    expect(
      addMedication(
        [],
        { ...draft, frequency: "As needed (PRN)" },
        "2026-09-30",
        1,
      )[0].status,
    ).toBe("PRN");
  });

  it("needs a name, dose, route, frequency and start", () => {
    expect(medicationError(draft)).toBeNull();
    expect(medicationError({ ...draft, route: "" })).toBe("route");
    expect(medicationError({ ...draft, endDate: "2026-08-01" })).toBe(
      "endDate",
    );
  });

  it("puts an added medication with a reminder on today's schedule", () => {
    const list = addMedication([], draft, "2026-09-30", 1);
    const reminder: MedicationReminder = {
      id: "r1",
      medicationName: "Renvela",
      time: reminderClock("13:30"),
      frequency: "Daily",
      channels: ["in_app"],
      enabled: true,
    };
    expect(reminderClock("13:30")).toBe("01:30 PM");
    expect(doseRows(list, [reminder]).map((r) => r.medication)).toEqual([
      "Renvela",
    ]);
    expect(doseRows(list, [])).toEqual([]);
  });

  it("keeps the sample schedule only for the sample list", () => {
    expect(doseRows(SEED_MEDICATIONS, []).length).toBeGreaterThan(0);
    expect(doseRows([], [])).toEqual([]);
  });
});
