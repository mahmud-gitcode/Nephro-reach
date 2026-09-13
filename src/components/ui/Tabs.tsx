"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/utils/cn";

/* ==========================================================================
   Tabs
   --------------------------------------------------------------------------
   Nine files in the member portal build their own tab strip, and no two are
   alike. More importantly, none of them handle arrow keys.

   WAI-ARIA says a tab list is ONE stop in the tab order: you Tab into it,
   then move between tabs with the arrow keys. Every hand-written version
   here instead makes each tab its own tab stop, so a member with nine tabs
   has to press Tab nine times to get past them. This component implements
   the roving tabindex properly:

     ← →  (or ↑ ↓ when vertical)  move between tabs
     Home / End                    first / last tab
     Tab                           leaves the strip entirely

   Selection follows focus, which is correct for panels that are already
   rendered — no extra Enter press to activate.
   ========================================================================== */

export type TabItem<T extends string = string> = {
  id: T;
  label: React.ReactNode;
  /** Sized by the component. */
  icon?: React.ReactNode;
  disabled?: boolean;
};

export type TabsVariant = "underline" | "pill" | "vertical";

export type TabsProps<T extends string = string> = {
  items: ReadonlyArray<TabItem<T>>;
  value: T;
  onChange: (id: T) => void;
  variant?: TabsVariant;
  /** Names the tab list for screen readers. */
  label: string;
  className?: string;
};

const shells: Record<TabsVariant, string> = {
  underline: "flex gap-inline-md border-b border-line",
  pill: "inline-flex rounded-control border border-line bg-surface-sunken p-1",
  vertical: "flex flex-col gap-stack-sm",
};

function tabClass(variant: TabsVariant, selected: boolean) {
  const base =
    "inline-flex cursor-pointer items-center gap-inline-md whitespace-nowrap " +
    "transition-colors duration-150 ease-standard " +
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring " +
    "disabled:cursor-not-allowed disabled:text-fg-subtle " +
    "[&_svg]:h-icon-small [&_svg]:w-icon-small [&_svg]:shrink-0";

  if (variant === "underline") {
    return cn(
      base,
      "-mb-px border-b-2 px-inset-sm pb-inset-xs text-label-lg",
      selected
        ? "border-primary-edge text-fg-brand"
        : "border-transparent text-fg-muted hover:text-fg",
    );
  }

  if (variant === "pill") {
    return cn(
      base,
      "rounded-control-small px-inset-md py-inset-xs text-label-md",
      selected
        ? "bg-surface text-fg-brand shadow-control"
        : "text-fg-secondary hover:text-fg",
    );
  }

  // vertical
  return cn(
    base,
    "h-control-small w-full rounded-control px-inset-sm text-left text-label-lg",
    selected
      ? "bg-primary-soft text-primary-fg"
      : "text-fg-secondary hover:bg-surface-sunken",
  );
}

export function Tabs<T extends string = string>({
  items,
  value,
  onChange,
  variant = "underline",
  label,
  className,
}: TabsProps<T>) {
  const listRef = useRef<HTMLDivElement>(null);
  const vertical = variant === "vertical";

  const move = (from: number, delta: number) => {
    const enabled = items
      .map((item, i) => ({ item, i }))
      .filter(({ item }) => !item.disabled);
    if (enabled.length === 0) return;

    const pos = enabled.findIndex(({ i }) => i === from);
    const next =
      enabled[(pos + delta + enabled.length) % enabled.length] ?? enabled[0];

    onChange(next.item.id);
    // Focus follows selection so the roving tabindex stays consistent.
    listRef.current
      ?.querySelectorAll<HTMLButtonElement>("[role='tab']")
      [next.i]?.focus();
  };

  const jump = (edge: "first" | "last") => {
    const enabled = items
      .map((item, i) => ({ item, i }))
      .filter(({ item }) => !item.disabled);
    if (enabled.length === 0) return;

    const target = edge === "first" ? enabled[0] : enabled[enabled.length - 1];
    onChange(target.item.id);
    listRef.current
      ?.querySelectorAll<HTMLButtonElement>("[role='tab']")
      [target.i]?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const prevKey = vertical ? "ArrowUp" : "ArrowLeft";
    const nextKey = vertical ? "ArrowDown" : "ArrowRight";

    if (e.key === prevKey) {
      e.preventDefault();
      move(index, -1);
    } else if (e.key === nextKey) {
      e.preventDefault();
      move(index, 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      jump("first");
    } else if (e.key === "End") {
      e.preventDefault();
      jump("last");
    }
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      aria-orientation={vertical ? "vertical" : "horizontal"}
      className={cn(shells[variant], className)}
    >
      {items.map((item, index) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`${item.id}-tab`}
            aria-selected={selected}
            aria-controls={`${item.id}-panel`}
            // Roving tabindex: the strip is one stop, not one per tab.
            tabIndex={selected ? 0 : -1}
            disabled={item.disabled}
            onClick={() => onChange(item.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={tabClass(variant, selected)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export type TabPanelProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Must match the TabItem id it belongs to. */
  id: string;
  /** The currently selected tab. The panel renders only when they match. */
  value: string;
};

export function TabPanel({
  id,
  value,
  className,
  children,
  ...rest
}: TabPanelProps) {
  if (id !== value) return null;

  return (
    <div
      id={`${id}-panel`}
      role="tabpanel"
      aria-labelledby={`${id}-tab`}
      tabIndex={0}
      className={cn("focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring", className)}
      {...rest}
    >
      {children}
    </div>
  );
}

export default Tabs;
