import { readJson, storageKey, writeJson } from "@/lib/data/storage";
import {
  DEFAULT_SUBSCRIPTION_PLANS,
  type SubscriptionPlan,
} from "./subscriptions";

export const PLANS_KEY = storageKey("subscription-plans");

export async function listPlans(): Promise<SubscriptionPlan[]> {
  /* An empty list falls back to the defaults here, unlike the member's own
     records elsewhere: a pricing page with no plans on it is not a state
     anyone meant to create. */
  const stored = await readJson<SubscriptionPlan[] | null>(PLANS_KEY, null);
  return Array.isArray(stored) && stored.length > 0
    ? stored
    : DEFAULT_SUBSCRIPTION_PLANS;
}

export async function savePlans(
  plans: SubscriptionPlan[],
): Promise<SubscriptionPlan[]> {
  return writeJson(PLANS_KEY, plans);
}
