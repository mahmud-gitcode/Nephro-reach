"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";

/* ==========================================================================
   Badge
   --------------------------------------------------------------------------
   Status pills. Today the same meaning gets a different colour depending on
   the page — rose / emerald / amber / purple / slate are all in use for
   overlapping states.

   Two rules this component enforces:

   1. Colour is never the only signal. `icon` sits beside the label, because
      roughly 8% of men have some colour vision deficiency, and among
      diabetic patients — a large share of a dialysis population — acquired
      colour discrimination loss is common on top of that.

   2. Text colour comes from the -700 step of each ramp, which clears 4.5:1
      on its own -50 surface. The bright -500 steps are fills only and may
      never carry a word.
   ========================================================================== */

export type BadgeTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "accent";

export type BadgeVariant = "soft" | "solid" | "outline";

const tones: Record<BadgeTone, Record<BadgeVariant, string>> = {
  neutral: {
    soft: "bg-surface-sunken border-line text-fg-secondary",
    solid: "bg-neutral-solid border-transparent text-neutral-on-solid",
    outline: "bg-transparent border-line-strong text-fg-secondary",
  },
  info: {
    soft: "bg-info-surface border-info-line text-info",
    solid: "bg-primary-solid border-transparent text-primary-on-solid",
    outline: "bg-transparent border-primary-edge text-primary-edge",
  },
  success: {
    soft: "bg-success-surface border-success-line text-success",
    solid: "bg-success-600 border-transparent text-white",
    outline: "bg-transparent border-success-600 text-success",
  },
  warning: {
    soft: "bg-warning-surface border-warning-line text-warning",
    solid: "bg-warning-600 border-transparent text-white",
    outline: "bg-transparent border-warning-600 text-warning",
  },
  danger: {
    soft: "bg-danger-surface border-danger-line text-danger",
    solid: "bg-danger-solid border-transparent text-danger-on-solid",
    outline: "bg-transparent border-danger-edge text-danger-edge",
  },
  accent: {
    soft: "bg-accent-soft border-accent-soft-line text-accent-fg",
    solid: "bg-accent-solid border-transparent text-accent-on-solid",
    outline: "bg-transparent border-accent-edge text-accent-edge",
  },
};

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  variant?: BadgeVariant;
  /** Shown before the label. Sized by the component. */
  icon?: React.ReactNode;
};

export function Badge({
  tone = "neutral",
  variant = "soft",
  icon,
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center gap-inline-xs rounded-pill border",
        "px-inset-xs py-0.5 text-label-sm whitespace-nowrap",
        "[&_svg]:h-3.5 [&_svg]:w-3.5 [&_svg]:shrink-0",
        tones[tone][variant],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </span>
  );
}

export default Badge;
