import { describe, expect, it } from "vitest";
import {
  fromApiReading,
  toReadingBody,
  type ApiBpReading,
} from "./blood-pressure/bloodPressure.mapper";
import type { BpDraft } from "./blood-pressure/bloodPressure";
import { reminderWrite } from "./blood-pressure/useBpReminders";
import {
  fromApiFood,
  fromApiGoals,
  toFoodBody,
  toGoalsBody,
  totalsFromSummary,
} from "./nutrition/nutrition.repository";
import {
  fromApiWeightFluid,
  toWeightFluidBody,
  type ApiWeightFluidEntry,
} from "./fluid/weightFluid.mapper";
import {
  fromApiCheckIn,
  noticeFromApi,
  toCheckInBody,
  type ApiCheckIn,
} from "./check-in/checkIn.mapper";
import { noticeStatus, isDelivered } from "./check-in/clinicNotice.rules";
import {
  fromApiExercise,
  toExerciseBody,
} from "./exercise/exercise.repository";
import {
  fromApiQuestion,
  toQuestionBody,
} from "@/features/care-team/questions.repository";

/* Phase 5: every transform between the screens and the API, both ways.
   Synthetic values only. */

const draft: BpDraft = {
  date: "2026-10-30",
  time: "08:15",
  systolic: 132,
  diastolic: 84,
  pulse: 0,
  position: "Standing",
  symptoms: "Dizzy",
  medication: "Not taken",
  mood: "tired",
  notes: " checked twice ",
};

describe("blood pressure <-> API", () => {
  it("sends the API's names and casing, with no pulse as null", () => {
    expect(toReadingBody(draft)).toEqual({
      takenOn: "2026-10-30",
      takenAt: "08:15",
      systolic: 132,
      diastolic: 84,
      pulse: null,
      position: "standing",
      symptoms: "Dizzy",
      medicationState: "not-taken",
      mood: "tired",
      notes: "checked twice",
    });
  });

  it("sends a photo only as a file id, and only when it changed", () => {
    expect(toReadingBody(draft)).not.toHaveProperty("photoFileId");
    expect(toReadingBody(draft, "file-1").photoFileId).toBe("file-1");
    expect(toReadingBody(draft, null).photoFileId).toBeNull();
  });

  it.each([
    ["normal", "Normal"],
    ["elevated", "Elevated"],
    ["stage-1", "Stage 1"],
    ["stage-2", "Stage 2"],
    ["crisis", "Crisis"],
  ] as const)("reads the server status %s as %s", (wire, label) => {
    const row: ApiBpReading = {
      id: "r1",
      patientId: "p1",
      takenOn: "2026-10-30",
      takenAt: "08:15",
      systolic: 132,
      diastolic: 84,
      pulse: null,
      status: wire,
      position: "sitting",
      symptoms: "None",
      medicationState: "late",
      mood: null,
      notes: "",
      photoFileId: "file-1",
      createdAt: "2026-10-30T08:15:00.000Z",
      updatedAt: "2026-10-30T08:15:00.000Z",
    };
    const reading = fromApiReading(row);
    expect(reading.status).toBe(label);
    expect(reading.position).toBe("Sitting");
    expect(reading.medication).toBe("Late");
    expect(reading.pulse).toBe(0);
    expect(reading.photoFileId).toBe("file-1");
    expect(reading).not.toHaveProperty("photo");
  });

  it("keeps one BLOOD_PRESSURE reminder: create, patch, delete", () => {
    expect(reminderWrite(null, ["20:00", "08:00"])).toEqual({
      kind: "create",
      body: {
        kind: "BLOOD_PRESSURE",
        times: ["08:00", "20:00"],
        channels: ["in_app"],
        enabled: true,
      },
    });
    const current = {
      id: "rem-1",
      kind: "BLOOD_PRESSURE",
      times: ["08:00"],
      enabled: true,
    };
    expect(reminderWrite(current, ["09:30"])).toEqual({
      kind: "update",
      id: "rem-1",
      body: { times: ["09:30"] },
    });
    expect(reminderWrite(current, [])).toEqual({ kind: "delete", id: "rem-1" });
    expect(reminderWrite(null, [])).toEqual({ kind: "none" });
  });
});

describe("nutrition <-> API", () => {
  const food = {
    meal: "lunch" as const,
    name: " Rice ",
    portion: " 1 cup ",
    calories: 200,
    sodium: 5,
    potassium: 55,
    phosphorus: 68,
    protein: 4,
    carbs: 45,
    fats: 0.4,
    fiber: 0.6,
  };

  it("renames the eight nutrients both ways", () => {
    const body = toFoodBody(food, "2026-10-30");
    expect(body).toEqual({
      entryDate: "2026-10-30",
      meal: "lunch",
      name: "Rice",
      portion: "1 cup",
      calories: 200,
      sodiumMg: 5,
      potassiumMg: 55,
      phosphorusMg: 68,
      proteinG: 4,
      carbsG: 45,
      fatsG: 0.4,
      fiberG: 0.6,
    });
    expect(
      fromApiFood({ ...body, id: "f1", patientId: "p1", createdAt: "x" }),
    ).toEqual({
      ...food,
      name: "Rice",
      portion: "1 cup",
      id: "f1",
      date: "2026-10-30",
    });
  });

  it("round-trips goals, fluid in millilitres", () => {
    const goals = {
      sodium: 2000,
      potassium: 2500,
      phosphorus: 1000,
      protein: 70,
      calories: 1900,
      carbs: 220,
      fats: 70,
      fiber: 30,
      fluid: 1500,
    };
    expect(fromApiGoals(toGoalsBody(goals))).toEqual(goals);
    expect(toGoalsBody(goals).fluidMl).toBe(1500);
  });

  it("takes the day's totals from the server's summary", () => {
    const totals = totalsFromSummary({
      date: "2026-10-30",
      nutrients: [
        { key: "sodium", consumed: 1200, goal: 2000 },
        { key: "fiber", consumed: 12, goal: 30 },
      ],
      fluid: {
        consumedMl: 473,
        consumed: 16,
        goalMl: 1500,
        goal: 50.7,
        unit: "oz",
        percent: 32,
      },
    });
    expect(totals.sodium).toBe(1200);
    expect(totals.fiber).toBe(12);
    expect(totals.calories).toBe(0);
  });
});

describe("weight and fluid <-> API", () => {
  const row: ApiWeightFluidEntry = {
    id: "w1",
    patientId: "p1",
    entryDate: "2026-10-30",
    weightKg: 72.6,
    morningWeight: "160",
    eveningWeight: "",
    urineOutput: "Low",
    intake: "40",
    goal: "Goal Met",
    swelling: "NO",
    shortnessOfBreath: "YES",
    weakness: "NO",
    rapidGain: "NO",
    dizziness: null,
    cramping: "NO",
    nausea: "NO",
    fluidStatus: "above-edw",
    notes: "",
    createdAt: "x",
    updatedAt: "x",
  };

  it("reads the day, the status and the server's kg", () => {
    const entry = fromApiWeightFluid(row);
    expect(entry.date).toBe("2026-10-30");
    expect(entry.dateEn).toBe("Oct 30, 2026");
    expect(entry.dateEs).toBe("30 Oct, 2026");
    expect(entry.weightKg).toBe(72.6);
    expect(entry.sob).toBe("YES");
    expect(entry.fluidStatus).toBe("Above EDW");
    expect(entry.fluidStatusMsg).toBe("Possible Fluid Overload");
    expect(entry.evening).toBe("--");
  });

  /* PUT replaces the whole day, so every field is sent, with the unit the
     form used; the server works out weightKg. */
  it("sends the full day with the typed unit", () => {
    const body = toWeightFluidBody(fromApiWeightFluid(row), "lbs");
    expect(body).toEqual({
      morningWeight: "160",
      weightUnit: "lbs",
      eveningWeight: "",
      urineOutput: "Low",
      intake: "40",
      goal: "Goal Met",
      swelling: "NO",
      shortnessOfBreath: "YES",
      weakness: "NO",
      rapidGain: "NO",
      dizziness: null,
      cramping: "NO",
      nausea: "NO",
      fluidStatus: "above-edw",
      notes: "",
    });
    expect(body).not.toHaveProperty("weightKg");
  });
});

describe("check-ins <-> API", () => {
  const row: ApiCheckIn = {
    id: "c1",
    patientId: "p1",
    checkInDate: "2026-10-30",
    treatmentDay: false,
    feeling: "rough",
    recoveryWindow: null,
    backToNormalAt: null,
    energyLevel: null,
    resumedActivities: null,
    symptoms: ["Cramping"],
    severity: "severe",
    bloodPressure: null,
    weight: "160",
    urineOutputMl: null,
    appetite: "poor",
    missedTreatment: true,
    notes: "",
    clinicNotice: {
      reasons: ["missed-treatment", "severe-symptoms"],
      raisedAt: "2026-10-30T12:00:00.000Z",
      deliverOn: "2026-10-31",
      status: "held",
    },
    createdAt: "x",
    updatedAt: "2026-10-30T12:00:00.000Z",
  };

  it("reads the id, the day and only the fields that are set", () => {
    const entry = fromApiCheckIn(row);
    expect(entry.id).toBe("c1");
    expect(entry.date).toBe("2026-10-30");
    expect(entry).not.toHaveProperty("bloodPressure");
    expect(entry.weight).toBe("160");
  });

  it("clears empty optional fields with null and sends the clinic choice", () => {
    const body = toCheckInBody(fromApiCheckIn(row), true);
    expect(body.bloodPressure).toBeNull();
    expect(body.recoveryWindow).toBeNull();
    expect(body.notifyClinic).toBe(true);
    expect(toCheckInBody(fromApiCheckIn(row))).not.toHaveProperty(
      "notifyClinic",
    );
  });

  it("never sends a missed treatment on a treatment day", () => {
    const entry = { ...fromApiCheckIn(row), treatmentDay: true };
    expect(toCheckInBody(entry).missedTreatment).toBe(false);
  });

  it("reads the server's notice and trusts its delivery state", () => {
    const notice = noticeFromApi(row);
    expect(notice).toMatchObject({
      checkInDate: "2026-10-30",
      deliverOn: "2026-10-31",
      reasons: ["missed-treatment", "severe-symptoms"],
    });
    expect(noticeStatus(notice!)).toBe("held");
    expect(isDelivered({ ...notice!, status: "delivered" })).toBe(true);
    expect(noticeFromApi({ ...row, clinicNotice: null })).toBeNull();
  });
});

describe("exercise and care-team questions <-> API", () => {
  it("renames the exercise day and keeps the API's enums", () => {
    const body = toExerciseBody(
      {
        activity: "walking",
        customName: "ignored",
        amount: 20,
        unit: "minutes",
        intensity: "moderate",
        feeling: null,
        note: " ok ",
      },
      "2026-10-30",
    );
    expect(body).toEqual({
      entryDate: "2026-10-30",
      activity: "walking",
      amount: 20,
      unit: "minutes",
      intensity: "moderate",
      feeling: null,
      note: "ok",
    });
    expect(
      fromApiExercise({
        ...body,
        id: "e1",
        patientId: "p1",
        customName: "",
        estimatedCalories: 80,
        createdAt: "2026-10-30T09:00:00.000Z",
        updatedAt: "x",
      }),
    ).toMatchObject({
      id: "e1",
      date: "2026-10-30",
      savedAt: "2026-10-30T09:00:00.000Z",
    });
  });

  it.each([
    ["Provider", "provider"],
    ["Dietitian", "dietitian"],
    ["Social Worker", "social-worker"],
    ["Nurse", "nurse"],
  ] as const)("round-trips the role %s", (label, wire) => {
    expect(toQuestionBody({ role: label }).role).toBe(wire);
    expect(
      fromApiQuestion({
        id: "q1",
        patientId: "p1",
        role: wire,
        question: "?",
        status: "answered",
        answer: null,
        createdAt: "x",
        updatedAt: "x",
      }),
    ).toMatchObject({ role: label, status: "Answered" });
  });

  it("sends an emptied answer as null", () => {
    expect(toQuestionBody({ answer: "  " }).answer).toBeNull();
    expect(toQuestionBody({ status: "Discussed" }).status).toBe("discussed");
  });
});
