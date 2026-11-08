import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { axe } from "vitest-axe";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/features/auth/AuthContext";
import type { MeContext } from "@/features/auth/auth.types";
import {
  apiError,
  memberContext,
  pageOf,
  stubApi,
  type StubCall,
  type StubReply,
} from "@/features/profile/memberApiStub";
import type { ApiQueuedRide } from "@/features/vascular-access/access.repository";
import { ClinicRideRequests, RideRequestsPanel } from "./RideRequests";

/* Phase 10: the dialysis center's ride queue (BE-12) and its actions on
   each record's own routes; buttons follow the transport level (D4,
   PM-2), a server refusal is shown. Synthetic data only. */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/dashboard/clinic/messages",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

const ORG = "org-river";
const PROFILE = "prof-1";

function staffContext(
  role: string,
  permissions: Record<string, number>,
): MeContext {
  return {
    ...memberContext(),
    patient: null,
    memberships: [
      {
        organizationId: ORG,
        organizationName: "Riverside Test Dialysis",
        organizationType: "DIALYSIS_CENTER",
        organizationStatus: "ACTIVE",
        role,
        title: null,
        isOwner: false,
        permissions,
      },
    ],
  };
}

const SOCIAL_WORKER = staffContext("Social Worker", {
  patients: 1,
  vascular_access: 1,
  transport: 2,
  messages: 2,
});
const NURSE = staffContext("Nurse", {
  patients: 2,
  vascular_access: 1,
  messages: 2,
});

const ride = (over: Partial<ApiQueuedRide> = {}): ApiQueuedRide => ({
  id: "ride-1",
  profileId: PROFILE,
  appointmentId: "appt-1",
  appointment: {
    id: "appt-1",
    date: "2026-12-01",
    time: "14:30",
    title: "Access Check",
    place: "Metro Test Access Center",
    completedAt: null,
  },
  status: "Requested",
  handledBy: "Riverside Test Dialysis",
  pickupAddress: "1 Test Way",
  returnTrip: true,
  mobility: "wheelchair",
  memberNote: "",
  pickupTime: null,
  returnPickupTime: null,
  provider: null,
  phone: null,
  confirmationNumber: null,
  confirmationNote: null,
  confirmedByName: null,
  requestedAt: "2026-11-08T09:00:00.000Z",
  acknowledgedAt: null,
  confirmedAt: null,
  cancelledAt: null,
  cancelledBy: null,
  patientId: "pat-1",
  firstName: "Ann",
  lastName: "Test",
  mrn: "T-100",
  ...over,
});

function queueApi(
  context: MeContext,
  rides: ApiQueuedRide[],
  extra?: (c: StubCall) => StubReply | undefined,
) {
  return stubApi((call) => {
    const hit = extra?.(call);
    if (hit) return hit;
    if (call.path === `/organizations/${ORG}/transport`) return pageOf(rides);
    if (call.method === "POST") return { data: rides[0] ?? {} };
    return pageOf([]);
  }, context);
}

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
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const sent = (calls: StubCall[], suffix: string) =>
  calls.find((c) => c.method === "POST" && c.path.endsWith(suffix));

describe("the office ride queue", () => {
  it("reads the office-wide queue once (BE-12), active rides only", async () => {
    const { calls } = queueApi(SOCIAL_WORKER, [ride()]);
    render(<RideRequestsPanel orgId={ORG} canManage />, { wrapper });
    expect(await screen.findByText("Ann Test")).toBeTruthy();
    const reads = calls.filter((c) => c.path.endsWith("/transport"));
    expect(reads).toHaveLength(1);
    expect(reads[0].path).toBe(`/organizations/${ORG}/transport`);
    expect(reads[0].query.get("active")).toBe("true");
  });

  it("acknowledge calls the record's office route", async () => {
    const { calls } = queueApi(SOCIAL_WORKER, [ride()]);
    render(<RideRequestsPanel orgId={ORG} canManage />, { wrapper });
    fireEvent.click(await screen.findByRole("button", { name: "Acknowledge" }));
    await waitFor(() =>
      expect(sent(calls, "/acknowledge")?.path).toBe(
        `/organizations/${ORG}/access-profiles/${PROFILE}/transport/ride-1/acknowledge`,
      ),
    );
  });

  it("confirm sends HH:mm times on the record's office route", async () => {
    const { calls } = queueApi(SOCIAL_WORKER, [ride()]);
    render(<RideRequestsPanel orgId={ORG} canManage />, { wrapper });
    fireEvent.click(
      await screen.findByRole("button", { name: "Confirm Ride" }),
    );
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText(/^Pickup time/), {
      target: { value: "09:30" },
    });
    fireEvent.change(within(dialog).getByLabelText(/^Return pickup time/), {
      target: { value: "13:45" },
    });
    fireEvent.change(within(dialog).getByLabelText(/^Transport company/), {
      target: { value: "Test Rides" },
    });
    fireEvent.change(within(dialog).getByLabelText(/^Phone/), {
      target: { value: "555-010-0199" },
    });
    fireEvent.change(within(dialog).getByLabelText(/^Confirmation number/), {
      target: { value: "C-1" },
    });
    expect(await axe(dialog)).toHaveNoViolations();
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Confirm & Notify Patient" }),
    );
    await waitFor(() => expect(sent(calls, "/confirm")).toBeTruthy());
    const confirm = sent(calls, "/confirm")!;
    expect(confirm.path).toBe(
      `/organizations/${ORG}/access-profiles/${PROFILE}/transport/ride-1/confirm`,
    );
    expect(confirm.body).toEqual({
      pickupTime: "09:30",
      returnPickupTime: "13:45",
      provider: "Test Rides",
      phone: "555-010-0199",
      confirmationNumber: "C-1",
    });
  });

  it("a server refusal is shown, never hidden", async () => {
    queueApi(SOCIAL_WORKER, [ride()], (call) =>
      call.method === "POST" && call.path.endsWith("/acknowledge")
        ? apiError(
            403,
            "vascular_access.dialysis_center_only",
            "Only the dialysis center can do that.",
          )
        : undefined,
    );
    render(<RideRequestsPanel orgId={ORG} canManage />, { wrapper });
    fireEvent.click(await screen.findByRole("button", { name: "Acknowledge" }));
    expect(
      await screen.findByText("Only the dialysis center can do that."),
    ).toBeTruthy();
  });

  it("a failed read is an error, not 'No ride requests'", async () => {
    queueApi(SOCIAL_WORKER, [], (call) =>
      call.path === `/organizations/${ORG}/transport`
        ? apiError(500, null)
        : undefined,
    );
    render(<RideRequestsPanel orgId={ORG} canManage />, { wrapper });
    expect(
      await screen.findByText("Ride requests could not be loaded"),
    ).toBeTruthy();
    expect(screen.queryByText("No ride requests.")).toBeNull();
  });

  it("without transport Edit the rides are read-only", async () => {
    queueApi(NURSE, [ride()]);
    render(<RideRequestsPanel orgId={ORG} canManage={false} />, { wrapper });
    expect(await screen.findByText("Ann Test")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Acknowledge" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Confirm Ride" })).toBeNull();
  });
});

describe("ClinicRideRequests (the Messages page slot, name and props unchanged)", () => {
  it("shows the queue to the Social Worker (transport Edit)", async () => {
    queueApi(SOCIAL_WORKER, [ride()]);
    render(<ClinicRideRequests />, { wrapper });
    expect(await screen.findByText("Ride Requests")).toBeTruthy();
  });

  it("shows nothing to a Nurse (no transport level, D4/PM-2)", async () => {
    const { calls } = queueApi(NURSE, [ride()]);
    const { container } = render(<ClinicRideRequests />, { wrapper });
    await waitFor(() =>
      expect(calls.some((c) => c.path === "/me/context")).toBe(true),
    );
    await new Promise((r) => setTimeout(r, 50));
    expect(container.textContent).toBe("");
    expect(calls.some((c) => c.path.endsWith("/transport"))).toBe(false);
  });
});
