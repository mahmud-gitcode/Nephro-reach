import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { axe } from "vitest-axe";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider, useAuth } from "@/features/auth/AuthContext";
import type { ContextMembership, MeContext } from "@/features/auth/auth.types";
import { activeOrganization, api } from "@/lib/api/client";
import { registerQueryClient } from "@/lib/data/queryCache";
import { memberContext, stubApi } from "@/features/profile/memberApiStub";
import { SelectPortal } from "./SelectPortal";

/* Phase 3 (D5, INT-6): entering a context sets the office header only in
   office mode and clears every cached query; a choice the account does not
   hold is refused; the picker lists every portal and is accessible.
   Synthetic ids only. */

const push = vi.fn();
let pathname = "/dashboard";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => pathname,
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

const office = (
  id: string,
  name: string,
  type: ContextMembership["organizationType"],
): ContextMembership => ({
  organizationId: id,
  organizationName: name,
  organizationType: type,
  organizationStatus: "ACTIVE",
  role: "Office Manager",
  title: null,
  isOwner: false,
  permissions: { staff: 3, roles: 1 },
});

function multi(): MeContext {
  const base = memberContext();
  return {
    ...base,
    memberships: [
      office("org-river", "Riverside Test Dialysis", "DIALYSIS_CENTER"),
      office("org-metro", "Metro Test Access", "ACCESS_CENTER"),
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

function Probe() {
  const auth = useAuth();
  return (
    <div>
      <p data-testid="status">{auth.status}</p>
      <p data-testid="picker">{String(auth.pickerNeeded)}</p>
      <p data-testid="role">{auth.user?.role ?? "none"}</p>
      <button
        type="button"
        onClick={() => {
          const m = auth.context!.memberships.find(
            (x) => x.organizationId === "org-metro",
          )!;
          auth.enterContext({ kind: "office", membership: m });
        }}
      >
        metro
      </button>
      <button
        type="button"
        onClick={() => auth.enterContext({ kind: "patient" })}
      >
        patient
      </button>
      <button
        type="button"
        onClick={() =>
          (document.body.dataset.forged = String(
            auth.enterContext({
              kind: "office",
              membership: office("org-forged", "Not Mine", "DIALYSIS_CENTER"),
            }),
          ))
        }
      >
        forged
      </button>
    </div>
  );
}

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  unregister = registerQueryClient(client);
  pathname = "/dashboard";
  push.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  window.history.pushState({}, "", "/");
  unregister();
  vi.unstubAllGlobals();
  delete document.body.dataset.forged;
});

describe("portal context", () => {
  it("asks a multi-portal account to pick, then sets the header only in office mode and clears the cache", async () => {
    const { calls } = stubApi(() => ({ data: [] }), multi());
    render(<Probe />, { wrapper });
    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("signed-in"),
    );
    expect(screen.getByTestId("picker").textContent).toBe("true");
    expect(activeOrganization()).toBeNull();

    client.setQueryData(
      ["patient", "p", "org", "self", "allergies"],
      ["cached"],
    );
    await userEvent.click(screen.getByRole("button", { name: "metro" }));
    expect(activeOrganization()).toBe("org-metro");
    expect(screen.getByTestId("picker").textContent).toBe("false");
    expect(screen.getByTestId("role").textContent).toBe("access");
    /* The previous context's cached answer is gone. */
    expect(
      client.getQueryData(["patient", "p", "org", "self", "allergies"]),
    ).toBeUndefined();

    /* A call in office mode carries this office, and only this office. */
    await act(async () => {
      await api("/patients/p-1/allergies");
    });
    expect(
      calls.filter((c) => c.path === "/patients/p-1/allergies").at(-1)?.headers[
        "x-organization-id"
      ],
    ).toBe("org-metro");

    client.setQueryData(["org", "org-metro", "staff"], ["cached"]);
    await userEvent.click(screen.getByRole("button", { name: "patient" }));
    expect(activeOrganization()).toBeNull();
    expect(client.getQueryData(["org", "org-metro", "staff"])).toBeUndefined();
    await act(async () => {
      await api("/patients/p-1/allergies");
    });
    expect(
      calls.filter((c) => c.path === "/patients/p-1/allergies").at(-1)?.headers[
        "x-organization-id"
      ],
    ).toBeUndefined();
  });

  it("refuses a context the account does not hold", async () => {
    stubApi(() => ({ data: [] }), multi());
    render(<Probe />, { wrapper });
    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("signed-in"),
    );
    await userEvent.click(screen.getByRole("button", { name: "forged" }));
    expect(document.body.dataset.forged).toBe("false");
    expect(activeOrganization()).toBeNull();
  });

  it("does not ask when the page names exactly one portal", async () => {
    pathname = "/dashboard/access-center/team";
    window.history.pushState({}, "", pathname);
    stubApi(() => ({ data: [] }), multi());
    render(<Probe />, { wrapper });
    await waitFor(() =>
      expect(screen.getByTestId("status").textContent).toBe("signed-in"),
    );
    expect(screen.getByTestId("picker").textContent).toBe("false");
    expect(screen.getByTestId("role").textContent).toBe("access");
    expect(activeOrganization()).toBe("org-metro");
  });
});

describe("/select-portal", () => {
  it("lists every portal, enters the chosen one and goes to its home (axe clean)", async () => {
    pathname = "/select-portal";
    stubApi(() => ({ data: [] }), multi());
    const { container } = render(<SelectPortal />, { wrapper });
    await screen.findByText("Riverside Test Dialysis");
    expect(screen.getByText("Metro Test Access")).toBeTruthy();
    expect(screen.getByText("My health")).toBeTruthy();
    expect(await axe(container)).toHaveNoViolations();
    await userEvent.click(
      screen.getByRole("button", { name: "Open: Riverside Test Dialysis" }),
    );
    expect(activeOrganization()).toBe("org-river");
    expect(push).toHaveBeenCalledWith("/dashboard/clinic");
  });
});
