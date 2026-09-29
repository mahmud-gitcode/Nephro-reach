"use client";

import React, { useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Input, type InputProps } from "./Input";

/* ==========================================================================
   SearchField
   --------------------------------------------------------------------------
   The reference dashboard's search box: a compact pill field (the canvas
   makes small fields pills) with a magnifier, and an optional keyboard
   shortcut shown as a key chip on the right — "⌘K".

   A shortcut shown must work, so `shortcut` also listens for it: ⌘K on a
   Mac, Ctrl+K elsewhere, focuses the field from anywhere on the page.
   ========================================================================== */

export type SearchFieldProps = Omit<
  InputProps,
  "leadingIcon" | "inputSize" | "type"
> & {
  /** The field's accessible name. There is no visible label. */
  label: string;
  /** Show a "⌘K" chip and focus the field on ⌘K / Ctrl+K. */
  shortcut?: boolean;
};

export function SearchField({
  label,
  shortcut = false,
  placeholder = "Search…",
  className,
  ...rest
}: SearchFieldProps) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!shortcut) return;
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shortcut]);

  return (
    <div className={cn("relative", className)}>
      <Input
        ref={ref}
        type="search"
        inputSize="small"
        leadingIcon={<Search />}
        placeholder={placeholder}
        aria-label={label}
        aria-keyshortcuts={shortcut ? "Meta+K Control+K" : undefined}
        // Room for the key chip.
        className={shortcut ? "pr-14" : undefined}
        {...rest}
      />
      {shortcut ? (
        <kbd
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 rounded-status border border-line bg-surface px-1.5 font-sans text-label-sm text-fg-muted"
        >
          ⌘K
        </kbd>
      ) : null}
    </div>
  );
}

export default SearchField;
