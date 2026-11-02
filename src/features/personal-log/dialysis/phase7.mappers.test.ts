import { describe, expect, it } from "vitest";
import {
  fromApiModality,
  fromApiPrescription,
  NOT_SET,
  toApiModality,
  toPrescriptionBody,
  type ApiPrescription,
} from "./prescription.mapper";
import { fromApiSchedule, toSchedulePeriodBody } from "./schedule.mapper";
import {
  fromApiTreatment,
  isKgWeight,
  kgWeightText,
  missedTreatmentBody,
  toTreatmentBody,
  treatmentDraftProblem,
  TreatmentValidationError,
  type ApiTreatment,
  type TreatmentDraft,
} from "./treatment.mapper";
import {
  fromApiPdExchange,
  toHhMm,
  toPdExchangeBody,
} from "./pdExchange.mapper";
import {
  fromApiAccessPhoto,
  fromApiChecks,
  fromApiHomeSystem,
  fromApiHomeVisit,
  fromApiProviderOrder,
  localStamp,
  toAccessPhotoBody,
  toEquipmentEventBody,
  toHomeSystemBody,
  toHomeVisitBody,
  toProviderOrderBody,
  toSupplyMonthBody,
  toZonedInstant,
} from "./homeDialysis.mapper";
import { fromApiExtraTreatment, toExtraTreatmentBody } from "./extraTreatments";
import {
  fromApiTreatmentMedication,
  parseGivenOn,
  toTreatmentMedicationBody,
} from "../treatmentMedications.types";
import { DEFAULT_SCHEDULE } from "./useDialysisSchedule";
import { DEFAULT_SYSTEM } from "./homeHd";
import { clock12 } from "./treatmentLog";

/* Phase 7 mappers, both ways. Synthetic values only. */

const prescription = (
  over: Partial<ApiPrescription> = {},
): ApiPrescription => ({
  patientId: "p",
  modality: "HOME_HD",
  pdSchedule: null,
  exchangesPerDay: null,
  pdFillVolumeMl: null,
  pdDwellMinutes: null,
  pdSolutions: [],
  bloodFlowRate: null,
  dialysateFlowRate: null,
  dialysateBath: null,
  dryWeightKg: 72.5,
  accessType: null,
  facilityOrganizationId: null,
  facilityName: null,
  nephrologistName: null,
  memberCanEdit: true,
  updatedById: null,
  createdAt: "2026-11-01T10:00:00.000Z",
  updatedAt: "2026-11-01T10:00:00.000Z",
  ...over,
});

describe("prescription / modality", () => {
  it("round-trips the three modalities in server casing", () => {
    for (const ui of ["in-center-hd", "home-hd", "pd"] as const)
      expect(fromApiModality(toApiModality(ui))).toBe(ui);
    expect(toApiModality("in-center-hd")).toBe("IN_CENTER_HD");
    expect(toApiModality("home-hd")).toBe("HOME_HD");
    expect(toApiModality("pd")).toBe("PD");
  });

  it("shows CKD (not on dialysis) as its own read-only state, not a tab", () => {
    const view = fromApiPrescription(
      prescription({ modality: "CKD_NOT_ON_DIALYSIS" }),
    );
    expect(view.notOnDialysis).toBe(true);
    expect(fromApiModality("CKD_NOT_ON_DIALYSIS")).toBeNull();
  });

  it("takes memberCanEdit from the server exactly", () => {
    expect(
      fromApiPrescription(prescription({ memberCanEdit: false })).memberCanEdit,
    ).toBe(false);
    expect(
      fromApiPrescription(prescription({ memberCanEdit: true })).memberCanEdit,
    ).toBe(true);
    expect(fromApiPrescription(prescription()).dryWeightKg).toBe(72.5);
    expect(NOT_SET.isSet).toBe(false);
  });

  it("creates with the modality and patches only what changed", () => {
    const current = fromApiPrescription(prescription()).settings;
    expect(toPrescriptionBody({ exchangesPerDay: 5 }, current, true)).toEqual({
      modality: "HOME_HD",
      exchangesPerDay: 5,
    });
    expect(toPrescriptionBody({ pdSchedule: "apd" }, current, false)).toEqual({
      pdSchedule: "apd",
    });
    expect(toPrescriptionBody({ exchangesPerDay: 11 }, current, false)).toEqual(
      {},
    );
  });
});

describe("schedule periods", () => {
  it("maps fromKey/days/durations to effectiveFrom/weekdays/durationsMinutes", () => {
    expect(
      toSchedulePeriodBody({
        fromKey: "2026-11-02",
        days: ["Monday", "Friday"],
        chairTimes: { Monday: "05:30", Friday: "06:00" },
        reminderLeadMinutes: 60,
        durations: { Monday: 240, Friday: 9999 },
      }),
    ).toEqual({
      effectiveFrom: "2026-11-02",
      weekdays: ["Monday", "Friday"],
      chairTimes: { Monday: "05:30", Friday: "06:00" },
      durationsMinutes: { Monday: 240, Friday: 720 },
      reminderLeadMinutes: 60,
    });
  });

  it("never sends the default week's placeholder day", () => {
    expect(() => toSchedulePeriodBody(DEFAULT_SCHEDULE[0])).toThrow(RangeError);
  });

  it("refuses a chair time that is not HH:mm", () => {
    expect(() =>
      toSchedulePeriodBody({
        fromKey: "2026-11-02",
        days: ["Monday"],
        chairTimes: { Monday: "5:30 AM" },
        reminderLeadMinutes: 0,
        durations: { Monday: 240 },
      }),
    ).toThrow(RangeError);
  });

  it("reads periods back oldest first", () => {
    const periods = fromApiSchedule([
      {
        id: "b",
        patientId: "p",
        effectiveFrom: "2026-11-02",
        weekdays: ["Tuesday"],
        chairTimes: { Tuesday: "07:00" },
        durationsMinutes: { Tuesday: 210 },
        reminderLeadMinutes: 30,
        createdById: null,
        createdAt: "x",
      },
      {
        id: "a",
        patientId: "p",
        effectiveFrom: "2026-10-01",
        weekdays: ["Monday"],
        chairTimes: {},
        durationsMinutes: {},
        reminderLeadMinutes: 0,
        createdById: null,
        createdAt: "x",
      },
    ]);
    expect(periods.map((p) => p.fromKey)).toEqual(["2026-10-01", "2026-11-02"]);
    expect(periods[1]).toEqual({
      fromKey: "2026-11-02",
      days: ["Tuesday"],
      chairTimes: { Tuesday: "07:00" },
      reminderLeadMinutes: 30,
      durations: { Tuesday: 210 },
    });
  });
});

const draft = (over: Partial<TreatmentDraft> = {}): TreatmentDraft => ({
  date: "2026-11-02",
  modality: "home-hd",
  status: "attended",
  startTime: "07:30",
  endTime: "11:45",
  arrivedLate: "Yes",
  endedEarly: "No",
  extraRecovery: "Yes",
  extraRecoveryMinutes: 15,
  preOverallFeel: 4,
  postOverallFeel: 2,
  medsTakenPrescribed: "No",
  preSymptoms: ["Fatigue", "Something else"],
  preSeverity: {
    Fatigue: 3,
    Nausea: 0,
    Pain: 11,
    "Shortness of Breath": 0,
    Overall: 2,
  },
  sequentialFluidRemoval: "Yes",
  cramping: "Mild",
  dizziness: "No",
  swelling: "No",
  shortnessOfBreath: "No",
  lowBp: "Severe",
  highBp: "No",
  fatigue: "Moderate",
  recoveryTime: "Yes",
  intraSymptoms: ["Nausea"],
  intraNotes: "Felt queasy",
  postSymptoms: ["Dizziness", "Low BP"],
  postSeverity: { Fatigue: 4, Nausea: 1, Pain: 0, Overall: 3 },
  preWeight: "74,7",
  postWeight: "72.4",
  fluidRemoved: 2.3,
  preBloodPressure: "140/85",
  preHeartRate: "80",
  bloodPressurePost: "120/80",
  heartRatePost: "72",
  otherNotes: "Fine",
  ...over,
});

describe("treatment form → server (§2.1)", () => {
  it("sends the raw HH:mm times, never the 12-hour label", () => {
    const body = toTreatmentBody(draft());
    expect(body.startTime).toBe("07:30");
    expect(body.endTime).toBe("11:45");
    expect(JSON.stringify(body)).not.toContain(clock12("07:30"));
    expect(JSON.stringify(body)).not.toMatch(/AM|PM/);
  });

  it("maps every field of the form", () => {
    const body = toTreatmentBody(draft());
    expect(body).toMatchObject({
      treatmentDate: "2026-11-02",
      modality: "HOME_HD",
      status: "ATTENDED",
      makeupForDate: null,
      location: null,
      arrivedLate: false /* nobody arrives late at home */,
      endedEarly: false,
      preWeight: "74.7",
      postWeight: "72.4",
      preBloodPressure: "140/85",
      postBloodPressure: "120/80",
      preHeartRate: "80",
      postHeartRate: "72",
      fluidRemoved: "2.3",
      extraRecoveryMinutes: 15,
      preOverallFeel: 4,
      postOverallFeel: 2,
      medsTakenAsPrescribed: false,
      notes: "Fine",
    });
    expect(body.symptoms).toMatchObject({
      preSymptoms: ["Fatigue"],
      preOtherSymptom: "Something else",
      preSeverity: { Fatigue: 3, Pain: 10, Overall: 2 },
      sequentialFluidRemoval: true,
      cramping: "Mild",
      lowBp: "Severe",
      fatigue: "Moderate",
      intraSymptoms: ["Nausea"],
      intraNotes: "Felt queasy",
      recoveryTime: "Yes",
    });
    expect(body).not.toHaveProperty("careTeam");
    expect(body).not.toHaveProperty("intraSeverity");
  });

  it("sends the post-treatment symptoms and severity (INT-12)", () => {
    const body = toTreatmentBody(draft());
    expect(body.symptoms.postSymptoms).toEqual(["Dizziness", "Low BP"]);
    expect(body.symptoms.postSeverity).toEqual({
      Fatigue: 4,
      Nausea: 1,
      Pain: 0,
      Overall: 3,
    });
  });

  it("in-center keeps arriving late; no extra recovery is null", () => {
    const body = toTreatmentBody(
      draft({ modality: "in-center-hd", extraRecovery: "No" }),
    );
    expect(body.modality).toBe("IN_CENTER_HD");
    expect(body.arrivedLate).toBe(true);
    expect(body.extraRecoveryMinutes).toBeNull();
  });

  it("a missed session sends no times", () => {
    const body = toTreatmentBody(draft({ status: "missed" }));
    expect(body.status).toBe("MISSED");
    expect(body.startTime).toBeNull();
    expect(body.endTime).toBeNull();
    expect(missedTreatmentBody("2026-11-02", "in-center-hd")).toEqual({
      treatmentDate: "2026-11-02",
      modality: "IN_CENTER_HD",
      status: "MISSED",
      startTime: null,
      endTime: null,
    });
  });

  it("a make-up session carries the day it replaces", () => {
    const body = toTreatmentBody(
      draft({ status: "rescheduled", makeupFor: "2026-10-30" }),
    );
    expect(body.status).toBe("RESCHEDULED");
    expect(body.makeupForDate).toBe("2026-10-30");
  });

  it('refuses "165 lb" and any unit: it is never sent (kg only, D7)', () => {
    expect(isKgWeight("165 lb")).toBe(false);
    expect(isKgWeight("165lbs")).toBe(false);
    expect(isKgWeight("74.7 kg")).toBe(false);
    expect(isKgWeight("165#")).toBe(false);
    expect(isKgWeight("74.75")).toBe(true);
    expect(isKgWeight("")).toBe(true);
    expect(treatmentDraftProblem(draft({ preWeight: "165 lb" }))).toBe(
      "weight-not-kg",
    );
    expect(() => toTreatmentBody(draft({ postWeight: "165 lb" }))).toThrow(
      TreatmentValidationError,
    );
    expect(() => kgWeightText("165 lb")).toThrow(TreatmentValidationError);
    expect(kgWeightText(" ")).toBeNull();
  });
});

const apiTreatment = (over: Partial<ApiTreatment> = {}): ApiTreatment =>
  ({
    id: "t1",
    patientId: "p",
    treatmentDate: "2026-11-02",
    modality: "HOME_HD",
    status: "ATTENDED",
    makeupForDate: null,
    startTime: "07:30",
    endTime: "11:45",
    durationMinutes: 255,
    location: null,
    arrivedLate: false,
    endedEarly: true,
    preWeight: "74.7",
    postWeight: "72.4",
    preWeightKg: 74.7,
    postWeightKg: 72.4,
    preBloodPressure: "140/85",
    postBloodPressure: "120/80",
    preHeartRate: "80",
    postHeartRate: "72",
    temperature: null,
    ufGoal: null,
    fluidRemoved: "2.3",
    bloodFlowRate: null,
    dialysateFlowRate: null,
    extraRecoveryMinutes: 15,
    preOverallFeel: 4,
    postOverallFeel: 2,
    feeling: null,
    medsTakenAsPrescribed: true,
    symptoms: {
      preSymptoms: ["Fatigue"],
      postSymptoms: ["Dizziness"],
      postSeverity: { Overall: 3 },
      cramping: "Mild",
    },
    complications: null,
    notes: "Fine",
    photoFileId: null,
    createdById: "u",
    createdAt: "x",
    updatedAt: "x",
    ...over,
  }) as ApiTreatment;

describe("server → treatment entry", () => {
  it("rebuilds the labels the pages draw from the server's fields", () => {
    const entry = fromApiTreatment(apiTreatment());
    expect(entry).toMatchObject({
      id: "t1",
      date: "2026-11-02",
      modality: "home-hd",
      status: "attended",
      startTime: "7:30 AM",
      endTime: "11:45 AM",
      duration: "4h 15m",
      attendance: "Ended Early",
      careTeam: "",
      fluidRemoved: "2.3 L",
      weightDiff: "-2.3 kg",
      bloodPressurePost: "120/80",
      extraRecovery: "Yes",
      extraRecoveryMinutes: 15,
      cramping: "Mild",
      postSymptoms: ["Dizziness"],
      postSeverity: { Overall: 3 },
      medicationsGiven: [],
      otherNotes: "Fine",
    });
  });

  it("a missed row has no times and reads as missed", () => {
    const entry = fromApiTreatment(
      apiTreatment({ status: "MISSED", startTime: null, endTime: null }),
    );
    expect(entry.attendance).toBe("Missed");
    expect(entry.startTime).toBe("");
  });
});

describe("PD exchanges", () => {
  it("date → exchangeDate, HH:mm checked, server UF shown", () => {
    expect(
      toPdExchangeBody({
        date: "2026-11-02",
        startTime: "7:05",
        dextrose: "2.5",
        fillMl: 2000,
        drainMl: 2200,
        dwellMinutes: 240,
        clarity: "cloudy",
        exitSiteOk: true,
        notes: "",
      }),
    ).toEqual({
      exchangeDate: "2026-11-02",
      startTime: "07:05",
      dextrose: "2.5",
      fillMl: 2000,
      drainMl: 2200,
      dwellMinutes: 240,
      clarity: "cloudy",
      exitSiteOk: true,
    });
    expect(() => toHhMm("7:05 PM")).toThrow(RangeError);
    const row = fromApiPdExchange({
      id: "x",
      patientId: "p",
      exchangeDate: "2026-11-02",
      startTime: "07:05",
      dextrose: "2.5",
      fillMl: 2000,
      drainMl: 2200,
      ultrafiltrationMl: 200,
      dwellMinutes: 240,
      clarity: "cloudy",
      urgentClarity: true,
      exitSiteOk: true,
      notes: "",
      createdById: null,
      createdAt: "2026-11-02T07:10:00.000Z",
    });
    expect(row).toMatchObject({
      date: "2026-11-02",
      ultrafiltrationMl: 200,
      urgentClarity: true,
    });
  });
});

describe("home dialysis", () => {
  it("home system: names and nulls both ways; the server's checks", () => {
    const body = toHomeSystemBody({
      ...DEFAULT_SYSTEM,
      serial: " SN-1 ",
      lastFilterChange: "2026-10-30",
    });
    expect(body).toEqual({
      machine: "nxstage",
      serial: "SN-1",
      lastDisinfectionOn: null,
      lastFilterChangeOn: "2026-10-30",
      filterIntervalDays: 30,
      disinfectionIntervalDays: 7,
    });
    const system = fromApiHomeSystem({
      ...body,
      patientId: "p",
      updatedById: null,
      updatedAt: "x",
    });
    expect(system.lastDisinfection).toBe("");
    expect(system.lastFilterChange).toBe("2026-10-30");
    expect(
      fromApiChecks([
        {
          id: "filter",
          lastDoneOn: "2026-10-30",
          dueOn: "2026-11-29",
          state: "ok",
        },
        { id: "disinfection", lastDoneOn: null, dueOn: null, state: "unknown" },
      ]),
    ).toEqual([
      { id: "filter", dueIso: "2026-11-29", state: "ok" },
      { id: "disinfection", dueIso: "", state: "unknown" },
    ]);
  });

  it("equipment events need a real day", () => {
    expect(
      toEquipmentEventBody({
        kind: "alarm",
        performedOn: "2026-11-01",
        notes: " beep ",
      }),
    ).toEqual({
      kind: "alarm",
      performedOn: "2026-11-01",
      notes: "beep",
    });
    expect(() =>
      toEquipmentEventBody({ kind: "alarm", performedOn: "", notes: "" }),
    ).toThrow();
  });

  it("home visits: date → visitDate, optional HH:mm", () => {
    const body = toHomeVisitBody({
      date: "2026-11-05",
      time: "",
      provider: "biomed",
      purpose: "Water",
      status: "scheduled",
      remind: true,
      notes: "",
      modality: "pd",
    });
    expect(body).toMatchObject({
      visitDate: "2026-11-05",
      time: "",
      modality: "pd",
    });
    expect(() =>
      toHomeVisitBody({ ...body, date: "2026-11-05", time: "9am" } as never),
    ).toThrow();
    expect(
      fromApiHomeVisit({
        id: "v",
        patientId: "p",
        visitDate: "2026-11-05",
        time: "09:00",
        provider: "rn",
        purpose: "",
        status: "scheduled",
        remind: false,
        modality: null,
        notes: "",
        createdById: null,
        createdAt: "x",
        updatedAt: "x",
      }),
    ).not.toHaveProperty("modality");
  });

  it("supply months keep only the three count fields, whole numbers", () => {
    expect(
      toSupplyMonthBody({
        monthKey: "2026-11",
        counts: {
          dialyzer: { have: 3.6, needed: 12, checked: true, extra: 1 } as never,
        },
        notes: "n",
        updatedAt: "x",
      }),
    ).toEqual({
      counts: { dialyzer: { have: 4, needed: 12, checked: true } },
      notes: "n",
    });
  });

  it("a provider order's reminder goes as an instant with an offset", () => {
    const body = toProviderOrderBody({
      date: "2026-11-03",
      order: " Hold BP pill ",
      remindAt: "2026-11-03T08:00",
    });
    expect(body.orderDate).toBe("2026-11-03");
    expect(body.order).toBe("Hold BP pill");
    expect(body.remindAt).toMatch(/Z$/);
    expect(body.remindAt).toBe(new Date("2026-11-03T08:00").toISOString());
    expect(() => toZonedInstant("2026-11-03 8am")).toThrow(RangeError);
  });

  it("the reminder reads back as the same local time, across a DST change", () => {
    for (const local of [
      "2026-03-08T02:30",
      "2026-11-01T01:30",
      "2026-07-01T09:15",
    ]) {
      const sent = toZonedInstant(local);
      const back = fromApiProviderOrder({
        id: "o",
        patientId: "p",
        orderDate: local.slice(0, 10),
        order: "x",
        completed: false,
        remindAt: sent,
        reminderDoneAt: null,
        reminderDone: false,
        createdById: null,
        createdAt: "x",
        updatedAt: "x",
      });
      expect(back.remindAt).toBe(localStamp(new Date(sent)));
    }
  });

  it("access photos: file id only, takenAt with an offset, no picture data", () => {
    const body = toAccessPhotoBody(
      "file-1",
      "exit-site",
      " red ",
      new Date("2026-11-02T10:00:00Z"),
    );
    expect(body).toEqual({
      fileId: "file-1",
      subject: "exit-site",
      note: "red",
      takenAt: "2026-11-02T10:00:00.000Z",
    });
    const photo = fromApiAccessPhoto({
      id: "ph",
      patientId: "p",
      subject: "access",
      note: "",
      takenAt: "2026-11-02T10:00:00.000Z",
      sentAt: null,
      sent: false,
      createdById: null,
      createdAt: "x",
    });
    expect(JSON.stringify(photo)).not.toContain("data:");
    expect(photo).not.toHaveProperty("dataUrl");
  });
});

describe("extra treatments and treatment medications", () => {
  it("extra treatments use the server's reason strings", () => {
    expect(
      toExtraTreatmentBody({
        dateKey: "2026-11-02",
        reason: "High Potassium",
        notes: " ",
      }),
    ).toEqual({
      date: "2026-11-02",
      reason: "High Potassium",
      notes: null,
    });
    expect(() =>
      toExtraTreatmentBody({ dateKey: "2026-11-02", reason: "Other" }),
    ).toThrow(RangeError);
    expect(
      fromApiExtraTreatment({
        id: "e",
        patientId: "p",
        date: "2026-11-02",
        reason: "Doctor Order",
        notes: null,
        createdById: null,
        createdAt: "x",
      }),
    ).toEqual({ id: "e", dateKey: "2026-11-02", reason: "Doctor Order" });
  });

  it("treatment medications: a typed display day becomes givenOn", () => {
    expect(parseGivenOn("May 31, 2024")).toBe("2024-05-31");
    expect(parseGivenOn("2026-11-02")).toBe("2026-11-02");
    expect(parseGivenOn("not a day")).toBeNull();
    expect(
      toTreatmentMedicationBody({
        givenOn: "2026-11-02",
        treatmentId: "t1",
        medication: " Epogen ",
        dose: "8,000 units",
        given: true,
      }),
    ).toEqual({
      givenOn: "2026-11-02",
      treatmentId: "t1",
      medication: "Epogen",
      dose: "8,000 units",
      given: true,
    });
    expect(
      fromApiTreatmentMedication({
        id: "m",
        patientId: "p",
        treatmentId: null,
        givenOn: "2026-11-02",
        medication: "Epogen",
        dose: "1",
        reason: "",
        given: false,
        createdById: null,
        createdAt: "x",
      }),
    ).toMatchObject({
      givenOn: "2026-11-02",
      date: "Nov 2, 2026",
      treatmentId: null,
    });
  });
});
