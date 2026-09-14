"use client";

import React, { useId } from "react";
import { cn } from "@/lib/utils/cn";

/* ==========================================================================
   Switch
   --------------------------------------------------------------------------
   This one exists because of a bug, not a count.

   The notification preferences in settings were a <div onClick> with an
   aria-hidden indicator. That made all six of them unreachable by keyboard
   and invisible to a screen reader — a member using either could not change
   a single notification setting.

   A switch has to be a real button with role="switch" and aria-checked.
   `SwitchRow` is the shape this app actually uses: label and description on
   the left, control on the right, the whole row operable.

   Note it is `role="switch"`, not a checkbox: a switch takes effect
   immediately, a checkbox waits for a submit. These rows save on toggle, so
   switch is the honest role.
   ========================================================================== */

export type SwitchSize = "big" | "small";

const track: Record<SwitchSize, string> = {
  big: "h-6 w-11",
  small: "h-5 w-9",
};

const thumb: Record<SwitchSize, string> = {
  big: "h-5 w-5",
  small: "h-4 w-4",
};

export type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Required unless the switch is inside a SwitchRow, which labels it. */
  label?: string;
  size?: SwitchSize;
  disabled?: boolean;
  id?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  className?: string;
};

export function Switch({
  checked,
  onChange,
  label,
  size = "big",
  disabled,
  id,
  className,
  ...aria
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "inline-flex shrink-0 cursor-pointer items-center rounded-pill p-0.5",
        "transition-colors duration-150 ease-standard",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        "disabled:cursor-not-allowed disabled:opacity-60",
        track[size],
        checked ? "justify-end bg-action" : "justify-start bg-line-strong",
        className,
      )}
      {...aria}
    >
      <span
        aria-hidden="true"
        className={cn("rounded-pill bg-surface shadow-sm", thumb[size])}
      />
    </button>
  );
}

export type SwitchRowProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
  className?: string;
};

/**
 * The whole row is the control, so the target is the full width of the card
 * rather than a 44px switch — which matters for members with reduced fine
 * motor control.
 */
export function SwitchRow({
  checked,
  onChange,
  title,
  description,
  disabled,
  className,
}: SwitchRowProps) {
  const id = useId();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={`${id}-title`}
      aria-describedby={description ? `${id}-desc` : undefined}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex w-full cursor-pointer items-center justify-between gap-inline-lg",
        "rounded-card border border-line-subtle bg-surface p-inset-sm text-left shadow-sm",
        "transition-all duration-150 ease-standard hover:bg-surface-sunken hover:shadow-md",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      <span className="min-w-0 flex-1">
        <span id={`${id}-title`} className="block text-heading-5 text-fg">
          {title}
        </span>
        {description ? (
          <span
            id={`${id}-desc`}
            className="mt-stack-xs block text-body-sm text-fg-muted"
          >
            {description}
          </span>
        ) : null}
      </span>

      {/* The row itself carries the switch semantics, so the visual is
          decorative here — nesting a second button would be invalid. */}
      <span
        aria-hidden="true"
        className={cn(
          "flex h-6 w-11 shrink-0 items-center rounded-pill p-0.5",
          "transition-colors duration-150 ease-standard",
          checked ? "justify-end bg-action" : "justify-start bg-line-strong",
        )}
      >
        <span className="h-5 w-5 rounded-pill bg-surface shadow-sm" />
      </span>
    </button>
  );
}

export default Switch;
