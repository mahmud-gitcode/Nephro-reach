"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";

/* ==========================================================================
   EmptyState
   --------------------------------------------------------------------------
   A search for an empty-state pattern in the member portal returned nothing
   — there is no shared one, and most empty lists simply render as a blank
   area with no explanation.

   An empty list is a moment where the member needs the most help, not the
   least: it is usually their first visit to that screen. So the copy is
   part of the component's contract, not decoration — say what belongs here
   and give them the action that fills it.
   ========================================================================== */

export type EmptyStateProps = {
  /** Sized by the component. Keep it plain — this is not the focal point. */
  icon?: React.ReactNode;
  /** What is missing, in the member's words. "No appointments yet". */
  title: React.ReactNode;
  /** What belongs here and why. One sentence. */
  description?: React.ReactNode;
  /** The action that fills the empty state. Usually one <Button>. */
  action?: React.ReactNode;
  /** `bare` drops the dashed container — for use inside a Card or a table. */
  variant?: "bordered" | "bare";
  className?: string;
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = "bordered",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        "px-inset-lg py-inset-xl",
        variant === "bordered" &&
          "rounded-card border border-dashed border-line-strong bg-canvas",
        className,
      )}
    >
      {icon ? (
        <span
          aria-hidden="true"
          className={cn(
            "mb-stack-md flex h-12 w-12 items-center justify-center rounded-pill",
            "bg-surface text-fg-subtle shadow-sm",
            "[&_svg]:h-icon-big [&_svg]:w-icon-big",
          )}
        >
          {icon}
        </span>
      ) : null}

      <p className="text-heading-5 text-fg">{title}</p>

      {description ? (
        <p className="mt-stack-xs max-w-sm text-body-sm text-fg-muted">
          {description}
        </p>
      ) : null}

      {action ? <div className="mt-stack-lg">{action}</div> : null}
    </div>
  );
}

export default EmptyState;
