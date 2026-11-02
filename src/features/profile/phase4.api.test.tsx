import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { axe } from "vitest-axe";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/features/auth/AuthContext";
import { useMyHealth } from "@/features/my-health/useMyHealth";
import {
  apiError,
  GRACE_ID,
  JOHN_ID,
  memberContext,
  pageOf,
  stubApi,
  type StubCall,
} from "./memberApiStub";
import { useEmergencyContact } from "./useEmergencyContact";

/* Phase 4 against a stand-in API: the right patient in every path, no
   office header, no seed row ever sent, legacy browser data never shown,
   error is not empty, and 403 is "not shared". Synthetic data only. */

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

const allergy = {
  id: "a1",
  patientId: JOHN_ID,
  name: "Penicillin",
  type: "medication",
  reaction: "Rash",
  severity: "severe",
  notes: null,
  createdAt: "2026-11-02T10:00:00.000Z",
  updatedAt: "2026-11-02T10:00:00.000Z",
};

const patientCalls = (calls: StubCall[]) =>
  calls.filter((c) => c.path.startsWith("/patients/"));

beforeEach(() => {
  window.localStorage.clear();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

describe("My Health on the API", () => {
  it("reads John's allergies by his id, with no office header and no write", async () => {
    /* A prototype browser still holding a demo row: it must not show. */
    window.localStorage.setItem(
      "nr:my-health",
      JSON.stringify({
        allergies: [{ id: "x", name: "Legacy Shellfish", type: "Food" }],
        history: [],
      }),
    );
    const { calls } = stubApi((call) =>
      call.path.endsWith("/allergies")
        ? pageOf([allergy])
        : call.path.endsWith("/medical-conditions")
          ? pageOf([])
          : undefined,
    );
    const { default: Page } =
      await import("@/app/(portal)/dashboard/(member)/my-health/page");
    const { container } = render(<Page />, { wrapper });
    expect((await screen.findAllByText("Penicillin")).length).toBeGreaterThan(
      0,
    );
    expect(screen.queryByText("Legacy Shellfish")).not.toBeInTheDocument();

    const reads = patientCalls(calls);
    expect(reads.length).toBeGreaterThan(0);
    for (const call of reads) {
      expect(call.path.startsWith(`/patients/${JOHN_ID}/`)).toBe(true);
      expect(call.headers["x-organization-id"]).toBeUndefined();
      /* Reading never sends anything: no seed row can reach the API. */
      expect(call.method).toBe("GET");
    }
    /* A profile list asks for a full page, never relying on the default 10. */
    expect(reads[0].query.get("limit")).toBe("150");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("Grace's session reads only Grace's records", async () => {
    const { calls } = stubApi(
      (call) => (call.path.includes("/patients/") ? pageOf([]) : undefined),
      memberContext(GRACE_ID),
    );
    const { result } = renderHook(() => useMyHealth(), { wrapper });
    await waitFor(() =>
      expect(result.current.allergiesRead.isPending).toBe(false),
    );
    const reads = patientCalls(calls);
    expect(reads.length).toBeGreaterThan(0);
    for (const call of reads) {
      expect(call.path).toContain(GRACE_ID);
      expect(call.path).not.toContain(JOHN_ID);
    }
  });

  it("a 403 shows the not-shared state with no retry and no rows", async () => {
    stubApi((call) =>
      call.path.includes("/patients/")
        ? apiError(403, "access.patient_access_denied")
        : undefined,
    );
    const { default: Page } =
      await import("@/app/(portal)/dashboard/(member)/my-health/page");
    render(<Page />, { wrapper });
    expect(
      await screen.findByText("This has not been shared with you"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /try again/i }),
    ).not.toBeInTheDocument();
  });

  it("adds with lower-case enums, and an edit sends only the changed field", async () => {
    const { calls } = stubApi((call) => {
      if (call.method === "POST") return { status: 201, data: allergy };
      if (call.method === "PATCH") return { data: allergy };
      if (call.path.endsWith("/allergies")) return pageOf([allergy]);
      if (call.path.endsWith("/medical-conditions")) return pageOf([]);
      return undefined;
    });
    const { result } = renderHook(() => useMyHealth(), { wrapper });
    await waitFor(() => expect(result.current.allergies).toHaveLength(1));

    await act(async () => {
      await result.current.addAllergy.mutateAsync({
        name: "Latex",
        type: "Environmental",
        reactionDefault: "Itching",
        severity: "Mild",
        notes: "—",
      });
    });
    const post = calls.find((c) => c.method === "POST");
    expect(post?.path).toBe(`/patients/${JOHN_ID}/allergies`);
    expect(post?.body).toEqual({
      name: "Latex",
      type: "environmental",
      reaction: "Itching",
      severity: "mild",
      notes: "",
    });

    const before = result.current.allergies[0];
    await act(async () => {
      await result.current.editAllergy.mutateAsync({
        before,
        next: { ...before, severity: "Moderate" },
      });
    });
    const patch = calls.find((c) => c.method === "PATCH");
    expect(patch?.path).toBe(`/patients/${JOHN_ID}/allergies/a1`);
    expect(patch?.body).toEqual({ severity: "moderate" });
  });
});

describe("emergency contact on the API", () => {
  it("reads null as not set, and clearing the number deletes it", async () => {
    let saved: unknown = {
      name: "Denise Park",
      phone: "555",
      relationship: "Daughter",
    };
    const { calls } = stubApi((call) => {
      if (!call.path.endsWith("/emergency-contact")) return undefined;
      if (call.method === "DELETE") {
        saved = null;
        return { data: null };
      }
      return { data: saved };
    });
    const { result } = renderHook(() => useEmergencyContact(), { wrapper });
    await waitFor(() => expect(result.current.isSet).toBe(true));
    await act(async () => {
      result.current.save({ name: "Denise Park", phone: "", relationship: "" });
    });
    await waitFor(() =>
      expect(calls.some((c) => c.method === "DELETE")).toBe(true),
    );
    await waitFor(() => expect(result.current.isSet).toBe(false));
    expect(result.current.contact).toEqual({
      name: "",
      phone: "",
      relationship: "",
    });
  });

  it("shows empty fields for a member with none saved", async () => {
    stubApi(() => undefined);
    const { default: Page } =
      await import("@/app/(portal)/dashboard/(member)/settings/page");
    const { container } = render(<Page />, { wrapper });
    expect(await screen.findByText("No number saved yet.")).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("healthcare team on the API", () => {
  const contact = {
    id: "t1",
    patientId: JOHN_ID,
    name: "Nurse Wilson",
    email: "nurse@clinic.example",
    role: "nurse",
    status: "invited",
    invitedAt: "2026-11-02T10:00:00.000Z",
  };

  it("lists the team with no way to mark someone accepted (INT-14)", async () => {
    stubApi((call) =>
      call.path.endsWith("/care-team-contacts")
        ? pageOf([contact])
        : call.path.includes("/patients/")
          ? pageOf([])
          : undefined,
    );
    const { default: Page } =
      await import("@/app/(portal)/dashboard/(member)/personal-log/page");
    const { container } = render(<Page />, { wrapper });
    expect(await screen.findByText("Nurse Wilson")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /mark accepted/i }),
    ).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("shows the duplicate copy when the server says 409", async () => {
    stubApi((call) => {
      if (call.method === "POST")
        return apiError(409, "patient_profile.care_team_contact_duplicate");
      return call.path.includes("/patients/") ? pageOf([]) : undefined;
    });
    const { default: Page } =
      await import("@/app/(portal)/dashboard/(member)/personal-log/page");
    render(<Page />, { wrapper });
    const email = await screen.findByLabelText("Email");
    await userEvent.type(email, "nurse@clinic.example");
    await userEvent.click(screen.getByRole("button", { name: "Invite" }));
    expect(
      await screen.findByText("This person is already on your team."),
    ).toBeInTheDocument();
  });
});
