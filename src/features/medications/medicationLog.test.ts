import { describe, expect, it } from "vitest";
import {
  assertHHmm,
  fromApiDose,
  fromApiSideEffect,
  toDoseBody,
  toSideEffectBody,
  type ApiDose,
  type ApiSideEffect,
} from "./medicationLog.mapper";
import {
  findDose,
  formatDayLabel,
  formatStamp,
  reportedSideEffectCount,
  shiftDay,
  sideEffectOf,
  statusOf,
  todayIso,
} from "./medicationLog.rules";
import type { DoseRecord, SideEffectRecord } from "./medicationLog.types";

/* Phase 6: doses and side effects keyed by (medication id, day, HH:mm).
 * Synthetic data only. */

const dose = (over: Partial<ApiDose> = {}): ApiDose => ({
  id: "d-1",
  patientId: "p-1",
  medicationId: "med-a",
  doseDate: "2026-10-30",
  doseTime: "08:00",
  status: "taken",
  stampedAt: "2026-10-30T08:05:00.000Z",
  createdById: "u-1",
  ...over,
});

const effect = (over: Partial<ApiSideEffect> = {}): ApiSideEffect => ({
  id: "s-1",
  patientId: "p-1",
  medicationId: "med-a",
  effectDate: "2026-10-30",
  effectTime: "08:00",
  effect: "nausea",
  createdById: "u-1",
  createdAt: "2026-10-30T09:00:00.000Z",
  ...over,
});

describe("dose records", () => {
  it("map from the API with the medication's name for display", () => {
    expect(fromApiDose(dose(), () => "Renvela")).toEqual({
      medicationId: "med-a",
      medication: "Renvela",
      date: "2026-10-30",
      time: "08:00",
      status: "taken",
      stampedAt: "2026-10-30T08:05:00.000Z",
    });
    expect(fromApiDose(dose({ status: "TAKEN" }))).toBeNull();
  });

  it("are found by medication id, day and HH:mm", () => {
    const doses = [fromApiDose(dose())!];
    expect(statusOf(doses, "2026-10-30", "med-a", "08:00")).toBe("taken");
    expect(statusOf(doses, "2026-10-30", "med-a", "20:00")).toBe("pending");
    expect(statusOf(doses, "2026-10-29", "med-a", "08:00")).toBe("pending");
    expect(findDose(doses, "2026-10-30", "med-b", "08:00")).toBeUndefined();
  });

  it("never match a legacy name-keyed, 12-hour record", () => {
    /* What `nr:medication-doses` held before Phase 6. */
    const legacy = {
      date: "2026-10-30",
      time: "08:00 AM",
      medication: "Renvela",
      status: "taken",
    } as unknown as DoseRecord;
    expect(statusOf([legacy], "2026-10-30", "med-a", "08:00")).toBe("pending");
    expect(statusOf([legacy], "2026-10-30", "Renvela", "08:00")).toBe(
      "pending",
    );
  });

  it("go out as HH:mm; pending is a status the server clears", () => {
    expect(toDoseBody("2026-10-30", "20:00", "pending")).toEqual({
      doseDate: "2026-10-30",
      doseTime: "20:00",
      status: "pending",
    });
    expect(() => toDoseBody("2026-10-30", "08:00 AM", "taken")).toThrow(
      RangeError,
    );
    expect(() => assertHHmm("8:00")).toThrow(RangeError);
  });
});

describe("side effects", () => {
  it("map from the API; an unanswered one is no record", () => {
    const r = fromApiSideEffect(effect(), () => "Renvela");
    expect(r).toMatchObject({ medication: "Renvela", effect: "nausea" });
    expect(fromApiSideEffect(effect({ effect: null }))).toBeNull();
    expect(fromApiSideEffect(effect({ effect: "bogus" }))).toBeNull();
  });

  it("are found by id and counted without 'none'", () => {
    const records = [
      fromApiSideEffect(effect())!,
      fromApiSideEffect(effect({ effectTime: "20:00", effect: "none" }))!,
    ] as SideEffectRecord[];
    expect(sideEffectOf(records, "2026-10-30", "med-a", "08:00")).toBe(
      "nausea",
    );
    expect(sideEffectOf(records, "2026-10-30", "med-b", "08:00")).toBeNull();
    expect(reportedSideEffectCount(records, "2026-10-30")).toBe(1);
  });

  it("go out as HH:mm, with null to clear", () => {
    expect(toSideEffectBody("2026-10-30", "08:00", null)).toEqual({
      effectDate: "2026-10-30",
      effectTime: "08:00",
      effect: null,
    });
  });
});

describe("day helpers", () => {
  it("move by calendar day, never by UTC", () => {
    expect(todayIso(new Date(2026, 9, 30, 23, 30))).toBe("2026-10-30");
    expect(shiftDay("2026-11-01", -1)).toBe("2026-10-31");
    expect(formatDayLabel("2026-10-30", false)).toMatch(/Oct/);
    expect(formatStamp(undefined, false)).toBeNull();
  });
});
