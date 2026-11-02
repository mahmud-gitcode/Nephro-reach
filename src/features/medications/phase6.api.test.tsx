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
} from "@testing-library/react";
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
  GRACE_ID,
  JOHN_ID,
  memberContext,
  pageOf,
  stubApi,
} from "@/features/profile/memberApiStub";
import { uploadFile } from "@/lib/api/upload";
import { useMedications } from "./useMedications";
import { useReminders } from "./useReminders";
import { useAdherence, useMedicationLog } from "./useMedicationLog";
import { AdherenceChart } from "./MedicationPanels";
import type { AdherenceReport } from "./medicationLog.types";
import type { ApiMedication } from "./medications.mapper";
import type { ApiReminder } from "./reminders.mapper";
import { useMemberLabs } from "@/features/labs/useMemberLabs";
import { useMemberClinicLabs } from "@/features/labs/useMemberClinicLabs";
import {
  LabReportButton,
  LabResultActions,
} from "@/features/labs/LabResultActions";
import type { ApiLabResult } from "@/features/labs/labs.mapper";

/* Phase 6 (medications and member labs) against a stand-in API. Synthetic
   data only: the synthetic John and Grace ids of memberApiStub. */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

vi.mock("@/lib/api/upload", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api/upload")>()),
  uploadFile: vi.fn(async () => "file-9"),
}));

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
  vi.mocked(uploadFile).mockClear();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

const BASE = `/patients/${JOHN_ID}`;

const medication = (over: Partial<ApiMedication> = {}): ApiMedication => ({
  id: "med-a",
  patientId: JOHN_ID,
  name: "Renvela",
  dose: "800 mg",
  route: "PO",
  frequency: "With meals",
  purpose: null,
  startDate: "2026-09-01",
  endDate: null,
  pharmacy: null,
  status: "Active",
  provider: null,
  instructions: null,
  needsRefill: false,
  photoFileId: null,
  createdById: "u",
  createdAt: "2026-09-01T10:00:00.000Z",
  updatedAt: "2026-09-01T10:00:00.000Z",
  ...over,
});

const reminder = (over: Partial<ApiReminder> = {}): ApiReminder => ({
  id: "rem-a",
  patientId: JOHN_ID,
  kind: "MEDICATION",
  medicationId: "med-a",
  title: null,
  times: ["08:00"],
  frequency: "Daily",
  channels: ["in_app"],
  enabled: true,
  notes: null,
  createdAt: "2026-10-01T10:00:00.000Z",
  updatedAt: "2026-10-01T10:00:00.000Z",
  ...over,
});

const lab = (over: Partial<ApiLabResult> = {}): ApiLabResult => ({
  id: "lab-1",
  patientId: JOHN_ID,
  collectedOn: "2026-10-01",
  resultedOn: null,
  testCode: "potassium",
  testName: "Potassium",
  value: "4.5",
  valueNumeric: 4.5,
  unit: "mEq/L",
  referenceRange: "3.5 – 5.0",
  referenceLow: 3.5,
  referenceHigh: 5,
  abnormalFlag: null,
  notes: null,
  source: "PATIENT_ENTERED",
  enteredById: "u",
  organizationId: null,
  hasReport: false,
  seenByPatientAt: null,
  createdAt: "2026-10-01T10:00:00.000Z",
  updatedAt: "2026-10-01T10:00:00.000Z",
  ...over,
});

const noOfficeHeader = (calls: { headers: Record<string, string> }[]) => {
  for (const call of calls)
    expect(call.headers["x-organization-id"]).toBeUndefined();
};

describe("medications on the API", () => {
  it("reads John's list by his patient id, a full page, no office header", async () => {
    const { calls } = stubApi((call) =>
      call.method === "GET" && call.path === `${BASE}/medications`
        ? pageOf([medication()])
        : undefined,
    );
    const { result } = renderHook(() => useMedications(), { wrapper });
    await waitFor(() => expect(result.current.medications).toHaveLength(1));
    const read = calls.find((c) => c.path === `${BASE}/medications`)!;
    expect(read.query.get("limit")).toBe("150");
    expect(result.current.medications[0]).toMatchObject({
      id: "med-a",
      startDate: "09/01/2026",
      endDate: "---",
    });
    noOfficeHeader(calls);
    expect(calls.some((c) => c.path.includes(GRACE_ID))).toBe(false);
  });

  it("adds with one POST: photo uploaded first, only its id sent, no status", async () => {
    const { calls } = stubApi((call) => {
      if (call.path === `${BASE}/medications` && call.method === "POST")
        return { status: 201, data: medication({ id: "med-new" }) };
      if (call.path === `${BASE}/medications`) return pageOf([]);
      return undefined;
    });
    const { result } = renderHook(() => useMedications(), { wrapper });
    await waitFor(() => expect(result.current.isPending).toBe(false));
    const photo = new File(["x"], "label.png", { type: "image/png" });
    let added: { id: string } | undefined;
    await act(async () => {
      added = await result.current.add(
        {
          name: "Renvela",
          dose: "800 mg",
          route: "PO",
          frequency: "With meals",
          purpose: "",
          startDate: "2026-09-01",
          endDate: "",
          provider: "",
          pharmacy: "",
          instructions: "",
        },
        photo,
      );
    });
    expect(added?.id).toBe("med-new");
    expect(uploadFile).toHaveBeenCalledWith(photo);
    const posts = calls.filter((c) => c.method === "POST");
    expect(posts).toHaveLength(1);
    expect(posts[0].body).toMatchObject({
      name: "Renvela",
      startDate: "2026-09-01",
      photoFileId: "file-9",
    });
    expect(posts[0].body).not.toHaveProperty("status");
    expect(JSON.stringify(posts[0].body)).not.toMatch(/data:/);
    noOfficeHeader(calls);
  });

  it("edits by id without the name or start date; status and refill are PATCHes", async () => {
    const { calls } = stubApi((call) => {
      if (call.method === "PATCH") return { data: medication() };
      if (call.path === `${BASE}/medications`) return pageOf([medication()]);
      return undefined;
    });
    const { result } = renderHook(() => useMedications(), { wrapper });
    await waitFor(() => expect(result.current.medications).toHaveLength(1));
    await act(async () => {
      await result.current.update("med-a", {
        dose: "1600 mg",
        route: "PO",
        frequency: "With meals",
        purpose: "",
        endDate: "",
        provider: "",
        pharmacy: "",
        instructions: "",
      });
    });
    act(() => result.current.setStatus("med-a", "Paused"));
    act(() => result.current.setNeedsRefill("med-a", true));
    await waitFor(() =>
      expect(calls.filter((c) => c.method === "PATCH")).toHaveLength(3),
    );
    const patches = calls.filter((c) => c.method === "PATCH");
    for (const p of patches) {
      expect(p.path).toBe(`${BASE}/medications/med-a`);
      expect(p.body).not.toHaveProperty("name");
      expect(p.body).not.toHaveProperty("startDate");
    }
    expect(patches[1].body).toEqual({ status: "Paused" });
    expect(patches[2].body).toEqual({ needsRefill: true });
  });

  it("shows the error, never an empty list, when the read fails", async () => {
    stubApi((call) =>
      call.path === `${BASE}/medications` ? { status: 500 } : undefined,
    );
    const { result } = renderHook(() => useMedications(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.medications).toEqual([]);
  });
});

describe("reminders by medication id, HH:mm", () => {
  it("creates one for a medication without one, with 24-hour times", async () => {
    const { calls } = stubApi((call) => {
      if (call.method === "POST")
        return { status: 201, data: reminder({ times: ["08:00", "20:00"] }) };
      if (call.path === `${BASE}/reminders`) return pageOf([]);
      return undefined;
    });
    const { result } = renderHook(() => useReminders(), { wrapper });
    await waitFor(() => expect(result.current.isPending).toBe(false));
    const read = calls.find((c) => c.path === `${BASE}/reminders`)!;
    expect(read.query.get("kind")).toBe("MEDICATION");
    await act(async () => {
      await result.current.setTimes("med-a", ["08:00 PM", "08:00 AM"]);
    });
    const post = calls.find((c) => c.method === "POST")!;
    expect(post.path).toBe(`${BASE}/reminders`);
    expect(post.body).toEqual({
      kind: "MEDICATION",
      medicationId: "med-a",
      times: ["08:00", "20:00"],
      frequency: "Daily",
      channels: ["in_app"],
      enabled: true,
    });
  });

  it("moves an existing one (PATCH) and removes it with no times (DELETE)", async () => {
    const { calls } = stubApi((call) => {
      if (call.method === "PATCH") return { data: reminder() };
      if (call.method === "DELETE") return { data: null };
      if (call.path === `${BASE}/reminders`) return pageOf([reminder()]);
      return undefined;
    });
    const { result } = renderHook(() => useReminders(), { wrapper });
    await waitFor(() => expect(result.current.reminders).toHaveLength(1));
    await act(async () => {
      await result.current.setTimes("med-a", ["12:05 AM"]);
    });
    await act(async () => {
      await result.current.remove("med-a");
    });
    const patch = calls.find((c) => c.method === "PATCH")!;
    expect(patch.path).toBe(`${BASE}/reminders/rem-a`);
    expect(patch.body).toEqual({ times: ["00:05"], enabled: true });
    expect(calls.find((c) => c.method === "DELETE")?.path).toBe(
      `${BASE}/reminders/rem-a`,
    );
    expect(calls.some((c) => c.method === "POST")).toBe(false);
  });
});

describe("the dose log", () => {
  it("reads one day and PUTs a dose by medication id and HH:mm", async () => {
    const { calls } = stubApi((call) => {
      if (call.method === "PUT") return { data: null };
      if (call.path === `${BASE}/medications`) return pageOf([medication()]);
      if (call.path === `${BASE}/medications/doses`)
        return pageOf([
          {
            id: "d-1",
            patientId: JOHN_ID,
            medicationId: "med-a",
            doseDate: "2026-10-30",
            doseTime: "08:00",
            status: "taken",
            stampedAt: "2026-10-30T08:05:00.000Z",
            createdById: "u",
          },
        ]);
      if (call.path === `${BASE}/medications/side-effects`) return pageOf([]);
      return undefined;
    });
    const { result } = renderHook(() => useMedicationLog("2026-10-30"), {
      wrapper,
    });
    await waitFor(() => expect(result.current.doses).toHaveLength(1));
    const read = calls.find((c) => c.path === `${BASE}/medications/doses`)!;
    expect(read.query.get("from")).toBe("2026-10-30");
    expect(read.query.get("to")).toBe("2026-10-30");
    expect(result.current.statusOf("2026-10-30", "med-a", "08:00")).toBe(
      "taken",
    );
    await waitFor(() =>
      expect(result.current.doses[0].medication).toBe("Renvela"),
    );

    act(() =>
      result.current.setDoseStatus("2026-10-30", "med-a", "20:00", "missed"),
    );
    act(() =>
      result.current.setSideEffect("2026-10-30", "med-a", "08:00", null),
    );
    await waitFor(() =>
      expect(calls.filter((c) => c.method === "PUT")).toHaveLength(2),
    );
    const [dosePut, effectPut] = calls.filter((c) => c.method === "PUT");
    expect(dosePut.path).toBe(`${BASE}/medications/med-a/doses`);
    expect(dosePut.body).toEqual({
      doseDate: "2026-10-30",
      doseTime: "20:00",
      status: "missed",
    });
    expect(effectPut.path).toBe(`${BASE}/medications/med-a/side-effects`);
    expect(effectPut.body).toEqual({
      effectDate: "2026-10-30",
      effectTime: "08:00",
      effect: null,
    });
  });
});

const report: AdherenceReport = {
  from: "2026-10-24",
  to: "2026-10-30",
  days: 7,
  overall: {
    taken: 4,
    late: 0,
    missed: 2,
    pending: 8,
    percent: 67,
    band: "poor",
  },
  byDay: Array.from({ length: 7 }, (_, i) => ({
    date: `2026-10-${24 + i}`,
    summary: {
      taken: i === 6 ? 4 : 0,
      late: 0,
      missed: i === 6 ? 2 : 0,
      pending: 0,
      percent: i === 6 ? 67 : null,
      band: i === 6 ? ("poor" as const) : null,
    },
  })),
  medications: [
    {
      medicationId: "med-a",
      name: "Renvela",
      scheduledPerDay: 2,
      summary: {
        taken: 4,
        late: 0,
        missed: 2,
        pending: 8,
        percent: 67,
        band: "poor",
      },
    },
  ],
  missedDoses: {
    threshold: 2,
    windowDays: 7,
    count: 2,
    triggered: true,
    medicationIds: ["med-a"],
  },
};

describe("adherence is the server's", () => {
  it("reads /medications/adherence for the week", async () => {
    const { calls } = stubApi((call) =>
      call.path === `${BASE}/medications/adherence`
        ? { data: report }
        : undefined,
    );
    const { result } = renderHook(() => useAdherence(7), { wrapper });
    await waitFor(() => expect(result.current.report).not.toBeNull());
    const read = calls.find((c) => c.path === `${BASE}/medications/adherence`)!;
    expect(read.query.get("days")).toBe("7");
    expect(result.current.report?.overall.percent).toBe(67);
  });

  it("the tracker shows the server's figure, not a client count", async () => {
    stubApi();
    const { container } = render(<AdherenceChart report={report} />, {
      wrapper,
    });
    /* The ring, the day row and its table all read the server figure. */
    expect((await screen.findAllByText("67%")).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/6 doses recorded over 7 days/),
    ).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("member labs on the API", () => {
  it("adds a draw as one POST of rows, the report by file id", async () => {
    const { calls } = stubApi((call) => {
      if (call.method === "POST" && call.path === `${BASE}/labs`)
        return { status: 201, data: [lab({ id: "new-1" })] };
      if (call.path === `${BASE}/labs`) return pageOf([lab()]);
      if (call.path === `${BASE}/labs/trends`) return { data: [] };
      return undefined;
    });
    const { result } = renderHook(() => useMemberLabs(), { wrapper });
    await waitFor(() => expect(result.current.rows).toHaveLength(1));
    const read = calls.find(
      (c) => c.path === `${BASE}/labs` && c.method === "GET",
    )!;
    expect(read.query.get("from")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(read.query.get("limit")).toBe("150");
    const trends = calls.find((c) => c.path === `${BASE}/labs/trends`)!;
    expect(trends.query.get("from")).toBe(read.query.get("from"));

    const file = new File(["%PDF"], "report.pdf", { type: "application/pdf" });
    await act(async () => {
      await result.current.addDraw(
        {
          collectedOn: "2026-10-30",
          values: { BUN: "48", Potassium: "5.2" },
          notes: "",
        },
        file,
      );
    });
    const posts = calls.filter((c) => c.method === "POST");
    expect(posts).toHaveLength(1);
    expect(posts[0].body).toEqual({
      collectedOn: "2026-10-30",
      reportFileId: "file-9",
      results: [
        { testCode: "bun", value: "48" },
        { testCode: "potassium", value: "5.2" },
      ],
    });
    noOfficeHeader(calls);
  });

  it("uploads nothing for an empty draw", async () => {
    stubApi((call) =>
      call.path === `${BASE}/labs`
        ? pageOf([])
        : call.path === `${BASE}/labs/trends`
          ? { data: [] }
          : undefined,
    );
    const { result } = renderHook(() => useMemberLabs(), { wrapper });
    await waitFor(() => expect(result.current.isPending).toBe(false));
    await expect(
      result.current.addDraw(
        { collectedOn: "2026-10-30", values: {}, notes: "" },
        new File(["x"], "r.pdf", { type: "application/pdf" }),
      ),
    ).rejects.toThrow(RangeError);
    expect(uploadFile).not.toHaveBeenCalled();
  });

  it("a 403 is an error (not shared), never an empty table", async () => {
    stubApi((call) =>
      call.path.startsWith(`${BASE}/labs`)
        ? apiError(403, "access.labs_not_shared", "Not shared")
        : undefined,
    );
    const { result } = renderHook(() => useMemberLabs(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.rows).toEqual([]);
  });

  it("the patient marks the care team's results seen", async () => {
    const { calls } = stubApi((call) => {
      if (call.method === "POST") return { data: { markedCount: 1 } };
      if (call.path === `${BASE}/labs`)
        return pageOf([lab({ source: "FACILITY_CSV_IMPORT" })]);
      return undefined;
    });
    const { result } = renderHook(() => useMemberClinicLabs(), { wrapper });
    await waitFor(() => expect(result.current.unseen).toBe(true));
    const read = calls.find((c) => c.path === `${BASE}/labs`)!;
    expect(read.query.get("unseen")).toBe("true");
    expect(result.current.newest).toEqual({ date: "2026-10-01" });
    expect(result.current.canMarkSeen).toBe(true);
    act(() => result.current.markSeen());
    await waitFor(() =>
      expect(
        calls.some(
          (c) => c.method === "POST" && c.path === `${BASE}/labs/seen`,
        ),
      ).toBe(true),
    );
  });

  it("a caregiver never marks them seen (the server would refuse)", async () => {
    const caregiver: MeContext = {
      ...memberContext(),
      patient: null,
      caregiving: [
        {
          grantId: "g-1",
          patientId: JOHN_ID,
          firstName: "John",
          lastName: "Test",
          relationship: "Family",
          preset: "full",
          permissions: { labs: 2 },
        },
      ],
    };
    const { calls } = stubApi((call) => {
      if (call.path === `${BASE}/labs`)
        return pageOf([lab({ source: "FACILITY_CSV_IMPORT" })]);
      return undefined;
    }, caregiver);
    const { result } = renderHook(() => useMemberClinicLabs(), { wrapper });
    await waitFor(() => expect(result.current.unseen).toBe(true));
    expect(result.current.canMarkSeen).toBe(false);
    act(() => result.current.markSeen());
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(calls.some((c) => c.method === "POST")).toBe(false);
  });
});

describe("My Labs page", () => {
  const rows = [
    lab({ id: "own-k", collectedOn: "2026-10-01" }),
    lab({
      id: "clinic-p",
      collectedOn: "2026-10-01",
      testCode: "phosphorus",
      testName: "Phosphorus",
      value: "5.9",
      valueNumeric: 5.9,
      unit: "mg/dL",
      referenceRange: "2.5 – 4.5",
      referenceLow: 2.5,
      referenceHigh: 4.5,
      source: "FACILITY_CSV_IMPORT",
      organizationId: "org-1",
    }),
  ];
  const handler = (call: { method: string; path: string }) => {
    if (call.method === "POST") return { data: { markedCount: 1 } };
    if (call.path === `${BASE}/labs`) return pageOf(rows);
    if (call.path === `${BASE}/labs/trends`) return { data: [] };
    return undefined;
  };

  async function renderLabs(context?: MeContext) {
    const { default: Page } =
      await import("@/app/(portal)/dashboard/(member)/personal-log/lab-tracking/page");
    const stub = stubApi(handler, context);
    render(<Page />, { wrapper });
    await screen.findByText(
      "New results from your clinic",
      {},
      { timeout: 4000 },
    );
    return stub;
  }

  it("shows the clinic's results read-only and the patient marks them seen", async () => {
    const { calls } = await renderLabs();
    await waitFor(() =>
      expect(
        calls.some(
          (c) => c.method === "POST" && c.path === `${BASE}/labs/seen`,
        ),
      ).toBe(true),
    );
    act(() => screen.getByRole("tab", { name: "History" }).click());
    expect(
      screen.getByRole("button", { name: "Edit Potassium" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit Phosphorus" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete Phosphorus" }),
    ).not.toBeInTheDocument();
    /* No sample readings: a test with no result shows a dash. */
    expect(screen.queryByText("48 mg/dL")).not.toBeInTheDocument();
  }, 15_000);

  it("a caregiver reads them without marking them seen", async () => {
    const caregiver: MeContext = {
      ...memberContext(),
      patient: null,
      caregiving: [
        {
          grantId: "g-1",
          patientId: JOHN_ID,
          firstName: "John",
          lastName: "Test",
          relationship: "Family",
          preset: "full",
          permissions: { labs: 2 },
        },
      ],
    };
    const { calls } = await renderLabs(caregiver);
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(calls.some((c) => c.method === "POST")).toBe(false);
  }, 15_000);
});

describe("lab result actions", () => {
  it("edits and removes by the caller's callbacks, and is accessible", async () => {
    const onSave = vi.fn(async () => undefined);
    const onRemove = vi.fn(async () => undefined);
    const { container } = render(
      <LabResultActions
        name="Potassium"
        value="4.5"
        isEs={false}
        onSave={onSave}
        onRemove={onRemove}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
    act(() => screen.getByRole("button", { name: "Edit Potassium" }).click());
    expect(await axe(document.body)).toHaveNoViolations();
    act(() => screen.getByRole("button", { name: "Save" }).click());
    await waitFor(() => expect(onSave).toHaveBeenCalledWith("4.5"));
    act(() => screen.getByRole("button", { name: "Delete Potassium" }).click());
    act(() => screen.getByRole("button", { name: "Delete" }).click());
    await waitFor(() => expect(onRemove).toHaveBeenCalled());
  });

  it("shows the server's sentence when a save is refused", async () => {
    stubApi();
    const { ApiError } = await import("@/lib/api/client");
    render(
      <LabResultActions
        name="Potassium"
        value="4.5"
        isEs={false}
        onSave={async () => {
          throw new ApiError(
            403,
            "This result came from your care team",
            "labs.clinic_result_read_only",
          );
        }}
        onRemove={async () => undefined}
      />,
    );
    act(() => screen.getByRole("button", { name: "Edit Potassium" }).click());
    act(() => screen.getByRole("button", { name: "Save" }).click());
    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });

  it("opens a report only through its link, never a stored URL", async () => {
    const load = vi.fn(async () => ({ url: "https://files.example.test/r" }));
    const { container } = render(<LabReportButton isEs={false} load={load} />);
    expect(await axe(container)).toHaveNoViolations();
    act(() => screen.getByRole("button", { name: "View report" }).click());
    const link = await screen.findByRole("link", { name: /open the report/i });
    expect(link).toHaveAttribute("href", "https://files.example.test/r");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("refuses a javascript: link", async () => {
    render(
      <LabReportButton
        isEs={false}
        load={async () => ({ url: "javascript:alert(1)" })}
      />,
    );
    act(() => screen.getByRole("button", { name: "View report" }).click());
    expect(
      await screen.findByText("The report could not be opened."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});

const PHASE_6_RETIRED = [
  "member-medications",
  "medication-doses",
  "medication-refills",
  "medication-side-effects",
  "medication-reminders",
  "custom-lab-results",
  "clinic-labs-seen",
];

const PHASE_6_DATA_FILES = [
  "src/features/medications/medicationList.repository.ts",
  "src/features/medications/medicationLog.repository.ts",
  "src/features/medications/reminders.repository.ts",
  "src/features/medications/useMedications.ts",
  "src/features/medications/useMedicationLog.ts",
  "src/features/medications/useReminders.ts",
  "src/features/labs/labs.repository.ts",
  "src/features/labs/useMemberLabs.ts",
  "src/features/labs/useMemberClinicLabs.ts",
  "src/features/labs/useCustomLabResult.ts",
];

describe("Phase 6 retired stores", () => {
  it.each(PHASE_6_RETIRED)(
    "%s is purged in every variant and the marker is written",
    (name) => {
      expect(RETIRED_STORES.some((store) => store.name === name)).toBe(true);
      const keys = [
        `nr:${name}`,
        `nr:member:someone@example.test:${name}`,
        `nr:caregiver-none:${name}`,
      ];
      for (const key of keys) {
        expect(isRetiredKey(key)).toBe(true);
        window.localStorage.setItem(
          key,
          JSON.stringify([{ id: "legacy-1", name: "Legacy row" }]),
        );
      }
      purgeLegacyStorage(window.localStorage);
      for (const key of keys)
        expect(window.localStorage.getItem(key)).toBeNull();
      expect(window.localStorage.getItem(STORAGE_VERSION_KEY)).toBe(
        String(STORAGE_VERSION),
      );
    },
  );

  it("legacy rows are never read back: the hooks show only the API", async () => {
    window.localStorage.setItem(
      "nr:member-medications",
      JSON.stringify([{ id: "seed-med-0", name: "Legacy Norvasc" }]),
    );
    window.localStorage.setItem(
      "nr:medication-doses",
      JSON.stringify([
        {
          date: "2026-10-30",
          time: "08:00 AM",
          medication: "Renvela",
          status: "taken",
        },
      ]),
    );
    window.localStorage.setItem(
      "nr:custom-lab-results",
      JSON.stringify({ date: "2026-10-30", values: { BUN: "99" } }),
    );
    stubApi((call) => {
      if (call.path === `${BASE}/medications`) return pageOf([medication()]);
      if (call.path.startsWith(`${BASE}/medications/`)) return pageOf([]);
      if (call.path === `${BASE}/labs`) return pageOf([]);
      if (call.path === `${BASE}/labs/trends`) return { data: [] };
      return undefined;
    });
    const meds = renderHook(() => useMedications(), { wrapper });
    const log = renderHook(() => useMedicationLog("2026-10-30"), { wrapper });
    const labs = renderHook(() => useMemberLabs(), { wrapper });
    await waitFor(() =>
      expect(meds.result.current.medications).toHaveLength(1),
    );
    await waitFor(() => expect(log.result.current.isPending).toBe(false));
    await waitFor(() => expect(labs.result.current.isPending).toBe(false));
    expect(meds.result.current.medications.map((m) => m.name)).toEqual([
      "Renvela",
    ]);
    /* The name-keyed legacy dose is never matched to the API medication. */
    expect(log.result.current.doses).toEqual([]);
    expect(log.result.current.statusOf("2026-10-30", "med-a", "08:00")).toBe(
      "pending",
    );
    expect(labs.result.current.rows).toEqual([]);
  });

  it.each(PHASE_6_DATA_FILES)("%s does not touch browser storage", (file) => {
    const text = fs.readFileSync(path.resolve(process.cwd(), file), "utf8");
    expect(text).not.toMatch(/@\/lib\/data\/storage/);
    expect(text).not.toMatch(/localStorage|sessionStorage/);
  });

  it("the seed files are gone", () => {
    for (const file of [
      "src/features/medications/medications.seed.ts",
      "src/features/medications/reminders.seed.ts",
    ])
      expect(fs.existsSync(path.resolve(process.cwd(), file))).toBe(false);
  });
});
