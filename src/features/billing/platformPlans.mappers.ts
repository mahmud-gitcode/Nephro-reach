/* ==========================================================================
   Platform plans: API ⇄ screen (Phase 14.5)
   --------------------------------------------------------------------------
   Member plans (`/platform/member-plans`) and organization plans
   (`/platform/organization-plans`) as the admin consoles show them.
   - `name` is the member plan's `configuration.structure`; `id` is the
     server's uuid and `code` the slug the landing page and seed use.
   - Prices are cents. The member plan's `priceLabel` is DERIVED from the
     cents ("$4.99"), never parsed back from what was typed.
   - A plan someone is subscribed to is versioned by the server when its
     terms change: the old row gets `replacedById`. The console shows the
     current versions (replacedById null) and says how many came before.
   ========================================================================== */

import { formatCents } from "./money";
import type { SubscriptionFeature } from "./subscriptions";

/** GET /platform/member-plans (MemberPlanResponseDto). */
export type ApiMemberPlan = {
  id: string;
  code: string;
  priceCents: number;
  active: boolean;
  sortOrder: number;
  configuration: {
    structure: string;
    priceLabel: string;
    billingLabel: string;
    billingType: "recurring" | "one_time";
    billingPeriodLabel: string;
    trialLabel: string | null;
    description: string;
    popular: boolean;
    badge: string | null;
    features: SubscriptionFeature[];
    limits: { accessDays: number | null; trialDays: number | null };
  };
  replacesId: string | null;
  replacedById: string | null;
  createdAt: string;
  updatedAt: string;
};

/** A member plan on the admin screen. */
export type AdminMemberPlan = {
  id: string;
  code: string;
  name: string;
  priceCents: number;
  /** "$4.99": always the cents formatted, for display. */
  price: string;
  billing: string;
  billingType: "recurring" | "one_time";
  billingPeriodLabel: string;
  accessDays: number | null;
  trialDays: number | null;
  trialLabel: string | null;
  description: string;
  popular: boolean;
  badge: string | null;
  features: SubscriptionFeature[];
  sortOrder: number;
  /** Published: offered on the landing page and to new members. */
  active: boolean;
  replacesId: string | null;
  replacedById: string | null;
};

export function fromApiMemberPlan(row: ApiMemberPlan): AdminMemberPlan {
  const c = row.configuration;
  return {
    id: row.id,
    code: row.code,
    name: c.structure,
    priceCents: row.priceCents,
    price: formatCents(row.priceCents),
    billing: c.billingLabel,
    billingType: c.billingType === "one_time" ? "one_time" : "recurring",
    billingPeriodLabel: c.billingPeriodLabel,
    accessDays: c.limits?.accessDays ?? null,
    trialDays: c.limits?.trialDays ?? null,
    trialLabel: c.trialLabel ?? null,
    description: c.description,
    popular: Boolean(c.popular),
    badge: c.badge ?? null,
    features: Array.isArray(c.features) ? c.features : [],
    sortOrder: row.sortOrder,
    active: row.active,
    replacesId: row.replacesId,
    replacedById: row.replacedById,
  };
}

/** The current versions, in the server's order. */
export function currentPlans<T extends { replacedById: string | null }>(
  plans: T[],
  order: (a: T, b: T) => number = () => 0,
): T[] {
  return plans.filter((p) => p.replacedById === null).sort(order);
}

/** How many earlier versions stand behind a plan (follows replacesId). */
export function versionCount(
  plan: { id: string; replacesId: string | null },
  all: { id: string; replacesId: string | null }[],
): number {
  const byId = new Map(all.map((p) => [p.id, p]));
  let count = 0;
  let cursor = plan.replacesId;
  const seen = new Set<string>([plan.id]);
  while (cursor && !seen.has(cursor)) {
    seen.add(cursor);
    count += 1;
    cursor = byId.get(cursor)?.replacesId ?? null;
  }
  return count;
}

/** What the plan editor collects. */
export type MemberPlanDraft = {
  name: string;
  priceCents: number;
  billing: string;
  billingType: "recurring" | "one_time";
  billingPeriodLabel: string;
  accessDays: number | null;
  trialDays: number | null;
  description: string;
  popular: boolean;
  badge: string | null;
  features: SubscriptionFeature[];
};

export type MemberPlanConfigurationBody = ApiMemberPlan["configuration"];

/** The configuration the API stores, built from the editor's fields. */
export function toMemberPlanConfiguration(
  draft: MemberPlanDraft,
): MemberPlanConfigurationBody {
  return {
    structure: draft.name.trim(),
    priceLabel: formatCents(draft.priceCents),
    billingLabel: draft.billing.trim(),
    billingType: draft.billingType,
    billingPeriodLabel: draft.billingPeriodLabel.trim(),
    trialLabel:
      draft.trialDays && draft.trialDays > 0
        ? `${draft.trialDays}-Day Free Trial`
        : null,
    description: draft.description.trim(),
    popular: draft.popular,
    badge: draft.badge?.trim() ? draft.badge.trim() : null,
    features: draft.features
      .map((f) => ({ label: f.label.trim(), included: f.included }))
      .filter((f) => f.label.length > 0),
    limits: {
      accessDays:
        draft.accessDays && draft.accessDays > 0 ? draft.accessDays : null,
      trialDays:
        draft.trialDays !== null && draft.trialDays >= 0
          ? draft.trialDays
          : null,
    },
  };
}

/** A plan code (≤60) from a name: "Family Plan+" → "family-plan". */
export function toPlanCode(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "plan"
  );
}

/* ---------------------------------------------- organization plans */

export type OrgAudience =
  | "DIALYSIS_CENTER"
  | "ACCESS_CENTER"
  | "NEPHROLOGY_OFFICE"
  | "HOSPITAL"
  | "TRANSPLANT_CENTER";

/** The four office types an office plan is sold to (TRANSPLANT_CENTER has
 *  no portal yet, so the editor does not offer it). */
export const ORG_AUDIENCES: readonly OrgAudience[] = [
  "DIALYSIS_CENTER",
  "ACCESS_CENTER",
  "NEPHROLOGY_OFFICE",
  "HOSPITAL",
];

export const AUDIENCE_LABEL: Record<string, string> = {
  DIALYSIS_CENTER: "Dialysis Center",
  ACCESS_CENTER: "Vascular Access Center",
  NEPHROLOGY_OFFICE: "Nephrology Office",
  HOSPITAL: "Hospital",
  TRANSPLANT_CENTER: "Transplant Center",
  PLATFORM: "NephroReach",
};

export const AUDIENCE_LABEL_ES: Record<string, string> = {
  DIALYSIS_CENTER: "Centro de diálisis",
  ACCESS_CENTER: "Centro de acceso vascular",
  NEPHROLOGY_OFFICE: "Consultorio de nefrología",
  HOSPITAL: "Hospital",
  TRANSPLANT_CENTER: "Centro de trasplantes",
  PLATFORM: "NephroReach",
};

/** The office type's name in the reader's language (the code if unknown). */
export function audienceLabelFor(code: string, isEs: boolean): string {
  return (isEs ? AUDIENCE_LABEL_ES : AUDIENCE_LABEL)[code] ?? code;
}

/** GET /platform/organization-plans (OrganizationPlanResponseDto). */
export type ApiOrgPlan = {
  id: string;
  code: string;
  name: string;
  audience: OrgAudience | "PLATFORM";
  monthlyFeeCents: number;
  active: boolean;
  configuration: {
    description: string | null;
    limits: { patientsIncluded: number };
  };
  replacesId: string | null;
  replacedById: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminOrgPlan = {
  id: string;
  code: string;
  name: string;
  audience: string;
  audienceLabel: string;
  monthlyFeeCents: number;
  patientsIncluded: number;
  description: string;
  active: boolean;
  replacesId: string | null;
  replacedById: string | null;
};

export function fromApiOrgPlan(row: ApiOrgPlan): AdminOrgPlan {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    audience: row.audience,
    audienceLabel: AUDIENCE_LABEL[row.audience] ?? row.audience,
    monthlyFeeCents: row.monthlyFeeCents,
    patientsIncluded: row.configuration?.limits?.patientsIncluded ?? 0,
    description: row.configuration?.description ?? "",
    active: row.active,
    replacesId: row.replacesId,
    replacedById: row.replacedById,
  };
}

export type OrgPlanDraft = {
  name: string;
  audience: OrgAudience;
  monthlyFeeCents: number;
  patientsIncluded: number;
  description: string;
};

/** The body of POST (with a code) or PATCH /platform/organization-plans. */
export function toOrgPlanBody(draft: OrgPlanDraft) {
  const description = draft.description.trim();
  return {
    name: draft.name.trim(),
    audience: draft.audience,
    monthlyFeeCents: draft.monthlyFeeCents,
    configuration: {
      ...(description ? { description: description.slice(0, 500) } : {}),
      limits: { patientsIncluded: draft.patientsIncluded },
    },
  };
}
