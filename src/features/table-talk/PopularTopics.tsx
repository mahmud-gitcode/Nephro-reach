"use client";

import React from "react";
import { ChevronRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { popularTopics } from "./tableTalk.rules";
import type { TableTalkCategory, TableTalkEpisode } from "./tableTalk.types";
import { Card } from "@/components/ui";

/* ==========================================================================
   Popular Topics
   --------------------------------------------------------------------------
   The topic list a member browses by, in place of a dropdown.

   A `<select>` hides every option until it is opened, which makes browsing
   impossible: you cannot be drawn to "Caregiver Support" if you have to
   already know to look for it. The list shows the shelf's shape at a glance,
   busiest topic first, with the episode count so a member can tell a rich
   topic from a thin one before they spend a tap on it.
   ========================================================================== */

export function PopularTopics({
  episodes,
  categories,
  selectedId,
  onSelect,
}: {
  /** The member-visible shelf, so counts match what a tap will show. */
  episodes: TableTalkEpisode[];
  categories: TableTalkCategory[];
  selectedId: string | "all";
  onSelect: (categoryId: string | "all") => void;
}) {
  const { language } = useLanguage();
  const isEs = language === "ES";

  const topics = popularTopics(episodes, categories);

  /* An empty shelf has no topics to be popular. Rendering the heading over
     nothing would read as a list that failed to load. */
  if (topics.length === 0) return null;

  return (
    <Card as="section" aria-labelledby="popular-topics">
      <div className="flex items-baseline justify-between gap-inline-md">
        <h2 id="popular-topics" className="text-heading-4 text-fg">
          {isEs ? "Temas Populares" : "Popular Topics"}
        </h2>

        {/* Only offered once a topic is narrowing the shelf, so it is never
          a control that does nothing. */}
        {selectedId !== "all" ? (
          <button
            type="button"
            onClick={() => onSelect("all")}
            className="cursor-pointer rounded-control-small text-label-sm text-fg-brand underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {isEs ? "Ver todos" : "Clear"}
          </button>
        ) : null}
      </div>

      <ul className="mt-stack-sm">
        {topics.map(({ category, count }) => {
          const selected = category.id === selectedId;
          const label = isEs ? category.labelEs : category.labelEn;

          return (
            <li key={category.id}>
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => onSelect(selected ? "all" : category.id)}
                className={`flex w-full cursor-pointer items-center justify-between gap-inline-md rounded-control-small px-inset-sm py-stack-xs text-left transition-colors duration-150 ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                  selected
                    ? "bg-primary-soft text-fg-brand"
                    : "text-fg-secondary hover:bg-surface-sunken"
                }`}
              >
                <span className="min-w-0 truncate text-body-sm">{label}</span>

                <span className="flex shrink-0 items-center gap-inline-sm">
                  <span className="text-label-sm text-fg-muted">{count}</span>
                  <ChevronRight
                    aria-hidden="true"
                    className="size-4 shrink-0 text-fg-subtle"
                  />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export default PopularTopics;
