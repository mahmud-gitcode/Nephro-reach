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
import { axe } from "vitest-axe";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/features/auth/AuthContext";
import { JOHN_ID, stubApi } from "@/features/profile/memberApiStub";
import type { ApiHomeDialysisClinic } from "@/features/profile/homeDialysisClinic";
import DialysisClinicCard from "./DialysisClinicCard";

/* P16a: the Dialysis Management card's "Add phone number" / "Edit center"
   save sent no organizationId, so a center on NephroReach lost its link
   (the server stores a typed-in center when the id is missing). Synthetic
   data only. */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/dashboard/personal-log/dialysis-management",
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

const PATH = `/patients/${JOHN_ID}/home-dialysis-clinic`;
const ORG = "33333333-3333-4333-8333-333333333333";

const linked: ApiHomeDialysisClinic = {
  patientId: JOHN_ID,
  organizationId: ORG,
  onNephroReach: true,
  name: "Synthetic Dialysis Center",
  phone: "",
  address: "",
  email: null,
  updatedAt: "2026-11-01T10:00:00.000Z",
};

function clinicApi() {
  return stubApi((call) =>
    call.path === PATH
      ? call.method === "GET"
        ? { data: linked }
        : { data: { ...linked, phone: "5555550100" } }
      : undefined,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

const put = (calls: { method: string; path: string; body: unknown }[]) =>
  calls.find((c) => c.method === "PUT" && c.path === PATH)?.body;

describe("dialysis center card save", () => {
  it("adding a phone keeps the NephroReach link (organizationId sent)", async () => {
    const { calls } = clinicApi();
    render(<DialysisClinicCard />, { wrapper });
    fireEvent.click(
      await screen.findByRole("button", { name: /Add phone number/ }),
    );
    fireEvent.change(screen.getByLabelText("Phone number"), {
      target: { value: "5555550100" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(put(calls)).toBeDefined());
    expect(put(calls)).toEqual({ organizationId: ORG, phone: "5555550100" });
  });

  it("a new center name is a typed-in center: no organizationId", async () => {
    const { calls } = clinicApi();
    render(<DialysisClinicCard />, { wrapper });
    fireEvent.click(await screen.findByRole("button", { name: "Edit center" }));
    fireEvent.change(screen.getByLabelText("Center name"), {
      target: { value: "Another Synthetic Center" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(put(calls)).toBeDefined());
    expect(put(calls)).toEqual({ name: "Another Synthetic Center" });
  });

  it("the open dialog has no axe violations", async () => {
    clinicApi();
    render(<DialysisClinicCard />, { wrapper });
    fireEvent.click(await screen.findByRole("button", { name: "Edit center" }));
    await screen.findByLabelText("Center name");
    expect(await axe(screen.getByRole("dialog"))).toHaveNoViolations();
  });
});
