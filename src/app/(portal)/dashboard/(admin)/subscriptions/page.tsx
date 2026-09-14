"use client";

import React, { useState, useEffect } from "react";
import { Check, CreditCard, Plus, X, Edit3, ShieldAlert } from "lucide-react";
import {
  Alert,
  Button,
  Card,
  FormField,
  Input,
  Modal,
  Select,
  SwitchRow,
  Textarea,
} from "@/components/ui";
import {
  SubscriptionPlan,
  DEFAULT_SUBSCRIPTION_PLANS,
  getStoredSubscriptionPlans,
  saveStoredSubscriptionPlans,
} from "@/features/billing/subscriptions";

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
}: {
  plan: SubscriptionPlan;
  onEdit: (plan: SubscriptionPlan) => void;
}) {
  const card = (
    <article
      className={`flex h-full flex-col justify-between gap-inset-lg overflow-hidden rounded-panel border border-line p-inset-lg transition-shadow duration-300 hover:shadow-raised ${
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
      </div>

      <div className="border-t border-dashed border-line" />

      <ul className="space-y-3">
        {plan.features.map((feature, idx) => (
          <li key={`${feature.label}-${idx}`} className="flex items-start gap-2.5">
            <FeatureIcon included={feature.included} />
            <span
              className={`text-caption ${
                feature.included ? "text-fg-secondary" : "text-fg-subtle line-through"
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
      <p className="text-overline mb-stack-sm text-center text-fg-inverse">
        {plan.badge || "Most Popular"}
      </p>
      <div className="flex-1">{card}</div>
    </div>
  );
}

function EditPlanModal({
  plan,
  onSave,
  onClose,
}: {
  plan: SubscriptionPlan | "new";
  onSave: (updatedPlan: SubscriptionPlan) => void;
  onClose: () => void;
}) {
  const isNew = plan === "new";

  const [name, setName] = useState(isNew ? "" : plan.name);
  const [price, setPrice] = useState(isNew ? "" : plan.price.replace("$", ""));
  const [billing, setBilling] = useState(isNew ? "/Month" : plan.billing);
  const [billingType, setBillingType] = useState<"recurring" | "one_time">(
    isNew ? "recurring" : plan.billingType
  );
  const [billingPeriodLabel, setBillingPeriodLabel] = useState(
    isNew ? "Recurring monthly" : plan.billingPeriodLabel
  );
  const [accessDays, setAccessDays] = useState<string>(
    !isNew && plan.accessDays ? String(plan.accessDays) : ""
  );
  const [trialDays, setTrialDays] = useState<string>(
    !isNew && plan.trialDays ? String(plan.trialDays) : ""
  );
  const [description, setDescription] = useState(isNew ? "" : plan.description);
  const [popular, setPopular] = useState(isNew ? false : !!plan.popular);
  const [badge, setBadge] = useState(isNew ? "" : plan.badge || "");
  const [features, setFeatures] = useState<Array<{ label: string; included: boolean }>>(
    isNew
      ? [
          { label: "7-day free trial included", included: true },
          { label: "Core NephroReach platform", included: true },
          { label: "Education library access", included: true },
          { label: "Patient logs & tracking tools", included: true },
          { label: "Live classes & Q&A", included: false },
        ]
      : plan.features
  );
  const [newFeatureText, setNewFeatureText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price.trim()) return;

    const formattedPlan: SubscriptionPlan = {
      id: isNew ? `plan-${Date.now()}` : plan.id,
      name: name.trim(),
      price: price.startsWith("$") ? price.trim() : `$${price.trim()}`,
      billing: billing.trim(),
      billingType,
      billingPeriodLabel: billingPeriodLabel.trim(),
      accessDays: accessDays ? parseInt(accessDays, 10) || null : null,
      trialDays: trialDays ? parseInt(trialDays, 10) || null : null,
      trialLabel: trialDays ? `${trialDays}-Day Free Trial` : undefined,
      description: description.trim(),
      popular,
      badge: badge.trim() || undefined,
      features,
    };

    onSave(formattedPlan);
  };

  const handleAddFeature = () => {
    if (!newFeatureText.trim()) return;
    setFeatures([...features, { label: newFeatureText.trim(), included: true }]);
    setNewFeatureText("");
  };

  const handleToggleFeature = (index: number) => {
    setFeatures(
      features.map((f, i) => (i === index ? { ...f, included: !f.included } : f))
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
          <Button variant="neutral" appearance="fill-stroke" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="subscription-plan-form">
            Save Changes
          </Button>
        </>
      }
    >
        <form
          id="subscription-plan-form"
          className="space-y-stack-xl"
          onSubmit={handleSubmit}
        >
          {/* Plan Name */}
          <FormField label="Plan Name" required>
            {(props) => (
              <Input
                {...props}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Essential Membership"
              />
            )}
          </FormField>

          {/* Price & Billing Unit */}
          <div className="grid grid-cols-2 gap-inline-lg">
            <FormField label="Price ($ USD)" required>
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
                    if (val === "recurring") setBillingPeriodLabel("Recurring monthly");
                    else setBillingPeriodLabel("One-time payment");
                  }}
                >
                  <option value="recurring">Recurring (Monthly)</option>
                  <option value="one_time">One-time Purchase</option>
                </Select>
              )}
            </FormField>
            <FormField label="Access Period (Days)">
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
            <p className="text-overline mb-stack-xs text-fg-muted">
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
  const [plans, setPlans] = useState<SubscriptionPlan[]>(DEFAULT_SUBSCRIPTION_PLANS);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | "new" | null>(null);
  const [showSavedToast, setShowSavedToast] = useState(false);

  useEffect(() => {
    setPlans(getStoredSubscriptionPlans());
  }, []);

  const handleSavePlan = (updatedPlan: SubscriptionPlan) => {
    let newPlans: SubscriptionPlan[];
    const exists = plans.some((p) => p.id === updatedPlan.id);

    if (exists) {
      newPlans = plans.map((p) => (p.id === updatedPlan.id ? updatedPlan : p));
    } else {
      newPlans = [...plans, updatedPlan];
    }

    setPlans(newPlans);
    saveStoredSubscriptionPlans(newPlans);
    setEditingPlan(null);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-heading-4 text-fg">Subscription &amp; Pricing Plans</h1>
          <p className="mt-stack-xs measure text-caption text-fg-muted">
            Manage your 4 customer packages, prices ($4.99, $7.99, $10, $49.99), trial periods, and feature permissions dynamically.
          </p>
        </div>
        <Button size="small" onClick={() => setEditingPlan("new")}>
          <Plus aria-hidden="true" />
          Add New Plan
        </Button>
      </div>

      {showSavedToast && (
        <Alert tone="success" className="mb-stack-xl">
          Changes saved successfully. Both the Admin Dashboard and the Landing
          Page pricing have been updated.
        </Alert>
      )}

      {/* Developer Rules & Notice Card */}
      <Alert
        tone="info"
        live={false}
        icon={<ShieldAlert />}
        title="Client Developer Rules Applied"
        className="mb-stack-2xl"
      >
        <ul className="list-disc space-y-stack-xs pl-5 text-caption">
          <li><strong>21-Day Dialysis Journey ($49.99):</strong> Grants 21 days of Full Membership access upon start; curriculum access is lifetime. Auto-prompts for Essential or Full renewal after Day 21.</li>
          <li><strong>Live Class Only ($10.00):</strong> One-time single class unlock without creating recurring subscriptions.</li>
          <li><strong>Zero Hard-Coding:</strong> All 4 tiers can be edited directly here; values update dynamically across the frontend.</li>
        </ul>
      </Alert>

      {/* 4 Plans Grid */}
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4 items-stretch">
        {plans.map((plan) => (
          <PricingCard key={plan.id || plan.name} plan={plan} onEdit={setEditingPlan} />
        ))}
      </section>

      {/* Overview Analytics Bar */}
      <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          ["Active Products", `${plans.length} Tiers`],
          ["Subscription Types", "2 Recurring + 2 One-Time"],
          ["Dynamic Storage", "Admin Synced"],
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

      {editingPlan && (
        <EditPlanModal
          plan={editingPlan}
          onSave={handleSavePlan}
          onClose={() => setEditingPlan(null)}
        />
      )}
    </>
  );
}
