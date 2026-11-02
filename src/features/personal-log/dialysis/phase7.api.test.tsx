import React from "react";
import fs from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { axe } from "vitest-axe";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/features/auth/AuthContext";
import {
  isRetiredKey,
  purgeLegacyStorage,
  RETIRED_STORES,
  STORAGE_VERSION,
  STORAGE_VERSION_KEY,
} from "@/lib/data/legacyPurge";
import {
  apiError,
  JOHN_ID,
  pageOf,
  stubApi,
  type StubCall,
} from "@/features/profile/memberApiStub";
import { uploadFile } from "@/lib/api/upload";
import { useDialysisModality } from "./useDialysisModality";
import { DEFAULT_SCHEDULE, useDialysisSchedule } from "./useDialysisSchedule";
import { useTreatmentLog } from "./useTreatmentLog";
import { usePdExchanges } from "./usePdExchanges";
import { useAccessPhotos } from "./useAccessPhotos";
import { useProviderOrders } from "./useProviderOrders";
import { useHomeSystem } from "./useHomeHd";
import { useSupplyChecklist } from "./useSupplyChecklist";
import { useExtraTreatments } from "./useExtraTreatments";
import { useTreatmentMedications } from "../useTreatmentMedications";
import ModalityTabs from "./ModalityTabs";
import AccessPhotosSection from "./AccessPhotosSection";
import { PhotoPicker } from "./PhotoPicker";
import { EquipmentEventsSection } from "./EquipmentEventsSection";
import { ExtraTreatmentsList } from "./ExtraTreatmentsList";
import {
  TreatmentValidationError,
  type TreatmentDraft,
} from "./treatment.mapper";
import type { ApiPrescription } from "./prescription.mapper";

/* Phase 7 (dialysis and home dialysis) against a stand-in API. Synthetic
   data only: the synthetic John id of memberApiStub. */

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

beforeEach(() => {
  window.localStorage.clear();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.mocked(uploadFile).mockClear();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

const BASE = `/patients/${JOHN_ID}/dialysis`;

const prescription = (
  over: Partial<ApiPrescription> = {},
): ApiPrescription => ({
  patientId: JOHN_ID,
  modality: "IN_CENTER_HD",
  pdSchedule: null,
  exchangesPerDay: null,
  pdFillVolumeMl: null,
  pdDwellMinutes: null,
  pdSolutions: [],
  bloodFlowRate: null,
  dialysateFlowRate: null,
  dialysateBath: null,
  dryWeightKg: null,
  accessType: null,
  facilityOrganizationId: null,
  facilityName: null,
  nephrologistName: null,
  memberCanEdit: true,
  updatedById: null,
  createdAt: "2026-11-01T10:00:00.000Z",
  updatedAt: "2026-11-01T10:00:00.000Z",
  ...over,
});

const noOfficeHeader = (calls: StubCall[]) =>
  calls.every((c) => !("x-organization-id" in c.headers));

describe("prescription (dialysis type)", () => {
  it("404 is 'not set', not an error; read by John's id, no office header", async () => {
    const { calls } = stubApi((call) =>
      call.path === `${BASE}/prescription`
        ? apiError(404, "dialysis.prescription_not_found")
        : undefined,
    );
    const { result } = renderHook(() => useDialysisModality(), { wrapper });
    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.isError).toBe(false);
    expect(result.current.isSet).toBe(false);
    expect(result.current.modality).toBe("in-center-hd");
    expect(calls.some((c) => c.path === `${BASE}/prescription`)).toBe(true);
    expect(noOfficeHeader(calls)).toBe(true);
  });

  it("403 not shared is the error state, never the default type", async () => {
    stubApi((call) =>
      call.path === `${BASE}/prescription`
        ? apiError(403, "dialysis.dialysis_not_shared")
        : undefined,
    );
    const { result } = renderHook(() => useDialysisModality(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as unknown as { status: number }).status).toBe(
      403,
    );
  });

  it("the first choice is a POST with the modality; later ones PATCH", async () => {
    let stored: ApiPrescription | null = null;
    const { calls } = stubApi((call) => {
      if (call.path !== `${BASE}/prescription`) return undefined;
      if (call.method === "GET")
        return stored
          ? { data: stored }
          : apiError(404, "dialysis.prescription_not_found");
      stored = prescription({
        modality:
          (call.body as { modality?: ApiPrescription["modality"] }).modality ??
          stored?.modality ??
          "IN_CENTER_HD",
      });
      return { status: call.method === "POST" ? 201 : 200, data: stored };
    });
    const { result } = renderHook(() => useDialysisModality(), { wrapper });
    await waitFor(() => expect(result.current.isPending).toBe(false));
    act(() => result.current.setModality("home-hd"));
    await waitFor(() => expect(result.current.modality).toBe("home-hd"));
    act(() => result.current.setModality("pd"));
    await waitFor(() => expect(result.current.modality).toBe("pd"));
    const writes = calls.filter((c) => c.method !== "GET");
    expect(writes.map((c) => [c.method, c.body])).toEqual([
      ["POST", { modality: "HOME_HD" }],
      ["PATCH", { modality: "PD" }],
    ]);
  });

  it("memberCanEdit false: the type and PD questions are read-only, nothing is sent", async () => {
    const { calls } = stubApi((call) =>
      call.path === `${BASE}/prescription`
        ? {
            data: prescription({
              memberCanEdit: false,
              facilityName: "Synthetic Dialysis Center",
            }),
          }
        : undefined,
    );
    function Probe() {
      const log = useDialysisModality();
      return log.isPending ? null : <ModalityTabs log={log} showPdRhythm />;
    }
    render(<Probe />, { wrapper });
    const notice = await screen.findByText(/Synthetic Dialysis Center/);
    expect(notice).toBeTruthy();
    const homeTab = screen.getByRole("tab", { name: /Home hemodialysis/ });
    expect((homeTab as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(homeTab);
    await new Promise((r) => setTimeout(r, 20));
    expect(calls.filter((c) => c.method !== "GET")).toEqual([]);
  });

  it("a change the server refuses (facility-managed) is shown, not swallowed", async () => {
    stubApi((call) => {
      if (call.path !== `${BASE}/prescription`) return undefined;
      if (call.method === "GET") return { data: prescription() };
      return apiError(403, "dialysis.prescription_managed_by_facility");
    });
    function Probe() {
      const log = useDialysisModality();
      return log.isPending ? null : <ModalityTabs log={log} />;
    }
    render(<Probe />, { wrapper });
    fireEvent.click(
      await screen.findByRole("tab", { name: /Home hemodialysis/ }),
    );
    expect(
      await screen.findByText(
        /Your dialysis center manages your prescription and schedule, so this was not changed/,
      ),
    ).toBeTruthy();
  });
});

describe("schedule", () => {
  it("the typical week only after a successful empty read, flagged as such", async () => {
    stubApi((call) =>
      call.path === `${BASE}/schedule` ? { data: [] } : undefined,
    );
    const { result } = renderHook(() => useDialysisSchedule(), { wrapper });
    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.isDefault).toBe(true);
    expect(result.current.periods).toEqual(DEFAULT_SCHEDULE);
  });

  it.each([
    [500, null],
    [403, "dialysis.dialysis_not_shared"],
  ])("a %s is an error with no default week", async (status, code) => {
    stubApi((call) =>
      call.path === `${BASE}/schedule` ? apiError(status, code) : undefined,
    );
    const { result } = renderHook(() => useDialysisSchedule(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.periods).toEqual([]);
    expect(result.current.isDefault).toBe(false);
  });

  it("saving a week POSTs one dated period", async () => {
    const { calls } = stubApi((call) =>
      call.path === `${BASE}/schedule`
        ? call.method === "GET"
          ? { data: [] }
          : { status: 201, data: {} }
        : undefined,
    );
    const { result } = renderHook(() => useDialysisSchedule(), { wrapper });
    await waitFor(() => expect(result.current.isPending).toBe(false));
    await act(() =>
      result.current.appendAsync({
        fromKey: "2026-11-02",
        days: ["Tuesday"],
        chairTimes: { Tuesday: "06:15" },
        reminderLeadMinutes: 45,
        durations: { Tuesday: 210 },
      }),
    );
    const post = calls.find((c) => c.method === "POST");
    expect(post?.body).toEqual({
      effectiveFrom: "2026-11-02",
      weekdays: ["Tuesday"],
      chairTimes: { Tuesday: "06:15" },
      durationsMinutes: { Tuesday: 210 },
      reminderLeadMinutes: 45,
    });
  });
});

const draft: TreatmentDraft = {
  date: "2026-11-02",
  modality: "home-hd",
  status: "attended",
  startTime: "07:30",
  endTime: "11:30",
  arrivedLate: "No",
  endedEarly: "No",
  extraRecovery: "No",
  preOverallFeel: 3,
  postOverallFeel: 3,
  medsTakenPrescribed: "Yes",
  preSymptoms: [],
  preSeverity: {},
  sequentialFluidRemoval: "No",
  cramping: "No",
  dizziness: "No",
  swelling: "No",
  shortnessOfBreath: "No",
  lowBp: "No",
  highBp: "No",
  fatigue: "No",
  recoveryTime: "No",
  intraSymptoms: [],
  intraNotes: "",
  postSymptoms: ["Dizziness"],
  postSeverity: { Overall: 2 },
  preWeight: "74.7",
  postWeight: "72.4",
  fluidRemoved: 2.3,
  preBloodPressure: "",
  preHeartRate: "",
  bloodPressurePost: "",
  heartRatePost: "",
  otherNotes: "",
};

describe("treatments", () => {
  it("reads a window of days, 150 a page; saves HH:mm and post-symptoms", async () => {
    const { calls } = stubApi((call) => {
      if (call.path === `${BASE}/treatments` && call.method === "GET")
        return pageOf([]);
      if (call.path === `${BASE}/treatments`)
        return {
          status: 201,
          data: {
            id: "t1",
            treatmentDate: "2026-11-02",
            modality: "HOME_HD",
            status: "ATTENDED",
            startTime: "07:30",
            endTime: "11:30",
            durationMinutes: 240,
            preWeightKg: 74.7,
            postWeightKg: 72.4,
            symptoms: { postSymptoms: ["Dizziness"] },
            notes: "",
          },
        };
      return undefined;
    });
    const { result } = renderHook(() => useTreatmentLog(), { wrapper });
    await waitFor(() => expect(result.current.isPending).toBe(false));
    const list = calls.find((c) => c.path === `${BASE}/treatments`)!;
    expect(list.query.get("limit")).toBe("150");
    expect(list.query.get("from")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(list.query.get("to")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const saved = await act(() => result.current.save(draft));
    expect(saved.startTime).toBe("7:30 AM");
    const post = calls.find((c) => c.method === "POST")!;
    expect(post.body).toMatchObject({
      startTime: "07:30",
      endTime: "11:30",
      modality: "HOME_HD",
      symptoms: { postSymptoms: ["Dizziness"], postSeverity: { Overall: 2 } },
    });
    expect(post.body).not.toHaveProperty("careTeam");
  });

  it('"165 lb" is refused before anything is sent', async () => {
    const { calls } = stubApi((call) =>
      call.path === `${BASE}/treatments` ? pageOf([]) : undefined,
    );
    const { result } = renderHook(() => useTreatmentLog(), { wrapper });
    await waitFor(() => expect(result.current.isPending).toBe(false));
    await expect(
      act(() => result.current.save({ ...draft, preWeight: "165 lb" })),
    ).rejects.toBeInstanceOf(TreatmentValidationError);
    expect(calls.filter((c) => c.method === "POST")).toEqual([]);
  });

  it("a failed read is an error, not an empty log", async () => {
    stubApi((call) =>
      call.path === `${BASE}/treatments` ? apiError(500, null) : undefined,
    );
    const { result } = renderHook(() => useTreatmentLog(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("treatment medications: one POST with givenOn and the treatment id", async () => {
    const { calls } = stubApi((call) =>
      call.path === `${BASE}/treatment-medications`
        ? call.method === "GET"
          ? pageOf([])
          : { status: 201, data: {} }
        : undefined,
    );
    const { result } = renderHook(() => useTreatmentMedications(), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isPending).toBe(false));
    await act(() =>
      result.current.add({
        givenOn: "2026-11-02",
        treatmentId: "t1",
        medication: "Epogen",
        dose: "8,000 units",
        given: true,
      }),
    );
    expect(calls.find((c) => c.method === "POST")?.body).toEqual({
      givenOn: "2026-11-02",
      treatmentId: "t1",
      medication: "Epogen",
      dose: "8,000 units",
      given: true,
    });
  });

  it("PD exchanges are read for the one day shown", async () => {
    const { calls } = stubApi((call) =>
      call.path === `${BASE}/pd-exchanges` ? pageOf([]) : undefined,
    );
    const { result } = renderHook(() => usePdExchanges("2026-11-02"), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isPending).toBe(false));
    const read = calls.find((c) => c.path === `${BASE}/pd-exchanges`)!;
    expect(read.query.get("from")).toBe("2026-11-02");
    expect(read.query.get("to")).toBe("2026-11-02");
  });
});

describe("home dialysis", () => {
  it("home system null shows the default to fill in, with unknown checks", async () => {
    stubApi((call) =>
      call.path === `${BASE}/home-system` ? { data: null } : undefined,
    );
    const { result } = renderHook(() => useHomeSystem(), { wrapper });
    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.isSet).toBe(false);
    expect(result.current.checks.every((c) => c.state === "unknown")).toBe(
      true,
    );
  });

  it("a supply month PUT is built from the latest shown month", async () => {
    const { calls } = stubApi((call) =>
      call.path.startsWith(`${BASE}/supplies/`)
        ? call.method === "GET"
          ? { data: null }
          : { data: { monthKey: "x", counts: {}, notes: "", updatedAt: "x" } }
        : undefined,
    );
    const { result } = renderHook(() => useSupplyChecklist("home-hd"), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isPending).toBe(false));
    act(() => {
      result.current.setCount("dialyzer", { have: 2, checked: true });
      result.current.setCount("bloodlines", { have: 5, checked: false });
    });
    await waitFor(() =>
      expect(calls.filter((c) => c.method === "PUT")).toHaveLength(2),
    );
    const last = calls.filter((c) => c.method === "PUT").at(-1)!;
    expect(
      Object.keys((last.body as { counts: object }).counts).sort(),
    ).toEqual(["bloodlines", "dialyzer"]);
  });

  it("a provider order reminder is sent with an offset", async () => {
    const { calls } = stubApi((call) =>
      call.path === `${BASE}/provider-orders`
        ? call.method === "GET"
          ? pageOf([])
          : { status: 201, data: {} }
        : undefined,
    );
    const { result } = renderHook(() => useProviderOrders(), { wrapper });
    await waitFor(() => expect(result.current.isPending).toBe(false));
    await act(() =>
      result.current.add({
        date: "2026-11-03",
        order: "Hold the BP pill",
        remindAt: "2026-11-03T08:00",
      }),
    );
    const post = calls.find((c) => c.method === "POST")!;
    expect((post.body as { remindAt: string }).remindAt).toBe(
      new Date("2026-11-03T08:00").toISOString(),
    );
  });

  it("an access photo is uploaded and only its file id is sent", async () => {
    const { calls } = stubApi((call) =>
      call.path === `${BASE}/access-photos`
        ? call.method === "GET"
          ? pageOf([])
          : { status: 201, data: {} }
        : undefined,
    );
    const { result } = renderHook(() => useAccessPhotos(), { wrapper });
    await waitFor(() => expect(result.current.isPending).toBe(false));
    const file = new File(["x"], "site.jpg", { type: "image/jpeg" });
    await act(() => result.current.add(file, "exit-site", "red"));
    expect(uploadFile).toHaveBeenCalledTimes(1);
    const post = calls.find((c) => c.method === "POST")!;
    expect(post.body).toMatchObject({
      fileId: "file-9",
      subject: "exit-site",
      note: "red",
    });
    expect((post.body as { takenAt: string }).takenAt).toMatch(/Z$/);
    expect(JSON.stringify(post.body)).not.toContain("data:");
  });

  it("extra treatments are a window around today; add is one POST", async () => {
    const { calls } = stubApi((call) =>
      call.path === `${BASE}/extra-treatments`
        ? call.method === "GET"
          ? pageOf([])
          : { status: 201, data: {} }
        : undefined,
    );
    const { result } = renderHook(() => useExtraTreatments(), { wrapper });
    await waitFor(() => expect(result.current.isPending).toBe(false));
    await act(() =>
      result.current.add({ dateKey: "2026-11-02", reason: "Fluid Overload" }),
    );
    const read = calls.find((c) => c.path === `${BASE}/extra-treatments`)!;
    expect(read.query.get("from")).toBeTruthy();
    expect(calls.find((c) => c.method === "POST")?.body).toEqual({
      date: "2026-11-02",
      reason: "Fluid Overload",
      notes: null,
    });
  });
});

describe("new components (axe)", () => {
  it("the equipment events section has no axe violations", async () => {
    stubApi((call) =>
      call.path === `${BASE}/equipment-events`
        ? pageOf([
            {
              id: "e1",
              patientId: JOHN_ID,
              kind: "disinfection",
              performedOn: "2026-11-01",
              notes: "Weekly",
              createdById: null,
              createdAt: "x",
            },
          ])
        : undefined,
    );
    const { container } = render(<EquipmentEventsSection isEs={false} />, {
      wrapper,
    });
    await screen.findByText("Weekly");
    fireEvent.click(screen.getByRole("button", { name: /Log maintenance/ }));
    expect(await axe(container)).toHaveNoViolations();
  });

  it("the extra treatments list has no axe violations", async () => {
    stubApi((call) =>
      call.path === `${BASE}/extra-treatments`
        ? pageOf([
            {
              id: "x1",
              patientId: JOHN_ID,
              date: "2026-11-02",
              reason: "High Potassium",
              notes: "Lab call",
              createdById: null,
              createdAt: "x",
            },
          ])
        : undefined,
    );
    function Probe() {
      const log = useExtraTreatments();
      return <ExtraTreatmentsList log={log} onAdd={() => {}} isEs={false} />;
    }
    const { container } = render(<Probe />, { wrapper });
    await screen.findByText("Lab call");
    expect(await axe(container)).toHaveNoViolations();
  });
});

const PHASE_7_RETIRED = [
  "dialysis-modality",
  "dialysis-schedule",
  "dialysis-treatments",
  "treatment-medications",
  "dialysis-pd-exchanges",
  "dialysis-home-system",
  "dialysis-home-visits",
  "dialysis-supplies",
  "provider-orders",
  "dialysis-access-photos",
  "dialysis-urine-output",
];

const PHASE_7_DATA_FILES = [
  "src/features/personal-log/dialysis/dialysis.repository.ts",
  "src/features/personal-log/dialysis/homeDialysis.repository.ts",
  "src/features/personal-log/dialysis/useDialysisModality.ts",
  "src/features/personal-log/dialysis/useDialysisSchedule.ts",
  "src/features/personal-log/dialysis/useTreatmentLog.ts",
  "src/features/personal-log/dialysis/usePdExchanges.ts",
  "src/features/personal-log/dialysis/useExtraTreatments.ts",
  "src/features/personal-log/dialysis/useEquipmentEvents.ts",
  "src/features/personal-log/dialysis/useHomeVisits.ts",
  "src/features/personal-log/dialysis/useSupplyChecklist.ts",
  "src/features/personal-log/dialysis/useProviderOrders.ts",
  "src/features/personal-log/dialysis/useAccessPhotos.ts",
  "src/features/personal-log/useTreatmentMedications.ts",
];

const LEGACY_PHOTO = JSON.stringify([
  {
    id: "legacy-photo",
    dataUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAA=",
    subject: "access",
    note: "Legacy photo",
    takenAt: "2026-09-11T08:00:00.000Z",
    sent: false,
  },
]);

describe("Phase 7 retired stores", () => {
  it.each(PHASE_7_RETIRED)(
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
        window.localStorage.setItem(key, JSON.stringify([{ id: "legacy-1" }]));
      }
      purgeLegacyStorage(window.localStorage);
      for (const key of keys)
        expect(window.localStorage.getItem(key)).toBeNull();
      expect(window.localStorage.getItem(STORAGE_VERSION_KEY)).toBe(
        String(STORAGE_VERSION),
      );
    },
  );

  it("home-HD session vitals are the one store kept (D8; Phase 15 at the latest)", () => {
    expect(isRetiredKey("nr:dialysis-treatment-vitals")).toBe(false);
    window.localStorage.setItem("nr:dialysis-treatment-vitals", "{}");
    purgeLegacyStorage(window.localStorage);
    expect(window.localStorage.getItem("nr:dialysis-treatment-vitals")).toBe(
      "{}",
    );
  });

  it("legacy rows are never read back: the hooks show only the API", async () => {
    window.localStorage.setItem(
      "nr:dialysis-treatments",
      JSON.stringify([{ id: "entry-01", date: "2026-06-24" }]),
    );
    window.localStorage.setItem(
      "nr:dialysis-schedule",
      JSON.stringify([{ fromKey: "2020-01-01", days: ["Sunday"] }]),
    );
    window.localStorage.setItem(
      "nr:treatment-medications",
      JSON.stringify([{ id: "1", date: "May 31, 2024", medication: "Legacy" }]),
    );
    window.localStorage.setItem("nr:dialysis-access-photos", LEGACY_PHOTO);
    stubApi((call) => {
      if (call.path === `${BASE}/schedule`) return { data: [] };
      if (call.path.startsWith(BASE)) return pageOf([]);
      return undefined;
    });
    const tx = renderHook(() => useTreatmentLog(), { wrapper });
    const sch = renderHook(() => useDialysisSchedule(), { wrapper });
    const meds = renderHook(() => useTreatmentMedications(), { wrapper });
    const photos = renderHook(() => useAccessPhotos(), { wrapper });
    await waitFor(() => expect(tx.result.current.isPending).toBe(false));
    await waitFor(() => expect(sch.result.current.isPending).toBe(false));
    await waitFor(() => expect(meds.result.current.isPending).toBe(false));
    await waitFor(() => expect(photos.result.current.isPending).toBe(false));
    expect(tx.result.current.entries).toEqual([]);
    expect(sch.result.current.periods).toEqual(DEFAULT_SCHEDULE);
    expect(meds.result.current.medications).toEqual([]);
    expect(photos.result.current.photos).toEqual([]);
  });

  it("a legacy data: photo is never rendered by the photo screens", async () => {
    window.localStorage.setItem("nr:dialysis-access-photos", LEGACY_PHOTO);
    purgeLegacyStorage(window.localStorage);
    window.localStorage.setItem("nr:dialysis-access-photos", LEGACY_PHOTO);
    stubApi((call) =>
      call.path === `${BASE}/access-photos`
        ? pageOf([
            {
              id: "api-photo",
              patientId: JOHN_ID,
              subject: "access",
              note: "From the API",
              takenAt: "2026-11-02T10:00:00.000Z",
              sentAt: null,
              sent: false,
              createdById: null,
              createdAt: "x",
            },
          ])
        : call.path.endsWith("/download-link")
          ? { data: { url: "http://localhost:5906/bucket/x", expiresIn: 300 } }
          : undefined,
    );
    function Picker() {
      const log = useAccessPhotos();
      return (
        <PhotoPicker
          photos={log.photos}
          value={null}
          onChange={() => {}}
          isEs={false}
        />
      );
    }
    const { container } = render(
      <>
        <AccessPhotosSection />
        <Picker />
      </>,
      { wrapper },
    );
    await screen.findByText("From the API");
    await waitFor(() =>
      expect(container.querySelectorAll("img").length).toBeGreaterThan(0),
    );
    expect(container.innerHTML).not.toContain("data:image");
    expect(screen.queryByText("Legacy photo")).toBeNull();
    for (const img of Array.from(container.querySelectorAll("img")))
      expect(img.getAttribute("src")).toBe("http://localhost:5906/bucket/x");
  });

  it.each(PHASE_7_DATA_FILES)("%s does not touch browser storage", (file) => {
    const text = fs.readFileSync(path.join(process.cwd(), file), "utf8");
    expect(text).not.toContain("@/lib/data/storage");
    expect(text).not.toMatch(/localStorage|sessionStorage/);
  });

  it("no member dialysis file produces a data: URL to store", () => {
    for (const file of [
      "src/features/personal-log/LogMediaBar.tsx",
      "src/features/personal-log/dialysis/AccessPhotosSection.tsx",
      "src/features/personal-log/dialysis/PhotoPicker.tsx",
      "src/features/personal-log/dialysis/CareTeamContactSection.tsx",
      "src/features/personal-log/dialysis/accessPhotos.ts",
    ]) {
      const text = fs.readFileSync(path.join(process.cwd(), file), "utf8");
      expect(text).not.toContain("downscaleToDataUrl");
      expect(text).not.toContain("toDataURL");
    }
  });
});
