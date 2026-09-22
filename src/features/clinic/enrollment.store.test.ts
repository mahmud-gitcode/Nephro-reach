import { beforeEach, describe, expect, it } from "vitest";
import { CONTRACT_SLOTS, CRASH, JOURNEY, patients } from "./enrollment.data";
import {
  emptyDraft,
  enrollPatient,
  readAllPatients,
  readEnrolled,
  toPatient,
  validateEnrollment,
  type EnrollmentDraft,
} from "./enrollment.store";
import { rosterMemberFor } from "./members.data";

beforeEach(() => window.localStorage.clear());

const draft = (overrides: Partial<EnrollmentDraft> = {}): EnrollmentDraft => ({
  ...emptyDraft(),
  name: "Maria L. Gomez",
  mrn: "700001",
  ...overrides,
});

describe("validating an enrollment", () => {
  it("accepts a complete draft", () => {
    expect(validateEnrollment(draft(), patients)).toEqual({});
  });

  it("needs a name and a six-digit MRN", () => {
    const errors = validateEnrollment(
      draft({ name: " ", mrn: "12a" }),
      patients,
    );
    expect(errors.name).toBeDefined();
    expect(errors.mrn).toBe("An MRN is 6 digits.");
  });

  it("refuses an MRN that is already enrolled", () => {
    const errors = validateEnrollment(
      draft({ mrn: patients[0].mrn }),
      patients,
    );
    expect(errors.mrn).toMatch(/already enrolled/);
  });

  it("refuses anyone once every contract seat is taken", () => {
    const full = Array.from({ length: CONTRACT_SLOTS }, (_, i) => ({
      mrn: String(800000 + i),
    }));
    expect(validateEnrollment(draft(), full).name).toMatch(/seats are filled/);
  });
});

describe("the new patient's row", () => {
  const today = new Date(2026, 8, 21);

  it("is dated today, at 0%, Not Started without a start date", () => {
    expect(toPatient(draft(), today)).toMatchObject({
      name: "Maria L. Gomez",
      enrolledOn: "09/21/2026",
      status: "Not Started",
      startDate: "—",
      progress: 0,
    });
  });

  it("is Pending Start once a start date is set, read as a local day", () => {
    const row = toPatient(draft({ startDate: "2026-10-01" }), today);
    expect(row.status).toBe("Pending Start");
    expect(row.startDate).toBe("10/01/2026");
  });

  it("tidies stray spaces in the name", () => {
    expect(toPatient(draft({ name: "  Maria   Gomez " }), today).name).toBe(
      "Maria Gomez",
    );
  });

  it("shows on the Member page as just enrolled, with no invented activity", () => {
    const member = rosterMemberFor(toPatient(draft({ program: CRASH }), today));
    expect(member).toMatchObject({
      status: "Not Started",
      progress: 0,
      lastActivity: "No activity yet",
      liveClasses: [0, 0],
    });
  });
});

describe("saving", () => {
  it("adds the patient after the demo roster", async () => {
    await enrollPatient(draft({ program: JOURNEY }));
    expect(await readEnrolled()).toHaveLength(1);
    const all = await readAllPatients();
    expect(all).toHaveLength(patients.length + 1);
    expect(all.at(-1)?.mrn).toBe("700001");
  });

  it("checks the stored list again, so an MRN cannot be taken twice", async () => {
    await enrollPatient(draft());
    await expect(
      enrollPatient(draft({ name: "Someone Else" })),
    ).rejects.toThrow(/already enrolled/);
    expect(await readEnrolled()).toHaveLength(1);
  });

  it("stops at the last contract seat", async () => {
    const open = CONTRACT_SLOTS - patients.length;
    for (let i = 0; i < open; i++)
      await enrollPatient(draft({ mrn: String(700100 + i) }));
    await expect(enrollPatient(draft({ mrn: "799999" }))).rejects.toThrow(
      /seats are filled/,
    );
  });
});
