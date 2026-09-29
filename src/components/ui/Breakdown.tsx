import React from "react";
import { cn } from "@/lib/utils/cn";
import { SeriesTone, toneVar } from "./Chart";

/* ==========================================================================
   Breakdown
   --------------------------------------------------------------------------
   How one total splits into parts — "Customers: 2,884 retailers, 1,432
   distributors, 562 wholesalers". Redesigned in the UI redesign (phase 3)
   after the reference's bracket segments (a left rule, a colour wash and a
   thick foot bar per part) were judged too busy:

     ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ ▬▬▬▬▬▬▬▬ ▬▬▬       one slim bar, split by share
     ● Retailers  │ ● Distributors │ ● Wholesalers
     2,884 59%    │ 1,432 29%      │ 562 12%

   The bar is decoration: the columns carry the same numbers as text, so a
   screen reader is read the list, not a bar it cannot see.
   ========================================================================== */

export type BreakdownItem = {
  label: string;
  value: number;
  /** The chart fills (--chart-*): shapes, so 3:1 is the bar. */
  tone: SeriesTone;
};

export type BreakdownProps = {
  items: BreakdownItem[];
  /** What is being broken down. Becomes the list's accessible name. */
  label: string;
  /** How a figure is written. Defaults to grouped thousands, "2,884". */
  formatValue?: (value: number) => string;
  className?: string;
};

export function Breakdown({
  items,
  label,
  formatValue = (value) => value.toLocaleString("en-US"),
  className,
}: BreakdownProps) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  /* A zero total draws an empty bar and 0% everywhere, not NaN. */
  const share = (value: number) => (total > 0 ? value / total : 0);

  return (
    <div className={cn("space-y-stack-lg", className)}>
      <div aria-hidden="true" className="flex h-2 gap-1">
        {total > 0 ? (
          items.map((item) => (
            <span
              key={item.label}
              className="rounded-pill"
              style={{
                width: `${share(item.value) * 100}%`,
                background: toneVar[item.tone],
              }}
            />
          ))
        ) : (
          <span className="flex-1 rounded-pill bg-track" />
        )}
      </div>

      <dl
        aria-label={label}
        className="grid divide-x divide-line"
        style={{
          gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
        }}
      >
        {items.map((item) => (
          <div
            key={item.label}
            className="min-w-0 px-inset-md first:pl-0 last:pr-0"
          >
            <dt className="flex items-center gap-inline-sm text-caption text-fg-muted">
              <span
                aria-hidden="true"
                className="h-2 w-2 shrink-0 rounded-pill"
                style={{ background: toneVar[item.tone] }}
              />
              <span className="truncate">{item.label}</span>
            </dt>
            <dd className="mt-stack-xs flex flex-wrap items-baseline gap-x-inline-sm">
              <span className="text-metric-md text-fg">
                {formatValue(item.value)}
              </span>
              <span className="text-caption text-fg-muted tabular-nums">
                {Math.round(share(item.value) * 100)}%
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default Breakdown;
