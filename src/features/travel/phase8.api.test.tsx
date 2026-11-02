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
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/features/auth/AuthContext";
import type { MeContext } from "@/features/auth/auth.types";
import {
  isRetiredKey,
  purgeLegacyStorage,
  RETIRED_KEYS,
  RETIRED_STORES,
  STORAGE_VERSION,
  STORAGE_VERSION_KEY,
} from "@/lib/data/legacyPurge";
import { isNotShared } from "@/lib/data/asyncState";
import {
  apiError,
  JOHN_ID,
  memberContext,
  pageOf,
  stubApi,
  type StubCall,
  type StubHandler,
} from "@/features/profile/memberApiStub";
import { officeContext } from "@/features/clinic/rosterTestData";
import { uploadFile } from "@/lib/api/upload";
import { emptyTrip } from "./trip.rules";
import type {
  ApiOfficeTrip,
  ApiOfficeTripSummary,
  ApiTrip,
} from "./trip.mapping";
import { toTrip } from "./trip.mapping";
import {
  ArrangementError,
  useMemberTrip,
  useMemberTrips,
  useOfficeTrip,
  useOfficeTrips,
} from "./useTrips";
import { useRides } from "./useRides";
import { useTravelTreatments } from "./useTravelTreatments";

/* Phase 8 travel (member and office), ride contacts and the retired travel
   stores, against a stand-in API. Synthetic ids and people only. */

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

const ORG = officeContext().memberships[0].organizationId;
const TRIP = "33333333-3333-4333-8333-333333333333";
const OPEN_TC = "44444444-4444-4444-8444-444444444444";

const apiTrip = (over: Partial<ApiTrip> = {}): ApiTrip => ({
  id: TRIP,
  patientId: JOHN_ID,
  organizationId: ORG,
  street: "1 Test Shore Dr",
  city: "Myrtle Beach",
  state: "SC",
  zip: null,
  departDate: "2099-12-18",
  returnDate: "2099-12-27",
  treatmentsNeeded: 4,
  preferredDays: ["mon", "wed"],
  preferredTime: "morning",
  emergencyName: "Pat Example",
  emergencyPhone: "555-0100",
  contactPhone: null,
  emergencyRelationship: null,
  insurancePlan: "Example Plan",
  insuranceMemberId: "EX-1",
  documentsReady: ["insurance"],
  prepDone: [],
  notes: null,
  status: "confirmed",
  facilityNote: "Booked",
  placementFacilityName: "Test Away Dialysis",
  placementAddress: null,
  placementPhone: "555-0199",
  confirmedTreatments: [{ id: "ct-1", date: "2099-12-19", time: "07:00" }],
  cancelRequestedAt: null,
  statusEvents: [
    {
      id: "e2",
      status: "confirmed",
      changedById: null,
      at: "2026-10-02T10:00:00.000Z",
    },
    {
      id: "e1",
      status: "submitted",
      changedById: null,
      at: "2026-10-01T10:00:00.000Z",
    },
  ],
  documents: [
    {
      id: "doc-1",
      key: "insurance",
      fileName: null,
      contentType: "application/pdf",
      sizeBytes: null,
      attachedAt: "2026-10-01T10:00:00.000Z",
    },
  ],
  timeChangeRequests: [
    {
      id: "tc-old",
      preferredTime: "evening",
      preferredDays: [],
      note: "Earlier ask",
      requestedAt: "2026-10-03T10:00:00.000Z",
      resolvedAt: "2026-10-04T10:00:00.000Z",
      facilityReply: "Done",
    },
    {
      id: OPEN_TC,
      preferredTime: "midday",
      preferredDays: ["fri"],
      note: "Flight lands at noon",
      requestedAt: "2026-10-05T10:00:00.000Z",
      resolvedAt: null,
      facilityReply: null,
    },
  ],
  submittedAt: "2026-10-01T10:00:00.000Z",
  updatedAt: "2026-10-05T10:00:00.000Z",
  ...over,
});

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

function as(context: MeContext, handler: StubHandler, page = "/dashboard") {
  window.history.replaceState(null, "", page);
  return stubApi(handler, context);
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

const BASE = `/patients/${JOHN_ID}/trips`;
const is = (call: StubCall, method: string, p: string) =>
  call.method === method && call.path === p;

/* ------------------------------------------------------------ mapping */

describe("trip mapping (flat API <-> nested screen)", () => {
  it("nests every request field and keeps the full time-change list", () => {
    const trip = toTrip(apiTrip());
    expect(trip.destination).toEqual({
      street: "1 Test Shore Dr",
      city: "Myrtle Beach",
      state: "SC",
      zip: "",
    });
    expect(trip.emergencyContact).toEqual({
      name: "Pat Example",
      phone: "555-0100",
      relationship: "",
    });
    expect(trip.insurance).toEqual({ plan: "Example Plan", memberId: "EX-1" });
    expect(trip.contactPhone).toBe("");
    expect(trip.notes).toBe("");
    expect(trip.placement?.facilityName).toBe("Test Away Dialysis");
    expect(trip.placement?.treatments).toEqual([
      { id: "ct-1", date: "2099-12-19", time: "07:00" },
    ]);
    expect(trip.statusHistory.map((e) => e.status)).toEqual([
      "submitted",
      "confirmed",
    ]);
    expect(trip.timeChanges).toHaveLength(2);
    expect(trip.timeChange?.id).toBe(OPEN_TC);
    expect(trip.documentFiles[0]).toMatchObject({
      id: "doc-1",
      fileName: null,
    });
    /* The member side has no patient name or email. */
    expect(trip.patient).toBeUndefined();
  });

  it("keeps the six statuses as they are (D10)", () => {
    for (const status of [
      "submitted",
      "facility-reviewing",
      "records-sent",
      "placement-pending",
      "confirmed",
      "closed",
    ] as const)
      expect(toTrip(apiTrip({ status })).status).toBe(status);
  });

  it("gives the office the patient's name and MRN, never an email", () => {
    const office: ApiOfficeTrip = {
      ...apiTrip(),
      firstName: "Avery",
      lastName: "Testpatient",
      mrn: "900001",
    };
    expect(toTrip(office).patient).toEqual({
      name: "Avery Testpatient",
      mrn: "900001",
    });
    expect(JSON.stringify(toTrip(office))).not.toMatch(/@/);
  });
});

/* ------------------------------------------------------------ member */

describe("member trips", () => {
  it("reads the patient's own trips, bounded, with no office header", async () => {
    const { calls } = as(memberContext(), (call) =>
      is(call, "GET", BASE) ? pageOf([apiTrip()]) : undefined,
    );
    const { result } = renderHook(() => useMemberTrips(), { wrapper });
    await waitFor(() => expect(result.current.trips).toHaveLength(1));
    const read = calls.find((c) => is(c, "GET", BASE))!;
    expect(Number(read.query.get("limit"))).toBeLessThanOrEqual(150);
    for (const c of calls)
      expect(c.headers["x-organization-id"]).toBeUndefined();
  });

  it("has no delete (D20): only a cancellation request, the trip stays", async () => {
    const { calls } = as(memberContext(), (call) =>
      is(call, "GET", BASE) ? pageOf([apiTrip()]) : undefined,
    );
    const { result } = renderHook(() => useMemberTrips(), { wrapper });
    await waitFor(() => expect(result.current.trips).toHaveLength(1));
    expect("cancel" in result.current).toBe(false);
    expect("remove" in result.current).toBe(false);
    act(() => result.current.requestCancel(TRIP));
    await waitFor(() =>
      expect(
        calls.some((c) =>
          is(c, "POST", `${BASE}/${TRIP}/cancellation-request`),
        ),
      ).toBe(true),
    );
    expect(calls.some((c) => c.method === "DELETE")).toBe(false);
  });

  it("a failed read is an error, never an empty list", async () => {
    as(memberContext(), (call) =>
      is(call, "GET", BASE) ? apiError(500, null) : undefined,
    );
    const { result } = renderHook(() => useMemberTrips(), { wrapper });
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(isNotShared(result.current.error)).toBe(false);
  });

  it("a 403 (a caregiver without travel) is the not-shared state", async () => {
    as(memberContext(), (call) =>
      is(call, "GET", BASE)
        ? apiError(403, "access.patient_access_denied")
        : undefined,
    );
    const { result } = renderHook(() => useMemberTrips(), { wrapper });
    await waitFor(() => expect(isNotShared(result.current.error)).toBe(true));
    expect(result.current.trips).toEqual([]);
  });

  it("an edit after the facility started (409) alerts and re-reads", async () => {
    const { calls } = as(memberContext(), (call) => {
      if (is(call, "GET", BASE))
        return pageOf([apiTrip({ status: "submitted" })]);
      if (is(call, "PUT", `${BASE}/${TRIP}`))
        return apiError(409, "travel.trip_not_editable");
      return undefined;
    });
    const { result } = renderHook(() => useMemberTrips(), { wrapper });
    await waitFor(() => expect(result.current.trips).toHaveLength(1));
    const reads = () => calls.filter((c) => is(c, "GET", BASE)).length;
    const before = reads();
    act(() => result.current.update(result.current.trips[0]));
    await waitFor(() => expect(result.current.saveError).toBeTruthy());
    await waitFor(() => expect(reads()).toBeGreaterThan(before));
    const put = calls.find((c) => is(c, "PUT", `${BASE}/${TRIP}`))!;
    /* A full replace of the request fields, flat. */
    expect(put.body).toMatchObject({
      street: "1 Test Shore Dr",
      city: "Myrtle Beach",
      state: "SC",
      emergencyName: "Pat Example",
      insurancePlan: "Example Plan",
    });
    expect(put.body).not.toHaveProperty("status");
  });

  it("creates a trip with the flat body and returns the server's message", async () => {
    const { calls } = as(memberContext(), (call) => {
      if (is(call, "GET", BASE)) return pageOf([]);
      if (is(call, "POST", BASE))
        return {
          status: 201,
          body: {
            success: true,
            message: "trip_created_outside",
            statusCode: 201,
            data: apiTrip({ organizationId: null }),
          },
        };
      return undefined;
    });
    const { result } = renderHook(() => useMemberTrips(), { wrapper });
    await waitFor(() => expect(result.current.isPending).toBe(false));
    const draft = {
      ...emptyTrip(new Date(2026, 9, 1)),
      destination: { street: "1 St", city: "Tampa", state: "fl", zip: "" },
      departDate: "2099-01-01",
      returnDate: "2099-01-05",
      emergencyContact: { name: "Pat", phone: "555", relationship: "" },
    };
    let answer: { message: string | string[] } | undefined;
    await act(async () => {
      answer = await result.current.submit(draft);
    });
    expect(answer?.message).toBe("trip_created_outside");
    const post = calls.find((c) => is(c, "POST", BASE))!;
    expect(post.body).toMatchObject({
      city: "Tampa",
      state: "FL",
      emergencyName: "Pat",
      documentsReady: [],
      prepDone: [],
    });
    expect(post.body).not.toHaveProperty("zip");
    expect(post.body).not.toHaveProperty("id");
    expect(post.body).not.toHaveProperty("status");
  });

  it("time changes: one request, withdrawn by its id", async () => {
    const { calls } = as(memberContext(), (call) =>
      is(call, "GET", `${BASE}/${TRIP}`) ? { data: apiTrip() } : undefined,
    );
    const { result } = renderHook(() => useMemberTrip(TRIP), { wrapper });
    await waitFor(() => expect(result.current.trip).toBeTruthy());
    act(() =>
      result.current.requestTimeChange(TRIP, {
        requestedAt: "",
        preferredTime: "evening",
        preferredDays: ["sat"],
        note: "  Later please ",
      }),
    );
    await waitFor(() =>
      expect(
        calls.some((c) =>
          is(c, "POST", `${BASE}/${TRIP}/time-change-requests`),
        ),
      ).toBe(true),
    );
    expect(
      calls.find((c) => is(c, "POST", `${BASE}/${TRIP}/time-change-requests`))!
        .body,
    ).toEqual({
      preferredTime: "evening",
      preferredDays: ["sat"],
      note: "Later please",
    });
    act(() => result.current.withdrawTimeChange(result.current.trip!));
    await waitFor(() =>
      expect(
        calls.some((c) =>
          is(c, "DELETE", `${BASE}/${TRIP}/time-change-requests/${OPEN_TC}`),
        ),
      ).toBe(true),
    );
  });

  it("a trip that is not this patient's (404) is 'not found', not an error", async () => {
    as(memberContext(), (call) =>
      is(call, "GET", `${BASE}/${TRIP}`)
        ? apiError(404, "travel.trip_not_found")
        : undefined,
    );
    const { result } = renderHook(() => useMemberTrip(TRIP), { wrapper });
    await waitFor(() => expect(result.current.notFound).toBe(true));
    expect(result.current.error).toBeNull();
    expect(result.current.trip).toBeUndefined();
  });

  it("documents go through /files and attach by file id; links are fetched each time", async () => {
    const { calls } = as(memberContext(), (call) => {
      if (is(call, "GET", `${BASE}/${TRIP}`)) return { data: apiTrip() };
      if (call.path.endsWith("/download-link"))
        return { data: { url: "http://127.0.0.1:5903/x" } };
      return undefined;
    });
    const { result } = renderHook(() => useMemberTrip(TRIP), { wrapper });
    await waitFor(() => expect(result.current.trip).toBeTruthy());
    const file = new File(["%PDF-1.4"], "labs.pdf", {
      type: "application/pdf",
    });
    act(() => result.current.attachFile(TRIP, "recent-labs", file));
    await waitFor(() =>
      expect(
        calls.some((c) => is(c, "POST", `${BASE}/${TRIP}/documents`)),
      ).toBe(true),
    );
    expect(uploadFile).toHaveBeenCalledWith(file);
    expect(
      calls.find((c) => is(c, "POST", `${BASE}/${TRIP}/documents`))!.body,
    ).toEqual({ key: "recent-labs", fileId: "file-9" });
    await result.current.documentLink(TRIP, "doc-1");
    await result.current.documentLink(TRIP, "doc-1");
    expect(
      calls.filter(
        (c) => c.path === `${BASE}/${TRIP}/documents/doc-1/download-link`,
      ),
    ).toHaveLength(2);
    expect(JSON.stringify(window.localStorage)).not.toMatch(/5903|download/);
  });
});

/* ------------------------------------------------------------ office */

const summary = (
  over: Partial<ApiOfficeTripSummary> = {},
): ApiOfficeTripSummary => ({
  id: TRIP,
  patientId: JOHN_ID,
  firstName: "Avery",
  lastName: "Testpatient",
  mrn: "900001",
  city: "Tampa",
  state: "FL",
  departDate: "2099-01-10",
  returnDate: "2099-01-17",
  treatmentsNeeded: 3,
  confirmedTreatmentCount: 0,
  status: "submitted",
  placementFacilityName: null,
  hasOpenTimeChange: true,
  cancelRequestedAt: null,
  submittedAt: "2026-10-01T10:00:00.000Z",
  updatedAt: "2026-10-01T10:00:00.000Z",
  ...over,
});

describe("office trips", () => {
  const LIST = `/organizations/${ORG}/trips`;

  it("splits open and past on the server (from / before), searches there too", async () => {
    const { calls } = as(
      officeContext(),
      (call) => {
        if (!is(call, "GET", LIST)) return undefined;
        if (call.query.get("before"))
          return pageOf([summary({ id: "old", status: "confirmed" })]);
        if (call.query.get("status") === "closed")
          return pageOf([summary({ id: "closed-now", status: "closed" })]);
        return pageOf([
          summary(),
          summary({ id: "closed-now", status: "closed" }),
        ]);
      },
      "/dashboard/clinic/travel",
    );
    const { result } = renderHook(() => useOfficeTrips({ search: " tampa " }), {
      wrapper,
    });
    await waitFor(() => expect(result.current.upcoming).toHaveLength(1));
    await waitFor(() => expect(result.current.past).toHaveLength(2));
    const reads = calls.filter((c) => is(c, "GET", LIST));
    for (const r of reads) {
      expect(r.query.get("search")).toBe("tampa");
      expect(r.headers["x-organization-id"]).toBe(ORG);
      expect(Number(r.query.get("limit"))).toBeLessThanOrEqual(150);
    }
    expect(reads.some((r) => r.query.get("before"))).toBe(true);
    expect(reads.some((r) => r.query.get("from"))).toBe(true);
    expect(result.current.upcoming[0]).toMatchObject({
      patientName: "Avery Testpatient",
      hasOpenTimeChange: true,
      bookedCount: 0,
    });
  });

  it("saves placement, then the message, then the status; an unchanged status is never sent", async () => {
    const DETAIL = `${LIST}/${TRIP}`;
    const office: ApiOfficeTrip = {
      ...apiTrip({ status: "placement-pending" }),
      firstName: "Avery",
      lastName: "Testpatient",
      mrn: "900001",
    };
    const { calls } = as(
      officeContext(),
      (call) => (is(call, "GET", DETAIL) ? { data: office } : undefined),
      "/dashboard/clinic/travel",
    );
    const { result } = renderHook(() => useOfficeTrip(TRIP), { wrapper });
    await waitFor(() => expect(result.current.trip).toBeTruthy());
    const trip = result.current.trip!;
    act(() =>
      result.current.saveArrangement(trip, {
        status: "confirmed",
        placement: {
          facilityName: "Test Away Dialysis",
          address: "",
          phone: "555",
          treatments: [{ id: "x", date: "2099-12-19", time: "07:00:00" }],
        },
        note: "See you there",
      }),
    );
    await waitFor(() =>
      expect(calls.some((c) => is(c, "PUT", `${DETAIL}/status`))).toBe(true),
    );
    const writes = calls.filter((c) => c.method !== "GET").map((c) => c.path);
    expect(writes).toEqual([
      `${DETAIL}/placement`,
      `${DETAIL}/facility-note`,
      `${DETAIL}/status`,
    ]);
    expect(
      calls.find((c) => is(c, "PUT", `${DETAIL}/placement`))!.body,
    ).toEqual({
      facilityName: "Test Away Dialysis",
      address: null,
      phone: "555",
      treatments: [{ date: "2099-12-19", time: "07:00" }],
    });

    calls.length = 0;
    act(() => result.current.saveArrangement(trip, { status: trip.status }));
    await waitFor(() => expect(result.current.isSaving).toBe(false));
    expect(calls.some((c) => c.path.endsWith("/status"))).toBe(false);
  });

  it("closes a cancellation request through cancellation/close, not status", async () => {
    const DETAIL = `${LIST}/${TRIP}`;
    const office: ApiOfficeTrip = {
      ...apiTrip({ cancelRequestedAt: "2026-10-06T10:00:00.000Z" }),
      firstName: "Avery",
      lastName: "Testpatient",
      mrn: null,
    };
    const { calls } = as(
      officeContext(),
      (call) => (is(call, "GET", DETAIL) ? { data: office } : undefined),
      "/dashboard/clinic/travel",
    );
    const { result } = renderHook(() => useOfficeTrip(TRIP), { wrapper });
    await waitFor(() => expect(result.current.trip).toBeTruthy());
    act(() =>
      result.current.saveArrangement(result.current.trip!, {
        status: "closed",
      }),
    );
    await waitFor(() =>
      expect(
        calls.some((c) => is(c, "POST", `${DETAIL}/cancellation/close`)),
      ).toBe(true),
    );
    expect(calls.some((c) => c.path.endsWith("/status"))).toBe(false);
  });

  it("names the part that failed when a later write is refused", async () => {
    const DETAIL = `${LIST}/${TRIP}`;
    const office: ApiOfficeTrip = {
      ...apiTrip({ status: "records-sent" }),
      firstName: "A",
      lastName: "B",
      mrn: null,
    };
    as(
      officeContext(),
      (call) => {
        if (is(call, "GET", DETAIL)) return { data: office };
        if (is(call, "PUT", `${DETAIL}/status`))
          return apiError(409, "travel.confirm_needs_placement");
        return undefined;
      },
      "/dashboard/clinic/travel",
    );
    const { result } = renderHook(() => useOfficeTrip(TRIP), { wrapper });
    await waitFor(() => expect(result.current.trip).toBeTruthy());
    act(() =>
      result.current.saveArrangement(result.current.trip!, {
        note: "x",
        status: "confirmed",
      }),
    );
    await waitFor(() =>
      expect(result.current.saveError).toBeInstanceOf(ArrangementError),
    );
    expect((result.current.saveError as ArrangementError).part).toBe("status");
  });

  it("answers the open time change by its id", async () => {
    const DETAIL = `${LIST}/${TRIP}`;
    const office: ApiOfficeTrip = {
      ...apiTrip(),
      firstName: "A",
      lastName: "B",
      mrn: null,
    };
    const { calls } = as(
      officeContext(),
      (call) => (is(call, "GET", DETAIL) ? { data: office } : undefined),
      "/dashboard/clinic/travel",
    );
    const { result } = renderHook(() => useOfficeTrip(TRIP), { wrapper });
    await waitFor(() => expect(result.current.trip).toBeTruthy());
    act(() => result.current.resolveTimeChange(result.current.trip!, "Moved"));
    await waitFor(() =>
      expect(
        calls.some((c) =>
          is(c, "POST", `${DETAIL}/time-change-requests/${OPEN_TC}/answer`),
        ),
      ).toBe(true),
    );
  });

  it("outside office mode reads nothing and shows no access", async () => {
    const { calls } = as(memberContext(), () => undefined);
    const { result } = renderHook(() => useOfficeTrips(), { wrapper });
    await waitFor(() => expect(isNotShared(result.current.error)).toBe(true));
    expect(calls.some((c) => c.path.startsWith("/organizations/"))).toBe(false);
  });
});

/* ------------------------------------------------------------ rides, log */

describe("ride contacts", () => {
  const RIDES = `/patients/${JOHN_ID}/ride-contacts`;
  const ride = {
    id: "r1",
    patientId: JOHN_ID,
    name: "Sam Driver",
    phone: "555",
    note: null,
    isPrimary: true,
    createdAt: "",
  };

  it("one call per write, then a re-read (the server keeps one primary)", async () => {
    const { calls } = as(memberContext(), (call) =>
      is(call, "GET", RIDES) ? pageOf([ride]) : { status: 201, data: ride },
    );
    const { result } = renderHook(() => useRides(), { wrapper });
    await waitFor(() => expect(result.current.rides).toHaveLength(1));
    const reads = () => calls.filter((c) => is(c, "GET", RIDES)).length;

    await act(() =>
      result.current.create.mutateAsync({ name: " Lee ", phone: "556" }),
    );
    await act(() =>
      result.current.update.mutateAsync({
        id: "r1",
        draft: { name: "Sam", phone: "555", note: "", isPrimary: true },
      }),
    );
    await act(() => result.current.remove.mutateAsync("r1"));
    const writes = calls.filter((c) => c.method !== "GET");
    expect(writes.map((c) => `${c.method} ${c.path}`)).toEqual([
      `POST ${RIDES}`,
      `PATCH ${RIDES}/r1`,
      `DELETE ${RIDES}/r1`,
    ]);
    expect(writes[0].body).toEqual({ name: "Lee", phone: "556" });
    /* A cleared note is sent as null so the server clears it. */
    expect(writes[1].body).toEqual({
      name: "Sam",
      phone: "555",
      note: null,
      isPrimary: true,
    });
    await waitFor(() => expect(reads()).toBeGreaterThanOrEqual(3));
  });
});

describe("travel treatment log and reflection", () => {
  const LOG = `${BASE}/${TRIP}/treatments`;
  const row = {
    id: "t1",
    tripId: TRIP,
    date: "2026-10-02",
    facilityName: "Away Unit",
    preWeight: "80.1 kg",
    postWeight: null,
    bloodPressure: null,
    treatmentTime: null,
    fluidRemoved: null,
    completed: true,
    notes: "",
    createdAt: "",
    updatedAt: "2026-10-02T12:00:00.000Z",
  };

  it("adds a new row, replaces a known one, and saves the reflection", async () => {
    const { calls } = as(memberContext(), (call) => {
      if (is(call, "GET", LOG)) return pageOf([row]);
      if (is(call, "GET", `${BASE}/${TRIP}/reflection`)) return { data: null };
      return { data: row };
    });
    const { result } = renderHook(() => useTravelTreatments(TRIP), { wrapper });
    await waitFor(() => expect(result.current.forTrip(TRIP)).toHaveLength(1));
    /* Free text as typed: no unit conversion. */
    expect(result.current.forTrip(TRIP)[0].preWeight).toBe("80.1 kg");
    expect(result.current.reflectionFor(TRIP)).toBe("");

    const known = result.current.forTrip(TRIP)[0];
    act(() => result.current.saveTreatment({ ...known, notes: "ok" }));
    await waitFor(() =>
      expect(calls.some((c) => is(c, "PUT", `${LOG}/t1`))).toBe(true),
    );
    act(() =>
      result.current.saveTreatment({
        ...known,
        id: "tx-local-1",
        notes: "new",
      }),
    );
    await waitFor(() =>
      expect(calls.some((c) => is(c, "POST", LOG))).toBe(true),
    );
    expect(calls.find((c) => is(c, "POST", LOG))!.body).not.toHaveProperty(
      "id",
    );
    act(() => result.current.saveReflection(TRIP, "A good trip"));
    await waitFor(() =>
      expect(
        calls.find((c) => is(c, "PUT", `${BASE}/${TRIP}/reflection`))?.body,
      ).toEqual({ body: "A good trip" }),
    );
  });
});

/* ------------------------------------------------------------ storage */

describe("Phase 8 retired keys cannot come back", () => {
  const legacyTrip = JSON.stringify([
    { id: "legacy-trip", destination: { city: "Legacyville" } },
  ]);

  it("purges every retired key and variant, and writes version 7", () => {
    expect(STORAGE_VERSION).toBe(7);
    for (const key of ["nr:clinic-enrollments", "nr:travel-trip-requests"])
      expect(RETIRED_KEYS).toContain(key);
    for (const name of ["travel-treatments", "travel-reflections", "rides"])
      expect(RETIRED_STORES.some((s) => s.name === name && s.since === 7)).toBe(
        true,
      );
    const keys = [
      "nr:clinic-enrollments",
      "nr:travel-trip-requests",
      "nr:rides",
      "nr:member:a@x.test:rides",
      "nr:caregiver-none:rides",
      "nr:travel-treatments",
      "nr:member:a@x.test:travel-treatments",
      "nr:travel-reflections",
      "nr:member:a@x.test:travel-reflections",
    ];
    for (const key of keys) {
      expect(isRetiredKey(key)).toBe(true);
      window.localStorage.setItem(key, legacyTrip);
    }
    window.localStorage.setItem("preferred_language", "EN");
    purgeLegacyStorage(window.localStorage);
    for (const key of keys) expect(window.localStorage.getItem(key)).toBeNull();
    expect(window.localStorage.getItem("preferred_language")).toBe("EN");
    expect(window.localStorage.getItem(STORAGE_VERSION_KEY)).toBe("7");
  });

  it("a legacy trip in storage is never shown: the page reads only the API", async () => {
    window.localStorage.setItem("nr:travel-trip-requests", legacyTrip);
    as(memberContext(), (call) =>
      is(call, "GET", BASE) ? pageOf([]) : pageOf([]),
    );
    const { default: YourTripsSection } =
      await import("./TravelDialysisSection");
    render(<YourTripsSection />, { wrapper });
    expect(await screen.findByText("Your trips")).toBeInTheDocument();
    expect(screen.queryByText(/Legacyville/)).not.toBeInTheDocument();
  });

  it("no Phase 8 data file touches browser storage or the seeds", () => {
    const files = [
      "src/features/travel/trip.repository.ts",
      "src/features/travel/useTrips.ts",
      "src/features/travel/travelTreatment.repository.ts",
      "src/features/travel/useTravelTreatments.ts",
      "src/features/travel/rides.repository.ts",
      "src/features/travel/useRides.ts",
      "src/features/clinic/roster.repository.ts",
      "src/features/clinic/useClinicData.ts",
      "src/features/clinic/enrollment.store.ts",
    ];
    for (const file of files) {
      const text = fs.readFileSync(path.join(process.cwd(), file), "utf8");
      expect(text).not.toMatch(/readJson|writeJson|localStorage|\.seed"/);
    }
    for (const gone of [
      "src/features/travel/trip.seed.ts",
      "src/features/travel/rides.seed.ts",
    ])
      expect(fs.existsSync(path.join(process.cwd(), gone))).toBe(false);
  });
});
