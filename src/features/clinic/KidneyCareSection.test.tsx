import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { axe } from "vitest-axe";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/features/auth/AuthContext";
import type { MeContext } from "@/features/auth/auth.types";
import {
  apiError,
  memberContext,
  pageOf,
  stubApi,
  type StubCall,
  type StubReply,
} from "@/features/profile/memberApiStub";
import { KidneyCareSection } from "./KidneyCareSection";
import type { CcmStore } from "./useCcm";

/* Phase 10 (QA M1): the CCM Kidney Care popup sends its access referral
   on the API again. The CCM list knows a patient by MRN only (it moves to
   the API in Phase 9), so the patient is found on this office's roster by
   that MRN, and only an exact single match is used. Synthetic data only. */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/dashboard/nephrology/ccm",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

const ORG = "org-neph";
const MRN = "T-100";

function staffContext(): MeContext {
  return {
    ...memberContext(),
    patient: null,
    memberships: [
      {
        organizationId: ORG,
        organizationName: "Test Office",
        organizationType: "NEPHROLOGY_OFFICE",
        organizationStatus: "ACTIVE",
        role: "Owner",
        title: null,
        isOwner: true,
        permissions: { "*": 3 },
      },
    ],
  };
}

const ANN = {
  patientId: "pat-ann",
  firstName: "Ann",
  lastName: "Test",
  mrn: MRN,
  status: "ACTIVE",
};

const DIRECTORY = [
  {
    id: "org-metro",
    name: "Metro Test Access Center",
    type: "ACCESS_CENTER",
    address: null,
    timeZone: null,
  },
];

const roster = (c: StubCall) =>
  c.method === "GET" && c.path === `/organizations/${ORG}/patients`;

function api(extra?: (c: StubCall) => StubReply | undefined) {
  return stubApi((call) => {
    const hit = extra?.(call);
    if (hit) return hit;
    if (call.path === "/directory/organizations") return pageOf(DIRECTORY);
    if (
      call.method === "POST" &&
      call.path === `/organizations/${ORG}/referrals`
    )
      return { status: 201, data: { id: "ref-1" } };
    return pageOf([]);
  }, staffContext());
}

function store(): CcmStore {
  return {
    state: {
      kidneyCare: {
        [MRN]: { answers: { accessReferral: "Yes" }, ehrDocumented: false },
      },
    },
    setKidneyCare: vi.fn(),
  } as unknown as CcmStore;
}

function renderSection(patient: {
  name: string;
  mrn: string;
  patientId?: string;
}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <LanguageProvider>
        <AuthProvider>
          <KidneyCareSection
            patient={patient}
            store={store()}
            today="2026-11-08"
            canEdit
          />
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const sendButton = () =>
  screen.findByRole("button", { name: /Send to Access Center/ });

describe("Kidney Care referral from CCM", () => {
  it("finds the patient on this office's roster by MRN and sends by patient id", async () => {
    const { calls } = api((c) => (roster(c) ? pageOf([ANN]) : undefined));
    const { container } = renderSection({ name: "Ann Test", mrn: MRN });
    const button = await sendButton();
    await waitFor(() => expect(button).toBeEnabled());
    const search = calls.find(roster)!;
    expect(search.query.get("search")).toBe(MRN);
    expect(search.query.get("status")).toBe("ACTIVE");
    expect(await axe(container)).toHaveNoViolations();

    fireEvent.click(button);
    const dialog = await screen.findByRole("dialog");
    /* One access center in the directory: it is named, not picked. */
    await within(dialog).findByText(
      /Goes straight to Metro Test Access Center/,
    );
    fireEvent.change(within(dialog).getByLabelText(/^Message/), {
      target: { value: "Please evaluate (synthetic)" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Send" }));
    await waitFor(() =>
      expect(
        calls.find(
          (c) =>
            c.method === "POST" && c.path === `/organizations/${ORG}/referrals`,
        ),
      ).toBeTruthy(),
    );
    const body = calls.find((c) => c.method === "POST")!.body as Record<
      string,
      unknown
    >;
    expect(body.patientId).toBe("pat-ann");
    expect(body).not.toHaveProperty("mrn");
  });

  it("uses a given patient id directly, without a roster search", async () => {
    const { calls } = api();
    renderSection({ name: "Ann Test", mrn: MRN, patientId: "pat-ann" });
    const button = await sendButton();
    await waitFor(() => expect(button).toBeEnabled());
    expect(calls.some(roster)).toBe(false);
  });

  it("two patients with that MRN: shown, disabled, says why (never guesses)", async () => {
    api((c) =>
      roster(c)
        ? pageOf([ANN, { ...ANN, patientId: "pat-other", firstName: "Bo" }])
        : undefined,
    );
    const { container } = renderSection({ name: "Ann Test", mrn: MRN });
    const button = await sendButton();
    await waitFor(() =>
      expect(screen.getByText(/is not available yet/)).toBeInTheDocument(),
    );
    expect(button).toBeDisabled();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("only a partial MRN match or a roster refusal: disabled with the note", async () => {
    api((c) => (roster(c) ? pageOf([{ ...ANN, mrn: `${MRN}9` }]) : undefined));
    renderSection({ name: "Ann Test", mrn: MRN });
    expect(await sendButton()).toBeDisabled();
    await screen.findByText(/is not available yet/);
    cleanup();
    api((c) =>
      roster(c) ? apiError(403, "access.permission_denied") : undefined,
    );
    renderSection({ name: "Ann Test", mrn: MRN });
    expect(await sendButton()).toBeDisabled();
  });
});
