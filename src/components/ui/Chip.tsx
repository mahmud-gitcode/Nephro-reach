"use client";

import React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/* ==========================================================================
   Chip · ChipGroup
   --------------------------------------------------------------------------
   38 chip-shaped controls across the member portal — filter pills, category
   selectors, the role picker in reviews. Every one hand-written.

   A Chip is NOT a Badge. A Badge reports state and is not interactive; a
   Chip is a control the member operates. They look similar, which is
   exactly why they drift into each other — so this one is a real <button>
   with `aria-pressed`, and Badge stays a <span>.

   ChipGroup handles the two shapes a group can take:
     single   behaves like a radio group — one selection
     multiple behaves like checkboxes — any number
   ========================================================================== */

export type ChipProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onSelect"
> & {
  selected?: boolean;
  /** Shows an X and calls onRemove. For chips that represent a filter in use. */
  onRemove?: () => void;
  /** Sized by the component. */
  icon?: React.ReactNode;
};

export function Chip({
  selected = false,
  onRemove,
  icon,
  className,
  children,
  type = "button",
  ...rest
}: ChipProps) {
  return (
    <span className="inline-flex items-center">
      <button
        type={type}
        aria-pressed={selected}
        className={cn(
          "inline-flex cursor-pointer items-center gap-inline-xs border",
          "h-control-small px-inset-sm text-label-md whitespace-nowrap",
          "transition-colors duration-150 ease-standard",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          "disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-sunken disabled:text-fg-subtle",
          "[&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0",
          onRemove ? "rounded-l-control border-r-0" : "rounded-control",
          selected
            ? "border-primary-soft-line bg-primary-soft text-primary-fg"
            : "border-line bg-surface text-fg-secondary hover:bg-surface-sunken",
          className,
        )}
        {...rest}
      >
        {icon}
        {children}
      </button>

      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove"
          className={cn(
            "inline-flex h-control-small cursor-pointer items-center rounded-r-control border px-inset-xs",
            "transition-colors duration-150 ease-standard",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            selected
              ? "border-primary-soft-line bg-primary-soft text-primary-fg hover:bg-primary-soft-hover"
              : "border-line bg-surface text-fg-muted hover:bg-surface-sunken hover:text-fg",
          )}
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </span>
  );
}

export type ChipGroupProps = {
  /** Names the group for screen readers. */
  label: string;
  /** `single` acts like a radio group, `multiple` like checkboxes. */
  selection?: "single" | "multiple";
  className?: string;
  children: React.ReactNode;
};

export function ChipGroup({
  label,
  selection = "single",
  className,
  children,
}: ChipGroupProps) {
  return (
    <div
      role="group"
      aria-label={label}
      data-selection={selection}
      className={cn("flex flex-wrap gap-inline-md", className)}
    >
      {children}
    </div>
  );
}

export default Chip;
