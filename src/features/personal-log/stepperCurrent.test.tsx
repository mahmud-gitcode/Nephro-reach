import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { axe } from "vitest-axe";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/features/auth/AuthContext";
import { pageOf, stubApi } from "@/features/profile/memberApiStub";
import DialysisDaySymptomLogForm from "./DialysisDaySymptomLogForm";

/* P16a crawl round 4: the treatment form's step buttons say which step is
   open (aria-current="step"). Before, a click on the open step changed
   nothing a screen reader (or the crawler) could read. Synthetic member. */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/dashboard/personal-log/dialysis-treatment/add",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  stubApi((call) => (call.method === "GET" ? pageOf([]) : undefined));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function renderForm() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <LanguageProvider>
        <AuthProvider>
          <DialysisDaySymptomLogForm isModal={false} />
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>,
  );
}

const stepButton = (name: RegExp) => screen.findByRole("button", { name });

describe("dialysis treatment form steps", () => {
  it("marks the open step as current and moves the mark on a click", async () => {
    renderForm();
    const pre = await stepButton(/Pre-Dialysis$/);
    const during = await stepButton(/During Session$/);
    expect(pre).toHaveAttribute("aria-current", "step");
    expect(during).not.toHaveAttribute("aria-current");
    fireEvent.click(during);
    expect(during).toHaveAttribute("aria-current", "step");
    expect(pre).not.toHaveAttribute("aria-current");
  });

  it("the step list has no axe violations", async () => {
    renderForm();
    const pre = await stepButton(/Pre-Dialysis$/);
    expect(await axe(pre.parentElement!)).toHaveNoViolations();
  });
});
