"use client";

import React from "react";
import { CheckCircle2, FileText } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { notBuiltYet } from "@/lib/utils/notBuiltYet";

/* The two side cards: kidney-diet resources and the rotating tips. */

export function ResourceCard() {
  const { dictionary } = useLanguage();
  const n = dictionary?.nutrition;

  const defaultResources = [
    "CKD Renal Diet Guide",
    "Phosphorus & Potassium Guide",
    "Low Sodium Shopping List",
  ];

  const items = n?.resources?.items || defaultResources;

  return (
    <section className="rounded-card-nested border border-line bg-[var(--color-gray-100)] p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-heading-4 text-fg">
          {n?.resources?.title || "Resources"}
        </h2>
      </div>
      <div className="mt-3 space-y-2">
        {items.map((resource: string) => (
          <button
            key={resource}
            {...notBuiltYet("Opening a resource")}
            type="button"
            className="flex w-full cursor-pointer items-center gap-3 rounded-card border border-line bg-surface p-3 text-left transition-colors hover:border-primary-soft-line hover:bg-primary-soft"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card-nested bg-brand-100 text-fg-brand">
              <FileText className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1 text-body-sm leading-5 font-medium text-fg">
              {resource}
            </span>
            <span className="rounded bg-surface-sunken px-2 py-1 text-body-sm font-semibold text-fg-muted">
              PDF
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

export function TipsCard() {
  const { dictionary } = useLanguage();
  const n = dictionary?.nutrition;

  const defaultTips = [
    "Choose fresh foods and cook at home to control sodium.",
    "Avoid high potassium foods like bananas, oranges, and potatoes.",
    "Choose lean proteins in the right portions.",
    "Track your fluid intake every day.",
  ];

  const items = n?.dietTips?.items || defaultTips;

  return (
    <section className="rounded-card-nested border border-line bg-[var(--color-gray-100)] p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-heading-4 text-fg">
          {n?.dietTips?.title || "Diet Tips"}
        </h2>
      </div>
      <div className="mt-3 space-y-2">
        {items.map((tip: string) => (
          <div
            key={tip}
            className="flex gap-2 rounded-card border border-line bg-surface p-3"
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
            <p className="text-body-sm leading-5 font-medium text-fg-secondary">
              {tip}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
