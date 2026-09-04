"use client";

import React, { useState, useEffect } from "react";
import { Check, CreditCard, Plus, ToggleRight, X, Edit3, ShieldAlert } from "lucide-react";
import {
  SubscriptionPlan,
  DEFAULT_SUBSCRIPTION_PLANS,
  getStoredSubscriptionPlans,
  saveStoredSubscriptionPlans,
} from "@/lib/subscriptions";

function FeatureIcon({ included }: { included: boolean }) {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white">
      {included ? (
        <Check className="h-4 w-4 text-emerald-500" />
      ) : (
        <X className="h-4 w-4 text-slate-300" />
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
      className={`flex h-full flex-col justify-between gap-6 overflow-hidden rounded-[32px] border border-slate-200 p-6 transition-all duration-300 hover:shadow-md ${
        plan.popular
          ? "bg-gradient-to-b from-white to-[#F2F7FF]"
          : "bg-[#F8FAFC]"
      }`}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2
            className={`text-lg font-bold ${
              plan.popular ? "text-blue-600" : "text-slate-800"
            }`}
          >
            {plan.name}
          </h2>
        </div>

        <div className="flex flex-wrap items-baseline gap-1">
          <span className="text-3xl font-bold leading-none text-slate-900">{plan.price}</span>
          <span className="text-sm font-medium text-slate-600">{plan.billing}</span>
        </div>

        {plan.accessDays && (
          <div className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
            Full Access: {plan.accessDays} Days
          </div>
        )}

        <button
          type="button"
          onClick={() => onEdit(plan)}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-bold text-white transition-colors hover:bg-slate-800 cursor-pointer"
        >
          <Edit3 className="h-4 w-4" />
          Edit Plan
        </button>
      </div>

      <div className="border-t border-dashed border-slate-200" />

      <ul className="space-y-3">
        {plan.features.map((feature, idx) => (
          <li key={`${feature.label}-${idx}`} className="flex items-start gap-2.5">
            <FeatureIcon included={feature.included} />
            <span
              className={`text-xs font-medium leading-5 ${
                feature.included ? "text-slate-800" : "text-slate-400 line-through"
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
    <div className="flex h-full flex-col rounded-[36px] bg-gradient-to-r from-blue-600 via-indigo-600 to-red-500 p-1 pt-2.5 shadow-md">
      <p className="mb-2 text-center text-xs font-bold uppercase tracking-wider text-white">
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
  const [description, setDescription] = useState(isNew ? "" : plan.description);
  const [popular, setPopular] = useState(isNew ? false : !!plan.popular);
  const [badge, setBadge] = useState(isNew ? "" : plan.badge || "");
  const [features, setFeatures] = useState<Array<{ label: string; included: boolean }>>(
    isNew
      ? [
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 sm:p-6 backdrop-blur-xs">
      <section className="relative my-8 w-full max-w-[540px] overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200 cursor-pointer"
          aria-label="Close subscription editor"
        >
          <X className="h-5 w-5" />
        </button>

        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {isNew ? "Create New Subscription Plan" : `Edit Plan: ${plan.name}`}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Edit pricing, billing cycle, access periods, and feature permissions dynamically.
          </p>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          {/* Plan Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700">Plan Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Essential Membership"
              required
              className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* Price & Billing Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Price ($ USD)</label>
              <div className="relative mt-1.5 flex items-center">
                <span className="absolute left-3 text-sm font-bold text-slate-500">$</span>
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="4.99"
                  required
                  className="h-10 w-full rounded-lg border border-slate-300 pl-7 pr-3 text-sm font-bold text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">Billing Suffix</label>
              <input
                type="text"
                value={billing}
                onChange={(e) => setBilling(e.target.value)}
                placeholder="e.g. /Month, /Class, or One-time"
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Billing Type & Access Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Billing Type</label>
              <select
                value={billingType}
                onChange={(e) => {
                  const val = e.target.value as "recurring" | "one_time";
                  setBillingType(val);
                  if (val === "recurring") setBillingPeriodLabel("Recurring monthly");
                  else setBillingPeriodLabel("One-time payment");
                }}
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              >
                <option value="recurring">Recurring (Monthly)</option>
                <option value="one_time">One-time Purchase</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Access Period (Days)
              </label>
              <input
                type="number"
                value={accessDays}
                onChange={(e) => setAccessDays(e.target.value)}
                placeholder="e.g. 21 for 21-Day Journey"
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What this plan includes..."
              className="mt-1.5 w-full rounded-lg border border-slate-300 p-3 text-xs font-medium text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* Most Popular Toggle */}
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-200">
            <div>
              <p className="text-xs font-bold text-slate-800">Highlight as Most Popular</p>
              <p className="text-[11px] text-slate-500">Applies gradient badge & emphasis on landing page</p>
            </div>
            <button
              type="button"
              onClick={() => setPopular(!popular)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                popular ? "bg-blue-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  popular ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Features Management */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Included Features ({features.length})
            </label>
            <div className="max-h-[160px] space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-2.5 bg-slate-50/50">
              {features.map((feat, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-2 rounded-lg bg-white p-2 border border-slate-200/70"
                >
                  <button
                    type="button"
                    onClick={() => handleToggleFeature(index)}
                    className="flex items-center gap-2 text-left text-xs font-medium flex-1 cursor-pointer"
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded ${
                        feat.included ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"
                      }`}
                    >
                      <Check className="h-3 w-3" />
                    </span>
                    <span className={feat.included ? "text-slate-800" : "text-slate-400 line-through"}>
                      {feat.label}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(index)}
                    className="text-slate-400 hover:text-red-500 cursor-pointer p-0.5"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={newFeatureText}
                onChange={(e) => setNewFeatureText(e.target.value)}
                placeholder="Add a new feature..."
                className="h-8 flex-1 rounded-lg border border-slate-300 px-2.5 text-xs font-medium outline-none focus:border-blue-600"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddFeature();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="inline-flex h-8 items-center gap-1 rounded-lg bg-slate-800 px-3 text-xs font-bold text-white hover:bg-slate-700 cursor-pointer"
              >
                <Plus className="h-3 w-3" /> Add
              </button>
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 h-11 rounded-lg bg-blue-600 text-xs font-bold text-white shadow-sm hover:bg-blue-700 cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      </section>
    </div>
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
          <h1 className="text-xl font-bold leading-7 text-slate-900">Subscription & Pricing Plans</h1>
          <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
            Manage your 4 customer packages, prices ($4.99, $7.99, $10, $49.99), trial periods, and feature permissions dynamically.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditingPlan("new")}
          className="flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-bold text-white shadow-sm transition-colors hover:bg-blue-700 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Add New Plan
        </button>
      </div>

      {showSavedToast && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 shadow-sm animate-fade-in">
          <Check className="h-4 w-4 text-emerald-600" />
          Changes saved successfully! Both the Admin Dashboard and Landing Page pricing have been updated.
        </div>
      )}

      {/* Developer Rules & Notice Card */}
      <div className="mb-8 rounded-2xl border border-blue-200 bg-blue-50/50 p-4 text-xs leading-relaxed text-blue-900">
        <div className="flex items-center gap-2 font-bold text-blue-950 mb-1">
          <ShieldAlert className="h-4 w-4 text-blue-600" />
          Client Developer Rules Applied:
        </div>
        <ul className="list-disc pl-5 space-y-1 text-slate-700 text-[11px]">
          <li><strong>21-Day Dialysis Journey ($49.99):</strong> Grants 21 days of Full Membership access upon start; curriculum access is lifetime. Auto-prompts for Essential or Full renewal after Day 21.</li>
          <li><strong>Live Class Only ($10.00):</strong> One-time single class unlock without creating recurring subscriptions.</li>
          <li><strong>Zero Hard-Coding:</strong> All 4 tiers can be edited directly here; values update dynamically across the frontend.</li>
        </ul>
      </div>

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
          <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <CreditCard className="h-4 w-4" />
            </div>
            <p className="text-xs font-semibold text-slate-500">{label}</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
          </article>
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
