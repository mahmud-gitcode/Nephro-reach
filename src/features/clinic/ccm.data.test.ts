import { describe, expect, it } from "vitest";
import {
  ACTIVITY_TYPES,
  ALERT_ACTIVITY,
  CCM_THRESHOLD_MINUTES,
  OUTCOMES,
  activityTypeFor,
  ageOn,
  durationMinutes,
  recentMonths,
  requirementBody,
  worklistCsv,
} from "./ccm.data";
import { CCM_INBOX_KINDS, type CcmEnrollment } from "./ccm.repository";

/* Phase 9: statuses, minutes and alerts are the server's. What stays in
   ccm.data.ts is display: labels, the client's lists, dates, the full
   checklist body and the CSV. Synthetic values only. */

const NOW = new Date(2026, 8, 27, 12).getTime();

const row = (over: Partial<CcmEnrollment> = {}): CcmEnrollment => ({
  id: "e-1",
  patientId: "00000000-0000-4000-8000-000000000001",
  firstName: "Test",
  lastName: "Patient",
  dateOfBirth: "1960-01-02",
  mrn: "000001",
  providerName: "Dr. Example",
  careManagerName: "Care Manager",
  location: "Main",
  conditions: ["ckd-4", "htn"],
  isOnDialysis: false,
  isOnHomeHealthOrHospice: false,
  billingBlocked: false,
  requirements: [],
  requirementsMet: 3,
  requirementsTotal: 8,
  kidneyCarePlan: null,
  enrolledById: null,
  enrolledAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
  month: "2026-09",
  minutes: 20,
  pendingMinutes: 0,
  remainingMinutes: 10,
  status: "Below Threshold",
  lastActivityOn: "2026-09-20",
  nextFollowUpOn: null,
  openAlerts: 0,
  overdueFollowUps: 0,
  ...over,
});

describe("the threshold", () => {
  it("is 30, not the mockup's 20", () => {
    expect(CCM_THRESHOLD_MINUTES).toBe(30);
  });
});

describe("time", () => {
  it("measures a start and end time", () => {
    expect(durationMinutes("10:05", "10:13")).toBe(8);
    expect(durationMinutes("10:13", "10:05")).toBe(0);
    expect(durationMinutes("", "10:05")).toBe(0);
  });

  it("offers the current month and the two before it", () => {
    expect(recentMonths(NOW)).toEqual(["2026-09", "2026-08", "2026-07"]);
  });

  it("works out age from the date of birth", () => {
    expect(ageOn("1953-04-12", "2026-09-27")).toBe(73);
    expect(ageOn("1953-10-12", "2026-09-27")).toBe(72);
  });
});

describe("the client's lists round-trip with the server's enums", () => {
  it("activity types: the client's sixteen plus the six KRT planning steps", () => {
    expect(ACTIVITY_TYPES).toHaveLength(22);
    expect(ACTIVITY_TYPES).toContain("Vascular Access Referral");
    expect(ACTIVITY_TYPES.at(-1)).toBe("Other CCM Activity");
  });

  it("outcomes are the server's six", () => {
    expect(OUTCOMES).toEqual([
      "Continue monitoring",
      "Education provided",
      "Medication adjusted",
      "Provider notified",
      "Referral placed",
      "Care plan updated",
    ]);
  });

  it("maps exactly the server's 10 inbox kinds (no seed-only kinds, NEW-4)", () => {
    expect(Object.keys(ALERT_ACTIVITY).sort()).toEqual(
      [...CCM_INBOX_KINDS].sort(),
    );
    expect(ALERT_ACTIVITY).not.toHaveProperty("Hospital discharge");
    expect(ALERT_ACTIVITY).not.toHaveProperty("Medication change");
    for (const type of Object.values(ALERT_ACTIVITY))
      expect(ACTIVITY_TYPES).toContain(type);
  });

  it("prefers the activity type the server sent with an inbox item", () => {
    expect(
      activityTypeFor({
        kind: "Lab alert",
        activityType: "Medical Record Review",
      }),
    ).toBe("Medical Record Review");
    expect(
      activityTypeFor({ kind: "Blood pressure", activityType: null }),
    ).toBe("BP Review & Follow-Up");
  });
});

describe("a checklist item always sends its full state", () => {
  const current = {
    met: false,
    inProgress: false,
    notApplicable: false,
    date: null,
    detail: "Called the patient",
  };

  it("completes with today's date and keeps the note", () => {
    expect(
      requirementBody(current, { status: "complete" }, "2026-09-27"),
    ).toEqual({
      met: true,
      inProgress: false,
      notApplicable: false,
      date: "2026-09-27",
      detail: "Called the patient",
    });
  });

  it("a note change keeps the status, and `met` is always present", () => {
    const body = requirementBody(
      { ...current, met: true, date: "2026-09-02" },
      { detail: "Signed" },
      "2026-09-27",
    );
    expect(body).toEqual({
      met: true,
      inProgress: false,
      notApplicable: false,
      date: "2026-09-02",
      detail: "Signed",
    });
  });

  it("not applicable and in progress are not met", () => {
    expect(
      requirementBody(current, { status: "not-applicable" }, "2026-09-27"),
    ).toMatchObject({ met: false, notApplicable: true, date: null });
    expect(
      requirementBody(current, { status: "in-progress" }, "2026-09-27"),
    ).toMatchObject({ met: false, inProgress: true, date: null });
  });
});

describe("the CSV export of server rows", () => {
  it("writes one line per row plus a header, from the server's fields", () => {
    const csv = worklistCsv(
      [row(), row({ patientId: "p-2", mrn: null })],
      "2026-09",
    );
    const lines = csv.split("\n");
    expect(lines).toHaveLength(3);
    expect(lines[0].startsWith("Month,Patient,MRN")).toBe(true);
    expect(lines[1]).toContain("Test Patient");
    expect(lines[1]).toContain("3/8");
    expect(lines[1]).toContain("Below Threshold");
  });

  it("neutralises a cell that would run as a spreadsheet formula", () => {
    const csv = worklistCsv(
      [row({ providerName: "=HYPERLINK(1)" })],
      "2026-09",
    );
    expect(csv).not.toContain(",=HYPERLINK");
  });
});
