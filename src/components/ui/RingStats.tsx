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

/* Thickness is ProgressRing's default, a seventh of the diameter, so these
   match every other ring in the product. */
const RING = {
  big: { diameter: 112, column: 160 },
  small: { diameter: 88, column: 132 },
};

export function RingStats({ items, size = "big", className }: RingStatsProps) {
  const ring = RING[size];

  return (
    <ul
      className={cn("grid gap-inline-md", className)}
      style={{
        /* Each tile is at least a ring and its padding wide; past that the
           tiles share the width, and on a narrow card they wrap. */
        gridTemplateColumns: `repeat(auto-fit, minmax(${ring.column}px, 1fr))`,
      }}
    >
      {items.map((item) => (
        /* A nested box per figure, the same shape as the dashboard's other
           boxes-in-a-card (Quick Actions), so the ring is framed rather
           than floating in the card's white. */
        <li
          key={item.label}
          className="flex flex-col items-center rounded-card-nested border border-line-subtle px-inset-sm py-inset-md"
        >
          <ProgressRing
            value={item.value}
            label={item.label}
            tone={item.tone}
            size={ring.diameter}
          />
          {/* Two lines are always reserved, so a label that wraps does not
              push its tile's ring out of line with its neighbours'. */}
          <p
            aria-hidden="true"
            className="mt-stack-md line-clamp-2 min-h-10 max-w-40 text-center text-label-md text-balance text-fg-secondary"
          >
            {item.label}
          </p>
        </li>
      ))}
    </ul>
  );
}

export default RingStats;
