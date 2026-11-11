import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { axe } from "vitest-axe";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/features/auth/AuthContext";
import { pageOf, stubApi } from "@/features/profile/memberApiStub";
import FluidTrackerPage from "./page";

/* P16a (6dd3103): the kg / lbs switch says which unit is on. Before, the
   active unit had no state a screen reader (or the crawler) could read, so
   clicking it looked like a control that does nothing. Synthetic member. */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/dashboard/personal-log/fluid-tracker",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

/* jsdom has no ResizeObserver; the page's chart measures itself. */
class NoResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", NoResizeObserver);
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  stubApi((call) => (call.method === "GET" ? pageOf([]) : undefined));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <LanguageProvider>
        <AuthProvider>
          <FluidTrackerPage />
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>,
  );
}

describe("weight & fluid tracker unit switch", () => {
  it("kg is pressed by default; a click on lbs moves the pressed state", async () => {
    renderPage();
    const kg = await screen.findByRole("button", { name: "kg" });
    const lbs = screen.getByRole("button", { name: "lbs" });
    expect(kg).toHaveAttribute("aria-pressed", "true");
    expect(lbs).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(lbs);
    expect(lbs).toHaveAttribute("aria-pressed", "true");
    expect(kg).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(kg);
    expect(kg).toHaveAttribute("aria-pressed", "true");
  });

  it("the switch has no axe violations", async () => {
    renderPage();
    await screen.findByRole("button", { name: "kg" });
    const group = screen.getByRole("button", { name: "kg" }).parentElement!;
    expect(await axe(group)).toHaveNoViolations();
  });
});
