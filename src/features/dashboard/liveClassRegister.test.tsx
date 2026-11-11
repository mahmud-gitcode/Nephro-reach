import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/features/auth/AuthContext";
import {
  apiError,
  pageOf,
  stubApi,
  type StubCall,
  type StubReply,
} from "@/features/profile/memberApiStub";
import UserDashboard from "./UserDashboard";

/* P16b crawl: a caregiver whose grant does not cover education pressed
   "Register" on the dashboard's live class; the server refused (403) and
   the card said "We could not register you. Please try again.", although
   trying again changes nothing. A refusal now says it is not shared (ADR
   0007 §5); any other failure keeps "try again". Synthetic data only. */

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

const inTwoDays = new Date(Date.now() + 2 * 86_400_000).toISOString();

const liveClass = {
  id: "c0c0c0c0-0000-4000-8000-000000000001",
  startsAt: inTwoDays,
  topic: "Synthetic class: first months on dialysis",
  educator: "Synthetic Educator",
  program: "dialysis",
  registeredCount: 0,
  capacity: 20,
  status: "open",
  recordingUrl: null,
};

function stub(registerReply: StubReply) {
  return stubApi((c: StubCall) => {
    if (c.method === "GET" && c.path === "/live-classes")
      return c.query.get("period") === "upcoming"
        ? pageOf([liveClass])
        : pageOf([]);
    if (c.method === "GET" && /\/education\/live-classes$/.test(c.path))
      return pageOf([]);
    if (c.method === "POST" && /\/registration$/.test(c.path))
      return registerReply;
    return apiError(404, null, "Not found");
  });
}

async function pressRegister() {
  render(<UserDashboard />, { wrapper });
  const button = await screen.findByRole(
    "button",
    { name: /^Register$/ },
    { timeout: 4000 },
  );
  await waitFor(() => expect(button).toBeEnabled());
  fireEvent.click(button);
}

describe("the dashboard's live class Register", () => {
  it("a refused registration (403) says it is not shared, with no 'try again'", async () => {
    const { calls } = stub(apiError(403, "access.patient_access_denied"));
    await pressRegister();
    const alert = await screen.findByText(/You do not have access/);
    expect(alert).toHaveAttribute("role", "alert");
    expect(screen.queryByText(/We could not register you/)).toBeNull();
    expect(
      calls.some((c) => c.method === "POST" && /registration$/.test(c.path)),
    ).toBe(true);
  }, 15_000);

  it("any other failure keeps 'try again'", async () => {
    stub(apiError(500, null, "Boom"));
    await pressRegister();
    expect(
      await screen.findByText("We could not register you. Please try again."),
    ).toHaveAttribute("role", "alert");
  }, 15_000);
});
