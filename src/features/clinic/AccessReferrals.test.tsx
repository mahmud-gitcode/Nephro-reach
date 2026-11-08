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
import { SendReferralModal, type ReferralPatient } from "./AccessReferrals";

/* Phase 10: referrals go to an office chosen by its directory id; the
   patient by id (the server derives the MRN); D11/COLLAB-3 is open, so
   the picker lists what the directory lists. Synthetic data only. */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/dashboard/nephrology/access-messages",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

const ORG = "org-neph";

function staffContext(type: string): MeContext {
  return {
    ...memberContext(),
    patient: null,
    memberships: [
      {
        organizationId: ORG,
        organizationName: "Test Office",
        organizationType: type as "NEPHROLOGY_OFFICE",
        organizationStatus: "ACTIVE",
        role: "Owner",
        title: null,
        isOwner: true,
        permissions: { "*": 3 },
      },
    ],
  };
}

const DIRECTORY = [
  {
    id: "org-metro",
    name: "Metro Test Access Center",
    type: "ACCESS_CENTER",
    address: null,
    timeZone: null,
  },
  {
    id: "org-lake",
    name: "Lakeside Test Access Center",
    type: "ACCESS_CENTER",
    address: null,
    timeZone: null,
  },
  {
    id: "org-river",
    name: "Riverside Test Dialysis",
    type: "DIALYSIS_CENTER",
    address: null,
    timeZone: null,
  },
];

const PATIENTS: ReferralPatient[] = [
  { patientId: "pat-ann", name: "Ann Test", mrn: "T-100" },
];

function api(type: string, extra?: (c: StubCall) => StubReply | undefined) {
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
  }, staffContext(type));
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

beforeEach(() => {
  window.localStorage.clear();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const posted = (calls: StubCall[]) =>
  calls.find(
    (c) => c.method === "POST" && c.path === `/organizations/${ORG}/referrals`,
  );

async function fillAndSend(dialog: HTMLElement) {
  fireEvent.change(within(dialog).getByLabelText(/^Message/), {
    target: { value: "Please evaluate (synthetic)" },
  });
  fireEvent.click(within(dialog).getByRole("button", { name: "Send" }));
}

describe("send a referral", () => {
  it("sends toOrganizationId from the directory and the patient id, never an MRN", async () => {
    const onClose = vi.fn();
    const { calls } = api("NEPHROLOGY_OFFICE");
    render(
      <SendReferralModal
        side="nephrology"
        orgId={ORG}
        patients={PATIENTS}
        initialPatientId="pat-ann"
        initialKind="New Access Referral"
        onClose={onClose}
      />,
      { wrapper },
    );
    const dialog = await screen.findByRole("dialog");
    const to = await within(dialog).findByLabelText(/^Access center/);
    /* Only access centers, as the directory lists them (D11 open). */
    await waitFor(() =>
      expect(
        within(to)
          .getAllByRole("option")
          .map((o) => o.textContent),
      ).toEqual(["Metro Test Access Center", "Lakeside Test Access Center"]),
    );
    fireEvent.change(to, { target: { value: "org-lake" } });
    expect(await axe(dialog)).toHaveNoViolations();
    await fillAndSend(dialog);
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    const body = posted(calls)!.body as Record<string, unknown>;
    expect(body).toEqual({
      toOrganizationId: "org-lake",
      kind: "New Access Referral",
      patientId: "pat-ann",
      detail: "Please evaluate (synthetic)",
    });
    expect(body).not.toHaveProperty("mrn");
    expect(JSON.stringify(body)).not.toContain("T-100");
  });

  it("404 referral_patient_not_linked says what to do, and the modal stays open", async () => {
    const onClose = vi.fn();
    api("NEPHROLOGY_OFFICE", (call) =>
      call.method === "POST"
        ? apiError(404, "vascular_access.referral_patient_not_linked")
        : undefined,
    );
    render(
      <SendReferralModal
        side="nephrology"
        orgId={ORG}
        patients={PATIENTS}
        initialPatientId="pat-ann"
        onClose={onClose}
      />,
      { wrapper },
    );
    const dialog = await screen.findByRole("dialog");
    await within(dialog).findByRole("option", {
      name: "Metro Test Access Center",
    });
    await fillAndSend(dialog);
    expect(
      await within(dialog).findByText(
        "This patient is not linked to your office.",
      ),
    ).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("the access center may start only a general message or an appointment request", async () => {
    api("ACCESS_CENTER");
    render(
      <SendReferralModal
        side="access"
        orgId={ORG}
        patients={PATIENTS}
        onClose={vi.fn()}
      />,
      { wrapper },
    );
    const dialog = await screen.findByRole("dialog");
    const type = within(dialog).getByLabelText(/^Type/);
    expect(
      within(type)
        .getAllByRole("option")
        .map((o) => o.textContent),
    ).toEqual(["General Message", "Appointment Request"]);
    /* It picks a dialysis center or nephrology office from the directory. */
    const office = await within(dialog).findByLabelText(/^Office/);
    await waitFor(() =>
      expect(
        within(office)
          .getAllByRole("option")
          .map((o) => o.textContent),
      ).toEqual(["Riverside Test Dialysis"]),
    );
  });

  it("a directory failure is shown, not an empty picker", async () => {
    api("NEPHROLOGY_OFFICE", (call) =>
      call.path === "/directory/organizations"
        ? apiError(500, null)
        : undefined,
    );
    render(
      <SendReferralModal
        side="nephrology"
        orgId={ORG}
        patients={PATIENTS}
        onClose={vi.fn()}
      />,
      { wrapper },
    );
    expect(
      await screen.findByText("The office directory could not be loaded."),
    ).toBeTruthy();
  });
});
