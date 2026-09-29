import React from "react";
import { cn } from "@/lib/utils/cn";
import { ProgressRing, type ProgressRingTone } from "./ProgressRing";

/* ==========================================================================
   RingStats
   --------------------------------------------------------------------------
   A row of percentages, each a ring with its label beneath — "Performance
   Overview": 78% curriculum completion, 84% weekly engagement, 76% class
   attendance.

   One size, one thickness, one label style, so every group of rings in the
   product reads the same. The row is a grid of equal columns that WRAPS
   when there is no room: three 120px rings forced into a half-width card
   used to overlap each other.

   For a whole split into parts, use DonutChart; for one ring beside other
   content, ProgressRing.
   ========================================================================== */

export type RingStat = {
  /** What is measured — also the ring's accessible name. */
  label: string;
  /** 0–100. */
  value: number;
  tone?: ProgressRingTone;
};

export type RingStatsProps = {
  items: RingStat[];
  /** `big` for a card of its own, `small` for a narrow column. */
  size?: "big" | "small";
  className?: string;
};

/* Thickness is ProgressRing's default, a twelfth of the diameter, so these
   match every other ring in the product. */
const RING = {
  big: { diameter: 120 },
  small: { diameter: 96 },
};

export function RingStats({ items, size = "big", className }: RingStatsProps) {
  const ring = RING[size];

  return (
    <ul
      className={cn("grid gap-x-inset-md gap-y-inset-lg", className)}
      style={{
        /* Each column is at least a ring and its gutter wide; past that
           the rings share the width, and on a narrow card they wrap. */
        gridTemplateColumns: `repeat(auto-fit, minmax(${ring.diameter + 24}px, 1fr))`,
      }}
    >
      {items.map((item) => (
        <li key={item.label} className="flex flex-col items-center">
          <ProgressRing
            value={item.value}
            label={item.label}
            tone={item.tone}
            size={ring.diameter}
          />
          <p
            aria-hidden="true"
            className="mt-stack-md max-w-40 text-center text-body-sm text-balance text-fg-secondary"
          >
            {item.label}
          </p>
        </li>
      ))}
    </ul>
  );
}

export default RingStats;
