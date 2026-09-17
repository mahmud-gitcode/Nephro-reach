import React from "react";
import { cn } from "@/lib/utils/cn";

/* ==========================================================================
   SectionTitle
   --------------------------------------------------------------------------
   The head of a section card, said one way across the portal: the title at
   heading-4, no icon, and an optional 16px subtitle under it.
   ========================================================================== */

export type SectionTitleProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** For `aria-labelledby` on the section. */
  id?: string;
  /** Heading level. The visual size is the same either way. */
  as?: "h2" | "h3";
  /** Right-aligned controls: a button, a badge, a filter. */
  action?: React.ReactNode;
  className?: string;
};

export function SectionTitle({
  title,
  subtitle,
  id,
  as: Heading = "h2",
  action,
  className,
}: SectionTitleProps) {
  return (
    <div
      className={cn(
        /* 24px to whatever the section holds. */
        "mb-6 flex flex-wrap items-center justify-between gap-inline-md",
        className,
      )}
    >
      <div className="min-w-0">
        <Heading id={id} className="text-heading-4 text-fg">
          {title}
        </Heading>
        {subtitle ? (
          <p className="mt-0.5 text-body-md text-fg-muted">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export default SectionTitle;
