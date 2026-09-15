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
   The synchronous reader
   --------------------------------------------------------------------------
   The admin screen reads and writes plans through usePlans(), which is async
   and goes through subscriptions.repository like every other feature.

   This stays for the marketing site's pricing table: that page is outside
   the portal, has no QueryClient above it, and is not ours to change. It
   gets a read, and nothing else.

   Nothing inside the portal should import this.
   ========================================================================== */
import { PLANS_KEY } from "./subscriptions.repository";

export function getStoredSubscriptionPlans(): SubscriptionPlan[] {
  if (typeof window === "undefined") return DEFAULT_SUBSCRIPTION_PLANS;
  try {
    const raw = window.localStorage.getItem(PLANS_KEY);
    if (!raw) return DEFAULT_SUBSCRIPTION_PLANS;
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as SubscriptionPlan[];
    }
  } catch (cause) {
    console.error("Could not read subscription plans.", cause);
  }
  return DEFAULT_SUBSCRIPTION_PLANS;
}
