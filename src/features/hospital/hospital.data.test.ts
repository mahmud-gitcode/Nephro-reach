import { describe, expect, it } from "vitest";
import {
  dayIn,
  dischargeInstant,
  enrollmentError,
  enrollmentStatusOf,
  ENROLL_BY_EMAIL,
  isHospitalCourse,
  monthsFrom,
  noonIn,
  recentActivity,
  summaryFrom,
  toHospitalEnrollment,
  type ApiHospitalEnrollment,
} from "./hospital.data";
import { planChange } from "./useHospital";

/* Phase 14: the hospital screens map the API's shapes; the server decides
   status, discharge, accessUntil and hasAccess. Synthetic data only. */

const row = (
  over: Partial<ApiHospitalEnrollment> = {},
): ApiHospitalEnrollment => ({
  id: "e-1",
  patientId: "p-1",
  firstName: "Ana",
  lastName: "Synthetic",
  mrn: "900001",
  program: "kidney-failure-crash-3-day",
  courseId: "c-crash",
  courseTitleEn: "3-Day Kidney Failure Crash Course",
  courseTitleEs: "Curso",
  source: "hospital-discharge",
  status: "admitted",
  startDate: null,
  enrolledAt: "2026-10-20T16:00:00.000Z",
  updatedAt: "2026-10-20T16:00:00.000Z",
  diagnosis: "new",
  dischargedAt: null,
  accessUntil: null,
  hasAccess: true,
  progress: {
    classesCompleted: 1,
    classesTotal: 3,
    percent: 33,
    status: "in-progress",
    lastActivityAt: "2026-10-21T10:00:00.000Z",
    certificateIssuedAt: null,
  },
  ...over,
});

const PROGRAMS = [
  {
    id: "c-crash",
    slug: "kidney-failure-crash-3-day",
    nameEn: "Crash",
    nameEs: "Crash",
    summaryEn: "",
    summaryEs: "",
    days: [],
    accessDaysAfterDischarge: 21,
  },
  {
    id: "c-other",
    slug: "understanding-dialysis-demo",
    nameEn: "Other",
    nameEs: "Other",
    summaryEn: "",
    summaryEs: "",
    days: [],
    accessDaysAfterDischarge: 30,
  },
];

describe("hospital enrollment mapping", () => {
  it("maps a row; enums round-trip; an unknown status is never 'admitted'", () => {
    const e = toHospitalEnrollment(row());
    expect(e).toMatchObject({
      patientName: "Ana Synthetic",
      mrn: "900001",
      status: "admitted",
      diagnosis: "new",
      programName: "3-Day Kidney Failure Crash Course",
      progress: { classesCompleted: 1, classesTotal: 3, status: "in-progress" },
    });
    for (const s of ["admitted", "discharged", "withdrawn"])
      expect(enrollmentStatusOf(s)).toBe(s);
    expect(enrollmentStatusOf("enrolled")).toBe("withdrawn");
    expect(
      toHospitalEnrollment(row({ diagnosis: "on-dialysis" })).diagnosis,
    ).toBe("on-dialysis");
    expect(
      toHospitalEnrollment(row({ diagnosis: "other" })).diagnosis,
    ).toBeNull();
    expect(
      toHospitalEnrollment(row({ mrn: null, progress: null })).progress,
    ).toEqual({
      classesCompleted: 0,
      classesTotal: 0,
      percent: 0,
      status: "not-started",
      lastActivityAt: null,
    });
  });

  it("keeps the server's accessUntil and hasAccess (never recomputed)", () => {
    const e = toHospitalEnrollment(
      row({
        status: "discharged",
        dischargedAt: "2026-10-25T16:00:00.000Z",
        accessUntil: "2026-11-15",
        hasAccess: false,
      }),
    );
    expect(e.accessUntil).toBe("2026-11-15");
    expect(e.hasAccess).toBe(false);
  });

  it("only courses with an access rule after discharge are hospital programs", () => {
    const base = { id: "x", slug: "x" } as never;
    expect(
      isHospitalCourse({
        ...(base as object),
        accessDaysAfterDischarge: 21,
      } as never),
    ).toBe(true);
    expect(
      isHospitalCourse({
        ...(base as object),
        accessDaysAfterDischarge: null,
      } as never),
    ).toBe(false);
  });
});

describe("the education report", () => {
  const report = {
    enrolled: 10,
    started: 6,
    completed: 2,
    notStarted: 4,
    completionPercent: 20,
    byDiagnosis: [
      { key: "new", count: 7 },
      { key: "on-dialysis", count: 3 },
    ],
    perMonth: [
      {
        month: "2026-09",
        enrolled: 4,
        started: 2,
        completed: 1,
        completionPercent: 25,
      },
      {
        month: "2026-10",
        enrolled: 6,
        started: 4,
        completed: 1,
        completionPercent: 17,
      },
    ],
  };
  it("figures come from the server; in progress = started - completed", () => {
    expect(summaryFrom(report)).toEqual({
      enrolled: 10,
      started: 6,
      inProgress: 4,
      completed: 2,
      notStarted: 4,
      incomplete: 8,
      completionPct: 20,
      newlyDiagnosed: 7,
      onDialysis: 3,
    });
    expect(monthsFrom(report).map((m) => m.month)).toEqual([
      "2026-10",
      "2026-09",
    ]);
    expect(monthsFrom(report)[0].completionPct).toBe(17);
  });
});

describe("enroll form", () => {
  const draft = {
    firstName: "Ana",
    lastName: "Synthetic",
    patientEmail: "",
    mrn: "900001",
    diagnosis: "new" as const,
    programId: "c-crash",
  };
  it("needs first and last name, an MRN and a program; email optional", () => {
    expect(enrollmentError(draft)).toBeNull();
    expect(enrollmentError({ ...draft, firstName: " " })).toBe("firstName");
    expect(enrollmentError({ ...draft, lastName: "" })).toBe("lastName");
    expect(enrollmentError({ ...draft, mrn: "" })).toBe("mrn");
    expect(enrollmentError({ ...draft, mrn: "x".repeat(41) })).toBe("mrn");
    expect(enrollmentError({ ...draft, patientEmail: "bad" })).toBe("email");
    expect(enrollmentError({ ...draft, programId: "" })).toBe("program");
  });
  it("D11 is open: enroll-by-email is off", () => {
    expect(ENROLL_BY_EMAIL).toBe(false);
  });
});

describe("discharge day -> instant in the hospital's zone", () => {
  const NY = "America/New_York";
  it("noon in the zone, DST included", () => {
    /* EDT (UTC-4) in summer, EST (UTC-5) after Nov 1, 2026. */
    expect(noonIn("2026-07-10", NY).toISOString()).toBe(
      "2026-07-10T16:00:00.000Z",
    );
    expect(noonIn("2026-11-02", NY).toISOString()).toBe(
      "2026-11-02T17:00:00.000Z",
    );
    expect(noonIn("2026-03-08", NY).toISOString()).toBe(
      "2026-03-08T16:00:00.000Z",
    );
    expect(dayIn(new Date("2026-11-03T03:00:00.000Z"), NY)).toBe("2026-11-02");
  });
  it("today is now; an earlier day is noon; the enrollment day stays after enrolment", () => {
    const now = new Date("2026-11-08T20:00:00.000Z");
    expect(
      dischargeInstant("2026-11-08", NY, now, "2026-11-01T12:00:00.000Z"),
    ).toBe(now.toISOString());
    expect(
      dischargeInstant("2026-11-05", NY, now, "2026-11-01T12:00:00.000Z"),
    ).toBe("2026-11-05T17:00:00.000Z");
    /* Enrolled at 13:30 New York time on the 5th: noon is before it. */
    expect(
      dischargeInstant("2026-11-05", NY, now, "2026-11-05T18:30:00.000Z"),
    ).toBe("2026-11-05T18:31:00.000Z");
  });
});

describe("saving an edit", () => {
  const NY = "America/New_York";
  const now = new Date("2026-11-08T20:00:00.000Z");
  const e = toHospitalEnrollment(row());

  it("discharge sends status + the instant; nothing else changes", () => {
    expect(
      planChange(
        e,
        {
          status: "discharged",
          dischargeDay: "2026-11-05",
          programId: "c-crash",
          diagnosis: "new",
        },
        PROGRAMS,
        NY,
        now,
      ),
    ).toEqual({
      kind: "patch",
      patch: { status: "discharged", dischargedAt: "2026-11-05T17:00:00.000Z" },
    });
  });

  it("re-admitting sends only the status; the server clears discharge and access", () => {
    const discharged = toHospitalEnrollment(
      row({
        status: "discharged",
        dischargedAt: "2026-11-05T17:00:00.000Z",
        accessUntil: "2026-11-26",
      }),
    );
    expect(
      planChange(
        discharged,
        { status: "admitted", programId: "c-crash", diagnosis: "new" },
        PROGRAMS,
        NY,
        now,
      ),
    ).toEqual({ kind: "patch", patch: { status: "admitted" } });
  });

  it("an unchanged form sends nothing; the diagnosis alone is a patch", () => {
    expect(
      planChange(
        e,
        { status: "admitted", programId: "c-crash", diagnosis: "new" },
        PROGRAMS,
        NY,
        now,
      ),
    ).toEqual({ kind: "none" });
    expect(
      planChange(
        e,
        { status: "admitted", programId: "c-crash", diagnosis: "on-dialysis" },
        PROGRAMS,
        NY,
        now,
      ),
    ).toEqual({ kind: "patch", patch: { diagnosis: "on-dialysis" } });
  });

  it("a program change is withdraw + enroll (Q-EDU-5)", () => {
    expect(
      planChange(
        e,
        { status: "admitted", programId: "c-other", diagnosis: "new" },
        PROGRAMS,
        NY,
        now,
      ),
    ).toEqual({
      kind: "switch",
      withdraw: true,
      enroll: {
        patientId: "p-1",
        program: "understanding-dialysis-demo",
        courseId: "c-other",
        diagnosis: "new",
      },
    });
  });
});

describe("recent activity", () => {
  it("newest first from one page, at most 10", () => {
    const list = [
      toHospitalEnrollment(row()),
      toHospitalEnrollment(
        row({
          id: "e-2",
          firstName: "Ben",
          enrolledAt: "2026-10-22T10:00:00.000Z",
          dischargedAt: "2026-10-23T10:00:00.000Z",
          status: "discharged",
          progress: null,
        }),
      ),
    ];
    const events = recentActivity(list);
    expect(events.map((x) => x.kind)).toEqual([
      "discharged",
      "enrolled",
      "active",
      "enrolled",
    ]);
    expect(recentActivity(Array(20).fill(list[0])).length).toBe(10);
  });
});
