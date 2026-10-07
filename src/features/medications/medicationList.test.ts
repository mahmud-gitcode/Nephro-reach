import { describe, expect, it } from "vitest";
import {
  SEED_MEDICATIONS,
  changeFrom,
  updateMedication,
  addMedication,
  doseRows,
  medicationError,
  reminderClock,
  setMedicationStatus,
  type Medication,
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

describe("status and the dose schedule (client, 2026-10-05)", () => {
  const added = (status: string): Medication => ({
    ...SEED_MEDICATIONS[0],
    id: "med-1",
    name: "Losartan",
    status,
  });
  const reminder = {
    id: "r1",
    medicationName: "Losartan",
    time: "08:00 AM",
    extraTimes: ["08:00 PM"],
    frequency: "Daily",
    channels: ["in_app" as const],
    enabled: true,
  };

  it("gives a twice-a-day medication two rows", () => {
    const rows = doseRows([added("Active")], [reminder]);
    expect(rows.map((r) => r.time)).toEqual(["08:00 am", "08:00 pm"]);
  });

  it("takes paused and stopped medications off the schedule", () => {
    expect(doseRows([added("Paused")], [reminder])).toEqual([]);
    expect(doseRows([added("Stopped")], [reminder])).toEqual([]);
  });

  it("sets a status by id", () => {
    const list = setMedicationStatus([added("Active")], "med-1", "PRN");
    expect(list[0].status).toBe("PRN");
  });
});

describe("editing a medication", () => {
  const first = SEED_MEDICATIONS[0];

  it("changes the dose and frequency and records both", () => {
    const change = {
      ...changeFrom(first),
      dose: "20 mg",
      frequency: "Twice daily",
    };
    const [after] = updateMedication([first], first.id, change, "2026-10-07");
    expect(after.dose).toBe("20 mg");
    expect(after.frequencyEn).toBe("Twice daily");
    expect(after.frequencyEs).toBe("Dos veces al día");
    expect(after.history).toEqual([
      { date: "2026-10-07", field: "Dose", from: first.dose, to: "20 mg" },
      {
        date: "2026-10-07",
        field: "Frequency",
        from: first.frequencyEn,
        to: "Twice daily",
      },
    ]);
  });

  it("records nothing when nothing changed", () => {
    const [after] = updateMedication(
      [first],
      first.id,
      changeFrom(first),
      "2026-10-07",
    );
    expect(after).toBe(first);
  });

  it("stops a medication whose new end date has passed", () => {
    const change = { ...changeFrom(first), endDate: "2026-10-01" };
    const [after] = updateMedication([first], first.id, change, "2026-10-07");
    expect(after.status).toBe("Stopped");
    expect(after.endDate).toBe("10/01/2026");
  });
});
