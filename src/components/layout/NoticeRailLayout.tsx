import React from "react";
import { cn } from "@/lib/utils/cn";

/* ==========================================================================
   NoticeRailLayout
   --------------------------------------------------------------------------
   Page content on the left, standing notices (disclaimers, privacy
   warnings) stacked in a narrow column on the right.

   The notices come first in the DOM, so on a phone — where the columns
   collapse — they are still the first thing read. On wide screens (xl)
   they move to the right column and scroll with the page — a rail taller
   than the screen cannot be pinned without hiding its bottom.

   xl, not lg: a tablet in landscape (1024–1194px) has the sidebar open, so
   a 320px rail beside the content left the page itself ~500px wide and its
   cards squeezed until text spilled out (client, 2026-10-09).
   ========================================================================== */

export function NoticeRailLayout({
  title,
  notices,
  children,
  fullWidth = false,
  railFrom = "xl",
  className,
}: {
  /** The page title. It gets a row to itself; both columns start under it. */
  title?: React.ReactNode;
  /** The notices, top to bottom. Each fills the column width. */
  notices: React.ReactNode;
  children: React.ReactNode;
  /** Drop the 1240px cap and use the whole page width. */
  fullWidth?: boolean;
  /** Where the rail moves beside the content. "lg" for a page whose rail
   *  is short and must stay in view on a tablet (Before the ER's Call 911,
   *  client 2026-10-10). */
  railFrom?: "lg" | "xl";
  className?: string;
}) {
  const grid = (
    <div
      className={cn(
        "grid w-full grid-cols-1 items-start gap-6",
        railFrom === "lg"
          ? "lg:grid-cols-[minmax(0,1fr)_300px]"
          : "xl:grid-cols-[minmax(0,1fr)_320px]",
        !title && "mx-auto",
        !title && !fullWidth && "max-w-[1240px]",
        !title && className,
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-4",
          railFrom === "lg" ? "lg:order-last" : "xl:order-last",
        )}
      >
        {notices}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );

  if (!title) return grid;

  return (
    <div
      className={cn(
        "mx-auto w-full space-y-6",
        !fullWidth && "max-w-[1240px]",
        className,
      )}
    >
      {title}
      {grid}
    </div>
  );
}

export default NoticeRailLayout;
