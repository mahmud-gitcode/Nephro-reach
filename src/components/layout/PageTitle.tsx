"use client";

import React from "react";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils/cn";
import { getNavLabel, sidebarItems, supportItems } from "./navigation";

/* ==========================================================================
   PageTitle
   --------------------------------------------------------------------------
   The heading of a main portal page — one that has its own entry in the
   sidebar. Same size and weight on every one (the Beyond the Chair
   heading), and the same words as the sidebar, so a member always sees the
   name they clicked.

   Sub-pages (a trip, an episode, a log under Personal Log) keep their own
   headings; this is only for the top of a section.
   ========================================================================== */

const NAV = [...sidebarItems, ...supportItems];

export function PageTitle({
  href,
  title,
  action,
  className,
}: {
  /** The sidebar entry this page belongs to; its label is the title. */
  href: string;
  /** Overrides the sidebar label, when a page needs different words. */
  title?: string;
  /** A primary action on the right, e.g. "Add Ride". */
  action?: React.ReactNode;
  className?: string;
}) {
  const { language } = useLanguage();
  const item = NAV.find((entry) => entry.href === href);
  const label = title ?? getNavLabel(href, item?.label ?? "", language);

  return (
    <header
      className={cn(
        "flex flex-col gap-inline-md sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <h1 className="text-heading-1 text-fg">{label}</h1>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export default PageTitle;
