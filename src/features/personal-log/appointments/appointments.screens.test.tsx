import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { axe } from "vitest-axe";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/features/auth/AuthContext";
import type { MeContext } from "@/features/auth/auth.types";
import {
  apiError,
  GRACE_ID,
  memberContext,
  pageOf,
  stubApi,
  type StubCall,
  type StubReply,
} from "@/features/profile/memberApiStub";
import AppointmentsPage from "@/app/(portal)/dashboard/(member)/personal-log/appointments/page";
import PersonalLogPage from "@/app/(portal)/dashboard/(member)/personal-log/page";
import UserDashboard from "@/features/dashboard/UserDashboard";

/* QA-SEC P15c round 2, R2-F1: on every screen that shows the member's
   appointments, a refused read (403) is the shared "not shared with you"
   state with no retry, and any other failed read is an error. Neither is
   ever the empty "nothing booked" state. Synthetic data only. */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/dashboard",
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

/** A caregiver for Grace whose grant does not cover personal logs. */
function caregiverWithoutLogs(): MeContext {
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
        permissions: { profile: 1 },
      },
    ],
  };
}

const isAppointments = (c: StubCall) =>
  c.method === "GET" && /^\/patients\/[^/]+\/appointments$/.test(c.path);

/** Appointments answer `failure`; every other read is an empty page, or
 *  a 404 where the screen reads summaries that are not lists (the
 *  dashboard), so only the appointments card is under test. */
function stubWithAppointments(
  failure: StubReply,
  context?: MeContext,
  others: () => StubReply = () => pageOf([]),
) {
  return stubApi(
    (c) => (isAppointments(c) ? failure : others()),
    context ?? memberContext(),
  );
}

const notFound = () => apiError(404, null, "Not found");

const NOT_SHARED = "This has not been shared with you";

describe("the Appointments page on a failed read", () => {
  it("a caregiver without the area sees the not-shared state, with no retry", async () => {
    stubWithAppointments(
      apiError(403, "access.forbidden"),
      caregiverWithoutLogs(),
    );
    render(<AppointmentsPage />, { wrapper });
    const alert = (await screen.findByText(NOT_SHARED)).closest(
      "[role=alert]",
    ) as HTMLElement;
    expect(alert).not.toBeNull();
    expect(within(alert).queryByRole("button", { name: /try again/i })).toBe(
      null,
    );
    expect(screen.queryByText("Your appointments could not be loaded")).toBe(
      null,
    );
    expect(screen.queryByText("No upcoming appointments")).toBeNull();
  });

  it("a server error keeps its own copy and offers a retry", async () => {
    stubWithAppointments(apiError(500, null, "Boom"));
    render(<AppointmentsPage />, { wrapper });
    expect(
      await screen.findByText("Your appointments could not be loaded"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /try again/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(NOT_SHARED)).toBeNull();
  });
});

describe("the Personal log hub's upcoming card on a failed read", () => {
  it("a caregiver without the area sees the not-shared state, not 'add your next visit'", async () => {
    stubWithAppointments(
      apiError(403, "access.forbidden"),
      caregiverWithoutLogs(),
    );
    const { container } = render(<PersonalLogPage />, { wrapper });
    const alert = (await screen.findByText(NOT_SHARED)).closest(
      "[role=alert]",
    ) as HTMLElement;
    expect(
      within(alert).queryByRole("button", { name: /try again/i }),
    ).toBeNull();
    expect(
      screen.queryByText("Add your next visit to be reminded before it."),
    ).toBeNull();
    expect(screen.queryByText("Add an appointment")).toBeNull();
    const card = alert.closest("section") as HTMLElement;
    expect(await axe(card)).toHaveNoViolations();
    expect(container).toBeTruthy();
  });

  it("a server error is an error with a retry, not the empty state", async () => {
    stubWithAppointments(apiError(500, null, "Boom"));
    render(<PersonalLogPage />, { wrapper });
    const title = await screen.findByText(
      "Your appointments could not be loaded",
    );
    const alert = title.closest("[role=alert]") as HTMLElement;
    expect(
      within(alert).getByRole("button", { name: /try again/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Add your next visit to be reminded before it."),
    ).toBeNull();
    expect(
      await axe(alert.closest("section") as HTMLElement),
    ).toHaveNoViolations();
  });
});

describe("the member dashboard's next-appointment card on a failed read", () => {
  it("a caregiver without the area sees the not-shared copy, not 'Nothing scheduled'", async () => {
    stubWithAppointments(
      apiError(403, "access.forbidden"),
      caregiverWithoutLogs(),
      notFound,
    );
    render(<UserDashboard />, { wrapper });
    const copy = await screen.findByText(NOT_SHARED);
    expect(screen.queryByText("Nothing scheduled")).toBeNull();
    const card = copy.closest("section") as HTMLElement;
    expect(within(card).getByText("Next appointment")).toBeInTheDocument();
    expect(await axe(card)).toHaveNoViolations();
  });

  it("a server error says the appointments did not load, not 'Nothing scheduled'", async () => {
    stubWithAppointments(apiError(500, null, "Boom"), undefined, notFound);
    render(<UserDashboard />, { wrapper });
    const copy = await screen.findByText("Your appointments did not load.");
    expect(screen.queryByText("Nothing scheduled")).toBeNull();
    expect(
      await axe(copy.closest("section") as HTMLElement),
    ).toHaveNoViolations();
  });
});
