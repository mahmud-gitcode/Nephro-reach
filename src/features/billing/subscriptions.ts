export type SubscriptionFeature = {
  label: string;
  included: boolean;
};

export type SubscriptionPlan = {
  id: string;
  name: string;
  price: string;
  billing: string;
  billingType: "recurring" | "one_time";
  billingPeriodLabel: string;
  accessDays?: number | null;
  trialDays?: number | null;
  trialLabel?: string;
  description: string;
  popular?: boolean;
  badge?: string;
  features: SubscriptionFeature[];
};

export const DEFAULT_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "essential",
    name: "Essential Membership",
    price: "$4.99",
    billing: "/Month",
    billingType: "recurring",
    billingPeriodLabel: "Recurring monthly",
    accessDays: null,
    trialDays: 7,
    trialLabel: "7-Day Free Trial",
    description:
      "Core NephroReach platform, education library, patient logs, tracking tools, dialysis resources.",
    popular: false,
    features: [
      { label: "7-day free trial included", included: true },
      { label: "Core NephroReach platform", included: true },
      { label: "Education library access", included: true },
      { label: "Patient logs & tracking tools", included: true },
      { label: "Dialysis resources & guides", included: true },
      { label: "Live classes & Q&A", included: false },
      { label: "21-Day Journey curriculum", included: false },
    ],
  },
  {
    id: "full",
    name: "Full Membership",
    price: "$7.99",
    billing: "/Month",
    billingType: "recurring",
    billingPeriodLabel: "Recurring monthly",
    accessDays: null,
    trialDays: 7,
    trialLabel: "7-Day Free Trial",
    description:
      "Everything in Essential + access to NephroReach live classes/Q&A and premium educational features.",
    popular: true,
    badge: "Most Popular",
    features: [
      { label: "7-day free trial included", included: true },
      { label: "Core NephroReach platform", included: true },
      { label: "Education library access", included: true },
      { label: "Patient logs & tracking tools", included: true },
      { label: "Dialysis resources & guides", included: true },
      { label: "Live classes & expert Q&A", included: true },
      { label: "Premium educational features", included: true },
    ],
  },
  {
    id: "live-class",
    name: "Live Class Only",
    price: "$10.00",
    billing: "/Class",
    billingType: "one_time",
    billingPeriodLabel: "One-time pass",
    accessDays: null,
    trialDays: 7,
    trialLabel: "7-Day Free Trial",
    description:
      "Access to one selected live NephroReach class; no monthly membership required.",
    popular: false,
    features: [
      { label: "7-day free trial included", included: true },
      { label: "Access to 1 selected live class", included: true },
      { label: "Live Q&A participation", included: true },
      { label: "No recurring subscription", included: true },
      { label: "Patient logs & tracking tools", included: false },
      { label: "Education library access", included: false },
      { label: "21-Day Journey curriculum", included: false },
    ],
  },
  {
    id: "21-day-journey",
    name: "21-Day Dialysis Journey",
    price: "$49.99",
    billing: "One-time",
    billingType: "one_time",
    billingPeriodLabel: "One-time purchase",
    accessDays: 21,
    trialDays: 7,
    trialLabel: "7-Day Free Trial",
    description:
      "Lifetime access to the complete 21-Day Dialysis Journey curriculum plus Full Membership platform access for 21 days.",
    popular: false,
    features: [
      { label: "7-day free trial included", included: true },
      { label: "Lifetime access to 21-Day curriculum", included: true },
      { label: "Full Membership platform access (21 days)", included: true },
      { label: "Complete patient logs & trackers (21 days)", included: true },
      { label: "Dialysis resources & guides (21 days)", included: true },
      { label: "Live classes & Q&A access (21 days)", included: true },
      { label: "Prompts to continue at $4.99 or $7.99", included: true },
    ],
  },
];

/* ==========================================================================
   The synchronous reader (the marketing site's pricing table)
   --------------------------------------------------------------------------
   The admin screen reads and writes plans through usePlans() (EDU-BIZ).

   This reader is for the landing page's pricing table (Pricing.tsx,
   protected UI): it reads once on mount, synchronously, and listens for
   nothing. Phase 12 (COLLAB, delegated for this one function) changed only
   its source: `GET /member-plans` (public), never localStorage.

   D14 option A, as built: the table paints DEFAULT_SUBSCRIPTION_PLANS first
   (as it always did), the first call starts one background read without
   credentials, and every later mount of the table gets the server's plans.
   Pricing.tsx has no listener, so the FIRST visit keeps the defaults until
   the table mounts again. Whether to prime the cache before mount instead
   (option B) is D14, still open.

   Prices are never computed here: `priceLabel` is the server's text.

   Nothing inside the portal should import this.
   ========================================================================== */
import { buildUrl } from "@/lib/api/client";

/** GET /member-plans (ListPublicMemberPlansResponseDto). */
export type ApiPublicMemberPlan = {
  id: string;
  code: string;
  priceCents: number;
  sortOrder: number;
  configuration: {
    structure: string;
    priceLabel: string;
    billingLabel: string;
    billingType: string;
    billingPeriodLabel: string;
    trialLabel?: string | null;
    description: string;
    popular?: boolean;
    badge?: string | null;
    features: SubscriptionFeature[];
    limits?: { accessDays?: number | null; trialDays?: number | null };
  };
};

/** A server plan in the table's shape: `code` is the id, `structure` the
 *  name, `priceLabel` the price. Sorted by the server's `sortOrder`. */
export function fromApiMemberPlans(
  rows: ApiPublicMemberPlan[],
): SubscriptionPlan[] {
  return [...rows]
    .filter((row) => row && typeof row.code === "string" && row.configuration)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(({ code, configuration: c }) => ({
      id: code,
      name: c.structure,
      price: c.priceLabel,
      billing: c.billingLabel,
      billingType: c.billingType === "one_time" ? "one_time" : "recurring",
      billingPeriodLabel: c.billingPeriodLabel,
      accessDays: c.limits?.accessDays ?? null,
      trialDays: c.limits?.trialDays ?? null,
      trialLabel: c.trialLabel ?? undefined,
      description: c.description,
      popular: Boolean(c.popular),
      badge: c.badge ?? undefined,
      features: Array.isArray(c.features) ? c.features : [],
    }));
}

let serverPlans: SubscriptionPlan[] | null = null;
let plansRequest: Promise<void> | null = null;

function loadPlans(): void {
  if (plansRequest || typeof window === "undefined") return;
  plansRequest = (async () => {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(buildUrl("/member-plans"), {
          method: "GET",
          credentials: "omit",
          headers: { Accept: "application/json" },
        });
        if (!res.ok) continue;
        const body = (await res.json()) as { data?: unknown } | null;
        const plans = Array.isArray(body?.data)
          ? fromApiMemberPlans(body.data as ApiPublicMemberPlan[])
          : [];
        if (plans.length > 0) serverPlans = plans;
        return;
      } catch {
        /* The defaults stay; nothing sensitive to log. */
      }
    }
  })();
}

export function getStoredSubscriptionPlans(): SubscriptionPlan[] {
  if (serverPlans) return serverPlans;
  loadPlans();
  return DEFAULT_SUBSCRIPTION_PLANS;
}

/** Tests only: forget the server's answer. */
export function resetSubscriptionPlansReader(): void {
  serverPlans = null;
  plansRequest = null;
}
