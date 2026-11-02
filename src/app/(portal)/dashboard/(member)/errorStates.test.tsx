import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { axe } from "vitest-axe";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/features/auth/AuthContext";

/* INT-10: a failed read shows the error state, never empty or default
 * health data. The failure is simulated where every member page reads
 * today, the storage layer (localStorage refuses), so each page meets a
 * real rejected query, as it will when the API is down. */

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ slug: "dialysis-access" }),
}));

function renderPage(Page: React.ComponentType) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <LanguageProvider>
        <AuthProvider>
          <Page />
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>,
  );
}

/* jsdom has no ResizeObserver; the fluid page's chart measures itself. */
class NoResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", NoResizeObserver);
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new DOMException("Storage is blocked", "SecurityError");
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const pages: [
  string,
  () => Promise<{ default: React.ComponentType }>,
  RegExp,
][] = [
  [
    "blood pressure",
    () => import("./personal-log/blood-pressure/page"),
    /Your readings could not be loaded/,
  ],
  [
    "weight & fluid tracker",
    () => import("./personal-log/fluid-tracker/page"),
    /Your weight & fluid log could not be loaded/,
  ],
  [
    "dialysis treatment",
    () => import("./personal-log/dialysis-treatment/page"),
    /Your dialysis log could not be loaded/,
  ],
  [
    "dialysis management",
    () => import("./personal-log/dialysis-management/page"),
    /Your dialysis details could not be loaded/,
  ],
  [
    "lab tracking",
    () => import("./personal-log/lab-tracking/page"),
    /Your lab results could not be loaded/,
  ],
  [
    "my health",
    () => import("./my-health/page"),
    /Your allergies could not be loaded/,
  ],
  [
    "profile (settings)",
    () => import("./settings/page"),
    /Your emergency contact could not be loaded/,
  ],
  [
    "before the ER",
    () => import("./before-the-er/page"),
    /Your ER visits could not be loaded/,
  ],
  [
    "before the ER topic",
    () => import("./before-the-er/[slug]/page"),
    /Your dialysis clinic could not be loaded/,
  ],
];

describe("INT-10 error states", () => {
  it.each(pages)(
    "%s shows the error state when its read fails",
    async (_name, load, title) => {
      const { default: Page } = await load();
      renderPage(Page);
      expect(
        await screen.findByText(title, {}, { timeout: 4000 }),
      ).toBeInTheDocument();
      expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
    },
    15_000,
  );

  it("profile also refuses to show empty care-office forms", async () => {
    const { default: Page } = await import("./settings/page");
    renderPage(Page);
    expect(
      await screen.findByText(
        /Your care offices could not be loaded/,
        {},
        { timeout: 4000 },
      ),
    ).toBeInTheDocument();
  });

  it.each(pages)(
    "%s shows no error when its read succeeds",
    async (_name, load, title) => {
      vi.mocked(Storage.prototype.getItem).mockRestore();
      window.localStorage.clear();
      const { default: Page } = await load();
      renderPage(Page);
      /* Let every query settle. */
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(screen.queryByText(title)).not.toBeInTheDocument();
      expect(screen.queryByText(/could not be loaded/)).not.toBeInTheDocument();
    },
    15_000,
  );

  it("the error state is accessible", async () => {
    const { default: Page } = await import("./my-health/page");
    const { container } = renderPage(Page);
    await screen.findByText(/Your allergies could not be loaded/);
    expect(await axe(container)).toHaveNoViolations();
  });
});
