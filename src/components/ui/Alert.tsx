"use client";

import React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  TriangleAlert,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "./Button";

/* ==========================================================================
   Alert
   --------------------------------------------------------------------------
   21 hand-written banners across the member portal, in 11 files, each one
   slightly different. During step 1 this had to be rebuilt inline three
   times and a local `SavedNotice` helper appeared in settings — the usual
   sign that a component is overdue.

   The part that matters most is not the colour, it is `role`:

     role="status"  polite   — announced when the reader is idle
     role="alert"   assertive — interrupts whatever is being read

   Getting this wrong means a screen-reader user either misses a warning
   entirely, or gets interrupted by a routine "saved" message. So the role
   follows the tone automatically: danger and warning interrupt, success and
   info wait. `live={false}` opts a static, always-present notice out of
   announcements altogether.
   ========================================================================== */

export type AlertTone = "info" | "success" | "warning" | "danger";

const tones: Record<
  AlertTone,
  { shell: string; icon: React.ReactNode; assertive: boolean }
> = {
  info: {
    shell: "border-info-line bg-info-surface text-info",
    icon: <Info />,
    assertive: false,
  },
  success: {
    shell: "border-success-line bg-success-surface text-success",
    icon: <CheckCircle2 />,
    assertive: false,
  },
  warning: {
    shell: "border-warning-line bg-warning-surface text-warning",
    icon: <TriangleAlert />,
    assertive: true,
  },
  danger: {
    shell: "border-danger-line bg-danger-surface text-danger",
    icon: <AlertTriangle />,
    assertive: true,
  },
};

export type AlertProps = {
  tone?: AlertTone;
  /** Optional bold line above the message. */
  title?: React.ReactNode;
  /** Replaces the default icon. Pass null to drop it entirely. */
  icon?: React.ReactNode | null;
  /** Shows a dismiss button. */
  onDismiss?: () => void;
  /** Action row under the message — usually one small Button. */
  action?: React.ReactNode;
  /**
   * Whether this alert should be announced when it appears. Leave true for
   * anything that shows up in response to something the member did; set
   * false for a notice that is simply part of the page.
   */
  live?: boolean;
  className?: string;
  children?: React.ReactNode;
};

export function Alert({
  tone = "info",
  title,
  icon,
  onDismiss,
  action,
  live = true,
  className,
  children,
}: AlertProps) {
  const { shell, icon: defaultIcon, assertive } = tones[tone];

  return (
    <div
      role={live ? (assertive ? "alert" : "status") : undefined}
      aria-live={live ? (assertive ? "assertive" : "polite") : undefined}
      className={cn(
        "flex items-start gap-inline-lg rounded-card border p-inset-md shadow-sm",
        "[&_svg]:h-icon-small [&_svg]:w-icon-small [&_svg]:shrink-0",
        shell,
        className,
      )}
    >
      {icon === null ? null : (
        <span aria-hidden="true" className="mt-0.5">
          {icon ?? defaultIcon}
        </span>
      )}

      <div className="min-w-0 flex-1">
        {title ? <p className="text-label-lg">{title}</p> : null}
        {children ? (
          <div className={cn("text-body-sm", title && "mt-stack-xs")}>
            {children}
          </div>
        ) : null}
        {action ? <div className="mt-stack-md">{action}</div> : null}
      </div>

      {onDismiss ? (
        <Button
          variant="neutral"
          appearance="stroke"
          size="small"
          iconOnly
          onClick={onDismiss}
          aria-label="Dismiss"
          className="-mt-1 -mr-1 border-transparent"
        >
          <X />
        </Button>
      ) : null}
    </div>
  );
}

export default Alert;
