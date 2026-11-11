import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/features/auth/AuthContext";
import { stubApi } from "@/features/profile/memberApiStub";

/* P16b crawl: the kg / lbs switch gave no sign of which unit is on, so a
   screen reader (and the crawler) could not tell that "kg" was already
   selected. Each button now carries aria-pressed. Synthetic data only. */

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/dashboard/personal-log/fluid-tracker",
  useSearchParams: () => new URLSearchParams(),
}));

/* jsdom has no ResizeObserver; the page's chart measures itself. */
class NoResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", NoResizeObserver);
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  stubApi();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("weight & fluid unit switch", () => {
  it("says which unit is selected", async () => {
    const { default: Page } = await import("./page");
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    render(
      <QueryClientProvider client={client}>
        <LanguageProvider>
          <AuthProvider>
            <Page />
          </AuthProvider>
        </LanguageProvider>
      </QueryClientProvider>,
    );
    const kg = await screen.findByRole("button", { name: "kg" });
    const lbs = screen.getByRole("button", { name: "lbs" });
    expect(kg).toHaveAttribute("aria-pressed", "true");
    expect(lbs).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(lbs);
    expect(lbs).toHaveAttribute("aria-pressed", "true");
    expect(kg).toHaveAttribute("aria-pressed", "false");
  }, 15_000);
});
