import React from "react";
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
import { JOHN_ID, pageOf, stubApi } from "@/features/profile/memberApiStub";
import HomeVisitsSection from "./HomeVisitsSection";
import { useHomeVisits } from "./useHomeVisits";
import type { ApiHomeVisit } from "./homeDialysis.mapper";
import type { DialysisModalityLog } from "./useDialysisModality";

/* P16a M1: one click on a home visit's delete sends one DELETE. A double
   click (or a click while the old list is still shown) used to send a
   second DELETE, whose 404 showed an error for a delete that succeeded.
   Synthetic data only. */

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

const PATH = `/patients/${JOHN_ID}/dialysis/home-visits`;

const visit: ApiHomeVisit = {
  id: "v1",
  patientId: JOHN_ID,
  visitDate: "2026-11-20",
  time: "10:00",
  provider: "rn",
  purpose: "Synthetic check",
  status: "scheduled",
  remind: false,
  modality: "home-hd",
  notes: "",
  createdById: null,
  createdAt: "2026-11-01T10:00:00.000Z",
  updatedAt: "2026-11-01T10:00:00.000Z",
};

/** The list holds the visit until a DELETE has been answered. */
function homeVisitsApi() {
  let deleted = false;
  return stubApi((call) => {
    if (call.path === PATH && call.method === "GET")
      return pageOf(deleted ? [] : [visit]);
    if (call.path === `${PATH}/v1` && call.method === "DELETE") {
      if (deleted)
        return {
          status: 404,
          body: { code: "records.record_gone", message: "gone" },
        };
      deleted = true;
      return { status: 200 };
    }
    return undefined;
  });
}

const homeHd = {
  modality: "home-hd",
  isHome: true,
} as unknown as DialysisModalityLog;

beforeEach(() => {
  window.localStorage.clear();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

const deletes = (calls: { method: string }[]) =>
  calls.filter((c) => c.method === "DELETE").length;

describe("home visit delete (P16a M1)", () => {
  it("two remove calls for the same visit send one DELETE", async () => {
    const { calls } = homeVisitsApi();
    const { result } = renderHook(() => useHomeVisits("home-hd"), {
      wrapper,
    });
    await waitFor(() => expect(result.current.visits).toHaveLength(1));
    act(() => {
      result.current.remove("v1");
      result.current.remove("v1");
    });
    await waitFor(() => expect(result.current.visits).toHaveLength(0));
    expect(deletes(calls)).toBe(1);
    expect(result.current.saveError).toBeNull();
  });

  it("a double click on the delete button sends one DELETE and shows no error", async () => {
    const { calls } = homeVisitsApi();
    render(<HomeVisitsSection modalityLog={homeHd} />, { wrapper });
    const button = await screen.findByRole("button", {
      name: /^Delete visit/,
    });
    fireEvent.click(button);
    fireEvent.click(button);
    await screen.findByText("No visits yet");
    expect(deletes(calls)).toBe(1);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("the delete button is disabled while its delete is in flight (axe clean)", async () => {
    const { fetchMock } = homeVisitsApi();
    /* Hold the DELETE until the test lets it go. */
    let release = () => {};
    const gate = new Promise<void>((resolve) => (release = resolve));
    const answer = fetchMock.getMockImplementation()!;
    fetchMock.mockImplementation(async (input, init) => {
      if (init?.method === "DELETE") await gate;
      return answer(input, init);
    });
    const { container } = render(<HomeVisitsSection modalityLog={homeHd} />, {
      wrapper,
    });
    const button = await screen.findByRole("button", {
      name: /^Delete visit/,
    });
    expect(button).toBeEnabled();
    fireEvent.click(button);
    await waitFor(() => expect(button).toBeDisabled());
    expect(await axe(container)).toHaveNoViolations();
    release();
    await screen.findByText("No visits yet");
  });
});
