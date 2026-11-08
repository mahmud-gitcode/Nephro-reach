import React from "react";
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
  apiError,
  GRACE_ID,
  JOHN_ID,
  memberContext,
  pageOf,
  stubApi,
  type StubCall,
} from "@/features/profile/memberApiStub";
import { isNotShared } from "@/lib/data/asyncState";
import { toDay } from "@/lib/api/paging";
import AppointmentsPage from "@/app/(portal)/dashboard/(member)/personal-log/appointments/page";
import {
  fromApiAppointment,
  toAppointmentBody,
  type ApiAppointment,
} from "./appointments.repository";
import { useAppointments } from "./useAppointments";

/* Member appointments on the API (P15c, INT-P15-1). The patient is the
   portal context's scope; nothing is read from or written to browser
   storage. Synthetic data only. */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/dashboard/personal-log/appointments",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
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
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

const today = toDay(new Date());
const inDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toDay(d);
};

const row = (over: Partial<ApiAppointment> = {}): ApiAppointment => ({
  id: "0b6f9a51-1c1e-4c39-9d63-0a0a0a0a0a01",
  patientId: JOHN_ID,
  date: inDays(3),
  startTime: "10:30",
  endTime: "11:15",
  title: "Nephrology Test Visit",
  doctor: "Dr. Test Carter",
  location: "Test Dialysis Center",
  address: "1 Test Way",
  notes: "",
  attendance: null,
  rescheduled: false,
  reminderLeadMinutes: 1440,
  sourceAccessAppointmentId: null,
  createdById: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  createdAt: "2026-11-01T10:00:00.000Z",
  updatedAt: "2026-11-01T10:00:00.000Z",
  ...over,
});

const isList = (c: StubCall, patientId = JOHN_ID) =>
  c.method === "GET" && c.path === `/patients/${patientId}/appointments`;

function caregiverContext(permissions: Record<string, number>): MeContext {
  return {
    ...memberContext(),
    patient: null,
    caregiving: [
      {
        grantId: "g-1",
        patientId: GRACE_ID,
        firstName: "Grace",
        lastName: "Test",
        relationship: "Daughter",
        preset: "custom",
        permissions,
      },
    ],
  };
}

function memberKeys(): string[] {
  return Object.keys(window.localStorage).filter((k) =>
    k.includes("member-appointments"),
  );
}

describe("appointments mapping", () => {
  it("maps the API row, its reminder and a server copy of an access visit", () => {
    expect(fromApiAppointment(row())).toMatchObject({
      start: "10:30",
      end: "11:15",
      reminder: "1d",
    });
    const copy = fromApiAppointment(
      row({ sourceAccessAppointmentId: "va-src-1", attendance: "missed" }),
    );
    expect(copy).toMatchObject({
      source: "vascular-access",
      sourceId: "va-src-1",
      attendance: "missed",
    });
    expect(
      fromApiAppointment(row({ reminderLeadMinutes: null })).reminder,
    ).toBeUndefined();
  });

  it("sends trimmed text, an open end as '' and 'No reminder' as null", () => {
    expect(
      toAppointmentBody({
        date: "2026-12-01",
        start: "09:00",
        end: "",
        title: "  Labs ",
        doctor: " Dr. Test ",
        location: "",
        address: "",
        notes: " bring list ",
        reminder: "none",
      }),
    ).toEqual({
      date: "2026-12-01",
      startTime: "09:00",
      endTime: "",
      title: "Labs",
      doctor: "Dr. Test",
      location: "",
      address: "",
      notes: "bring list",
      reminderLeadMinutes: null,
    });
  });
});

describe("useAppointments on the API", () => {
  it("reads what is ahead and the past year for the member's own record", async () => {
    const { calls } = stubApi((c) =>
      isList(c)
        ? pageOf(c.query.get("order") === "asc" ? [row()] : [])
        : undefined,
    );
    const { result } = renderHook(() => useAppointments(), { wrapper });
    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.appointments).toHaveLength(1);
    const lists = calls.filter((c) => isList(c));
    expect(lists).toHaveLength(2);
    const ahead = lists.find((c) => c.query.get("order") === "asc")!;
    expect(ahead.query.get("from")).toBe(today);
    const past = lists.find((c) => c.query.get("order") === "desc")!;
    expect(past.query.get("to")).toBe(inDays(-1));
    for (const c of calls)
      expect(c.headers["x-organization-id"]).toBeUndefined();
  });

  it("never reads a legacy browser copy (no seed, no restore)", async () => {
    const legacy = JSON.stringify([
      {
        id: "seed-appt-1",
        date: inDays(2),
        start: "10:00",
        end: "",
        title: "Old",
        doctor: "Old",
        location: "",
        address: "",
        notes: "",
      },
    ]);
    window.localStorage.setItem("nr:member-appointments", legacy);
    window.localStorage.setItem(
      "nr:member:john.test@example.test:member-appointments",
      legacy,
    );
    stubApi((c) => (isList(c) ? pageOf([]) : undefined));
    const { result } = renderHook(() => useAppointments(), { wrapper });
    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.appointments).toEqual([]);
  });

  it("writes each change as its own call and stores nothing locally", async () => {
    const { calls } = stubApi((c) => {
      if (isList(c)) return pageOf([row()]);
      if (c.method !== "GET") return { data: row() };
      return undefined;
    });
    const { result } = renderHook(() => useAppointments(), { wrapper });
    await waitFor(() => expect(result.current.isPending).toBe(false));
    const id = row().id;
    const draft = {
      date: inDays(5),
      start: "08:00",
      end: "",
      title: "Access check",
      doctor: "Test Team",
      location: "",
      address: "",
      notes: "",
      reminder: "1h" as const,
    };
    await act(async () => result.current.add(draft));
    await act(async () => result.current.update(id, draft));
    await act(async () => result.current.setAttendance(id, "missed"));
    await act(async () => result.current.markRescheduled(id));
    await act(async () => result.current.remove(id));
    await waitFor(() =>
      expect(calls.filter((c) => c.method !== "GET")).toHaveLength(5),
    );
    const writes = calls
      .filter((c) => c.method !== "GET")
      .map((c) => `${c.method} ${c.path}`);
    const base = `/patients/${JOHN_ID}/appointments`;
    expect(writes).toEqual([
      `POST ${base}`,
      `PATCH ${base}/${id}`,
      `PATCH ${base}/${id}/attendance`,
      `POST ${base}/${id}/rescheduled`,
      `DELETE ${base}/${id}`,
    ]);
    const post = calls.find((c) => c.method === "POST" && c.path === base)!;
    expect(post.body).toMatchObject({ reminderLeadMinutes: 60, endTime: "" });
    expect(calls.find((c) => c.path.endsWith("/attendance"))!.body).toEqual({
      attendance: "missed",
    });
    expect(memberKeys()).toEqual([]);
  });

  it("shows a refused write as an error, not as saved", async () => {
    stubApi((c) => {
      if (isList(c)) return pageOf([]);
      if (c.method === "POST") return apiError(403, "access.forbidden");
      return undefined;
    });
    const { result } = renderHook(() => useAppointments(), { wrapper });
    await waitFor(() => expect(result.current.isPending).toBe(false));
    await act(async () =>
      result.current.add({
        date: inDays(1),
        start: "09:00",
        end: "",
        title: "T",
        doctor: "D",
        location: "",
        address: "",
        notes: "",
      }),
    );
    await waitFor(() => expect(result.current.saveError).toBeTruthy());
  });

  it("a caregiver reads only the patient of their grant", async () => {
    const { calls } = stubApi(
      (c) =>
        isList(c, GRACE_ID) && c.query.get("order") === "asc"
          ? pageOf([row({ patientId: GRACE_ID })])
          : undefined,
      caregiverContext({ personal_logs: 2 }),
    );
    const { result } = renderHook(() => useAppointments(), { wrapper });
    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.appointments).toHaveLength(1);
    const reads = calls.filter((c) => c.path.includes("/appointments"));
    expect(
      reads.every((c) => c.path === `/patients/${GRACE_ID}/appointments`),
    ).toBe(true);
    expect(memberKeys()).toEqual([]);
  });

  it("a caregiver without the area gets the not-shared state, never an empty list", async () => {
    stubApi(
      (c) =>
        isList(c, GRACE_ID) ? apiError(403, "access.forbidden") : undefined,
      caregiverContext({ profile: 1 }),
    );
    const { result } = renderHook(() => useAppointments(), { wrapper });
    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.error).toBeTruthy();
    expect(isNotShared(result.current.error)).toBe(true);
  });

  it("an office context has no patient scope and sends nothing", async () => {
    const { calls } = stubApi(() => undefined, {
      ...memberContext(),
      patient: null,
    });
    const { result } = renderHook(() => useAppointments(), { wrapper });
    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(isNotShared(result.current.error)).toBe(true);
    expect(calls.filter((c) => c.path.includes("/appointments"))).toEqual([]);
  });
});

describe("the Appointments page", () => {
  it("lists the API's appointments and has no axe violations", async () => {
    stubApi((c) =>
      isList(c)
        ? pageOf(c.query.get("order") === "asc" ? [row()] : [])
        : undefined,
    );
    const { container } = render(<AppointmentsPage />, { wrapper });
    expect(
      (await screen.findAllByText("Nephrology Test Visit")).length,
    ).toBeGreaterThan(0);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("shows a load failure as an error, not as no appointments", async () => {
    stubApi((c) => (isList(c) ? apiError(500, null, "Boom") : undefined));
    render(<AppointmentsPage />, { wrapper });
    expect(
      await screen.findByText("Your appointments could not be loaded"),
    ).toBeInTheDocument();
    expect(screen.queryByText("No upcoming appointments")).toBeNull();
  });
});
