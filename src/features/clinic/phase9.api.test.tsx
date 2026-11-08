import React from "react";
import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  render,
  renderHook,
  screen,
  waitFor,
  within,
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
  RETIRED_STORES,
  STORAGE_VERSION,
  STORAGE_VERSION_KEY,
} from "@/lib/data/legacyPurge";
import {
  apiError,
  memberContext,
  pageOf,
  stubApi,
  type StubCall,
  type StubReply,
} from "@/features/profile/memberApiStub";
import {
  uploadImport,
  LAB_IMPORT_MAX_CSV_CHARS,
} from "./labImports.repository";
import { correctProviderResult } from "./labsChart.repository";
import ClinicLabs from "./ClinicLabs";
import ClinicCheckIns from "./ClinicCheckIns";
import ClinicCcm from "./ClinicCcm";
import { ClinicErVisits } from "./ClinicErVisits";
import { ConditionLibraryModal } from "./ConditionLibraryModal";
import { useCcm } from "./useCcm";
import { useOfficeOrg } from "./officeContext";
import type { CcmEnrollment, CcmInboxItem } from "./ccm.repository";

/* Phase 9 (office labs CSV, check-in notices, CCM, ccm/inbox replacing the
   member feed) against a stand-in API. Synthetic data only: made-up ids,
   names and MRNs. */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/dashboard/clinic",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

const ORG = "33333333-3333-4333-8333-333333333333";
const P1 = "44444444-4444-4444-8444-444444444444";
const P2 = "55555555-5555-4555-8555-555555555555";

function officeContext(
  permissions: Record<string, number>,
  type = "DIALYSIS_CENTER",
): MeContext {
  return {
    ...memberContext(),
    patient: null,
    memberships: [
      {
        organizationId: ORG,
        organizationName: "Test Office",
        organizationType: type,
        organizationStatus: "ACTIVE",
        role: "Office Manager",
        title: null,
        isOwner: false,
        permissions,
      },
    ],
  } as MeContext;
}

const CLINIC = officeContext({
  patients: 2,
  labs: 3,
  check_ins: 1,
  staff: 1,
  messages: 1,
});
const NEPHRO = officeContext(
  { patients: 2, ccm: 2, check_ins: 1, staff: 1, settings: 2 },
  "NEPHROLOGY_OFFICE",
);

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

const rosterRow = (patientId: string, firstName: string, mrn: string) => ({
  patientId,
  firstName,
  lastName: "Synthetic",
  dateOfBirth: "1960-01-02",
  mrn,
  status: "ACTIVE",
  startedOn: "2026-01-01",
  endedOn: null,
  hasAccount: true,
  sharedAreas: ["labs"],
});

/** Every office or patient call carries the office in the header too. */
function expectOfficeHeader(calls: StubCall[]) {
  const office = calls.filter(
    (c) =>
      c.path.startsWith("/organizations/") || c.path.startsWith("/patients/"),
  );
  expect(office.length).toBeGreaterThan(0);
  for (const c of office) expect(c.headers["x-organization-id"]).toBe(ORG);
}

/* ------------------------------------------------------------ labs */

describe("office lab CSV import", () => {
  it("sends the CSV as text in a JSON body; patientId only for one patient", async () => {
    const { calls } = stubApi(() => ({ data: { id: "b-1" } }), CLINIC);
    await uploadImport(ORG, { fileName: "labs.csv", csv: "mrn,date\n" });
    await uploadImport(ORG, {
      fileName: "labs.csv",
      csv: "date,test\n",
      patientId: P1,
    });
    const posts = calls.filter((c) => c.method === "POST");
    expect(posts.map((c) => c.path)).toEqual([
      org("/lab-imports"),
      org("/lab-imports"),
    ]);
    expect(posts[0].body).toEqual({ fileName: "labs.csv", csv: "mrn,date\n" });
    expect(posts[1].body).toEqual({
      fileName: "labs.csv",
      csv: "date,test\n",
      patientId: P1,
    });
    expect(posts[0].headers["content-type"]).toBe("application/json");
    expect(posts[0].headers["x-organization-id"]).toBe(ORG);
  });

  it("refuses a file over 1,000,000 characters before any request", async () => {
    const { calls } = stubApi(() => ({ data: {} }), CLINIC);
    await expect(
      uploadImport(ORG, {
        fileName: "big.csv",
        csv: "x".repeat(LAB_IMPORT_MAX_CSV_CHARS + 1),
      }),
    ).rejects.toThrow(/too large/);
    expect(calls).toHaveLength(0);
  });

  it("a provider-result correction needs a reason (checked before sending)", async () => {
    const { calls } = stubApi(() => ({ data: {} }), CLINIC);
    await expect(
      correctProviderResult(ORG, P1, "r-1", { value: "5" }, "  "),
    ).rejects.toThrow(/reason/i);
    expect(calls).toHaveLength(0);
    await correctProviderResult(ORG, P1, "r-1", { value: "5" }, "Typo");
    expect(calls[0]).toMatchObject({
      method: "PATCH",
      path: `/patients/${P1}/labs/provider-results/r-1`,
      body: { value: "5", reason: "Typo" },
    });
    expect(calls[0].headers["x-organization-id"]).toBe(ORG);
  });
});

const IMPORT_ROWS = [
  ["MATCHED", "Ready to import"],
  ["UNMATCHED", "No matching patient"],
  ["NOT_OPTED_IN", "Not shared with your office"],
  ["INVALID", "Invalid"],
  ["DUPLICATE", "Already on the chart"],
].map(([status], i) => ({
  id: `row-${i}`,
  rowNumber: i + 2,
  status,
  patientId: status === "MATCHED" ? P1 : null,
  matchedBy: status === "MATCHED" ? "mrn" : null,
  message: status === "INVALID" ? "The date is in the future" : null,
  data:
    status === "INVALID"
      ? null
      : {
          mrn: `90000${i}`,
          patientId: P1,
          date: "2026-10-01",
          collectedOn: "2026-10-01",
          test: "Potassium",
          testCode: "potassium",
          value: "4.1",
          unit: "mEq/L",
          reference: "3.5-5.0",
          flag: "",
        },
}));

const BATCH = {
  id: "batch-1",
  organizationId: ORG,
  fileName: "labs.csv",
  status: "PENDING_REVIEW",
  totalRows: 5,
  matchedRows: 1,
  unmatchedRows: 1,
  invalidRows: 1,
  duplicateRows: 1,
  importedRows: 0,
  uploadedById: "u",
  confirmedById: null,
  confirmedAt: null,
  createdAt: "2026-11-01T00:00:00.000Z",
  updatedAt: "2026-11-01T00:00:00.000Z",
  rowCounts: {
    matched: 1,
    unmatched: 1,
    notOptedIn: 1,
    invalid: 1,
    duplicate: 1,
    excluded: 0,
    imported: 0,
  },
};

function labsHandler(extra?: (c: StubCall) => StubReply | undefined) {
  return (c: StubCall): StubReply | undefined => {
    const hit = extra?.(c);
    if (hit) return hit;
    if (c.path === org("/patients"))
      return pageOf([
        rosterRow(P1, "Ana", "900001"),
        rosterRow(P2, "Ben", "900002"),
      ]);
    if (c.path === `/patients/${P1}/labs`)
      return pageOf([
        {
          id: "lab-1",
          patientId: P1,
          collectedOn: "2026-10-01",
          resultedOn: null,
          testCode: "potassium",
          testName: "Potassium",
          value: "5.9",
          unit: "mEq/L",
          referenceRange: "3.5-5.0",
          abnormalFlag: "H",
          notes: null,
          source: "FACILITY_CSV_IMPORT",
          enteredById: "u",
          organizationId: ORG,
          hasReport: false,
          createdAt: "2026-10-02T00:00:00.000Z",
          updatedAt: "2026-10-02T00:00:00.000Z",
        },
      ]);
    if (c.path === org("/lab-imports") && c.method === "POST")
      return { data: BATCH };
    if (c.path === org("/lab-imports/batch-1")) return { data: BATCH };
    if (c.path === org("/lab-imports/batch-1/rows")) return pageOf(IMPORT_ROWS);
    if (c.path === org("/lab-imports/batch-1/confirm"))
      return { data: { ...BATCH, status: "IMPORTED", importedRows: 1 } };
    if (c.path === org("/lab-imports/batch-1/cancel"))
      return { data: { ...BATCH, status: "CANCELLED" } };
    return undefined;
  };
}

async function uploadFileInModal(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    await screen.findByRole("button", { name: /Upload Labs \(CSV\)/ }),
  );
  const dialog = await screen.findByRole("dialog");
  const input = dialog.querySelector('input[type="file"]') as HTMLInputElement;
  const file = new File(
    ["mrn,date,test,value\n900001,2026-10-01,Potassium,4.1\n"],
    "labs.csv",
    { type: "text/csv" },
  );
  await user.upload(input, file);
  await user.click(within(dialog).getByRole("button", { name: "Review file" }));
  return dialog;
}

describe("ClinicLabs on the API", () => {
  it("shows the chart from the API with the server's flag and source", async () => {
    const { calls } = stubApi(labsHandler(), CLINIC);
    render(<ClinicLabs />, { wrapper });
    expect(await screen.findByText("Potassium")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText("CSV import")).toBeInTheDocument();
    expectOfficeHeader(calls);
  });

  it("a 403 on the chart shows not shared, never an empty chart", async () => {
    stubApi(
      labsHandler((c) =>
        c.path === `/patients/${P1}/labs`
          ? apiError(403, "access.patient_access_denied")
          : undefined,
      ),
      CLINIC,
    );
    render(<ClinicLabs />, { wrapper });
    expect(
      await screen.findByText("This has not been shared with you"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/No lab results on this chart/),
    ).not.toBeInTheDocument();
  });

  it("reviews every row status, imports once on confirm, offers no re-match", async () => {
    const user = userEvent.setup();
    const { calls } = stubApi(labsHandler(), CLINIC);
    render(<ClinicLabs />, { wrapper });
    const dialog = await uploadFileInModal(user);
    for (const label of [
      "Ready to import",
      "No matching patient",
      "Not shared with your office",
      "Invalid",
      "Already on the chart",
    ])
      expect(await within(dialog).findByText(label)).toBeInTheDocument();
    expect(within(dialog).getByText("The date is in the future")).toBeVisible();
    expect(
      within(dialog).queryByRole("button", { name: /match/i }),
    ).not.toBeInTheDocument();
    expect(await axe(dialog)).toHaveNoViolations();
    await user.click(
      within(dialog).getByRole("button", { name: "Import 1 result" }),
    );
    await waitFor(() =>
      expect(
        screen.getByText(/1 lab result added to patient charts/),
      ).toBeInTheDocument(),
    );
    expect(
      calls.filter((c) => c.path === org("/lab-imports/batch-1/confirm")),
    ).toHaveLength(1);
    expect(calls.filter((c) => c.path.endsWith("/cancel"))).toHaveLength(0);
  });

  it("closing the review without importing cancels the batch", async () => {
    const user = userEvent.setup();
    const { calls } = stubApi(labsHandler(), CLINIC);
    render(<ClinicLabs />, { wrapper });
    const dialog = await uploadFileInModal(user);
    await within(dialog).findByText("Ready to import");
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() =>
      expect(
        calls.filter((c) => c.path === org("/lab-imports/batch-1/cancel")),
      ).toHaveLength(1),
    );
  });

  it("shows the server's refusal of an upload", async () => {
    const user = userEvent.setup();
    stubApi(
      labsHandler((c) =>
        c.path === org("/lab-imports") && c.method === "POST"
          ? apiError(400, "labs.import_too_many_rows", "Too many rows")
          : undefined,
      ),
      CLINIC,
    );
    render(<ClinicLabs />, { wrapper });
    const dialog = await uploadFileInModal(user);
    expect(await within(dialog).findByText("Too many rows")).toBeVisible();
  });
});

/* -------------------------------------------------------- check-ins */

const NOTICE = {
  id: "n-1",
  patientId: P1,
  checkInId: "c-1",
  firstName: "Ana",
  lastName: "Synthetic",
  mrn: "900001",
  reasons: ["rough-day", "member-requested"],
  raisedAt: "2026-11-01T10:00:00.000Z",
  deliverOn: "2026-11-01",
  seen: false,
  seenAt: null,
  seenById: null,
};

function checkInsHandler(extra?: (c: StubCall) => StubReply | undefined) {
  return (c: StubCall): StubReply | undefined => {
    const hit = extra?.(c);
    if (hit) return hit;
    if (c.path === org("/check-in-notices")) return pageOf([NOTICE]);
    if (c.path === org("/check-in-notices/n-1/check-in"))
      return {
        data: {
          id: "c-1",
          patientId: P1,
          checkInDate: "2026-11-01",
          treatmentDay: false,
          feeling: "rough",
          recoveryWindow: null,
          backToNormalAt: null,
          energyLevel: 2,
          resumedActivities: null,
          symptoms: ["fatigue"],
          severity: "moderate",
          bloodPressure: "150/95",
          weight: null,
          urineOutputMl: null,
          appetite: "poor",
          missedTreatment: false,
          notes: "Tired after the weekend",
        },
      };
    if (c.path === org("/check-in-notices/n-1/seen"))
      return { data: { ...NOTICE, seen: true } };
    if (c.path === org("/check-ins/summary"))
      return pageOf([
        {
          patientId: P1,
          firstName: "Ana",
          lastName: "Synthetic",
          mrn: "900001",
          from: "2026-11-01",
          to: "2026-11-03",
          daysInWindow: 3,
          checkInDays: 2,
          completionPercent: 67,
          lastCheckInDate: "2026-11-02",
        },
      ]);
    return undefined;
  };
}

describe("ClinicCheckIns on the API (D33 closed)", () => {
  it("lists the server's notices with their reasons; opening reads the check-in, then marks it seen", async () => {
    const user = userEvent.setup();
    const { calls } = stubApi(checkInsHandler(), CLINIC);
    render(<ClinicCheckIns />, { wrapper });
    expect(await screen.findByText("Rough day")).toBeInTheDocument();
    expect(screen.getByText("Member asked for a call")).toBeInTheDocument();
    expect((await screen.findAllByText("67%")).length).toBeGreaterThan(0);
    await user.click(
      screen.getByRole("button", { name: "View — Ana Synthetic" }),
    );
    expect(await screen.findByText("Tired after the weekend")).toBeVisible();
    await waitFor(() =>
      expect(
        calls.filter((c) => c.path === org("/check-in-notices/n-1/seen")),
      ).toHaveLength(1),
    );
    const order = calls.map((c) => c.path);
    expect(order.indexOf(org("/check-in-notices/n-1/check-in"))).toBeLessThan(
      order.indexOf(org("/check-in-notices/n-1/seen")),
    );
    expect(await axe(screen.getByRole("dialog"))).toHaveNoViolations();
    expectOfficeHeader(calls);
  });

  it("shows no demo numbers: labels with no server source say so", async () => {
    stubApi(checkInsHandler(), CLINIC);
    render(<ClinicCheckIns />, { wrapper });
    await screen.findByText("Rough day");
    expect(screen.getAllByText("Not available yet").length).toBeGreaterThan(0);
    /* The old demo quote and demo members are gone. */
    expect(screen.queryByText(/Mary S\. Johnson|John D\./)).toBeNull();
  });

  it("a failed read is an error, not 'no notices'", async () => {
    stubApi(
      checkInsHandler((c) =>
        c.path === org("/check-in-notices") ? apiError(500, null) : undefined,
      ),
      CLINIC,
    );
    render(<ClinicCheckIns />, { wrapper });
    expect(
      await screen.findByText("Check-in notices could not be loaded"),
    ).toBeInTheDocument();
    expect(screen.queryByText("No check-in notices yet.")).toBeNull();
  });

  it("a role without check-ins sees the no-access state", async () => {
    stubApi(
      checkInsHandler((c) =>
        c.path.startsWith(org("/check-in")) ||
        c.path.startsWith(org("/check-ins"))
          ? apiError(403, "access.permission_denied")
          : undefined,
      ),
      CLINIC,
    );
    render(<ClinicCheckIns />, { wrapper });
    expect(
      (await screen.findAllByText("This has not been shared with you")).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText("No check-in notices yet.")).toBeNull();
  });
});

/* -------------------------------------------------------------- CCM */

const enrollment = (over: Partial<CcmEnrollment> = {}): CcmEnrollment => ({
  id: "e-1",
  patientId: P1,
  firstName: "Ana",
  lastName: "Synthetic",
  dateOfBirth: "1960-01-02",
  mrn: "900001",
  providerName: "Dr. Example",
  careManagerName: "Care Manager",
  location: "Main",
  conditions: ["ckd-4", "htn"],
  isOnDialysis: false,
  isOnHomeHealthOrHospice: false,
  billingBlocked: false,
  requirements: [
    {
      id: "consent",
      status: "complete",
      met: true,
      inProgress: false,
      notApplicable: false,
      date: "2026-09-02",
      detail: "",
    },
  ],
  requirementsMet: 1,
  requirementsTotal: 8,
  kidneyCarePlan: null,
  enrolledById: null,
  enrolledAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
  month: "2026-11",
  minutes: 20,
  pendingMinutes: 5,
  remainingMinutes: 10,
  status: "Below Threshold",
  lastActivityOn: "2026-11-01",
  nextFollowUpOn: null,
  openAlerts: 1,
  overdueFollowUps: 0,
  ...over,
});

const INBOX: CcmInboxItem = {
  id: "i-1",
  patientId: P1,
  firstName: "Ana",
  lastName: "Synthetic",
  mrn: "900001",
  kind: "Blood pressure",
  text: "Two high readings this week",
  activityType: "BP Review & Follow-Up",
  receivedAt: "2026-11-01T08:00:00.000Z",
  resolved: false,
  resolvedAt: null,
  resolvedById: null,
};

function ccmHandler(extra?: (c: StubCall) => StubReply | undefined) {
  return (c: StubCall): StubReply | undefined => {
    const hit = extra?.(c);
    if (hit) return hit;
    if (c.path === org("/ccm/enrollments/summary"))
      return {
        data: {
          month: "2026-11",
          enrolled: 7,
          billingQueue: 6,
          billingDeactivated: 1,
          actionNeeded: 2,
          belowThreshold: 3,
          readyForReview: 1,
        },
      };
    if (c.path === org("/ccm/enrollments")) {
      if (c.query.get("billing") === "deactivated") return pageOf([]);
      return pageOf([enrollment()]);
    }
    if (c.path === org(`/ccm/enrollments/${P1}`)) return { data: enrollment() };
    if (c.path === org(`/ccm/enrollments/${P1}/activities`))
      return { data: [] };
    if (c.path === org("/ccm/inbox")) return pageOf([INBOX]);
    if (c.path === org("/ccm/conditions")) return { data: [] };
    if (c.path === org("/check-in-notices")) return pageOf([]);
    if (c.path === org("/staff")) return pageOf([]);
    return undefined;
  };
}

describe("CCM actions hit one route each, keyed by patientId", () => {
  it("sends the exact route and body for every write", async () => {
    const { calls } = stubApi(() => ({ data: {} }), NEPHRO);
    const { result } = renderHook(
      () => ({ actions: useCcm(), office: useOfficeOrg() }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.office.orgId).toBe(ORG));
    const actions = () => result.current.actions;
    await act(async () => {
      await actions().setRequirement(P1, "consent", {
        met: false,
        inProgress: true,
        notApplicable: false,
        date: null,
        detail: "",
      });
      await actions().addActivity(P1, {
        type: "Patient Communication",
        activityDate: "2026-11-01",
        minutes: 15,
        outcome: "Education provided",
        countsToward: "yes",
        followUp: {
          date: "2026-11-05",
          task: "Call back",
          assigneeId: "66666666-6666-4666-8666-666666666666",
        },
      });
      await actions().setConditions(P1, ["ckd-4", "htn"]);
      await actions().setCompliance(P1, {
        isOnDialysis: true,
        isOnHomeHealthOrHospice: false,
      });
      await actions().setKidneyCare(P1, { answers: { krtEducation: "Yes" } });
      await actions().setEhrDocumented(P1, "a-1", true);
      await actions().completeFollowUp(P1, "a-1");
      await actions().resolveInbox(P1, "i-1");
    });
    const writes = calls
      .filter((c) => c.method !== "GET")
      .map((c) => [c.method, c.path.replace(`/organizations/${ORG}`, "")]);
    expect(writes).toEqual([
      ["PUT", `/ccm/enrollments/${P1}/requirements/consent`],
      ["POST", `/ccm/enrollments/${P1}/activities`],
      ["PATCH", `/ccm/enrollments/${P1}`],
      ["PATCH", `/ccm/enrollments/${P1}`],
      ["PATCH", `/ccm/enrollments/${P1}/kidney-care`],
      ["PATCH", `/ccm/enrollments/${P1}/activities/a-1`],
      ["PATCH", `/ccm/enrollments/${P1}/activities/a-1`],
      ["POST", "/ccm/inbox/i-1/resolve"],
    ]);
    const body = (i: number) =>
      calls.filter((c) => c.method !== "GET")[i].body as Record<
        string,
        unknown
      >;
    expect(body(0)).toHaveProperty("met", false);
    expect(body(1)).not.toHaveProperty("staff");
    expect(body(1).followUp).toEqual({
      date: "2026-11-05",
      task: "Call back",
      assigneeId: "66666666-6666-4666-8666-666666666666",
    });
    expect(body(6)).toEqual({ followUpDone: true });
    for (const c of calls.filter((c) => c.method !== "GET"))
      expect(c.headers["x-organization-id"]).toBe(ORG);
  });
});

describe("ClinicCcm on the API", () => {
  it("shows the server's summary, worklist and inbox (no seed)", async () => {
    const user = userEvent.setup();
    const { calls } = stubApi(ccmHandler(), NEPHRO);
    render(<ClinicCcm />, { wrapper });
    expect(
      await screen.findByRole("button", { name: "Open Ana Synthetic" }),
    ).toBeInTheDocument();
    /* Counts from /summary, never from the page (one row loaded). */
    expect(
      screen.getByText("6 enrolled patients", { exact: false }),
    ).toBeVisible();
    expect(screen.getByText("10 min remaining")).toBeVisible();
    /* No demo patient from the old seed. */
    expect(screen.queryByText(/Mary S\. Johnson|John D\. Smith/)).toBeNull();
    await user.click(screen.getByRole("tab", { name: /CCM Inbox/ }));
    expect(
      await screen.findByText("Two high readings this week"),
    ).toBeVisible();
    const worklist = calls.find(
      (c) =>
        c.path === org("/ccm/enrollments") &&
        c.query.get("billing") === "queue",
    );
    expect(worklist?.query.get("sort")).toBe("name");
    expectOfficeHeader(calls);
  });

  it("opens a patient by id and shows the server's minutes and alert", async () => {
    const user = userEvent.setup();
    const { calls } = stubApi(ccmHandler(), NEPHRO);
    render(<ClinicCcm />, { wrapper });
    await user.click(
      await screen.findByRole("button", { name: "Open Ana Synthetic" }),
    );
    const sheet = await screen.findByRole("dialog");
    expect(
      await within(sheet).findByText("+5 min pending review"),
    ).toBeVisible();
    expect(
      await within(sheet).findByText("Two high readings this week"),
    ).toBeVisible();
    expect(calls.some((c) => c.path === org(`/ccm/enrollments/${P1}`))).toBe(
      true,
    );
    expect(calls.some((c) => c.query.get("patientId") === P1)).toBe(true);
  });

  it("a role without CCM sees the no-access state, not an empty worklist", async () => {
    stubApi(
      ccmHandler((c) =>
        c.path.startsWith(org("/ccm"))
          ? apiError(403, "access.permission_denied")
          : undefined,
      ),
      NEPHRO,
    );
    render(<ClinicCcm />, { wrapper });
    expect(
      (await screen.findAllByText("This has not been shared with you")).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText("No patients match these filters.")).toBeNull();
  });

  it("an ended relationship shows its own state in the sheet (404)", async () => {
    const user = userEvent.setup();
    stubApi(
      ccmHandler((c) =>
        c.path === org(`/ccm/enrollments/${P1}`)
          ? apiError(404, "ccm.enrollment_not_found")
          : undefined,
      ),
      NEPHRO,
    );
    render(<ClinicCcm />, { wrapper });
    await user.click(
      await screen.findByRole("button", { name: "Open Ana Synthetic" }),
    );
    expect(
      await screen.findByText("This patient is no longer in this office's CCM"),
    ).toBeVisible();
  });
});

/* ------------------------------------------------- storage and sources */

const PHASE_9_RETIRED = ["clinic-labs", "clinic-ccm", "ccm-condition-library"];

const PHASE_9_FILES = [
  "src/features/clinic/officeContext.ts",
  "src/features/clinic/labImports.repository.ts",
  "src/features/clinic/labsChart.repository.ts",
  "src/features/clinic/checkInNotices.repository.ts",
  "src/features/clinic/ccm.repository.ts",
  "src/features/clinic/useClinicLabs.ts",
  "src/features/clinic/useOfficeCheckIns.ts",
  "src/features/clinic/useCcm.ts",
  "src/features/clinic/useConditionLibrary.ts",
  "src/features/clinic/ClinicLabs.tsx",
  "src/features/clinic/ClinicCheckIns.tsx",
  "src/features/clinic/ClinicErVisits.tsx",
  "src/features/clinic/ClinicCcm.tsx",
  "src/features/clinic/KidneyCareSection.tsx",
  "src/features/clinic/ConditionLibraryModal.tsx",
  "src/features/clinic/ccm.data.ts",
  "src/features/clinic/labs.data.ts",
  "src/features/clinic/checkIns.data.ts",
  "src/features/clinic/clinicEr.data.ts",
];

function clinicSources(): string[] {
  const dir = path.resolve(process.cwd(), "src/features/clinic");
  return fs
    .readdirSync(dir)
    .filter((f) => /\.(ts|tsx)$/.test(f) && !/\.test\.(ts|tsx)$/.test(f))
    .map((f) => path.join(dir, f));
}

/** Member hooks and member stores the office must never read (D33). */
const MEMBER_DATA =
  /from "@\/features\/(personal-log|medications|labs|emergency)\/(use|.*\.repository|.*\.store)|from "\.\/(useMemberFeed|memberFeed)"|\buseMemberFeed\(|\bLINKED_MEMBER\b/;

/** The code without its comments (a comment may name what was removed). */
function codeOf(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

describe("ClinicErVisits on the office summary", () => {
  const erRow = (weeks: number) => ({
    patientId: P1,
    firstName: "Ana",
    lastName: "Synthetic",
    mrn: "900001",
    from: "2026-11-01",
    to: "2026-11-03",
    weeksInWindow: 1,
    weeksAnswered: 1,
    erVisitWeeks: weeks,
    lastErVisitWeekOf: weeks ? "2026-10-26" : null,
    lastAnsweredAt: null,
  });

  it("lists who reported a visit from the server, with no sample patients", async () => {
    const { calls } = stubApi(
      (c) =>
        c.path === org("/er-visits/summary") ? pageOf([erRow(2)]) : undefined,
      CLINIC,
    );
    render(<ClinicErVisits />, { wrapper });
    expect((await screen.findAllByText("2 visits")).length).toBeGreaterThan(0);
    expect(screen.getByText(/MRN 900001/)).toBeVisible();
    expect(screen.queryByText(/Mary S\. Johnson|Robert L\. Davis/)).toBeNull();
    /* Six month windows and the 90-day list: bounded, never per patient. */
    expect(
      calls.filter((c) => c.path === org("/er-visits/summary")).length,
    ).toBe(7);
    expectOfficeHeader(calls);
  });

  it("a role without patients access sees no access, not zero visits", async () => {
    stubApi(
      (c) =>
        c.path === org("/er-visits/summary")
          ? apiError(403, "access.permission_denied")
          : undefined,
      CLINIC,
    );
    render(<ClinicErVisits />, { wrapper });
    expect(
      await screen.findByText("This has not been shared with you"),
    ).toBeVisible();
    expect(screen.queryByText("No self-reported ER visits.")).toBeNull();
  });
});

describe("the condition library on the API", () => {
  const CONDITIONS = [
    {
      id: "pkd",
      entryId: null,
      label: "Polycystic Kidney Disease",
      short: "PKD",
      group: "Kidney / Renal",
      secondary: false,
      isDefault: true,
      active: true,
    },
    {
      id: "custom:Sarcoidosis",
      entryId: "77777777-7777-4777-8777-777777777777",
      label: "Sarcoidosis",
      short: "Sarcoidosis",
      group: null,
      secondary: false,
      isDefault: false,
      active: true,
    },
  ];

  it("toggles a default by id, a custom entry by entryId, and adds by name only", async () => {
    const user = userEvent.setup();
    const { calls } = stubApi(
      (c) =>
        c.path === org("/ccm/conditions") && c.method === "GET"
          ? { data: CONDITIONS }
          : { data: {} },
      NEPHRO,
    );
    render(<ConditionLibraryModal onClose={() => undefined} />, { wrapper });
    const dialog = await screen.findByRole("dialog");
    await within(dialog).findAllByText("Sarcoidosis");
    expect(await axe(dialog)).toHaveNoViolations();
    await user.click(
      within(dialog).getByRole("switch", {
        name: "Offer Polycystic Kidney Disease",
      }),
    );
    await user.click(
      within(dialog).getByRole("switch", { name: "Offer Sarcoidosis" }),
    );
    await user.type(
      within(dialog).getByLabelText(/^Name/),
      "Sickle Cell Disease",
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Add Condition" }),
    );
    await waitFor(() =>
      expect(calls.filter((c) => c.method !== "GET")).toHaveLength(3),
    );
    const writes = calls.filter((c) => c.method !== "GET");
    expect(writes[0]).toMatchObject({
      method: "PUT",
      path: org("/ccm/conditions/defaults/pkd"),
      body: { active: false },
    });
    expect(writes[1]).toMatchObject({
      method: "PATCH",
      path: org("/ccm/conditions/77777777-7777-4777-8777-777777777777"),
      body: { active: false },
    });
    expect(writes[2]).toMatchObject({
      method: "POST",
      path: org("/ccm/conditions"),
      body: { name: "Sickle Cell Disease" },
    });
  });
});

describe("Phase 9 retired stores", () => {
  it.each(PHASE_9_RETIRED)(
    "%s is purged in every variant and the marker is written",
    (name) => {
      const store = RETIRED_STORES.find((s) => s.name === name);
      expect(store?.since).toBe(10);
      expect(STORAGE_VERSION).toBeGreaterThanOrEqual(10);
      const keys = [
        `nr:${name}`,
        `nr:member:someone@example.test:${name}`,
        `nr:caregiver-none:${name}`,
      ];
      for (const key of keys) {
        expect(isRetiredKey(key)).toBe(true);
        window.localStorage.setItem(key, JSON.stringify({ legacy: true }));
      }
      purgeLegacyStorage(window.localStorage);
      for (const key of keys)
        expect(window.localStorage.getItem(key)).toBeNull();
      expect(window.localStorage.getItem(STORAGE_VERSION_KEY)).toBe(
        String(STORAGE_VERSION),
      );
    },
  );

  it("legacy CCM and lab rows are never shown: the screens read only the API", async () => {
    window.localStorage.setItem(
      "nr:clinic-ccm",
      JSON.stringify({
        version: 6,
        state: {
          activities: [],
          requirements: {},
          inbox: [
            {
              id: "legacy",
              mrn: "999999",
              kind: "Lab alert",
              text: "Legacy alert 999999",
              receivedAt: "2026-10-01T00:00:00.000Z",
              resolved: false,
            },
          ],
        },
      }),
    );
    window.localStorage.setItem(
      "nr:clinic-labs",
      JSON.stringify({
        version: 2,
        state: {
          results: [{ id: "x", mrn: "999999", test: "Legacy Potassium" }],
        },
      }),
    );
    purgeLegacyStorage(window.localStorage);
    expect(window.localStorage.getItem("nr:clinic-ccm")).toBeNull();
    expect(window.localStorage.getItem("nr:clinic-labs")).toBeNull();
    const user = userEvent.setup();
    stubApi(
      ccmHandler((c) =>
        c.path === org("/ccm/inbox") || c.path === org("/ccm/enrollments")
          ? pageOf([])
          : undefined,
      ),
      NEPHRO,
    );
    render(<ClinicCcm />, { wrapper });
    await screen.findByText("No patients match these filters.");
    await user.click(screen.getByRole("tab", { name: /CCM Inbox/ }));
    await screen.findByText("The inbox is clear.");
    expect(document.body.textContent).not.toContain("999999");
    /* Nothing wrote the retired keys back. */
    expect(window.localStorage.getItem("nr:clinic-ccm")).toBeNull();
    expect(window.localStorage.getItem("nr:ccm-condition-library")).toBeNull();
  });

  it.each(PHASE_9_FILES)("%s does not touch browser storage", (file) => {
    const text = fs.readFileSync(path.resolve(process.cwd(), file), "utf8");
    expect(text).not.toMatch(/@\/lib\/data\/storage/);
    expect(text).not.toMatch(/localStorage|sessionStorage/);
  });

  it("no office code reads member hooks or member storage (D33)", () => {
    for (const file of clinicSources()) {
      const text = codeOf(fs.readFileSync(file, "utf8"));
      expect(`${path.basename(file)}: ${MEMBER_DATA.test(text)}`).toBe(
        `${path.basename(file)}: false`,
      );
    }
  });

  it("the member feed and the clinic seeds are gone", () => {
    for (const file of [
      "src/features/clinic/memberFeed.ts",
      "src/features/clinic/useMemberFeed.ts",
    ])
      expect(fs.existsSync(path.resolve(process.cwd(), file))).toBe(false);
    const ccm = fs.readFileSync(
      path.resolve(process.cwd(), "src/features/clinic/ccm.data.ts"),
      "utf8",
    );
    expect(ccm).not.toMatch(/seedCcmState|CCM_PATIENTS|PROVIDERS|STAFF =/);
    const labs = fs.readFileSync(
      path.resolve(process.cwd(), "src/features/clinic/labs.data.ts"),
      "utf8",
    );
    expect(labs).not.toMatch(/seedLabs|importLabs|parseLabCsv/);
  });
});
