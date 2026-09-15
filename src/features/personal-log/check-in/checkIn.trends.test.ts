import { describe, expect, it } from "vitest";
import {
  analyseTrends,
  parseBloodPressure,
  parseNumber,
} from "./checkIn.trends";
import { emptyCheckIn } from "./checkIn.rules";
import type { BetweenTreatmentCheckIn } from "./checkIn.types";

/* These are the figures the client architecture guide asks Beyond the Chair
 * to trend. The risk in all of them is the same: showing a member a number
 * that reads like a finding when it rests on one entry, or on a value that
 * was never really a number. */

function day(
  date: string,
  patch: Partial<BetweenTreatmentCheckIn> = {},
): BetweenTreatmentCheckIn {
  return { ...emptyCheckIn(date), ...patch };
}

describe("parsing what members type", () => {
  it("reads a decimal weight however it is punctuated", () => {
    expect(parseNumber("72.4")).toBe(72.4);
    expect(parseNumber("72,4")).toBe(72.4);
    expect(parseNumber("")).toBeNull();
    expect(parseNumber(undefined)).toBeNull();
  });

  it("refuses to guess at a number that is not one", () => {
    // Counting this as 0 would drag every average down, so it drops out.
    expect(parseNumber("about 72")).toBeNull();
    expect(parseNumber("n/a")).toBeNull();
  });

  it("reads a blood pressure only in the shape it is written", () => {
    expect(parseBloodPressure("128/74")).toEqual({
      systolic: 128,
      diastolic: 74,
    });
    expect(parseBloodPressure(" 128 / 74 ")).toEqual({
      systolic: 128,
      diastolic: 74,
    });
    expect(parseBloodPressure("128")).toBeNull();
    expect(parseBloodPressure("high")).toBeNull();
  });
});

describe("holding back until there is something to say", () => {
  it("shows nothing at all from an empty log", () => {
    const trends = analyseTrends([]);
    expect(trends.hasAnything).toBe(false);
    expect(trends.averageRecoveryHours).toBeNull();
    expect(trends.weightChange).toBeNull();
  });

  it("does not call one entry a trend", () => {
    const trends = analyseTrends([
      day("2026-09-15", {
        treatmentDay: true,
        recoveryWindow: "2-4h",
        weight: "72",
        bloodPressure: "130/80",
      }),
    ]);
    expect(trends.averageRecoveryHours).toBeNull();
    expect(trends.weightChange).toBeNull();
    expect(trends.averageSystolic).toBeNull();
  });
});

describe("recovery", () => {
  it("averages the windows that map to hours", () => {
    const trends = analyseTrends([
      day("2026-09-15", { treatmentDay: true, recoveryWindow: "under-1h" }),
      day("2026-09-13", { treatmentDay: true, recoveryWindow: "4-6h" }),
    ]);
    // 0.5 and 5 -> 2.75, shown to one decimal because "2.75 hours" is
    // more precision than a bucketed answer can honestly carry.
    expect(trends.averageRecoveryHours).toBe(2.8);
  });

  it("counts 'still not recovered' instead of averaging it in", () => {
    // Giving it an hour value would flatter the average and hide the very
    // days a care team most needs to see.
    const trends = analyseTrends([
      day("2026-09-15", {
        treatmentDay: true,
        recoveryWindow: "still-not-recovered",
      }),
      day("2026-09-13", { treatmentDay: true, recoveryWindow: "1-2h" }),
      day("2026-09-11", { treatmentDay: true, recoveryWindow: "1-2h" }),
    ]);
    expect(trends.stillNotRecoveredCount).toBe(1);
    expect(trends.averageRecoveryHours).toBe(1.5);
  });

  it("reads a negative change as recovering faster", () => {
    const trends = analyseTrends([
      // Newest two: quick. Oldest two: slow.
      day("2026-09-15", { treatmentDay: true, recoveryWindow: "under-1h" }),
      day("2026-09-13", { treatmentDay: true, recoveryWindow: "1-2h" }),
      day("2026-09-11", { treatmentDay: true, recoveryWindow: "over-6h" }),
      day("2026-09-09", { treatmentDay: true, recoveryWindow: "over-6h" }),
    ]);
    expect(trends.recoveryChangeHours).toBeLessThan(0);
  });

  it("ignores recovery logged on a non-treatment day", () => {
    const trends = analyseTrends([
      day("2026-09-15", { treatmentDay: false, recoveryWindow: "over-6h" }),
      day("2026-09-13", { treatmentDay: true, recoveryWindow: "1-2h" }),
      day("2026-09-11", { treatmentDay: true, recoveryWindow: "1-2h" }),
    ]);
    expect(trends.averageRecoveryHours).toBe(1.5);
  });
});

describe("symptom frequency", () => {
  it("ranks by how often, with a share of all check-ins", () => {
    const trends = analyseTrends([
      day("2026-09-15", { symptoms: ["Fatigue", "Nausea"] }),
      day("2026-09-14", { symptoms: ["Fatigue"] }),
      day("2026-09-13", { symptoms: ["Fatigue", "Weakness"] }),
      day("2026-09-12", { symptoms: [] }),
    ]);

    expect(trends.symptomFrequency[0]).toEqual({
      symptom: "Fatigue",
      count: 3,
      percent: 75,
    });
  });
});

describe("weight and blood pressure", () => {
  it("measures weight change oldest to newest so a rise reads positive", () => {
    const trends = analyseTrends([
      day("2026-09-15", { weight: "74.0" }),
      day("2026-09-10", { weight: "72.0" }),
    ]);
    expect(trends.weightChange).toBe(2);
  });

  it("averages only the readings that parsed", () => {
    const trends = analyseTrends([
      day("2026-09-15", { bloodPressure: "130/80" }),
      day("2026-09-14", { bloodPressure: "140/90" }),
      day("2026-09-13", { bloodPressure: "dunno" }),
    ]);
    expect(trends.averageSystolic).toBe(135);
    expect(trends.averageDiastolic).toBe(85);
  });

  it("averages urine output for members still making urine", () => {
    const trends = analyseTrends([
      day("2026-09-15", { urineOutputMl: "400" }),
      day("2026-09-14", { urineOutputMl: "600" }),
    ]);
    expect(trends.averageUrineOutputMl).toBe(500);
  });
});

describe("treatment days versus the days between", () => {
  const log = [
    day("2026-09-15", {
      treatmentDay: true,
      feeling: "rough",
      energyLevel: 2,
    }),
    day("2026-09-14", { treatmentDay: false, feeling: "good", energyLevel: 4 }),
    day("2026-09-13", {
      treatmentDay: true,
      feeling: "rough",
      energyLevel: 2,
    }),
    day("2026-09-12", { treatmentDay: false, feeling: "good", energyLevel: 5 }),
  ];

  it("splits feeling and energy by day type", () => {
    const trends = analyseTrends(log);
    expect(trends.treatmentDayRoughPercent).toBe(100);
    expect(trends.nonTreatmentDayRoughPercent).toBe(0);
    expect(trends.treatmentDayEnergy).toBe(2);
    expect(trends.nonTreatmentDayEnergy).toBe(4.5);
  });

  it("withholds the comparison until both sides have enough", () => {
    const oneSided = analyseTrends([
      day("2026-09-15", { treatmentDay: true, feeling: "rough" }),
      day("2026-09-13", { treatmentDay: true, feeling: "rough" }),
    ]);
    expect(oneSided.treatmentDayRoughPercent).toBe(100);
    expect(oneSided.nonTreatmentDayRoughPercent).toBeNull();
  });
});
