"use client";

import React, { useId, useMemo, useState } from "react";
import { Check, ChevronDown, Plus } from "lucide-react";
import { Button, Chip, Input, SearchField } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import {
  CONDITION_GROUPS,
  resolveCondition,
  sortedConditions,
  type CcmCondition,
} from "./ccmConditions";

/* ==========================================================================
   Condition select — a patient's chronic conditions
   --------------------------------------------------------------------------
   Multi-select, because a CCM patient is rarely one diagnosis: CKD + HTN +
   diabetes + CHF is the usual shape. The list opens under the field rather
   than floating over it, so it is never clipped inside a dialog, and it is
   searchable, grouped the way the client listed it.

   "Other" takes anything the library does not have; it is kept on the
   patient as typed. What is chosen shows as chips under the field, each
   removable, most important first.
   ========================================================================== */

export function ConditionSelect({
  library,
  value,
  onChange,
  invalid,
  describedBy,
}: {
  /** The clinic's library; only active conditions are offered. */
  library: CcmCondition[];
  value: string[];
  onChange: (next: string[]) => void;
  invalid?: boolean;
  describedBy?: string;
}) {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [other, setOther] = useState("");

  const selected = useMemo(
    () => sortedConditions(value, library),
    [value, library],
  );
  const chosenIds = new Set(
    selected.filter((c) => !c.other).map((c) => library[c.rank]?.id),
  );

  const q = query.trim().toLowerCase();
  const offered = library.filter(
    (condition) =>
      (condition.active || chosenIds.has(condition.id)) &&
      (q === "" ||
        condition.label.toLowerCase().includes(q) ||
        condition.short.toLowerCase().includes(q)),
  );

  function toggle(condition: CcmCondition) {
    if (chosenIds.has(condition.id)) {
      onChange(
        value.filter((v) => {
          const r = resolveCondition(v, library);
          return r.other || library[r.rank]?.id !== condition.id;
        }),
      );
    } else {
      onChange([...value, condition.id]);
    }
  }

  function addOther(text: string) {
    const clean = text.trim();
    if (!clean) return;
    /* Typed text that names a library condition selects that instead. */
    const match = resolveCondition(clean, library);
    const next = match.other ? clean : library[match.rank].id;
    if (!value.some((v) => v.toLowerCase() === next.toLowerCase())) {
      onChange([...value, next]);
    }
    setOther("");
    setQuery("");
  }

  return (
    <div className="space-y-stack-sm">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-describedby={describedBy}
        className={cn(
          "flex min-h-11 w-full cursor-pointer items-center justify-between gap-inline-md rounded-field border bg-surface px-inset-sm text-left text-body-sm",
          "transition-colors duration-150 ease-standard",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          invalid ? "border-danger" : "border-line hover:border-line-strong",
        )}
      >
        <span className={selected.length > 0 ? "text-fg" : "text-fg-muted"}>
          {selected.length > 0
            ? `${selected.length} condition${selected.length === 1 ? "" : "s"} selected`
            : "Select conditions"}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-4 shrink-0 text-fg-muted transition-transform duration-150 ease-standard",
            open && "rotate-180",
          )}
        />
      </button>

      {selected.length > 0 ? (
        <ul
          aria-label="Selected conditions"
          className="flex flex-wrap gap-inline-sm"
        >
          {selected.map((condition) => (
            <li key={condition.value}>
              <Chip
                selected
                title={condition.label}
                onRemove={() =>
                  onChange(value.filter((v) => v !== condition.value))
                }
                aria-label={condition.label}
              >
                {condition.short}
                {condition.other ? " (Other)" : ""}
              </Chip>
            </li>
          ))}
        </ul>
      ) : null}

      {open ? (
        <div
          id={panelId}
          className="rounded-card-nested border border-line bg-surface p-inset-sm"
        >
          <SearchField
            label="Search conditions"
            placeholder="Search conditions…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="mt-stack-sm max-h-72 space-y-stack-md overflow-y-auto pr-1">
            {CONDITION_GROUPS.map((group) => {
              const items = offered.filter((c) => c.group === group);
              if (items.length === 0) return null;
              return (
                <fieldset key={group}>
                  <legend className="mb-stack-xs text-label-sm text-fg-muted">
                    {group}
                  </legend>
                  <ul className="space-y-0.5">
                    {items.map((condition) => {
                      const on = chosenIds.has(condition.id);
                      return (
                        <li key={condition.id}>
                          <label
                            className={cn(
                              "flex min-h-10 cursor-pointer items-center gap-inline-md rounded-control px-inset-xs text-body-sm",
                              "transition-colors duration-150 ease-standard hover:bg-surface-sunken",
                              on ? "text-fg" : "text-fg-secondary",
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={() => toggle(condition)}
                              className="size-4 shrink-0 cursor-pointer accent-brand-600"
                            />
                            <span className="min-w-0 flex-1">
                              {condition.label}
                              {condition.secondary ? (
                                <span className="block text-caption text-fg-muted">
                                  Temporary — does not count toward CCM
                                  eligibility
                                </span>
                              ) : null}
                            </span>
                            <span className="shrink-0 text-caption text-fg-muted">
                              {condition.short}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </fieldset>
              );
            })}
            {offered.length === 0 && q ? (
              <p className="px-inset-xs text-body-sm text-fg-muted">
                Nothing in the library matches “{query.trim()}”.
              </p>
            ) : null}
          </div>

          {/* "Other": anything the library does not hold, kept as typed. */}
          <div className="mt-stack-md border-t border-line pt-stack-md">
            <p className="mb-stack-xs text-label-sm text-fg-muted">Other</p>
            <div className="flex gap-inline-sm">
              <Input
                inputSize="small"
                aria-label="Other condition"
                placeholder={q ? query.trim() : "Type a diagnosis"}
                value={other}
                onChange={(e) => setOther(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addOther(other || query);
                  }
                }}
                className="flex-1"
              />
              <Button
                size="small"
                variant="neutral"
                appearance="fill-stroke"
                disabled={!(other.trim() || q)}
                onClick={() => addOther(other || query)}
                leadingIcon={<Plus aria-hidden="true" />}
              >
                Add
              </Button>
            </div>
          </div>

          <div className="mt-stack-md flex justify-end">
            <Button
              size="small"
              onClick={() => setOpen(false)}
              leadingIcon={<Check aria-hidden="true" />}
            >
              Done
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
