"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { NoticeRailLayout } from "@/components/layout/NoticeRailLayout";
import { Card, SearchField } from "@/components/ui";
import { PageTitle } from "@/components/layout/PageTitle";
import {
  BEFORE_THE_ER_INTRO,
  BEFORE_THE_ER_SUBTITLE,
  searchTopics,
} from "@/features/emergency/beforeTheEr.topics";
import { EmergencyInformationCard } from "@/features/emergency/BeforeTheErParts";
import { ErVisitsCard } from "@/features/emergency/ErVisitsCard";

/* ==========================================================================
   Before the ER — a retrieval-only education library
   --------------------------------------------------------------------------
   Rebuilt for the client's legal rule (2026-10-05): no symptom checker, no
   urgency levels, no advice about where to go. A search over a fixed list
   of approved topics, the emergency information apart from it, and the
   member's own ER visit log. See features/emergency/beforeTheEr.topics.ts.
   ========================================================================== */

export default function BeforeTheErPage() {
  const { language } = useLanguage();
  const isEs = language === "ES";
  const [query, setQuery] = useState("");
  const topics = searchTopics(query);
  const searching = query.trim() !== "";

  /* The emergency information sits in the right-hand column, apart from
     the search and its results (above them on a phone). */
  return (
    <NoticeRailLayout
      title={
        <div className="space-y-stack-xs">
          <PageTitle href="/dashboard/before-the-er" />
          <p className="text-body-lg text-fg-secondary">
            {isEs ? BEFORE_THE_ER_SUBTITLE.es : BEFORE_THE_ER_SUBTITLE.en}
          </p>
        </div>
      }
      notices={<EmergencyInformationCard isEs={isEs} />}
    >
      <div className="space-y-4">
        <Card as="section" padding="small">
          <p className="text-body-md text-fg-secondary">
            {isEs ? BEFORE_THE_ER_INTRO.es : BEFORE_THE_ER_INTRO.en}
          </p>
        </Card>

        <Card as="section" padding="small" className="space-y-stack-md">
          <SearchField
            label={isEs ? "Buscar temas de diálisis" : "Search dialysis topics"}
            placeholder={
              isEs ? "Buscar temas de diálisis" : "Search dialysis topics"
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <h2 className="text-heading-4 text-fg" aria-live="polite">
            {searching
              ? isEs
                ? `${topics.length} tema${topics.length === 1 ? "" : "s"} encontrado${topics.length === 1 ? "" : "s"}`
                : `${topics.length} topic${topics.length === 1 ? "" : "s"} found`
              : isEs
                ? "Temas de diálisis"
                : "Dialysis topics"}
          </h2>
          {topics.length === 0 ? (
            <p className="text-body-sm text-fg-muted">
              {isEs
                ? "Ningún tema coincide con su búsqueda. Borre la búsqueda para ver todos los temas."
                : "No topics match your search. Clear the search to see every topic."}
            </p>
          ) : (
            <ul className="divide-y divide-line-subtle">
              {topics.map((topic) => (
                <li key={topic.slug}>
                  <Link
                    href={`/dashboard/before-the-er/${topic.slug}`}
                    className="group flex items-center gap-inline-md rounded-control py-inset-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-label-lg text-fg group-hover:text-fg-brand">
                        {isEs ? topic.titleEs : topic.titleEn}
                      </span>
                      <span className="block text-body-sm text-fg-muted">
                        {topic.summaryEn}
                      </span>
                    </span>
                    <ChevronRight
                      aria-hidden="true"
                      className="size-5 shrink-0 text-fg-subtle group-hover:text-fg-brand"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <ErVisitsCard isEs={isEs} />
      </div>
    </NoticeRailLayout>
  );
}
