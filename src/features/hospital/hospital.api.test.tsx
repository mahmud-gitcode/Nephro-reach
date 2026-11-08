import React from "react";
import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  render,
  renderHook,
  screen,
  waitFor,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { axe } from "vitest-axe";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/features/auth/AuthContext";
import type { MeContext } from "@/features/auth/auth.types";
import {
  isRetiredKey,
  purgeLegacyStorage,
  STORAGE_VERSION,
  STORAGE_VERSION_KEY,
} from "@/lib/data/legacyPurge";
import {
  apiError,
  memberContext,
  pageOf,
  stubApi,
  type StubHandler,
} from "@/features/profile/memberApiStub";
import HospitalPatients from "./HospitalPatients";
import HospitalReports from "./HospitalReports";
import HospitalOverview from "./HospitalOverview";
import { useEnrollPatient, useHospitalOffice } from "./useHospital";
import type { ApiHospitalEnrollment, EducationProgram } from "./hospital.data";

/* Phase 14 (hospital portal on the API) against a stand-in API. Synthetic
   data only: made-up ids, names and MRNs. */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/dashboard/hospital/patients",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

const ORG = "66666666-6666-4666-8666-666666666666";
const P1 = "77777777-7777-4777-8777-777777777777";
const COURSE = "88888888-8888-4888-8888-888888888888";
const SLUG = "kidney-failure-crash-3-day";
const MRN = "SYN-424242";

function hospitalContext(permissions: Record<string, number>): MeContext {
  return {
    ...memberContext(),
    patient: null,
    memberships: [
      {
        organizationId: ORG,
        organizationName: "Synthetic General Hospital",
        organizationType: "HOSPITAL",
        organizationStatus: "ACTIVE",
        role: "Nurse",
        title: null,
        isOwner: false,
        permissions,
      },
    ],
  } as MeContext;
}

const NURSE = hospitalContext({ patients: 2, programs: 2, reports: 1 });

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return (
    <QueryClientProvider client={client}>
      <LanguageProvider>
        <AuthProvider>{children}</AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

class NoResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  window.localStorage.clear();
  vi.stubGlobal("ResizeObserver", NoResizeObserver);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

const org = (rest: string) => `/organizations/${ORG}${rest}`;

const enrollment = (
  over: Partial<ApiHospitalEnrollment> = {},
): ApiHospitalEnrollment => ({
  id: "e-1",
  patientId: P1,
  firstName: "Ana",
  lastName: "Synthetic",
  mrn: MRN,
  program: SLUG,
  courseId: COURSE,
  courseTitleEn: "3-Day Kidney Failure Crash Course",
  courseTitleEs: "Curso",
  source: "hospital-discharge",
  status: "discharged",
  startDate: null,
  enrolledAt: "2026-10-20T16:00:00.000Z",
  updatedAt: "2026-10-25T16:00:00.000Z",
  diagnosis: "new",
  dischargedAt: "2026-10-25T16:00:00.000Z",
  accessUntil: "2026-11-15",
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

const COURSE_SUMMARY = {
  id: COURSE,
  slug: SLUG,
  titleEn: "3-Day Kidney Failure Crash Course",
  titleEs: "Curso",
  descriptionEn: "Synthetic course",
  descriptionEs: "",
  accessDaysAfterDischarge: 21,
};

const REPORT = {
  enrolled: 1,
  started: 1,
  completed: 0,
  notStarted: 0,
  completionPercent: 0,
  byDiagnosis: [{ key: "new", count: 1 }],
  perMonth: [
    {
      month: "2026-10",
      enrolled: 1,
      started: 1,
      completed: 0,
      completionPercent: 0,
    },
  ],
};

function hospitalApi(over: StubHandler = () => undefined) {
  return stubApi((c) => {
    const o = over(c);
    if (o) return o;
    if (c.path === org("/program-enrollments") && c.method === "GET")
      return pageOf([enrollment()]);
    if (c.path === org("/reports/education")) return { data: REPORT };
    if (c.path === "/courses") return pageOf([COURSE_SUMMARY]);
    if (c.path === `/courses/${COURSE}`)
      return { data: { ...COURSE_SUMMARY, modules: [] } };
    return undefined;
  }, NURSE);
}

/* ---------------------------------------------------------- the patients */

describe("hospital patients from the API", () => {
  it("lists the server's rows; the MRN is shown and never in a link; axe", async () => {
    const { calls } = hospitalApi();
    const { container } = render(<HospitalPatients />, { wrapper });
    expect(await screen.findByText("Ana Synthetic")).toBeInTheDocument();
    expect(screen.getByText(`MRN ${MRN}`)).toBeInTheDocument();
    expect(screen.getAllByText("Discharged").length).toBeGreaterThan(1);
    expect(screen.getByText("1 of 3 classes")).toBeInTheDocument();
    for (const a of container.querySelectorAll("a"))
      expect(a.getAttribute("href") ?? "").not.toContain(MRN);
    for (const c of calls)
      expect(c.path + c.query.toString()).not.toContain(MRN);
    const list = calls.find((c) => c.path === org("/program-enrollments"))!;
    expect(list.headers["x-organization-id"]).toBe(ORG);
    expect(list.query.get("limit")).toBe("25");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("the status filter goes to the server", async () => {
    const { calls } = hospitalApi();
    render(<HospitalPatients />, { wrapper });
    await screen.findByText("Ana Synthetic");
    await userEvent.selectOptions(
      screen.getByLabelText("Enrollment status"),
      "admitted",
    );
    await waitFor(() =>
      expect(
        calls.some(
          (c) =>
            c.path === org("/program-enrollments") &&
            c.query.get("status") === "admitted",
        ),
      ).toBe(true),
    );
  });

  it("a 403 is the no-access state, never an empty list", async () => {
    hospitalApi((c) =>
      c.path === org("/program-enrollments")
        ? apiError(403, "access.permission_denied")
        : undefined,
    );
    render(<HospitalPatients />, { wrapper });
    expect(
      await screen.findByText("This has not been shared with you"),
    ).toBeInTheDocument();
    expect(screen.queryByText("No patients here")).toBeNull();
  });

  it("a failed read is an error, not empty", async () => {
    hospitalApi((c) =>
      c.path === org("/program-enrollments") ? apiError(500, null) : undefined,
    );
    render(<HospitalPatients />, { wrapper });
    expect(
      await screen.findByText("Patients did not load"),
    ).toBeInTheDocument();
    expect(screen.queryByText("No patients here")).toBeNull();
  });
});

/* ------------------------------------------------------------- enrolling */

const PROGRAMS: EducationProgram[] = [
  {
    id: COURSE,
    slug: SLUG,
    nameEn: "Crash",
    nameEs: "Crash",
    summaryEn: "",
    summaryEs: "",
    days: [],
    accessDaysAfterDischarge: 21,
  },
];

const DRAFT = {
  firstName: "Ana",
  lastName: "Synthetic",
  patientEmail: "ana@example.test",
  mrn: MRN,
  diagnosis: "on-dialysis" as const,
  programId: COURSE,
};

describe("enrolling is two server calls", () => {
  it("roster first (no email sent, D11), then the enrollment with the diagnosis", async () => {
    const { calls } = hospitalApi((c) => {
      if (c.method === "POST" && c.path === org("/patients"))
        return {
          status: 201,
          data: {
            patientId: P1,
            mrn: MRN,
            status: "ACTIVE",
            startedOn: "2026-11-08",
          },
        };
      if (c.method === "POST" && c.path === org("/program-enrollments"))
        return { status: 201, data: enrollment({ status: "admitted" }) };
      return undefined;
    });
    const { result } = renderHook(
      () => ({ ...useEnrollPatient(PROGRAMS), office: useHospitalOffice() }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.office.orgId).toBe(ORG));
    await act(async () => {
      await result.current.mutateAsync(DRAFT);
    });
    const posts = calls.filter((c) => c.method === "POST");
    expect(posts.map((c) => c.path)).toEqual([
      org("/patients"),
      org("/program-enrollments"),
    ]);
    expect(posts[0].body).toEqual({
      firstName: "Ana",
      lastName: "Synthetic",
      mrn: MRN,
    });
    expect(JSON.stringify(posts[0].body)).not.toContain("example.test");
    expect(posts[1].body).toEqual({
      patientId: P1,
      program: SLUG,
      courseId: COURSE,
      diagnosis: "on-dialysis",
      source: "hospital-discharge",
    });
    for (const p of posts) expect(p.headers["x-organization-id"]).toBe(ORG);
  });

  it("when the enrollment fails after the roster call, a retry sends the enrollment only", async () => {
    let fail = true;
    const { calls } = hospitalApi((c) => {
      if (c.method === "POST" && c.path === org("/patients"))
        return {
          status: 201,
          data: {
            patientId: P1,
            mrn: MRN,
            status: "ACTIVE",
            startedOn: "2026-11-08",
          },
        };
      if (c.method === "POST" && c.path === org("/program-enrollments")) {
        if (fail) return apiError(409, "education.enrollment_exists");
        return { status: 201, data: enrollment({ status: "admitted" }) };
      }
      return undefined;
    });
    const { result } = renderHook(
      () => ({ ...useEnrollPatient(PROGRAMS), office: useHospitalOffice() }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.office.orgId).toBe(ORG));
    await act(async () => {
      await result.current.mutateAsync(DRAFT).catch(() => undefined);
    });
    await waitFor(() => expect(result.current.partialPatientId).toBe(P1));
    fail = false;
    await act(async () => {
      await result.current.mutateAsync(DRAFT);
    });
    const posts = calls.filter((c) => c.method === "POST").map((c) => c.path);
    expect(posts).toEqual([
      org("/patients"),
      org("/program-enrollments"),
      org("/program-enrollments"),
    ]);
  });
});

/* -------------------------------------------------------------- reports */

describe("hospital reports", () => {
  it("figures from the report route; the download is the server's audited CSV", async () => {
    const { calls, fetchMock } = hospitalApi();
    const created: string[] = [];
    vi.stubGlobal(
      "URL",
      Object.assign(URL, {
        createObjectURL: () => {
          created.push("blob");
          return "blob:x";
        },
        revokeObjectURL: () => undefined,
      }),
    );
    const base = fetchMock.getMockImplementation()!;
    fetchMock.mockImplementation(async (input, init) => {
      if (String(input).includes("/reports/education/export")) {
        calls.push({
          method: init?.method ?? "GET",
          path: new URL(String(input)).pathname.replace("/api/v1", ""),
          query: new URL(String(input)).searchParams,
          body: undefined,
          headers: Object.fromEntries(
            Object.entries((init?.headers as Record<string, string>) ?? {}).map(
              ([k, v]) => [k.toLowerCase(), v],
            ),
          ),
        });
        return new Response("metric,group,value\nenrolled,,1\n", {
          status: 200,
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition":
              'attachment; filename="education-2026-11-08.csv"',
          },
        });
      }
      return base(input, init);
    });
    const { container } = render(<HospitalReports />, { wrapper });
    expect(await screen.findByText("Patients enrolled")).toBeInTheDocument();
    expect(await screen.findByText("October 2026")).toBeInTheDocument();
    const patientReport = screen.getByRole("button", {
      name: /Download patient report/,
    });
    expect(patientReport).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Download" }));
    await waitFor(() =>
      expect(
        calls.some((c) => c.path === org("/reports/education/export")),
      ).toBe(true),
    );
    const exportCall = calls.find(
      (c) => c.path === org("/reports/education/export"),
    )!;
    expect(exportCall.headers["x-organization-id"]).toBe(ORG);
    await waitFor(() => expect(created).toHaveLength(1));
    expect(await axe(container)).toHaveNoViolations();
  });

  it("a report failure is an error on the figures, not zeros", async () => {
    hospitalApi((c) =>
      c.path === org("/reports/education") ? apiError(500, null) : undefined,
    );
    render(<HospitalOverview />, { wrapper });
    expect(
      (await screen.findAllByText("Figures did not load")).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText("Patients enrolled")).toBeNull();
  });
});

/* -------------------------------------------------------- legacy storage */

const RETIRED = [
  "nr:hospital-enrollments",
  "nr:member:demo@example.test:hospital-enrollments",
  "nr:caregiver-none:hospital-enrollments",
];

const DATA_FILES = [
  "src/features/hospital/hospital.data.ts",
  "src/features/hospital/hospital.repository.ts",
  "src/features/hospital/useHospital.ts",
  "src/features/hospital/HospitalPatients.tsx",
  "src/features/hospital/HospitalOverview.tsx",
  "src/features/hospital/HospitalEducation.tsx",
  "src/features/hospital/HospitalReports.tsx",
  "src/features/hospital/HospitalMessages.tsx",
  "src/features/hospital/HospitalUi.tsx",
  "src/features/hospital/MyHospitalCourse.tsx",
];

describe("retired hospital storage", () => {
  it("is in the registry at version 14 and purged with the marker", () => {
    expect(STORAGE_VERSION).toBeGreaterThanOrEqual(14);
    for (const key of RETIRED) expect(isRetiredKey(key)).toBe(true);
    const store = window.localStorage;
    for (const key of RETIRED)
      store.setItem(
        key,
        JSON.stringify({
          version: 1,
          state: {
            enrollments: [
              {
                id: "henr-1",
                patientName: "Old Sample",
                mrn: "000111",
                patientEmail: "old@example.test",
              },
            ],
          },
        }),
      );
    store.setItem("preferred_language", "EN");
    const result = purgeLegacyStorage(store);
    for (const key of RETIRED) expect(store.getItem(key)).toBeNull();
    expect(result.removed).toEqual(expect.arrayContaining(RETIRED));
    expect(store.getItem(STORAGE_VERSION_KEY)).toBe(String(STORAGE_VERSION));
    expect(store.getItem("preferred_language")).toBe("EN");
  });

  it("an empty server list stays empty: nothing re-seeds or is written back", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    hospitalApi((c) =>
      c.path === org("/program-enrollments") ? pageOf([]) : undefined,
    );
    render(<HospitalPatients />, { wrapper });
    expect(await screen.findByText("No patients here")).toBeInTheDocument();
    expect(
      setItem.mock.calls.filter(([key]) => String(key).includes("hospital")),
    ).toEqual([]);
    expect(window.localStorage.getItem("nr:hospital-enrollments")).toBeNull();
    setItem.mockRestore();
  });

  it("cannot come back: no data file touches browser storage; the seed is gone", () => {
    for (const file of DATA_FILES) {
      const text = fs.readFileSync(path.join(process.cwd(), file), "utf8");
      expect(text, file).not.toMatch(
        /readJson|writeJson|storageKey|localStorage|hospital\.seed|seedHospital/,
      );
    }
    expect(
      fs.existsSync(
        path.join(process.cwd(), "src/features/hospital/hospital.seed.ts"),
      ),
    ).toBe(false);
  });
});
