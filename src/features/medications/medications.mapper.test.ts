import { describe, expect, it } from "vitest";
import {
  changeFrom,
  doseRows,
  isoFromUs,
  medicationError,
  refillCount,
  reminderClock,
  usDate,
  type Medication,
  type MedicationDraft,
} from "./medicationList";
import {
  fromApiMedication,
  fromApiRevision,
  toCreateBody,
  toUpdateBody,
  type ApiMedication,
} from "./medications.mapper";
import type { MedicationReminder } from "./reminders.types";

/* Phase 6: the medication list on the API. Synthetic data only. */

const draft: MedicationDraft = {
  name: "  Renvela ",
  dose: " 800 mg",
  route: "PO",
  frequency: "With meals",
  purpose: "",
  startDate: "2026-09-01",
  endDate: "",
  provider: "",
  pharmacy: " ",
  instructions: "Take with food",
};

const api = (over: Partial<ApiMedication> = {}): ApiMedication => ({
  id: "med-a",
  patientId: "p-1",
  name: "Renvela",
  dose: "800 mg",
  route: "PO",
  frequency: "With meals",
  purpose: null,
  startDate: "2026-09-01",
  endDate: null,
  pharmacy: null,
  status: "Active",
  provider: null,
  instructions: null,
  needsRefill: false,
  photoFileId: null,
  createdById: "u-1",
  createdAt: "2026-09-01T10:00:00.000Z",
  updatedAt: "2026-09-01T10:00:00.000Z",
  ...over,
});

describe("toCreateBody", () => {
  it("sends ISO dates, nulls for blanks, and no status", () => {
    const body = toCreateBody(draft);
    expect(body).toEqual({
      name: "Renvela",
      dose: "800 mg",
      route: "PO",
      frequency: "With meals",
      purpose: null,
      startDate: "2026-09-01",
      endDate: null,
      provider: null,
      pharmacy: null,
      instructions: "Take with food",
    });
    expect(body).not.toHaveProperty("status");
    expect(body).not.toHaveProperty("photo");
  });

  it("sends an end date as ISO and a photo only as its file id", () => {
    const body = toCreateBody({ ...draft, endDate: "2026-12-31" }, "file-1");
    expect(body.endDate).toBe("2026-12-31");
    expect(body.photoFileId).toBe("file-1");
    expect(JSON.stringify(body)).not.toMatch(/data:/);
  });

  it("keeps a frequency that is not on the list as typed", () => {
    expect(toCreateBody({ ...draft, frequency: "Mon/Wed/Fri" }).frequency).toBe(
      "Mon/Wed/Fri",
    );
  });
});

describe("toUpdateBody", () => {
  it("never sends the name or the start date", () => {
    const change = changeFrom(fromApiMedication(api({ purpose: "Binder" })));
    const body = toUpdateBody({ ...change, dose: "1600 mg" });
    expect(body).not.toHaveProperty("name");
    expect(body).not.toHaveProperty("startDate");
    expect(body).not.toHaveProperty("status");
    expect(body.dose).toBe("1600 mg");
    expect(body.purpose).toBe("Binder");
    expect(body.endDate).toBeNull();
  });

  it("clears an optional field with null", () => {
    const body = toUpdateBody({
      ...changeFrom(fromApiMedication(api({ pharmacy: "Kidney Care Rx" }))),
      pharmacy: "",
    });
    expect(body.pharmacy).toBeNull();
  });
});

describe("fromApiMedication", () => {
  it("shows the list's date forms and placeholders", () => {
    const m = fromApiMedication(api());
    expect(m.startDate).toBe("09/01/2026");
    expect(m.endDate).toBe("---");
    expect(m.startIso).toBe("2026-09-01");
    expect(m.endIso).toBe("");
    expect(m.purposeEn).toBe("—");
    expect(m.pharmacy).toBe("—");
    expect(m.photoFileId).toBeNull();
  });

  it("looks the Spanish frequency up, and shows an unknown one raw", () => {
    expect(fromApiMedication(api()).frequencyEs).toBe("Con las comidas");
    const odd = fromApiMedication(api({ frequency: "Mon/Wed/Fri" }));
    expect(odd.frequencyEn).toBe("Mon/Wed/Fri");
    expect(odd.frequencyEs).toBe("Mon/Wed/Fri");
  });

  it("round-trips through the edit form", () => {
    const m = fromApiMedication(
      api({ endDate: "2026-12-31", provider: "Dr. Synthetic" }),
    );
    expect(changeFrom(m)).toMatchObject({
      endDate: "2026-12-31",
      provider: "Dr. Synthetic",
      frequency: "With meals",
    });
    expect(toUpdateBody(changeFrom(m)).endDate).toBe("2026-12-31");
  });

  it("keeps the refill flag and the photo id", () => {
    const m = fromApiMedication(api({ needsRefill: true, photoFileId: "f" }));
    expect(m.needsRefill).toBe(true);
    expect(m.photoFileId).toBe("f");
  });
});

describe("fromApiRevision", () => {
  it("labels fields and shows values the member can read", () => {
    const edit = fromApiRevision({
      id: "rev-1",
      actorKind: "CAREGIVER",
      createdAt: "2026-10-01T10:00:00.000Z",
      changes: [
        { field: "dose", from: "5 mg", to: "10 mg" },
        { field: "endDate", from: "", to: "2026-12-31" },
        { field: "needsRefill", from: false, to: true },
        { field: "photo", from: false, to: true },
      ],
    });
    expect(edit.actorKind).toBe("CAREGIVER");
    expect(edit.changes).toEqual([
      { field: "Dose", from: "5 mg", to: "10 mg" },
      { field: "End date", from: "—", to: "12/31/2026" },
      { field: "Needs refill", from: "No", to: "Yes" },
      { field: "Photo", from: "No", to: "Yes" },
    ]);
  });
});

describe("the list rules", () => {
  it("needs a name, dose, route, frequency and start", () => {
    expect(medicationError({ ...draft, name: "Renvela" })).toBeNull();
    expect(medicationError({ ...draft, route: "" })).toBe("route");
    expect(medicationError({ ...draft, endDate: "2026-08-01" })).toBe(
      "endDate",
    );
  });

  it("converts dates both ways", () => {
    expect(usDate("2026-09-30")).toBe("09/30/2026");
    expect(isoFromUs("09/30/2026")).toBe("2026-09-30");
    expect(isoFromUs("---")).toBe("");
  });

  it("counts the medications flagged low", () => {
    expect(
      refillCount([
        fromApiMedication(api({ needsRefill: true })),
        fromApiMedication(api({ id: "b" })),
      ]),
    ).toBe(1);
  });

  it("shows a 24-hour time as a 12-hour clock", () => {
    expect(reminderClock("08:00")).toBe("08:00 AM");
    expect(reminderClock("20:30")).toBe("08:30 PM");
  });
});

describe("doseRows", () => {
  const reminder = (
    medicationId: string,
    times: string[],
    enabled = true,
  ): MedicationReminder => ({
    id: `r-${medicationId}`,
    medicationId,
    medicationName: "",
    times,
    time: "",
    extraTimes: [],
    frequency: "Daily",
    channels: ["in_app"],
    enabled,
  });
  const meds: Medication[] = [
    fromApiMedication(api({ id: "a", name: "Renvela" })),
    fromApiMedication(api({ id: "b", name: "Norvasc" })),
    fromApiMedication(api({ id: "c", name: "Paused one", status: "Paused" })),
    fromApiMedication(api({ id: "d", name: "PRN one", status: "PRN" })),
  ];

  it("is one row per reminder time of each Active medication, by id", () => {
    const rows = doseRows(meds, [
      reminder("a", ["08:00", "20:00"]),
      reminder("b", ["07:30"]),
      reminder("c", ["09:00"]),
      reminder("d", ["10:00"]),
    ]);
    expect(rows.map((r) => [r.medicationId, r.time, r.timeLabel])).toEqual([
      ["b", "07:30", "07:30 AM"],
      ["a", "08:00", "08:00 AM"],
      ["a", "20:00", "08:00 PM"],
    ]);
  });

  it("has no rows without an enabled reminder, and no sample rows", () => {
    expect(doseRows(meds, [])).toEqual([]);
    expect(doseRows(meds, [reminder("a", ["08:00"], false)])).toEqual([]);
    expect(doseRows([], [reminder("a", ["08:00"])])).toEqual([]);
  });

  it("matches by id, never by name", () => {
    const sameName = fromApiMedication(api({ id: "x", name: "Renvela" }));
    expect(doseRows([sameName], [reminder("a", ["08:00"])])).toEqual([]);
  });
});
