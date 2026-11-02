import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { axe } from "vitest-axe";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/features/auth/AuthContext";
import type { MeContext } from "@/features/auth/auth.types";
import { activeOrganization } from "@/lib/api/client";
import { registerQueryClient } from "@/lib/data/queryCache";
import { memberContext, stubApi } from "@/features/profile/memberApiStub";
import CaregiverHome from "./CaregiverHome";
import { CaregiverBar } from "./CaregiverBar";

/* The caregiver side (D1, D5): patients come from /me/context; with
   several, none is picked until the caregiver opens one; opening or
   switching clears the cache and never sets an office header; shared
   areas are listed from the grant. Synthetic data only. */

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/dashboard/caregiver",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

function caregiverContext(): MeContext {
  return {
    ...memberContext(),
    patient: null,
    caregiving: [
      {
        grantId: "g-1",
        patientId: "p-1",
        firstName: "Ann",
        lastName: "Test",
        relationship: "Daughter",
        preset: "full",
        permissions: { profile: 2, labs: 2 },
      },
      {
        grantId: "g-2",
        patientId: "p-2",
        firstName: "Bea",
        lastName: "Test",
        relationship: "Grandchild",
        preset: "view-only",
        permissions: { profile: 1 },
      },
    ],
  };
}

let client: QueryClient;
let unregister: () => void;
function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={client}>
      <LanguageProvider>
        <AuthProvider>{children}</AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  unregister = registerQueryClient(client);
  window.history.pushState({}, "", "/dashboard/caregiver");
  push.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  cleanup();
  unregister();
  vi.unstubAllGlobals();
  window.history.pushState({}, "", "/");
});

describe("My Patients", () => {
  it("lists each patient with what they shared, none picked yet (axe clean)", async () => {
    stubApi(() => ({ data: [] }), caregiverContext());
    const { container } = render(
      <>
        <CaregiverBar />
        <CaregiverHome />
      </>,
      { wrapper },
    );
    await screen.findByText("Ann Test");
    expect(screen.getByText("Bea Test")).toBeTruthy();
    expect(screen.getByText(/Labs \(edit\)/)).toBeTruthy();
    expect(screen.queryByText("You are caring for")).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("opening a patient clears the cache, sends no office header, then the bar switches", async () => {
    stubApi(() => ({ data: [] }), caregiverContext());
    render(
      <>
        <CaregiverBar />
        <CaregiverHome />
      </>,
      { wrapper },
    );
    client.setQueryData(
      ["patient", "p-2", "org", "self", "allergies"],
      ["cached"],
    );
    await userEvent.click(
      await screen.findByRole("button", { name: "Open Ann Test" }),
    );
    expect(push).toHaveBeenCalledWith("/dashboard");
    expect(
      client.getQueryData(["patient", "p-2", "org", "self", "allergies"]),
    ).toBeUndefined();
    expect(activeOrganization()).toBeNull();
    await screen.findByText("You are caring for");

    client.setQueryData(
      ["patient", "p-1", "org", "self", "allergies"],
      ["ann"],
    );
    await userEvent.click(screen.getByRole("button", { name: /Switch/ }));
    await userEvent.click(
      screen.getByRole("menuitemradio", { name: /Bea Test/ }),
    );
    expect(
      client.getQueryData(["patient", "p-1", "org", "self", "allergies"]),
    ).toBeUndefined();
  });
});
