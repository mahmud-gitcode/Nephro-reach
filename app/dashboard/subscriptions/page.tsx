"use client";

import React, { useState } from "react";
import { Check, CreditCard, Plus, ToggleRight, X } from "lucide-react";

type Plan = {
  name: string;
  price: string;
  description: string;
  popular?: boolean;
  features: Array<{ label: string; included: boolean }>;
};

const plans: Plan[] = [
  {
    name: "Class Purchase",
    price: "$10",
    description: "Complete access to all platform features",
    features: [
      { label: "Digital Journal", included: false },
      { label: "4-week educational curriculum", included: false },
      { label: "Monthly live classes", included: true },
      { label: "Weekly SMS check-ins", included: false },
      { label: "Community support", included: false },
    ],
  },
  {
    name: "Full Membership",
    price: "$10",
    description: "Complete access to all platform features",
    popular: true,
    features: [
      { label: "Digital Journal", included: true },
      { label: "4-week educational curriculum", included: true },
      { label: "Monthly live classes", included: true },
      { label: "Weekly SMS check-ins", included: true },
      { label: "Community support", included: true },
    ],
  },
  {
    name: "Journal Only",
    price: "$5",
    description: "Complete access to all platform features",
    features: [
      { label: "Digital Journal", included: true },
      { label: "4-week educational curriculum", included: false },
      { label: "Monthly live classes", included: false },
      { label: "Weekly SMS check-ins", included: false },
      { label: "Community support", included: false },
    ],
  },
];

const editableFeatures = [
  "2 Days On Site Consulting",
  "2-Session Zoom Meetings",
  "10-Hours in Person Training",
  "10-Hours in Person Training",
  "10-Hours in Person Training",
];

function FeatureIcon({ included }: { included: boolean }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white">
      {included ? (
        <Check className="h-5 w-5 text-emerald-500" />
      ) : (
        <X className="h-5 w-5 text-red-400" />
      )}
    </span>
  );
}

function PricingCard({
  plan,
  onEdit,
}: {
  plan: Plan;
  onEdit: (plan: Plan) => void;
}) {
  const card = (
    <article
      className={`flex h-full min-h-[552px] flex-col gap-6 overflow-hidden border border-slate-200 p-7 ${
        plan.popular
          ? "rounded-[46px] bg-gradient-to-b from-white to-[#F2F7FF]"
          : "rounded-[50px] bg-[#F1F5FA]"
      }`}
    >
      <div className="space-y-4">
        <h2
          className={`text-xl font-semibold leading-7 ${
            plan.popular ? "text-blue-600" : "text-slate-700"
          }`}
        >
          {plan.name}
        </h2>
        <div className="flex flex-wrap items-baseline gap-1">
          <span className="text-4xl font-bold leading-[52px] text-slate-900">{plan.price}</span>
          <span className="text-lg font-medium leading-7 text-slate-700">/Month</span>
        </div>
        <p className="text-base font-medium leading-6 text-slate-700">{plan.description}</p>
        <button
          type="button"
          onClick={() => onEdit(plan)}
          className="flex h-11 w-full items-center justify-center rounded bg-slate-900 px-4 text-base font-bold text-white transition-colors hover:bg-slate-800"
        >
          Edit
        </button>
      </div>

      <div className="border-t border-dashed border-slate-200" />

      <ul className="space-y-5">
        {plan.features.map((feature) => (
          <li key={feature.label} className="flex items-center gap-3">
            <FeatureIcon included={feature.included} />
            <span className="text-lg font-medium leading-7 text-slate-900">{feature.label}</span>
          </li>
        ))}
      </ul>
    </article>
  );

  if (!plan.popular) return card;

  return (
    <div className="rounded-[54px] bg-[conic-gradient(from_90deg,rgba(0,0,0,0.5),rgba(253,155,43,0.5),rgba(75,224,21,0.5),rgb(106,200,203),rgba(0,0,0,0.5))] p-1 pt-3 shadow">
      <p className="mb-2 text-center text-lg font-semibold leading-7 text-white">Most Popular</p>
      {card}
    </div>
  );
}

function ToggleSwitch() {
  return (
    <span className="flex h-5 w-8 items-center justify-end rounded-full bg-blue-600 p-0.5">
      <span className="h-4 w-4 rounded-full bg-white" />
    </span>
  );
}

function EditPlanModal({
  plan,
  onClose,
}: {
  plan: Plan | "new";
  onClose: () => void;
}) {
  const isNew = plan === "new";
  const name = isNew ? "Class Purchase" : plan.name;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-slate-950/70 px-4 py-8">
      <section className="relative w-full max-w-[450px] overflow-hidden rounded-[50px] border border-slate-200 bg-[#F8FAFC] p-7 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-6 top-6 flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm hover:bg-slate-100"
          aria-label="Close subscription editor"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="pr-10">
          <h2 className="text-2xl font-medium leading-8 text-slate-900">{name}</h2>
          <p className="mt-1 text-base font-medium leading-6 text-slate-700">
            Add the pricing and details added to the package.
          </p>
        </div>

        <form className="mt-6 space-y-6" onSubmit={(event) => event.preventDefault()}>
          <label className="flex items-center gap-1">
            <span className="text-5xl font-normal leading-none text-slate-900">$</span>
            <input
              defaultValue={isNew ? "" : plan.price.replace("$", "")}
              placeholder="00.00"
              className="w-full bg-transparent text-5xl font-normal leading-none text-slate-500 outline-none placeholder:text-slate-500"
            />
          </label>

          <div className="space-y-3">
            <h3 className="text-lg font-medium leading-7 text-[#171717]">Description</h3>
            <div className="flex h-[130px] flex-col justify-between rounded-[22px] border border-slate-200 bg-[#F1F5FA] p-4">
              <textarea
                defaultValue={isNew ? "" : plan.description}
                placeholder="Add description here"
                maxLength={80}
                className="h-16 resize-none bg-transparent text-base font-medium leading-6 text-slate-700 outline-none placeholder:text-slate-700"
              />
              <div className="flex justify-end">
                <span className="rounded-full border border-slate-200 px-3 py-1 text-sm font-medium leading-5 text-slate-700">
                  80 Characters
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-dashed border-slate-200" />

          <div className="space-y-3">
            <h3 className="text-lg font-semibold leading-7 text-[#171717]">Included</h3>
            <div className="space-y-2">
              {editableFeatures.map((feature, index) => (
                <input
                  key={`${feature}-${index}`}
                  defaultValue={feature}
                  className="h-9 w-full rounded-xl bg-white px-3 text-base font-medium leading-6 text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
                />
              ))}
            </div>
          </div>

          <div className="rounded-[20px] bg-[#F1F5FA] p-3.5">
            <div className="mb-3 flex h-[50px] items-center gap-3 rounded-xl bg-white p-3">
              <span className="flex-1 text-lg font-medium leading-7 text-[#171717]">Most Popular</span>
              <ToggleSwitch />
            </div>
            <button
              type="submit"
              className="flex h-12 w-full items-center justify-center rounded bg-blue-600 text-base font-bold text-white shadow-[inset_0_-1px_0_#DBE9FE] transition-colors hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function SubscriptionsPage() {
  const [editingPlan, setEditingPlan] = useState<Plan | "new" | null>(null);

  return (
    <>
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-lg font-medium leading-7 text-[#0F1912]">Subscription Plans</h1>
          <p className="mt-2 text-base font-medium leading-6 text-[#7A7A7A]">
            Manage pricing tiers, features, and availability.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditingPlan("new")}
          className="flex h-11 items-center justify-center gap-2 rounded bg-blue-600 px-4 text-base font-bold text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          New Subscription
        </button>
      </div>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3 xl:items-center">
        {plans.map((plan) => (
          <PricingCard key={plan.name} plan={plan} onEdit={setEditingPlan} />
        ))}
      </section>

      <section className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          ["Active Plans", "03"],
          ["Paid Members", "147"],
          ["Monthly Revenue", "$1,275"],
        ].map(([label, value]) => (
          <article key={label} className="rounded-[14px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[10px] bg-blue-100 text-blue-600">
              {label === "Active Plans" ? (
                <ToggleRight className="h-5 w-5" />
              ) : (
                <CreditCard className="h-5 w-5" />
              )}
            </div>
            <p className="text-sm font-semibold text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold leading-8 text-slate-900">{value}</p>
          </article>
        ))}
      </section>

      {editingPlan && <EditPlanModal plan={editingPlan} onClose={() => setEditingPlan(null)} />}
    </>
  );
}
