import { describe, expect, it } from "vitest";
import { isApiError } from "@/lib/api/client";
import {
  NO_PATIENT_CODE,
  patientPath,
  requireScope,
  scopeForUser,
  scopedKey,
} from "./patientScope";

describe("whose records a member screen reads", () => {
  it("is the member's own patient, with no office", () => {
    expect(scopeForUser({ role: "user", patientId: "p1" })).toEqual({
      patientId: "p1",
      organizationId: null,
    });
  });

  it("is the caregiver's patient (from /me/context caregiving)", () => {
    expect(scopeForUser({ role: "caregiver", patientId: "p2" })).toEqual({
      patientId: "p2",
      organizationId: null,
    });
  });

  it("is nobody for an office or admin, or without a patient", () => {
    expect(scopeForUser({ role: "clinic", patientId: "p1" })).toBeNull();
    expect(scopeForUser({ role: "user", patientId: undefined })).toBeNull();
    expect(scopeForUser(null)).toBeNull();
  });

  /* ADR 0007 §2: whose data and in which context, in every key. */
  it("keys each read by patient and context, and never shares a key with no patient", () => {
    expect(
      scopedKey({ patientId: "p1", organizationId: null }, "allergies"),
    ).toEqual(["patient", "p1", "org", "self", "allergies"]);
    expect(
      scopedKey({ patientId: "p1", organizationId: "o1" }, "allergies"),
    ).toEqual(["patient", "p1", "org", "o1", "allergies"]);
    expect(scopedKey(null, "allergies")).toEqual([
      "patient",
      "none",
      "allergies",
    ]);
  });

  it("refuses to read with no patient: the page shows not-shared", () => {
    let thrown: unknown;
    try {
      requireScope(null);
    } catch (error) {
      thrown = error;
    }
    expect(isApiError(thrown, { status: 403, code: NO_PATIENT_CODE })).toBe(
      true,
    );
  });

  it("puts the patient id in the path", () => {
    expect(
      patientPath({ patientId: "p1", organizationId: null }, "/allergies"),
    ).toBe("/patients/p1/allergies");
  });
});
