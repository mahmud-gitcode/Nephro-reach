import { describe, expect, it } from "vitest";
import {
  emptyDraft,
  enrollablePrograms,
  enrollErrorText,
  validateEnrollment,
  type EnrollmentDraft,
} from "./enrollment.store";
import { CRASH, JOURNEY } from "./enrollment.data";

const draft = (patch: Partial<EnrollmentDraft> = {}): EnrollmentDraft => ({
  ...emptyDraft(),
  name: "Avery Testpatient",
  mrn: "900001",
  ...patch,
});

describe("validating an enrollment (client hints only)", () => {
  it("accepts a complete draft", () => {
    expect(validateEnrollment(draft())).toEqual({});
  });

  it("needs a name and a six-digit MRN", () => {
    const errors = validateEnrollment(draft({ name: " ", mrn: "12" }));
    expect(errors.name).toBe("Enter the patient's full name.");
    expect(errors.mrn).toBe("An MRN is 6 digits.");
  });

  it("asks for first and last name: the API needs both", () => {
    expect(validateEnrollment(draft({ name: "Avery" })).name).toBe(
      "Enter first and last name.",
    );
  });

  /* Phase 8: a taken MRN and a full contract are the server's answers
     (409 mrn_taken, seats_full), never decided from a local list. */
  it("does not gate on MRN uniqueness or seats any more", () => {
    expect(validateEnrollment(draft({ mrn: "123456" }))).toEqual({});
  });

  it("refuses a program or source that is not offered", () => {
    const errors = validateEnrollment(
      draft({ program: "Made Up", source: "Billboard" }),
    );
    expect(errors.program).toBe("Choose a program.");
    expect(errors.source).toBe("Choose how they were referred.");
  });
});

describe("programs offered", () => {
  it("are the two contracted ones, then each published course once", () => {
    expect(
      enrollablePrograms([
        { titleEn: "Understanding Dialysis" },
        { titleEn: "Understanding Dialysis" },
        { titleEn: " " },
      ]),
    ).toEqual([JOURNEY, CRASH, "Understanding Dialysis"]);
  });

  it("accepts a published course as a program", () => {
    const programs = enrollablePrograms([{ titleEn: "Kidney Basics" }]);
    expect(
      validateEnrollment(draft({ program: "Kidney Basics" }), programs),
    ).toEqual({});
  });
});

describe("the server's refusals, in words", () => {
  it.each([
    ["patients.mrn_taken", "A patient with this MRN is already enrolled."],
    ["patients.seats_full", "All contract seats are filled."],
    ["patients.patient_already_enrolled", "This patient is already enrolled."],
    ["education.enrollment_exists", "This patient is already enrolled."],
  ])("%s", (code, text) => {
    expect(enrollErrorText(code, "fallback")).toBe(text);
  });

  it("keeps the server's own message for anything else", () => {
    expect(enrollErrorText(null, "Server said no")).toBe("Server said no");
  });
});
