import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { axe } from "vitest-axe";
import { LanguageProvider } from "@/context/LanguageContext";
import {
  apiError,
  pageOf,
  stubApi,
  type StubHandler,
} from "@/features/profile/memberApiStub";
import ClinicLiveClass from "./ClinicLiveClass";
import { toStartsAt } from "./liveClass.mappers";

/* The Live Class page on the API (Phase 13). D13 is open: an office sees
   the NephroReach schedule read-only; only the platform team schedules,
   edits, cancels and posts recordings. No sample figures; links open as
   links, never embedded (D18). Synthetic data only. */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/dashboard/clinic/live-class",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

function day(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const upcoming = {
  id: "lc-up",
  startsAt: toStartsAt(day(5), "18:00") as string,
  topic: "Fluid Basics",
  educator: "NephroReach Education Team",
  program: "all",
  capacity: 50,
  status: "open",
  registeredCount: 4,
  seatsLeft: 46,
  recordingUrl: null,
};
const past = {
  ...upcoming,
  id: "lc-past",
  startsAt: toStartsAt(day(-5), "18:00") as string,
  topic: "Potassium Basics",
  recordingUrl: "https://example.test/recordings/potassium",
};

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return (
    <QueryClientProvider client={client}>
      <LanguageProvider>
        <main>{children}</main>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

const officeApi: StubHandler = (call) => {
  if (call.path === "/live-classes")
    return pageOf(call.query.get("period") === "past" ? [past] : [upcoming]);
  return undefined;
};

beforeEach(() => {
  window.localStorage.clear();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

describe("office view (D13: read-only)", () => {
  it("shows the server schedule with no management actions and no sample figures", async () => {
    const { calls } = stubApi(officeApi, null);
    render(<ClinicLiveClass />, { wrapper });
    expect((await screen.findAllByText("Fluid Basics")).length).toBeGreaterThan(
      0,
    );
    expect(
      screen.queryByRole("button", { name: /Schedule New Class/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Edit Fluid Basics/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Actions for/ }),
    ).not.toBeInTheDocument();
    /* The prototype's figures are gone. */
    expect(screen.queryByText("326")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Informative, easy to understand/),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText("No data yet").length).toBeGreaterThan(0);
    /* Only the public schedule is read: no platform route, no writes. */
    expect(calls.every((c) => c.method === "GET")).toBe(true);
    expect(calls.some((c) => c.path.startsWith("/platform/"))).toBe(false);
    /* A recording opens as a link, never an embedded player. */
    expect(document.querySelector("iframe, video")).toBeNull();
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it("an API failure is an error, and a 403 is 'not shared' with no retry", async () => {
    stubApi(() => apiError(500, null), null);
    render(<ClinicLiveClass />, { wrapper });
    expect(
      await screen.findByText("Live classes did not load"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Fluid Basics")).not.toBeInTheDocument();
    cleanup();
    vi.unstubAllGlobals();
    stubApi(() => apiError(403, "access.forbidden"), null);
    render(<ClinicLiveClass />, { wrapper });
    expect(
      await screen.findByText("This has not been shared with you"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Try again/ }),
    ).not.toBeInTheDocument();
  });
});

describe("NephroReach team view (platform content)", () => {
  it("reads the platform list and settings, and changes a class with one call", async () => {
    const { calls } = stubApi((call) => {
      if (call.path === "/platform/live-classes" && call.method === "GET")
        return pageOf([
          { ...upcoming, joinUrl: null, attendedCount: 0, averageRating: null },
          { ...past, joinUrl: null, attendedCount: 3, averageRating: 4.5 },
        ]);
      if (call.path === "/platform/live-class-settings") return { data: [] };
      if (
        call.path === "/platform/live-classes/lc-up" &&
        call.method === "PATCH"
      )
        return { data: { ...upcoming, status: "cancelled" } };
      return undefined;
    }, null);
    render(<ClinicLiveClass manage href="/dashboard/live-class" />, {
      wrapper,
    });
    expect(
      await screen.findByRole("button", { name: /Schedule New Class/ }),
    ).toBeInTheDocument();
    await userEvent.click(
      await screen.findByRole("button", { name: "Actions for Fluid Basics" }),
    );
    const cancel = await screen.findByRole("button", {
      name: /Cancel class|Cancel Class|Mark cancelled/i,
    });
    await userEvent.click(cancel);
    await waitFor(() =>
      expect(calls.some((c) => c.method === "PATCH")).toBe(true),
    );
    const patch = calls.find((c) => c.method === "PATCH");
    expect(patch?.path).toBe("/platform/live-classes/lc-up");
    expect(patch?.body).toEqual({ status: "cancelled" });
  });
});
