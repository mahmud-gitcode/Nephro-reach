"use client";

import { OrganizationSubscriptions } from "@/features/billing/OrganizationSubscriptions";
import React, { useState } from "react";
import { Check, CreditCard, Plus, X, Edit3, ShieldAlert } from "lucide-react";
import {
  Alert,
  AsyncSection,
  Button,
  Card,
  EmptyState,
  FormField,
  Input,
  Modal,
  Select,
  Skeleton,
  SwitchRow,
  Textarea,
} from "@/components/ui";
import { useCanLevel } from "@/features/staff/useStaffAccounts";
import { canRetry } from "@/lib/data/asyncState";
import {
  ActionError,
  PublishedBadge,
  actionErrorText,
  readErrorCopy,
} from "@/features/billing/consoleUi";
import { centsToInput, parseDollars } from "@/features/billing/money";
import type { MemberPlanDraft } from "@/features/billing/platformPlans.mappers";
import { usePlans, type AdminMemberPlan } from "@/features/billing/usePlans";

/* ==========================================================================
   Subscription & pricing plans (Phase 14.5, on the API)
   --------------------------------------------------------------------------
   The member plans are `/platform/member-plans`: prices in cents (the label
   is derived from the cents, never parsed from text), one plan per call.
   - Edit and Add need plans WRITE; Publish and Retire need plans MANAGE.
     The UI hides what the role cannot do; the server refuses it anyway.
   - Editing the price or features of a plan members are on is saved by the
     server as a NEW version; members keep the old terms. The card says so.
   - A new plan starts unpublished; only published plans reach the landing
     page's pricing table (its own public reader, D14).
   Nothing is kept in this browser.
   ========================================================================== */

type SubscriptionPlan = AdminMemberPlan & { earlierVersions: number };

function FeatureIcon({ included }: { included: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-pill border border-line bg-surface"
    >
      {included ? (
        <Check className="h-4 w-4 text-success" />
      ) : (
        <X className="h-4 w-4 text-fg-subtle" />
      )}
    </span>
  );
}

function PricingCard({
  plan,
  onEdit,
  canEdit,
  canManage,
  statusPending,
  onStatus,
}: {
  plan: SubscriptionPlan;
  onEdit: (plan: SubscriptionPlan) => void;
  canEdit: boolean;
  canManage: boolean;
  statusPending: boolean;
  onStatus: (plan: SubscriptionPlan) => void;
}) {
  const card = (
    <article
      className={`flex h-full flex-col justify-between gap-inset-lg overflow-hidden rounded-panel border border-line p-inset-lg transition-shadow duration-300 ${
        plan.popular
          ? "bg-gradient-to-b from-surface to-primary-soft"
          : "bg-surface-sunken"
      }`}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2
            className={`text-heading-5 ${
              plan.popular ? "text-fg-brand" : "text-fg-secondary"
            }`}
          >
            {plan.name}
          </h2>
          <PublishedBadge active={plan.active} />
        </div>

        <div className="flex flex-wrap items-baseline gap-1">
          <span className="text-metric-md text-fg">{plan.price}</span>
          <span className="text-body-sm text-fg-muted">{plan.billing}</span>
        </div>

        {plan.accessDays && (
          <div className="inline-flex items-center gap-inline-sm rounded-control-small bg-primary-soft px-inset-xs py-1 text-label-sm text-primary-fg">
            Full Access: {plan.accessDays} Days
          </div>
        )}

        {plan.earlierVersions > 0 ? (
          <p className="text-caption text-fg-muted">
            Version {plan.earlierVersions + 1}: members on an earlier version
            keep its terms.
          </p>
        ) : null}

        {canEdit ? (
          <Button
            variant="neutral"
            appearance="fill"
            size="small"
            onClick={() => onEdit(plan)}
            className="w-full"
          >
            <Edit3 aria-hidden="true" />
            Edit Plan
          </Button>
        ) : null}
        {canManage ? (
          <Button
            variant="neutral"
            appearance="stroke"
            size="small"
            loading={statusPending}
            onClick={() => onStatus(plan)}
            className="w-full"
            aria-label={`${plan.active ? "Retire" : "Publish"} ${plan.name}`}
          >
            {plan.active ? "Retire Plan" : "Publish Plan"}
          </Button>
        ) : null}
      </div>

      <div className="border-t border-dashed border-line" />

      <ul className="space-y-3">
        {plan.features.map((feature, idx) => (
          <li
            key={`${feature.label}-${idx}`}
            className="flex items-start gap-2.5"
          >
            <FeatureIcon included={feature.included} />
            <span
              className={`text-caption ${
                feature.included
                  ? "text-fg-secondary"
                  : "text-fg-subtle line-through"
              }`}
            >
              {feature.label}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );

  if (!plan.popular) return card;

  return (
    // The "most popular" frame is a deliberate three-hue gradient, the one
    // decorative flourish on this page. It takes the categorical steps rather
    // than status colours, which would have read as good → bad.
    <div className="flex h-full flex-col rounded-panel bg-gradient-to-r from-cat-6 via-cat-7 to-cat-8 p-1 pt-2.5 shadow-raised">
      <p className="mb-stack-sm text-center text-overline text-fg-inverse">
        {plan.badge || "Most Popular"}
      </p>
      <div className="flex-1">{card}</div>
    </div>
  );
}

function EditPlanModal({
  plan,
  saving,
  error,
  onSave,
  onClose,
}: {
  plan: SubscriptionPlan | "new";
  saving: boolean;
  error: unknown;
  onSave: (draft: MemberPlanDraft) => void;
  onClose: () => void;
}) {
  const isNew = plan === "new";

  const [name, setName] = useState(isNew ? "" : plan.name);
  const [price, setPrice] = useState(
    isNew ? "" : centsToInput(plan.priceCents),
  );
  const [billing, setBilling] = useState(isNew ? "/Month" : plan.billing);
  const [billingType, setBillingType] = useState<"recurring" | "one_time">(
    isNew ? "recurring" : plan.billingType,
  );
  const [billingPeriodLabel, setBillingPeriodLabel] = useState(
    isNew ? "Recurring monthly" : plan.billingPeriodLabel,
  );
  const [accessDays, setAccessDays] = useState<string>(
    !isNew && plan.accessDays ? String(plan.accessDays) : "",
  );
  const [trialDays, setTrialDays] = useState<string>(
    !isNew && plan.trialDays ? String(plan.trialDays) : "",
  );
  const [description, setDescription] = useState(isNew ? "" : plan.description);
  const [popular, setPopular] = useState(isNew ? false : !!plan.popular);
  const [badge] = useState(isNew ? "" : plan.badge || "");
  const [tried, setTried] = useState(false);
  const priceCents = parseDollars(price);
  const nameError = name.trim() ? undefined : "Give the plan a name.";
  const priceError =
    priceCents === null
      ? "Enter the price in dollars and cents, e.g. 4.99."
      : undefined;
  const accessError =
    accessDays === "" ||
    (/^\d+$/.test(accessDays) &&
      Number(accessDays) >= 1 &&
      Number(accessDays) <= 3650)
      ? undefined
      : "Enter whole days from 1 to 3650, or leave it blank.";
  const trialError =
    trialDays === "" || (/^\d+$/.test(trialDays) && Number(trialDays) <= 365)
      ? undefined
      : "Enter whole days from 0 to 365, or leave it blank.";
  const [features, setFeatures] = useState<
    Array<{ label: string; included: boolean }>
  >(
    isNew
      ? [
          { label: "7-day free trial included", included: true },
          { label: "Core NephroReach platform", included: true },
          { label: "Education library access", included: true },
          { label: "Patient logs & tracking tools", included: true },
          { label: "Live classes & Q&A", included: false },
        ]
      : plan.features,
  );
  const [newFeatureText, setNewFeatureText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (nameError || priceError || accessError || trialError) return;

    onSave({
      name: name.trim(),
      priceCents: priceCents!,
      billing: billing.trim(),
      billingType,
      billingPeriodLabel: billingPeriodLabel.trim(),
      accessDays: accessDays ? Number(accessDays) : null,
      trialDays: trialDays ? Number(trialDays) : null,
      description: description.trim(),
      popular,
      badge: badge.trim() || null,
      features,
    });
  };

  const handleAddFeature = () => {
    if (!newFeatureText.trim()) return;
    setFeatures([
      ...features,
      { label: newFeatureText.trim(), included: true },
    ]);
    setNewFeatureText("");
  };

  const handleToggleFeature = (index: number) => {
    setFeatures(
      features.map((f, i) =>
        i === index ? { ...f, included: !f.included } : f,
      ),
    );
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="wide"
      title={isNew ? "Create New Subscription Plan" : `Edit Plan: ${plan.name}`}
      description="Edit pricing, billing cycle, access periods, and feature permissions dynamically."
      footer={
        <>
          <Button
            variant="neutral"
            appearance="fill-stroke"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="submit" form="subscription-plan-form" loading={saving}>
            Save Changes
          </Button>
        </>
      }
    >
      <form
        id="subscription-plan-form"
        className="space-y-stack-xl"
        onSubmit={handleSubmit}
        noValidate
      >
        {error ? (
          <Alert tone="danger" title="Your plan changes were not saved">
            {actionErrorText(error)}
          </Alert>
        ) : null}
        {!isNew && plan.active ? (
          <Alert tone="info" live={false}>
            If members are on this plan, a new price or feature list is saved as
            a new version: they keep their current terms.
          </Alert>
        ) : null}
        {/* Plan Name */}
        <FormField
          label="Plan Name"
          required
          error={tried ? nameError : undefined}
        >
          {(props) => (
            <Input
              {...props}
              type="text"
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Essential Membership"
            />
          )}
        </FormField>

        {/* Price & Billing Unit */}
        <div className="grid grid-cols-2 gap-inline-lg">
          <FormField
            label="Price ($ USD)"
            required
            error={tried ? priceError : undefined}
          >
            {(props) => (
              <div className="relative flex items-center">
                <span
                  aria-hidden="true"
                  className="absolute left-3 text-label-md text-fg-muted"
                >
                  $
                </span>
                <Input
                  {...props}
                  type="text"
                  inputMode="decimal"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="4.99"
                  className="pl-7"
                />
              </div>
            )}
          </FormField>
          <FormField label="Billing Suffix">
            {(props) => (
              <Input
                {...props}
                type="text"
                value={billing}
                maxLength={40}
                onChange={(e) => setBilling(e.target.value)}
                placeholder="e.g. /Month, /Class, or One-time"
              />
            )}
          </FormField>
        </div>

        {/* Billing Type & Access Duration */}
        <div className="grid grid-cols-2 gap-inline-lg">
          <FormField label="Billing Type">
            {(props) => (
              <Select
                {...props}
                value={billingType}
                onChange={(e) => {
                  const val = e.target.value as "recurring" | "one_time";
                  setBillingType(val);
                  if (val === "recurring")
                    setBillingPeriodLabel("Recurring monthly");
                  else setBillingPeriodLabel("One-time payment");
                }}
              >
                <option value="recurring">Recurring (Monthly)</option>
                <option value="one_time">One-time Purchase</option>
              </Select>
            )}
          </FormField>
          <FormField
            label="Access Period (Days)"
            error={tried ? accessError : undefined}
          >
            {(props) => (
              <Input
                {...props}
                type="number"
                value={accessDays}
                onChange={(e) => setAccessDays(e.target.value)}
                placeholder="e.g. 21 for 21-Day Journey"
              />
            )}
          </FormField>
        </div>

        {/* Free Trial Period */}
        <FormField
          label="Free Trial Period (Days)"
          hint="Grants free trial days before recurring payment begins (e.g. 7 days)."
          error={tried ? trialError : undefined}
        >
          {(props) => (
            <Input
              {...props}
              type="number"
              value={trialDays}
              onChange={(e) => setTrialDays(e.target.value)}
              placeholder="e.g. 7 (leave blank if no trial)"
            />
          )}
        </FormField>

        {/* Description */}
        <FormField label="Description">
          {(props) => (
            <Textarea
              {...props}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              rows={2}
              placeholder="What this plan includes..."
            />
          )}
        </FormField>

        {/* Most Popular Toggle */}
        {/* Was a bare <button> drawing a track and a knob: no role="switch",
              no aria-checked, and focus:outline-none removed the focus ring. */}
        <SwitchRow
          checked={popular}
          onChange={setPopular}
          title="Highlight as Most Popular"
          description="Applies gradient badge and emphasis on the landing page"
        />

        {/* Features Management */}
        <div>
          <p className="mb-stack-xs text-overline text-fg-muted">
            Included Features ({features.length})
          </p>
          <div className="max-h-[160px] space-y-stack-sm overflow-y-auto rounded-control border border-line bg-surface-sunken p-inset-xs">
            {features.map((feat, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-inline-md rounded-control border border-line bg-surface p-inset-xs"
              >
                {/* Was a plain button toggling a tick: role and state now
                      say so, and the name says which feature. */}
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={feat.included}
                  onClick={() => handleToggleFeature(index)}
                  className="flex flex-1 cursor-pointer items-center gap-inline-md rounded-control-small text-left text-caption focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <span
                    aria-hidden="true"
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-control-small ${
                      feat.included
                        ? "bg-success-600 text-white"
                        : "bg-line text-fg-subtle"
                    }`}
                  >
                    <Check className="h-3 w-3" />
                  </span>
                  <span
                    className={
                      feat.included
                        ? "text-fg-secondary"
                        : "text-fg-subtle line-through"
                    }
                  >
                    {feat.label}
                  </span>
                </button>
                <Button
                  variant="danger"
                  appearance="stroke"
                  size="small"
                  className="px-inset-xs"
                  onClick={() => handleRemoveFeature(index)}
                  aria-label={`Remove feature: ${feat.label}`}
                >
                  <X aria-hidden="true" />
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-stack-sm flex gap-inline-md">
            <label htmlFor="new-feature" className="sr-only">
              Add a new feature
            </label>
            <Input
              id="new-feature"
              inputSize="small"
              type="text"
              value={newFeatureText}
              maxLength={200}
              onChange={(e) => setNewFeatureText(e.target.value)}
              placeholder="Add a new feature..."
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddFeature();
                }
              }}
            />
            <Button
              variant="neutral"
              appearance="fill"
              size="small"
              onClick={handleAddFeature}
            >
              <Plus aria-hidden="true" />
              Add
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default function SubscriptionsPage() {
  const {
    plans,
    isPending,
    error,
    refetch,
    save,
    isSaving,
    saveError,
    dismissSaveError,
    outcome,
    dismissOutcome,
    setStatus,
    statusPendingId,
    statusError,
    dismissStatusError,
  } = usePlans();
  const canEdit = useCanLevel("plans", 2);
  const canManage = useCanLevel("plans", 3);

  const [editingPlan, setEditingPlan] = useState<
    SubscriptionPlan | "new" | null
  >(null);

  /* The message waits for the server: a version, an edit in place, or a
     new (unpublished) plan are three different outcomes. */
  const handleSavePlan = (draft: MemberPlanDraft) => {
    const target = editingPlan === "new" ? null : editingPlan;
    void save(target, draft)
      .then(() => setEditingPlan(null))
      .catch(() => {});
  };
  const copy = readErrorCopy(error, "The plans did not load");
  const published = plans.filter((plan) => plan.active);
  const recurring = published.filter(
    (plan) => plan.billingType === "recurring",
  ).length;
  const unknown = isPending || Boolean(error);

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-heading-4 text-fg">
            Subscription &amp; Pricing Plans
          </h1>
          <p className="mt-stack-xs measure text-caption text-fg-muted">
            Manage the member packages, prices, trial periods, and feature
            permissions. Published plans show on the landing page.
          </p>
        </div>
        {canEdit ? (
          <Button
            size="small"
            onClick={() => {
              dismissSaveError();
              setEditingPlan("new");
            }}
          >
            <Plus aria-hidden="true" />
            Add New Plan
          </Button>
        ) : null}
      </div>

      {outcome ? (
        <Alert
          tone="success"
          className="mb-stack-xl"
          onDismiss={dismissOutcome}
        >
          {outcome === "versioned"
            ? "Saved as a new version. Members already on this plan keep their current terms; new members get the new one."
            : outcome === "created"
              ? "The plan was created. It is not on the landing page until it is published."
              : "Changes saved."}
        </Alert>
      ) : null}
      <ActionError
        error={statusError}
        title="The plan status did not change"
        onDismiss={dismissStatusError}
        className="mb-stack-xl"
      />

      {/* Developer Rules & Notice Card */}
      <Alert
        tone="info"
        live={false}
        icon={<ShieldAlert />}
        title="Client Developer Rules Applied"
        className="mb-stack-2xl"
      >
        <ul className="list-disc space-y-stack-xs pl-5 text-caption">
          <li>
            <strong>21-Day Dialysis Journey ($49.99):</strong> Grants 21 days of
            Full Membership access upon start; curriculum access is lifetime.
            Auto-prompts for Essential or Full renewal after Day 21.
          </li>
          <li>
            <strong>Live Class Only ($10.00):</strong> One-time single class
            unlock without creating recurring subscriptions.
          </li>
          <li>
            <strong>Zero Hard-Coding:</strong> Every tier is edited here and
            saved on the server; the landing page shows the published ones.
          </li>
        </ul>
      </Alert>

      {/* 4 Plans Grid */}
      <AsyncSection
        pending={isPending}
        error={error}
        onRetry={canRetry(error) ? refetch : undefined}
        {...copy}
        isEmpty={plans.length === 0}
        empty={
          <EmptyState
            title="No member plans yet"
            description="Add a plan, then publish it to show it on the landing page."
          />
        }
        skeleton={
          <section className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 xl:grid-cols-4">
            <Skeleton height={420} />
            <Skeleton height={420} />
            <Skeleton height={420} />
            <Skeleton height={420} />
          </section>
        }
      >
        <section className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              canEdit={canEdit}
              canManage={canManage}
              statusPending={statusPendingId === plan.id}
              onStatus={(p) => setStatus(p.id, p.active ? "retire" : "publish")}
              onEdit={(p) => {
                dismissSaveError();
                setEditingPlan(p);
              }}
            />
          ))}
        </section>
      </AsyncSection>

      {/* Overview Analytics Bar */}
      <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          ["Active Products", unknown ? "—" : `${published.length} Published`],
          [
            "Subscription Types",
            unknown
              ? "—"
              : `${recurring} Recurring + ${published.length - recurring} One-Time`,
          ],
          ["Plan Storage", "Saved on the server"],
        ].map(([label, value]) => (
          <Card as="article" key={label} padding="none" className="p-inset-lg">
            <div
              aria-hidden="true"
              className="mb-stack-md flex h-9 w-9 items-center justify-center rounded-control bg-primary-soft text-fg-brand"
            >
              <CreditCard className="h-4 w-4" />
            </div>
            <p className="text-label-sm text-fg-muted">{label}</p>
            <p className="mt-stack-xs text-metric-sm text-fg">{value}</p>
          </Card>
        ))}
      </section>

      <OrganizationSubscriptions />

      {editingPlan && (
        <EditPlanModal
          plan={editingPlan}
          saving={isSaving}
          error={saveError}
          onSave={handleSavePlan}
          onClose={() => setEditingPlan(null)}
        />
      )}
    </>
  );
}
