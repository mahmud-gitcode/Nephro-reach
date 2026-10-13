import { describe, expect, it } from "vitest";
import {
  accessUntil,
  completeDay,
  educationStatus,
  enroll,
  enrollmentError,
  enrollmentsForMember,
  forHospital,
  hasAccess,
  monthlyReport,
  summarise,
  updateEnrollment,
  type HospitalState,
} from "./hospital.data";

const draft = {
  patientName: "Ana Ruiz",
  patientEmail: " Ana@Example.com ",
  mrn: "1001",
  diagnosis: "new" as const,
  programId: "crash-3",
  enrolledAt: "2026-10-01",
};

describe("hospital enrollment and education", () => {
  it("enrolls into the hospital's own list, admitted and not started", () => {
    const s = enroll({ enrollments: [] }, "h1", draft, "RN", 1);
    expect(forHospital(s, "h1")).toHaveLength(1);
    expect(forHospital(s, "h2")).toHaveLength(0);
    expect(educationStatus(s.enrollments[0])).toBe("not-started");
    expect(enrollmentError(s.enrollments, draft)).toBe("duplicate");
    expect(enrollmentError([], { ...draft, mrn: "" })).toBe("mrn");
  });

  it("tracks days to completion", () => {
    let s: HospitalState = enroll({ enrollments: [] }, "h1", draft, "RN", 1);
    const id = s.enrollments[0].id;
    s = completeDay(s, id, 1, Date.UTC(2026, 9, 2));
    expect(educationStatus(s.enrollments[0])).toBe("in-progress");
    s = completeDay(s, id, 2, Date.UTC(2026, 9, 3));
    s = completeDay(s, id, 3, Date.UTC(2026, 9, 4));
    expect(educationStatus(s.enrollments[0])).toBe("completed");
    expect(summarise(s.enrollments)).toMatchObject({
      enrolled: 1,
      completed: 1,
      incomplete: 0,
    });
    expect(monthlyReport(s.enrollments)[0]).toMatchObject({
      month: "2026-10",
      completionPct: 100,
    });
  });

  it("keeps access 21 days after discharge, then closes it", () => {
    let s = enroll({ enrollments: [] }, "h1", draft, "RN", 1);
    const id = s.enrollments[0].id;
    expect(accessUntil(s.enrollments[0])).toBeNull();
    s = updateEnrollment(s, id, {
      status: "discharged",
      dischargedAt: "2026-10-05",
    });
    expect(accessUntil(s.enrollments[0])).toBe("2026-10-26");
    expect(hasAccess(s.enrollments[0], "2026-10-26")).toBe(true);
    expect(hasAccess(s.enrollments[0], "2026-10-27")).toBe(false);
  });

  it("finds a member's courses by their own account", () => {
    const s = enroll({ enrollments: [] }, "h1", draft, "RN", 1);
    expect(enrollmentsForMember(s, "ana@example.com")).toHaveLength(1);
    expect(enrollmentsForMember(s, "someone@example.com")).toHaveLength(0);
  });
});
