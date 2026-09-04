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
    description:
      "Core NephroReach platform, education library, patient logs, tracking tools, dialysis resources.",
    popular: false,
    features: [
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
    description:
      "Everything in Essential + access to NephroReach live classes/Q&A and premium educational features.",
    popular: true,
    badge: "Most Popular",
    features: [
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
    description:
      "Access to one selected live NephroReach class; no monthly membership required.",
    popular: false,
    features: [
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
    description:
      "Lifetime access to the complete 21-Day Dialysis Journey curriculum plus Full Membership platform access for 21 days.",
    popular: false,
    features: [
      { label: "Lifetime access to 21-Day curriculum", included: true },
      { label: "Full Membership platform access (21 days)", included: true },
      { label: "Complete patient logs & trackers (21 days)", included: true },
      { label: "Dialysis resources & guides (21 days)", included: true },
      { label: "Live classes & Q&A access (21 days)", included: true },
      { label: "Prompts to continue at $4.99 or $7.99", included: true },
    ],
  },
];

const STORAGE_KEY = "nephroreach_subscription_plans_v2";

export function getStoredSubscriptionPlans(): SubscriptionPlan[] {
  if (typeof window === "undefined") return DEFAULT_SUBSCRIPTION_PLANS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SUBSCRIPTION_PLANS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // Fallback on error
  }
  return DEFAULT_SUBSCRIPTION_PLANS;
}

export function saveStoredSubscriptionPlans(plans: SubscriptionPlan[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  } catch {
    // Ignore storage write error
  }
}
