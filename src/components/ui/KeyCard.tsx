import React from "react";
import { ChevronsDown, ChevronsUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/* ==========================================================================
   KeyCard
   --------------------------------------------------------------------------
   The summary tile every dashboard in the product opens with: a square
   tinted icon tile beside the figure and its label, and an optional
   footnote below a divider.

   Built from the client's reference (2026-09-26). Three things about it are
   deliberate:

   1. HORIZONTAL, and the figure before the label. The number is what
      somebody scans a row of these for; the label only explains it once
      found. Putting the label first, as the old cards did, spent a line of
      height on the part nobody reads first.

   2. THE TILE IS A SQUARE. It ran the full height of the card's left edge
      for a while, which made it a stripe rather than a tile and tied its
      shape to however tall the text below happened to be. A fixed 64px
      square keeps every card in a row identical whatever its text does.

   3. NOT INTERACTIVE. These were links on some pages and filter buttons on
      others; the client asked for neither (2026-09-26). Every page that
      filtered from a card still has a status select and a search box, so
      nothing became unreachable — there were simply two controls for one
      job. A card that cannot be pressed also does not have to explain that
      it can be.

   The icon should be a FILLED glyph — see `@/components/icons/solid`. The
   panel is a tint rather than a solid, so the glyph carries the colour; a
   hairline outline icon would disappear into it at this size.
   ========================================================================== */

export type KeyCardTone =
  "brand" | "success" | "warning" | "danger" | "accent" | "neutral";

/**
 * A tint behind a coloured glyph, not a saturated block behind a white one.
 *
 * Six of these can sit in a row, and six solid blocks of colour across the
 * top of a page shout over the figures they are there to label. The tint
 * carries the same meaning at a fraction of the weight.
 *
 * Each pairs a ramp's 50 tint with its own 600 (700 for accent, where 600
 * sits lighter). A glyph is a shape, so it answers to 3:1, and every pair
 * here clears it with room: success is the tightest at 4.58, accent and
 * neutral run past 6.
 */
const bands: Record<KeyCardTone, string> = {
  brand: "bg-surface-brand-subtle text-brand-600",
  success: "bg-success-surface text-success",
  warning: "bg-warning-surface text-warning",
  danger: "bg-danger-surface text-danger",
  accent: "bg-accent-soft text-accent-fg",
  neutral: "bg-surface-sunken text-fg-secondary",
};

/**
 * A movement since some earlier point — "12% vs yesterday".
 *
 * `good` decides the colour, not `direction`. A rise in completions is
 * green and a rise in missed check-ins is red, and only the caller knows
 * which way is which. Left unset, up is treated as good.
 */
export type KeyCardTrend = {
  direction: "up" | "down";
  /** The movement itself, e.g. "12%". Carries the colour. */
  value: string;
  /** What it is measured against, e.g. "vs yesterday". Stays grey. */
  suffix?: string;
  good?: boolean;
};

export type KeyCardProps = {
  /** A filled glyph. Sized by the card; do not set its height here. */
  icon: React.ReactNode;
  tone?: KeyCardTone;
  /** The figure. The thing the card exists to show. */
  value: React.ReactNode;
  /** What the figure is. Wraps to a second line when it must. */
  label: string;
  /**
   * A share, a comparison, a remainder. Sits below a divider at the foot of
   * the card. Use `trend` instead when the note is a movement.
   */
  note?: React.ReactNode;
  /** A movement since an earlier point. Rendered with an arrow. */
  trend?: KeyCardTrend;
  /**
   * Anything extra — a rating, a link. Renders in the footer beside where a
   * note would go, so the figure above stays level with every other card.
   */
  children?: React.ReactNode;
  className?: string;
};

export function KeyCard({
  icon,
  tone = "brand",
  value,
  label,
  note,
  trend,
  children,
  className,
}: KeyCardProps) {
  const Arrow = trend?.direction === "down" ? ChevronsDown : ChevronsUp;
  /* Unset means up is the good direction, which is true of most figures a
     card like this carries. */
  const rising = (trend?.good ?? trend?.direction === "up") === true;

  const footer = trend ? (
    <p className="flex items-center gap-inline-xs text-body-sm">
      <Arrow
        aria-hidden="true"
        className={cn(
          "h-4 w-4 shrink-0",
          rising ? "text-success" : "text-danger",
        )}
      />
      <span
        className={cn(
          "font-bold tabular-nums",
          rising ? "text-success" : "text-danger",
        )}
      >
        {trend.value}
      </span>
      {trend.suffix ? (
        <span className="text-fg-muted">{trend.suffix}</span>
      ) : null}
    </p>
  ) : note ? (
    <p className="text-body-sm text-fg-muted">{note}</p>
  ) : null;

  /* Anything extra sits in the footer too, on the same line as a note would
     be. It used to render under the label inside the text column, which
     pushed the figure up and left a card carrying a button sitting
     differently from every other card in its row. */
  const hasFooter = footer !== null || children !== undefined;

  return (
    <article
      className={cn(
        "flex h-full flex-col gap-inset-sm rounded-card border border-line bg-surface p-inset-md",
        className,
      )}
    >
      {/* The tile and the figure are one line of reading, so they are
          centred against each other. */}
      <div className="flex items-center gap-inline-lg">
        <span
          aria-hidden="true"
          className={cn(
            /* A square, so it reads as a tile rather than a stripe down the
               card. 64px, which is the same square the client's reference
               uses beside a figure this size. */
            "flex h-16 w-16 shrink-0 items-center justify-center rounded-card",
            /* 36px inside 64px: filled without crowding the corners. */
            "[&_svg]:h-9 [&_svg]:w-9",
            bands[tone],
          )}
        >
          {icon}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-metric-lg leading-none text-fg">{value}</p>
          {/* Six of these can sit across one row, so a label like "Need
              Follow-Up" has to be able to take a second line. `text-balance`
              splits it evenly instead of stranding one word under seven. */}
          <p className="mt-stack-xs text-label-md text-balance text-fg-secondary">
            {label}
          </p>
        </div>
      </div>

      {/* A rule, then the footnote. Below the content rather than floating
          over it: it briefly sat absolute in the corner, where a long note
          ran under the label. A divider gives it a place of its own and
          says it is a different kind of fact from the figure above. */}
      {hasFooter ? (
        <div className="mt-auto space-y-stack-xs border-t border-line pt-inset-xs">
          {footer}
          {children}
        </div>
      ) : null}
    </article>
  );
}

export default KeyCard;
