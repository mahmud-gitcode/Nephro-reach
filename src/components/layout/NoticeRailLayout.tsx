import React from "react";
import { cn } from "@/lib/utils/cn";

/* ==========================================================================
   NoticeRailLayout
   --------------------------------------------------------------------------
   Page content on the left, standing notices (disclaimers, privacy
   warnings) stacked in a narrow column on the right.

   The notices come first in the DOM, so on a phone — where the columns
   collapse — they are still the first thing read. On wider screens they
   move to the right column and scroll with the page — a rail taller than
   the screen cannot be pinned without hiding its bottom.
   ========================================================================== */

export function NoticeRailLayout({
  notices,
  children,
  fullWidth = false,
  className,
}: {
  /** The notices, top to bottom. Each fills the column width. */
  notices: React.ReactNode;
  children: React.ReactNode;
  /** Drop the 1240px cap and use the whole page width. */
  fullWidth?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto grid w-full grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]",
        !fullWidth && "max-w-[1240px]",
        className,
      )}
    >
      <div className="flex flex-col gap-4 lg:order-last">{notices}</div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export default NoticeRailLayout;
