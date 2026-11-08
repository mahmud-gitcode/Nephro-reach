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
import {
  isRetiredKey,
  purgeLegacyStorage,
  STORAGE_VERSION,
} from "@/lib/data/legacyPurge";
import SubscriptionsPage from "@/app/(portal)/dashboard/(admin)/subscriptions/page";
import MembersPage from "@/app/(portal)/dashboard/(admin)/members/page";
import { centsToInput, formatCents, formatDay, parseDollars } from "./money";
import {
  currentPlans,
  fromApiMemberPlan,
  toMemberPlanConfiguration,
  toPlanCode,
  versionCount,
  type ApiMemberPlan,
} from "./platformPlans.mappers";

/* Phase 14 part B (EDU-BIZ): the platform consoles on the API: member and
   office plans (cents, versions, publish/retire), contracts, invoices and
   change requests, and member subscriptions (14.5–14.6). A stand-in API;
   synthetic data only. */

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

const PLATFORM_ORG = "99999999-9999-4999-8999-999999999999";
const CLINIC = "c1c1c1c1-c1c1-4c1c-8c1c-c1c1c1c1c1c1";
const HOSPITAL = "a2a2a2a2-a2a2-4a2a-8a2a-a2a2a2a2a2a2";

/** A NephroReach team member: the owner, or a role with these levels. */
function platformContext(
  permissions: Record<string, number> | "owner" = "owner",
): MeContext {
  const base = memberContext();
  return {
    ...base,
    user: { ...base.user, name: "Platform Test", email: "pa@example.test" },
    patient: null,
    platform: {
      organizationId: PLATFORM_ORG,
      organizationName: "NephroReach",
      organizationType: "PLATFORM",
      organizationStatus: "ACTIVE",
      role: permissions === "owner" ? "Owner" : "Custom",
      title: null,
      isOwner: permissions === "owner",
      permissions: permissions === "owner" ? {} : permissions,
    },
  } as MeContext;
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
  window.localStorage.clear();
});

const memberPlan = (over: Partial<ApiMemberPlan> = {}): ApiMemberPlan => ({
  id: "mp-1",
  code: "essential",
  priceCents: 499,
  active: true,
  sortOrder: 0,
  configuration: {
    structure: "Essential Membership",
    priceLabel: "$4.99",
    billingLabel: "/Month",
    billingType: "recurring",
    billingPeriodLabel: "Recurring monthly",
    trialLabel: "7-Day Free Trial",
    description: "SYNTH plan",
    popular: false,
    badge: null,
    features: [{ label: "Core platform", included: true }],
    limits: { accessDays: null, trialDays: 7 },
  },
  replacesId: null,
  replacedById: null,
  createdAt: "2026-11-01T00:00:00.000Z",
  updatedAt: "2026-11-01T00:00:00.000Z",
  ...over,
});

const orgPlan = (over: Record<string, unknown> = {}) => ({
  id: "op-1",
  code: "dialysis-center",
  name: "Dialysis Center Plan",
  audience: "DIALYSIS_CENTER",
  monthlyFeeCents: 199_500,
  active: true,
  configuration: { description: null, limits: { patientsIncluded: 150 } },
  replacesId: null,
  replacedById: null,
  createdAt: "2026-11-01T00:00:00.000Z",
  updatedAt: "2026-11-01T00:00:00.000Z",
  ...over,
});

const contract = (over: Record<string, unknown> = {}) => ({
  id: "ct-1",
  organizationId: CLINIC,
  plan: { id: "op-1", code: "dialysis-center", name: "Dialysis Center Plan" },
  contractNumber: "NR-SYNTH-1",
  status: "ACTIVE",
  startsOn: "2026-01-01",
  endsOn: "2026-12-31",
  patientsAllowed: 30,
  monthlyFeeCents: 199_500,
  billingCycle: "monthly",
  autoRenew: true,
  renewalChoice: null,
  primaryContactUserId: null,
  createdAt: "2026-11-01T00:00:00.000Z",
  updatedAt: "2026-11-01T00:00:00.000Z",
  ...over,
});

const invoice = (over: Record<string, unknown> = {}) => ({
  id: "inv-1",
  organizationId: CLINIC,
  subscriptionId: "ct-1",
  number: "NR-INV-SYNTH-1",
  periodLabel: "Oct 2026",
  issuedOn: "2026-10-01",
  dueOn: "2026-11-15",
  patientsAllowed: 30,
  monthlyFeeCents: 199_500,
  amountCents: 199_995,
  currency: "USD",
  status: "DUE",
  paidAt: null,
  hasPdf: false,
  createdAt: "2026-11-01T00:00:00.000Z",
  ...over,
});

const changeRequest = (over: Record<string, unknown> = {}) => ({
  id: "cr-1",
  organizationId: HOSPITAL,
  topic: "seats",
  detail: "SYNTH please add ten seats",
  requestedById: "u-1",
  requestedAt: "2026-11-02T10:00:00.000Z",
  resolvedAt: null,
  resolvedById: null,
  ...over,
});

const organizations = [
  {
    id: CLINIC,
    name: "Synth Dialysis",
    type: "DIALYSIS_CENTER",
    status: "ACTIVE",
    timeZone: "America/New_York",
  },
  {
    id: HOSPITAL,
    name: "Synth Hospital",
    type: "HOSPITAL",
    status: "ACTIVE",
    timeZone: "America/New_York",
  },
];

type Routes = Record<string, StubReply | ((call: StubCall) => StubReply)>;

/** A platform API: `METHOD /path` → reply. Unlisted platform reads are an
 *  empty page so a test sees only what it set up. */
function platformApi(routes: Routes, context: MeContext = platformContext()) {
  return stubApi((call) => {
    const key = `${call.method} ${call.path}`;
    const hit = routes[key];
    if (hit) return typeof hit === "function" ? hit(call) : hit;
    if (call.method === "GET" && call.path.startsWith("/platform/"))
      return pageOf([]);
    return undefined;
  }, context);
}

const platformCalls = (calls: StubCall[]) =>
  calls.filter((c) => c.path.startsWith("/platform/"));

/* ------------------------------------------------------------- money */

describe("money: cents in, cents out", () => {
  it("formats cents with the cents shown", () => {
    expect(formatCents(1995)).toBe("$19.95");
    expect(formatCents(199_500)).toBe("$1,995.00");
    expect(formatCents(0)).toBe("$0.00");
  });

  it("parses typed dollars without float error", () => {
    expect(parseDollars("4.99")).toBe(499);
    expect(parseDollars("0.29")).toBe(29); // 0.29 * 100 = 28.999… in floats
    expect(parseDollars("19.99")).toBe(1999);
    expect(parseDollars("1.1")).toBe(110);
    expect(parseDollars("$1,995.00")).toBe(199_500);
    expect(parseDollars("10")).toBe(1000);
    expect(parseDollars("1000000")).toBe(100_000_000);
  });

  it("refuses what is not an amount the API takes", () => {
    for (const bad of [
      "",
      "abc",
      "4.999",
      "-1",
      "1e3",
      "1,99",
      "1000000.01",
      "4..9",
    ])
      expect(parseDollars(bad)).toBeNull();
  });

  it("round-trips every cent value through the input text", () => {
    for (const cents of [0, 1, 29, 499, 799, 1000, 4999, 199_500, 100_000_000])
      expect(parseDollars(centsToInput(cents))).toBe(cents);
  });

  it("shows a calendar day without a time-zone shift", () => {
    expect(formatDay("2026-12-31")).toBe("Dec 31, 2026");
    expect(formatDay(null)).toBe("—");
  });
});

/* ----------------------------------------------------------- mappers */

describe("plan mappers", () => {
  it("maps a member plan: structure is the name, price from cents", () => {
    const plan = fromApiMemberPlan(memberPlan({ priceCents: 749 }));
    expect(plan.name).toBe("Essential Membership");
    expect(plan.price).toBe("$7.49");
    expect(plan.trialDays).toBe(7);
  });

  it("derives the price label from cents, never from typed text", () => {
    const config = toMemberPlanConfiguration({
      name: " Family ",
      priceCents: 1999,
      billing: "/Month",
      billingType: "recurring",
      billingPeriodLabel: "Recurring monthly",
      accessDays: null,
      trialDays: 0,
      description: "x",
      popular: false,
      badge: "",
      features: [
        { label: "  ", included: true },
        { label: "A", included: false },
      ],
    });
    expect(config.priceLabel).toBe("$19.99");
    expect(config.structure).toBe("Family");
    expect(config.trialLabel).toBeNull();
    expect(config.limits).toEqual({ accessDays: null, trialDays: 0 });
    expect(config.badge).toBeNull();
    expect(config.features).toEqual([{ label: "A", included: false }]);
  });

  it("keeps the current versions and counts the earlier ones", () => {
    const v1 = { id: "a", replacesId: null, replacedById: "b" };
    const v2 = { id: "b", replacesId: "a", replacedById: "c" };
    const v3 = { id: "c", replacesId: "b", replacedById: null };
    expect(currentPlans([v1, v2, v3]).map((p) => p.id)).toEqual(["c"]);
    expect(versionCount(v3, [v1, v2, v3])).toBe(2);
    expect(versionCount(v1, [v1, v2, v3])).toBe(0);
  });

  it("makes a plan code from a name", () => {
    expect(toPlanCode("Family Plan+ 2027")).toBe("family-plan-2027");
    expect(toPlanCode("!!!")).toBe("plan");
  });
});

/* -------------------------------------------------- subscriptions page */

describe("Subscriptions page: member plans on the API", () => {
  it("lists the server's plans, sends no office header and keeps nothing in the browser", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const { calls } = platformApi({
      "GET /platform/member-plans": {
        data: [
          memberPlan(),
          memberPlan({ id: "old", code: "full-old", replacedById: "mp-2" }),
          memberPlan({
            id: "mp-2",
            code: "full",
            replacesId: "old",
            sortOrder: 1,
            priceCents: 849,
            configuration: {
              ...memberPlan().configuration,
              structure: "Full Membership",
            },
          }),
        ],
      },
      "GET /platform/organization-plans": { data: [orgPlan()] },
    });
    const { container } = render(<SubscriptionsPage />, { wrapper });
    expect(await screen.findByText("Full Membership")).toBeInTheDocument();
    expect(screen.getByText("$8.49")).toBeInTheDocument();
    // the replaced version is not a card of its own
    expect(
      screen.getAllByRole("heading", { level: 2, name: /Membership/ }),
    ).toHaveLength(2);
    expect(screen.getByText(/Version 2/)).toBeInTheDocument();
    await screen.findByText("Dialysis Center Plan");
    for (const call of platformCalls(calls))
      expect(call.headers["x-organization-id"]).toBeUndefined();
    expect(
      setItem.mock.calls.filter(([k]) =>
        /subscription|org-sub/.test(String(k)),
      ),
    ).toEqual([]);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("an empty list is empty, never the sample plans", async () => {
    platformApi({ "GET /platform/member-plans": { data: [] } });
    render(<SubscriptionsPage />, { wrapper });
    expect(await screen.findByText("No member plans yet")).toBeInTheDocument();
    expect(screen.queryByText("$4.99")).toBeNull();
    expect(screen.queryByText("Essential Membership")).toBeNull();
  });

  it("a failed read is an error with a retry, not an empty list", async () => {
    platformApi({ "GET /platform/member-plans": apiError(500, null) });
    render(<SubscriptionsPage />, { wrapper });
    expect(
      await screen.findByText("The plans did not load"),
    ).toBeInTheDocument();
    expect(screen.queryByText("No member plans yet")).toBeNull();
    expect(
      screen.getAllByRole("button", { name: /try again/i }).length,
    ).toBeGreaterThan(0);
  });

  it("a 403 is the no-access state, with no retry", async () => {
    platformApi({
      "GET /platform/member-plans": apiError(
        403,
        "access.platform_permission_required",
      ),
      "GET /platform/organization-plans": apiError(
        403,
        "access.platform_permission_required",
      ),
    });
    render(<SubscriptionsPage />, { wrapper });
    expect(
      (await screen.findAllByText(/has not been shared with you/i)).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText("No member plans yet")).toBeNull();
  });

  it("edits a price in cents and says when the server saved a new version", async () => {
    const { calls } = platformApi({
      "GET /platform/member-plans": { data: [memberPlan()] },
      "PATCH /platform/member-plans/mp-1": {
        data: memberPlan({ id: "mp-9", replacesId: "mp-1", priceCents: 529 }),
      },
    });
    render(<SubscriptionsPage />, { wrapper });
    fireEvent.click(await screen.findByRole("button", { name: "Edit Plan" }));
    const dialog = await screen.findByRole("dialog");
    const price = within(dialog).getByLabelText(/Price/);
    expect(price).toHaveValue("4.99");
    fireEvent.change(price, { target: { value: "5.29" } });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Save Changes" }),
    );
    expect(
      await screen.findByText(/Saved as a new version/),
    ).toBeInTheDocument();
    const patch = calls.find((c) => c.method === "PATCH");
    expect(patch?.body).toMatchObject({
      priceCents: 529,
      configuration: { priceLabel: "$5.29", structure: "Essential Membership" },
    });
  });

  it("refuses a price it cannot read exactly, and sends nothing", async () => {
    const { calls } = platformApi({
      "GET /platform/member-plans": { data: [memberPlan()] },
    });
    render(<SubscriptionsPage />, { wrapper });
    fireEvent.click(await screen.findByRole("button", { name: "Edit Plan" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText(/Price/), {
      target: { value: "4.999" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Save Changes" }),
    );
    expect(
      await within(dialog).findByText(/dollars and cents/),
    ).toBeInTheDocument();
    expect(calls.some((c) => c.method === "PATCH")).toBe(false);
  });

  it("publishes and retires with MANAGE; a WRITE-only role sees no such button", async () => {
    const { calls } = platformApi({
      "GET /platform/member-plans": {
        data: [
          memberPlan(),
          memberPlan({
            id: "mp-3",
            code: "draft",
            active: false,
            configuration: {
              ...memberPlan().configuration,
              structure: "Draft Plan",
            },
          }),
        ],
      },
      "POST /platform/member-plans/mp-3/publish": {
        data: memberPlan({ id: "mp-3" }),
      },
    });
    render(<SubscriptionsPage />, { wrapper });
    fireEvent.click(
      await screen.findByRole("button", { name: "Publish Draft Plan" }),
    );
    await waitFor(() =>
      expect(
        calls.some(
          (c) => c.method === "POST" && c.path.endsWith("/mp-3/publish"),
        ),
      ).toBe(true),
    );
    expect(
      screen.getByRole("button", { name: "Retire Essential Membership" }),
    ).toBeInTheDocument();
    cleanup();

    platformApi(
      { "GET /platform/member-plans": { data: [memberPlan()] } },
      platformContext({ plans: 2 }),
    );
    render(<SubscriptionsPage />, { wrapper });
    expect(
      await screen.findByRole("button", { name: "Edit Plan" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Retire|Publish/ })).toBeNull();
  });

  it("shows a server refusal of an action, not success", async () => {
    platformApi({
      "GET /platform/member-plans": { data: [memberPlan()] },
      "POST /platform/member-plans/mp-1/retire": apiError(
        403,
        "access.platform_permission_required",
      ),
    });
    render(<SubscriptionsPage />, { wrapper });
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Retire Essential Membership",
      }),
    );
    expect(await screen.findByText(/role does not allow/)).toBeInTheDocument();
  });
});

/* -------------------------------------- office plans, contracts, invoices */

describe("Office plans, contracts, invoices and change requests", () => {
  const routes = (): Routes => ({
    "GET /platform/member-plans": { data: [] },
    "GET /platform/organization-plans": {
      data: [
        orgPlan(),
        orgPlan({
          id: "op-h",
          code: "hospital",
          name: "Hospital Plan",
          audience: "HOSPITAL",
          monthlyFeeCents: 149_550,
        }),
      ],
    },
    "GET /platform/organizations": pageOf(organizations),
    "GET /platform/contracts": pageOf([
      contract(),
      contract({
        id: "ct-2",
        organizationId: HOSPITAL,
        status: "PENDING",
        plan: { id: "op-h", code: "hospital", name: "Hospital Plan" },
      }),
    ]),
    "GET /platform/invoices": pageOf([
      invoice(),
      invoice({
        id: "inv-2",
        number: "NR-INV-SYNTH-2",
        status: "PAID",
        paidAt: "2026-09-18T15:00:00.000Z",
      }),
    ]),
    "GET /platform/contract-change-requests": pageOf([changeRequest()]),
    "POST /platform/invoices/inv-1/mark-paid": {
      data: invoice({ status: "PAID" }),
    },
    "POST /platform/contract-change-requests/cr-1/resolve": {
      data: changeRequest({ resolvedAt: "2026-11-03T00:00:00.000Z" }),
    },
    "POST /platform/contracts/ct-2/activate": {
      data: contract({ id: "ct-2", status: "ACTIVE" }),
    },
  });

  it("shows contracts by office name, fees in cents, and the MANAGE actions to the owner", async () => {
    const { calls } = platformApi(routes());
    const { container } = render(<SubscriptionsPage />, { wrapper });
    expect(await screen.findByText("NR-INV-SYNTH-1")).toBeInTheDocument();
    expect(
      (await screen.findAllByText("Synth Dialysis")).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText("$1,495.50")).toBeInTheDocument();
    expect(screen.getAllByText("$1,999.95").length).toBeGreaterThan(0);
    // the prototype's per-office status picker has no server equivalent
    expect(screen.queryByRole("combobox", { name: /Status for/ })).toBeNull();
    const pause = screen.getAllByRole("button", { name: /Pause the contract/ });
    expect(pause[0]).toBeDisabled();

    fireEvent.click(
      screen.getByRole("button", { name: "Mark NR-INV-SYNTH-1 paid" }),
    );
    expect(
      screen.queryByRole("button", { name: "Mark NR-INV-SYNTH-2 paid" }),
    ).toBeNull();
    fireEvent.click(
      await screen.findByRole("button", { name: /Resolve the Seats request/ }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: /Activate the contract for Synth Hospital/,
      }),
    );
    await waitFor(() => {
      const posts = calls.filter((c) => c.method === "POST").map((c) => c.path);
      expect(posts).toEqual(
        expect.arrayContaining([
          "/platform/invoices/inv-1/mark-paid",
          "/platform/contract-change-requests/cr-1/resolve",
          "/platform/contracts/ct-2/activate",
        ]),
      );
    });
    expect(await axe(container)).toHaveNoViolations();
  });

  it("hides mark-paid and resolve from a contracts WRITE-only role", async () => {
    platformApi(
      routes(),
      platformContext({ plans: 1, contracts: 2, organizations: 1 }),
    );
    render(<SubscriptionsPage />, { wrapper });
    expect(await screen.findByText("NR-INV-SYNTH-1")).toBeInTheDocument();
    await screen.findByText(/SYNTH please add ten seats/);
    expect(screen.queryByRole("button", { name: /Mark .* paid/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Resolve/ })).toBeNull();
    // WRITE still renews and ends
    expect(
      screen.getAllByRole("button", { name: /Renew the contract/ }).length,
    ).toBeGreaterThan(0);
  });

  it("creates an office plan with the fee in cents", async () => {
    const { calls } = platformApi({
      ...routes(),
      "POST /platform/organization-plans": {
        status: 201,
        data: orgPlan({ id: "op-new", active: false }),
      },
    });
    render(<SubscriptionsPage />, { wrapper });
    fireEvent.click(
      await screen.findByRole("button", { name: "Add Office Plan" }),
    );
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText(/Plan name/), {
      target: { value: "Synth Access Plan" },
    });
    fireEvent.change(within(dialog).getByLabelText(/^For/), {
      target: { value: "ACCESS_CENTER" },
    });
    fireEvent.change(within(dialog).getByLabelText(/Monthly fee/), {
      target: { value: "995.29" },
    });
    fireEvent.change(within(dialog).getByLabelText(/Patients included/), {
      target: { value: "120" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "Save Plan" }));
    await waitFor(() =>
      expect(
        calls.find(
          (c) =>
            c.method === "POST" && c.path === "/platform/organization-plans",
        )?.body,
      ).toEqual({
        code: "synth-access-plan",
        name: "Synth Access Plan",
        audience: "ACCESS_CENTER",
        monthlyFeeCents: 99_529,
        configuration: { limits: { patientsIncluded: 120 } },
      }),
    );
  });
});

/* -------------------------------------------------------- members page */

describe("Members page: member subscriptions on the API", () => {
  const sub = {
    patientId: "p-1",
    patient: { firstName: "Synth", lastName: "Member" },
    plan: { id: "mp-1", code: "essential", priceCents: 499, active: true },
    status: "ACTIVE",
    trialEndsAt: null,
    currentPeriodEnd: "2026-11-30T23:59:59.000Z",
    startedAt: "2026-09-01T12:00:00.000Z",
    updatedAt: "2026-09-01T12:00:00.000Z",
  };
  const overview = {
    members: 5,
    memberSubscriptionsByStatus: [
      { key: "ACTIVE", count: 3 },
      { key: "TRIALING", count: 1 },
      { key: "CANCELLED", count: 1 },
    ],
    organizations: [],
    activeContracts: 4,
    openSupportTickets: 2,
  };

  it("shows the server's counts and rows, no contact details, and changes a subscription", async () => {
    const { calls } = platformApi({
      "GET /platform/reports/overview": { data: overview },
      "GET /platform/member-subscriptions": pageOf([sub]),
      "GET /platform/member-plans": {
        data: [
          memberPlan(),
          memberPlan({
            id: "mp-2",
            code: "full",
            configuration: {
              ...memberPlan().configuration,
              structure: "Full Membership",
            },
          }),
        ],
      },
      "PUT /platform/member-subscriptions/p-1": {
        data: { ...sub, plan: { ...sub.plan, id: "mp-2", code: "full" } },
      },
    });
    const { container } = render(<MembersPage />, { wrapper });
    expect(await screen.findByText("Synth Member")).toBeInTheDocument();
    const totals = screen.getByRole("region", { name: "Member totals" });
    await within(totals).findByText("5");
    expect(within(totals).getByText("3")).toBeInTheDocument();
    expect(screen.queryByText(/@/)).toBeNull();
    expect(screen.queryByText(/MM-\d/)).toBeNull();
    expect(await axe(container)).toHaveNoViolations();

    fireEvent.click(screen.getByRole("button", { name: "View Synth Member" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("Plan"), {
      target: { value: "mp-2" },
    });
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Save Subscription" }),
    );
    await waitFor(() =>
      expect(calls.find((c) => c.method === "PUT")?.body).toEqual({
        planId: "mp-2",
        status: "ACTIVE",
      }),
    );
  });

  it("a 403 on the overview says no access, never zeros", async () => {
    platformApi({
      "GET /platform/reports/overview": apiError(
        403,
        "access.platform_permission_required",
      ),
      "GET /platform/member-subscriptions": apiError(
        403,
        "access.platform_permission_required",
      ),
    });
    render(<MembersPage />, { wrapper });
    expect((await screen.findAllByText("No access")).length).toBe(4);
    expect(screen.queryByText("0")).toBeNull();
    expect(
      await screen.findByText(/has not been shared with you/i),
    ).toBeInTheDocument();
  });
});

/* ------------------------------------------------- retired local stores */

describe("legacy plan stores are retired and cannot come back", () => {
  it("purges nr:subscription-plans and nr:org-subscriptions, and the screens show only the API", async () => {
    expect(STORAGE_VERSION).toBeGreaterThanOrEqual(15);
    expect(isRetiredKey("nr:subscription-plans")).toBe(true);
    expect(isRetiredKey("nr:org-subscriptions")).toBe(true);
    window.localStorage.setItem(
      "nr:subscription-plans",
      JSON.stringify([
        { id: "legacy", name: "LEGACY-PLAN-X", price: "$0.01", features: [] },
      ]),
    );
    window.localStorage.setItem(
      "nr:org-subscriptions",
      JSON.stringify({
        plans: [
          {
            id: "x",
            name: "LEGACY-ORG-PLAN-X",
            audience: "clinic",
            monthlyFee: 1,
            patientsIncluded: 1,
            description: "",
          },
        ],
        assignments: {},
      }),
    );
    const result = purgeLegacyStorage();
    expect(result.removed).toEqual(
      expect.arrayContaining(["nr:subscription-plans", "nr:org-subscriptions"]),
    );

    const getItem = vi.spyOn(Storage.prototype, "getItem");
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    platformApi({
      "GET /platform/member-plans": { data: [] },
      "GET /platform/organization-plans": { data: [] },
    });
    render(<SubscriptionsPage />, { wrapper });
    expect(await screen.findByText("No member plans yet")).toBeInTheDocument();
    expect(await screen.findByText(/No office plans yet/)).toBeInTheDocument();
    expect(screen.queryByText(/LEGACY-/)).toBeNull();
    expect(screen.queryByText("Dialysis Center Plan")).toBeNull();
    const touched = [...getItem.mock.calls, ...setItem.mock.calls].map(([k]) =>
      String(k),
    );
    expect(
      touched.filter((k) => /subscription-plans|org-subscriptions/.test(k)),
    ).toEqual([]);
    expect(window.localStorage.getItem("nr:subscription-plans")).toBeNull();
    expect(window.localStorage.getItem("nr:org-subscriptions")).toBeNull();
  });
});
