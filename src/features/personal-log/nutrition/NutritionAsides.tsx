"use client";

import React from "react";
import { CheckCircle2, FileText } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import Link from "next/link";
import { Skeleton } from "@/components/ui";
import { useLibrary } from "@/features/library/useLibrary";

/* The two side cards: kidney-diet resources and the rotating tips. */

/* Kidney-diet documents from the Library, which the admin uploads
   (client, 2026-10-12): each opens the PDF's page there, with a way back. */
export function ResourceCard() {
  const { dictionary, language } = useLanguage();
  const n = dictionary?.nutrition;
  const isEs = language === "ES";
  const { resources, isPending } = useLibrary();
  const items = resources
    .filter((r) => r.category === "nutrition" && r.kind === "document")
    .slice(0, 4);

  return (
    <section className="rounded-card-nested border border-line bg-[var(--color-gray-100)] p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-heading-4 text-fg">
          {n?.resources?.title || "Resources"}
        </h2>
        <Link
          href="/dashboard/my-library?category=nutrition&from=nutrition"
          className="text-body-sm font-semibold text-fg-brand hover:underline"
        >
          {n?.resources?.viewAll || "View all"}
        </Link>
      </div>
      <div className="mt-3 space-y-2">
        {isPending ? (
          <Skeleton height={64} />
        ) : items.length === 0 ? (
          <p className="text-body-sm text-fg-muted">
            {isEs
              ? "Aún no hay guías de nutrición en la biblioteca."
              : "There are no nutrition guides in the library yet."}
          </p>
        ) : (
          items.map((resource) => (
            <Link
              key={resource.id}
              href={`/dashboard/my-library/${resource.slug}?from=nutrition`}
              className="flex w-full items-center gap-3 rounded-card border border-line bg-surface p-3 text-left transition-colors hover:border-primary-soft-line hover:bg-primary-soft"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card-nested bg-brand-100 text-fg-brand">
                <FileText className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1 text-body-sm leading-5 font-medium text-fg">
                {isEs && resource.titleEs ? resource.titleEs : resource.titleEn}
              </span>
              <span className="rounded bg-surface-sunken px-2 py-1 text-body-sm font-semibold text-fg-muted">
                PDF
              </span>
            </Link>
          ))
        )}
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
