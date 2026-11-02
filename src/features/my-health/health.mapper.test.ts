import { describe, expect, it } from "vitest";
import {
  changedFields,
  fromApiAllergy,
  fromApiCondition,
  toAllergyBody,
  toConditionBody,
  type ApiAllergy,
  type ApiCondition,
} from "./health.mapper";
import type {
  AllergySeverity,
  AllergyType,
  ConditionStatus,
} from "./health.types";

const apiAllergy = (over: Partial<ApiAllergy> = {}): ApiAllergy => ({
  id: "a1",
  patientId: "p1",
  name: "Penicillin",
  type: "medication",
  reaction: "Rash",
  severity: "severe",
  notes: null,
  createdAt: "2026-11-02T10:00:00.000Z",
  updatedAt: "2026-11-02T10:00:00.000Z",
  ...over,
});

const apiCondition = (over: Partial<ApiCondition> = {}): ApiCondition => ({
  id: "c1",
  patientId: "p1",
  name: "Hypertension",
  status: "current",
  diagnosed: "05/07/2016",
  notes: "",
  createdAt: "2026-11-02T10:00:00.000Z",
  updatedAt: "2026-11-02T10:00:00.000Z",
  ...over,
});

describe("allergies <-> API (Phase 4)", () => {
  const types: [AllergyType, ApiAllergy["type"]][] = [
    ["Medication", "medication"],
    ["Food", "food"],
    ["Environmental", "environmental"],
  ];
  const severities: [AllergySeverity, ApiAllergy["severity"]][] = [
    ["Severe", "severe"],
    ["Moderate", "moderate"],
    ["Mild", "mild"],
  ];

  it.each(types)("round-trips the type %s", (label, wire) => {
    expect(fromApiAllergy(apiAllergy({ type: wire })).type).toBe(label);
    expect(
      toAllergyBody({
        name: "x",
        type: label,
        reactionDefault: "r",
        severity: "Mild",
      }).type,
    ).toBe(wire);
  });

  it.each(severities)("round-trips the severity %s", (label, wire) => {
    expect(fromApiAllergy(apiAllergy({ severity: wire })).severity).toBe(label);
    expect(
      toAllergyBody({
        name: "x",
        type: "Food",
        reactionDefault: "r",
        severity: label,
      }).severity,
    ).toBe(wire);
  });

  it("sends the reaction as `reaction` and the form's dash as nothing", () => {
    expect(
      toAllergyBody({
        name: " Latex ",
        type: "Environmental",
        reactionDefault: " Itching ",
        severity: "Moderate",
        notes: "—",
      }),
    ).toEqual({
      name: "Latex",
      type: "environmental",
      reaction: "Itching",
      severity: "moderate",
      notes: "",
    });
  });

  it("shows an empty note as the dash the table uses", () => {
    expect(fromApiAllergy(apiAllergy({ notes: null })).notes).toBe("—");
    expect(fromApiAllergy(apiAllergy({ notes: "Tell staff" })).notes).toBe(
      "Tell staff",
    );
  });

  /* The prototype's sample rows carried `reactionKey` and `week`. A row
     from the API never does, so nothing can pass one back to the server. */
  it("carries no seed-only fields", () => {
    const row = fromApiAllergy(apiAllergy());
    expect(Object.keys(row).sort()).toEqual(
      ["id", "name", "notes", "reactionDefault", "severity", "type"].sort(),
    );
  });
});

describe("medical conditions <-> API (Phase 4)", () => {
  const statuses: [ConditionStatus, ApiCondition["status"]][] = [
    ["Current", "current"],
    ["Past", "past"],
  ];

  it.each(statuses)("round-trips the status %s", (label, wire) => {
    expect(fromApiCondition(apiCondition({ status: wire })).status).toBe(label);
    expect(
      toConditionBody({
        conditionDefault: "x",
        status: label,
        diagnosed: "—",
      }).status,
    ).toBe(wire);
  });

  it("keeps the diagnosed text as typed and maps the name", () => {
    const row = fromApiCondition(apiCondition());
    expect(row.conditionDefault).toBe("Hypertension");
    expect(row.diagnosed).toBe("05/07/2016");
    expect(toConditionBody(row)).toEqual({
      name: "Hypertension",
      status: "current",
      diagnosed: "05/07/2016",
      notes: "",
    });
  });

  it("shows an empty diagnosed date as a dash, and sends the dash as empty", () => {
    expect(fromApiCondition(apiCondition({ diagnosed: "" })).diagnosed).toBe(
      "—",
    );
    expect(
      toConditionBody({
        conditionDefault: "CKD",
        status: "Past",
        diagnosed: "—",
      }).diagnosed,
    ).toBe("");
  });
});

describe("an edit sends only what changed", () => {
  it("drops unchanged fields from the PATCH", () => {
    expect(
      changedFields(
        { name: "a", type: "food", notes: "x" },
        { name: "a", type: "food", notes: "y" },
      ),
    ).toEqual({ notes: "y" });
  });
});
