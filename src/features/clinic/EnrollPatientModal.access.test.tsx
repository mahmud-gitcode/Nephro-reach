import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  render,
  renderHook,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider, useOptionalAuth } from "@/features/auth/AuthContext";
import type { MeContext } from "@/features/auth/auth.types";
import { pageOf, stubApi } from "@/features/profile/memberApiStub";
import { apiRoster, officeContext } from "./rosterTestData";
import {
  CCM_PROGRAM,
  EnrollPatientModal,
  useCanEnrollPatient,
} from "./EnrollPatientModal";

/* P16F-1: the enroll form puts a patient on the roster AND in a program in
   one server call (backend spec 067), which needs patients edit and
   programs edit. A role without programs edit (the seeded dialysis Office
   Manager) gets no program step it cannot complete: no enabled Enroll, the
   form's no-access notice, nothing sent. The nephrology office still has
   CCM to choose. Synthetic office, people and ids. */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/dashboard/clinic",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

const { patients } = apiRoster();

/** A staff member (not the owner) with these levels. */
function staffContext(
  permissions: Record<string, number>,
  role: string,
  organizationType: "DIALYSIS_CENTER" | "NEPHROLOGY_OFFICE" = "DIALYSIS_CENTER",
): MeContext {
  const context = officeContext(permissions);
  context.memberships[0] = {
    ...context.memberships[0],
    organizationType,
    /* The form offers CCM by the office's portal (organizationFor). */
    ...(organizationType === "NEPHROLOGY_OFFICE"
      ? { organizationName: "Riverside Nephrology Associates" }
      : {}),
    role,
    isOwner: false,
  };
  return context;
}

/* The seeded built-in levels (backend built-in-roles.constants.ts). */
const OFFICE_MANAGER = { patients: 2, programs: 1, billing: 1, reports: 1 };
const FRONT_DESK = { patients: 2, referrals: 1, vascular_access: 1 };

function api(context: MeContext) {
  return stubApi((call) => {
    if (call.method === "GET" && call.path.endsWith("/patients"))
      return pageOf(patients);
    if (call.method === "GET" && call.path.endsWith("/program-enrollments"))
      return pageOf([]);
    if (call.path === "/courses") return pageOf([]);
    return undefined;
  }, context);
}

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

/** The hook's answer once the session has loaded. */
async function canEnroll(context: MeContext) {
  api(context);
  const { result } = renderHook(
    () => ({
      can: useCanEnrollPatient(),
      user: useOptionalAuth()?.user ?? null,
    }),
    { wrapper },
  );
  await waitFor(() => expect(result.current.user).not.toBeNull());
  return result.current.can;
}

beforeEach(() => {
  window.localStorage.clear();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("useCanEnrollPatient (P16F-1)", () => {
  it("is false for the dialysis Office Manager (patients edit, programs view)", async () => {
    expect(
      await canEnroll(staffContext(OFFICE_MANAGER, "Office Manager")),
    ).toBe(false);
  });

  it("is false for a role with patients edit and no programs level", async () => {
    expect(await canEnroll(staffContext(FRONT_DESK, "Front Desk"))).toBe(false);
  });

  it("is true for the owner and for a role with patients edit and programs edit", async () => {
    expect(await canEnroll(officeContext())).toBe(true);
    cleanup();
    expect(
      await canEnroll(
        staffContext({ patients: 2, programs: 2 }, "Enrollment Lead"),
      ),
    ).toBe(true);
  });

  it("is false without patients edit, whatever the programs level", async () => {
    expect(
      await canEnroll(staffContext({ patients: 1, programs: 3 }, "Educator")),
    ).toBe(false);
  });

  it("is true at the nephrology office without programs edit: CCM is still a choice", async () => {
    expect(
      await canEnroll(
        staffContext(
          { patients: 2, ccm: 2, programs: 1 },
          "Office Manager",
          "NEPHROLOGY_OFFICE",
        ),
      ),
    ).toBe(true);
  });

  it("is false at the nephrology office without ccm edit or programs edit: the CCM step would be refused", async () => {
    expect(
      await canEnroll(
        staffContext(
          { patients: 2, ccm: 1, programs: 1 },
          "Front Desk",
          "NEPHROLOGY_OFFICE",
        ),
      ),
    ).toBe(false);
    cleanup();
    expect(
      await canEnroll(
        staffContext({ patients: 2 }, "Front Desk", "NEPHROLOGY_OFFICE"),
      ),
    ).toBe(false);
  });
});

describe("the nephrology enroll form for a role without ccm edit", () => {
  it("shows the no-access notice and no CCM choice without programs edit", async () => {
    const { calls } = api(
      staffContext(
        { patients: 2, ccm: 1, programs: 1 },
        "Front Desk",
        "NEPHROLOGY_OFFICE",
      ),
    );
    render(<EnrollPatientModal onClose={vi.fn()} onEnrolled={vi.fn()} />, {
      wrapper,
    });
    const dialog = await screen.findByRole("dialog", {
      name: "Enroll New Patient",
    });
    expect(
      await within(dialog).findByText(
        /Your role cannot enroll patients in a program\./,
      ),
    ).toBeInTheDocument();
    const program = within(dialog).getByRole("combobox", { name: /Program/ });
    expect(within(program).queryAllByRole("option")).toEqual([]);
    expect(
      within(dialog).getByRole("button", { name: "Enroll Patient" }),
    ).toBeDisabled();
    expect(calls.some((c) => c.method === "POST")).toBe(false);
  });

  it("offers the programs but not CCM with programs edit", async () => {
    api(
      staffContext(
        { patients: 2, ccm: 1, programs: 2 },
        "Enrollment Lead",
        "NEPHROLOGY_OFFICE",
      ),
    );
    render(<EnrollPatientModal onClose={vi.fn()} onEnrolled={vi.fn()} />, {
      wrapper,
    });
    const dialog = await screen.findByRole("dialog", {
      name: "Enroll New Patient",
    });
    await waitFor(() =>
      expect(
        within(dialog).getByRole("button", { name: "Enroll Patient" }),
      ).toBeEnabled(),
    );
    const program = within(dialog).getByRole("combobox", { name: /Program/ });
    const options = within(program)
      .getAllByRole("option")
      .map((o) => o.textContent);
    expect(options.length).toBeGreaterThan(0);
    expect(options).not.toContain(CCM_PROGRAM);
  });
});

describe("the enroll form for a role without programs edit", () => {
  it("shows the no-access notice, offers no program and cannot submit", async () => {
    const { calls } = api(staffContext(OFFICE_MANAGER, "Office Manager"));
    render(<EnrollPatientModal onClose={vi.fn()} onEnrolled={vi.fn()} />, {
      wrapper,
    });
    const dialog = await screen.findByRole("dialog", {
      name: "Enroll New Patient",
    });
    expect(
      await within(dialog).findByText(
        /Your role cannot enroll patients in a program\./,
      ),
    ).toBeInTheDocument();
    const program = within(dialog).getByRole("combobox", { name: /Program/ });
    expect(within(program).queryAllByRole("option")).toEqual([]);
    expect(
      within(dialog).getByRole("button", { name: "Enroll Patient" }),
    ).toBeDisabled();
    expect(within(dialog).queryByText(/try/i)).not.toBeInTheDocument();
    expect(calls.some((c) => c.method === "POST")).toBe(false);
  });

  it("offers the programs and can submit for a role with programs edit", async () => {
    api(staffContext({ patients: 2, programs: 2 }, "Enrollment Lead"));
    render(<EnrollPatientModal onClose={vi.fn()} onEnrolled={vi.fn()} />, {
      wrapper,
    });
    const dialog = await screen.findByRole("dialog", {
      name: "Enroll New Patient",
    });
    await waitFor(() =>
      expect(
        within(dialog).getByRole("button", { name: "Enroll Patient" }),
      ).toBeEnabled(),
    );
    const program = within(dialog).getByRole("combobox", { name: /Program/ });
    expect(within(program).getAllByRole("option").length).toBeGreaterThan(0);
    expect(
      within(dialog).queryByText(/cannot enroll patients/),
    ).not.toBeInTheDocument();
  });
});
