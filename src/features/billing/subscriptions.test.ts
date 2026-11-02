import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_SUBSCRIPTION_PLANS,
  fromApiMemberPlans,
  getStoredSubscriptionPlans,
  resetSubscriptionPlansReader,
  type ApiPublicMemberPlan,
} from "./subscriptions";

/* The landing pricing table's reader (Phase 12, delegated to COLLAB for this
   one function). Pricing.tsx (protected UI) is unchanged: it paints the
   defaults and calls this once on mount. D14 option A: the first call starts
   one public read; later mounts get the server's plans. */

const plan = (
  code: string,
  sortOrder: number,
  over: Partial<ApiPublicMemberPlan["configuration"]> = {},
): ApiPublicMemberPlan => ({
  id: `id-${code}`,
  code,
  priceCents: 499,
  sortOrder,
  configuration: {
    structure: `${code} name`,
    priceLabel: "$4.99",
    billingLabel: "/Month",
    billingType: "recurring",
    billingPeriodLabel: "Recurring monthly",
    trialLabel: "7-Day Free Trial",
    description: "d",
    popular: false,
    badge: null,
    features: [{ label: "f", included: true }],
    limits: { accessDays: null, trialDays: 7 },
    ...over,
  },
});

const reply = (rows: unknown) =>
  new Response(JSON.stringify({ success: true, statusCode: 200, data: rows }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => resetSubscriptionPlansReader());
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe("the plan mapping", () => {
  it("takes the code as the id, the structure as the name and the label as the price", () => {
    const [first, second] = fromApiMemberPlans([
      plan("full", 1, { structure: "Full Membership", priceLabel: "$7.99" }),
      plan("essential", 0, {
        structure: "Essential Membership",
        badge: "Most Popular",
        billingType: "one_time",
        limits: { accessDays: 21, trialDays: 7 },
      }),
    ]);
    // Sorted by the server's sortOrder, not the reply's order.
    expect(first).toMatchObject({
      id: "essential",
      name: "Essential Membership",
      price: "$4.99",
      billingType: "one_time",
      badge: "Most Popular",
      accessDays: 21,
      trialDays: 7,
    });
    expect(second).toMatchObject({ id: "full", price: "$7.99" });
    expect(second.badge).toBeUndefined();
  });

  it("matches the plan ids the landing table already knows", () => {
    const ids = fromApiMemberPlans([
      plan("essential", 0),
      plan("full", 1),
      plan("live-class", 2),
      plan("21-day-journey", 3),
    ]).map((p) => p.id);
    expect(ids).toEqual(DEFAULT_SUBSCRIPTION_PLANS.map((p) => p.id));
  });
});

describe("the landing pricing reader (D14 option A)", () => {
  it("paints the defaults first, then later mounts get the server's plans", async () => {
    const fetchMock = vi.fn(async () =>
      reply([plan("essential", 0, { priceLabel: "$5.49" })]),
    );
    vi.stubGlobal("fetch", fetchMock);
    expect(getStoredSubscriptionPlans()).toBe(DEFAULT_SUBSCRIPTION_PLANS);
    await flush();
    expect(getStoredSubscriptionPlans()[0].price).toBe("$5.49");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reads the public route without credentials and never from storage", async () => {
    window.localStorage.setItem(
      "nr:subscription-plans",
      JSON.stringify([{ id: "legacy", price: "$0.01" }]),
    );
    const getItem = vi.spyOn(Storage.prototype, "getItem");
    const fetchMock = vi.fn(async () => reply([]));
    vi.stubGlobal("fetch", fetchMock);
    expect(getStoredSubscriptionPlans()).toBe(DEFAULT_SUBSCRIPTION_PLANS);
    await flush();
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(new URL(url).pathname).toMatch(/\/member-plans$/);
    expect(init.credentials).toBe("omit");
    expect(getItem).not.toHaveBeenCalled();
    // An empty reply keeps the defaults rather than an empty table.
    expect(getStoredSubscriptionPlans()).toBe(DEFAULT_SUBSCRIPTION_PLANS);
  });

  it("keeps the defaults when the API is down, and asks at most twice", async () => {
    const fetchMock = vi.fn(async () => new Response("", { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);
    getStoredSubscriptionPlans();
    await flush();
    await flush();
    expect(getStoredSubscriptionPlans()).toBe(DEFAULT_SUBSCRIPTION_PLANS);
    await flush();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
