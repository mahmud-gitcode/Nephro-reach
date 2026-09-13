"use client";

import React, { createContext, useContext, useId, useRef } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/* ==========================================================================
   RadioGroup · RadioCard
   --------------------------------------------------------------------------
   "Pick one" lists are written as plain <button> elements all over this app —
   the mood picker and the medication yes/no on the blood-pressure form are
   two examples from a single page. A screen reader reading those hears a
   row of unrelated buttons: not that they form one choice, not how many
   options there are, and not which one is currently picked.

   Same keyboard contract as Tabs, and for the same reason: a radio group is
   ONE stop in the tab order.

     ← → ↑ ↓   move between options (and select — selection follows focus,
               which is the correct behaviour for radios)
     Home/End  first / last option
     Tab       leaves the group

   RadioCard renders compactly when given only a title, and as a full option
   card when given an icon or description — so the same component covers
   both shapes without a variant prop.
   ========================================================================== */

type RadioContextValue = {
  name: string;
  value: string;
  onChange: (value: string) => void;
};

const RadioContext = createContext<RadioContextValue | null>(null);

function useRadioGroup(component: string) {
  const ctx = useContext(RadioContext);
  if (!ctx) {
    throw new Error(`<${component}> must be used inside <RadioGroup>`);
  }
  return ctx;
}

export type RadioGroupProps = {
  /** Names the group for screen readers. Required. */
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Arrow-key axis. Defaults to vertical, matching a stacked option list. */
  orientation?: "vertical" | "horizontal";
  className?: string;
  children: React.ReactNode;
};

export function RadioGroup({
  label,
  value,
  onChange,
  orientation = "vertical",
  className,
  children,
}: RadioGroupProps) {
  const name = useId();
  const listRef = useRef<HTMLDivElement>(null);

  /* Option order is read from the DOM when a key is pressed rather than
     collected during render. Registering into a ref while rendering breaks
     under concurrent rendering, and the DOM is the authority on the order
     the member actually sees. */
  const radios = () =>
    Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>(
        "[role='radio']:not([disabled])",
      ) ?? [],
    );

  const select = (el: HTMLButtonElement | undefined) => {
    const next = el?.dataset.value;
    if (!next) return;
    onChange(next);
    el.focus();
  };

  const move = (delta: number) => {
    const items = radios();
    if (items.length === 0) return;
    const current = items.findIndex((el) => el.dataset.value === value);
    const index = (current + delta + items.length) % items.length;
    select(items[index]);
  };

  const jump = (edge: "first" | "last") => {
    const items = radios();
    if (items.length === 0) return;
    select(edge === "first" ? items[0] : items[items.length - 1]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const prev = orientation === "vertical" ? "ArrowUp" : "ArrowLeft";
    const next = orientation === "vertical" ? "ArrowDown" : "ArrowRight";

    // Both axes are accepted: a member does not know which way we laid the
    // options out, and the spec allows it.
    if (e.key === prev || e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      move(-1);
    } else if (e.key === next || e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      move(1);
    } else if (e.key === "Home") {
      e.preventDefault();
      jump("first");
    } else if (e.key === "End") {
      e.preventDefault();
      jump("last");
    }
  };

  return (
    <RadioContext.Provider value={{ name, value, onChange }}>
      <div
        ref={listRef}
        role="radiogroup"
        aria-label={label}
        aria-orientation={orientation}
        onKeyDown={handleKeyDown}
        className={cn(
          orientation === "vertical"
            ? "flex flex-col gap-stack-sm"
            : "grid grid-cols-2 gap-inline-md",
          className,
        )}
      >
        {children}
      </div>
    </RadioContext.Provider>
  );
}

/** The tick that shows which option is chosen. */
function RadioMark({ selected }: { selected: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-chip border",
        selected
          ? "border-primary-edge bg-primary-solid text-primary-on-solid"
          : "border-field bg-surface",
      )}
    >
      {selected ? <Check className="h-3.5 w-3.5" /> : null}
    </span>
  );
}

export type RadioCardProps = {
  value: string;
  title: React.ReactNode;
  /** Adds a second line. Presence of this or `icon` gives the full card shape. */
  description?: React.ReactNode;
  /** Leading badge — an icon, an emoji, an initial. */
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
};

export function RadioCard({
  value,
  title,
  description,
  icon,
  disabled,
  className,
}: RadioCardProps) {
  const { value: selectedValue, onChange } = useRadioGroup("RadioCard");
  const selected = selectedValue === value;

  const rich = Boolean(icon || description);

  return (
    <button
      type="button"
      role="radio"
      // Read by the group to work out arrow-key order from the DOM.
      data-value={value}
      aria-checked={selected}
      disabled={disabled}
      // Roving tabindex: the group is one stop, not one per option.
      tabIndex={selected ? 0 : -1}
      onClick={() => onChange(value)}
      className={cn(
        "flex w-full cursor-pointer items-center gap-inline-md border text-left",
        "transition-colors duration-150 ease-standard",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        "disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-sunken disabled:text-fg-subtle",
        rich
          ? "rounded-card p-inset-sm"
          : "h-control-big rounded-card px-inset-sm",
        selected
          ? "border-primary-soft-line bg-primary-soft"
          : "border-line bg-surface hover:bg-surface-sunken",
        className,
      )}
    >
      {icon ? (
        <span
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill bg-surface-sunken text-label-md text-fg-secondary [&_svg]:h-icon-small [&_svg]:w-icon-small"
        >
          {icon}
        </span>
      ) : null}

      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block text-label-md",
            selected ? "text-primary-fg" : "text-fg",
          )}
        >
          {title}
        </span>
        {description ? (
          <span className="block text-caption text-fg-muted">{description}</span>
        ) : null}
      </span>

      <RadioMark selected={selected} />
    </button>
  );
}

export default RadioGroup;
