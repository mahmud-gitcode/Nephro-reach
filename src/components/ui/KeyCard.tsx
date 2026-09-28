import React from "react";
import { cn } from "@/lib/utils/cn";

/* ==========================================================================
   KeyCard
   --------------------------------------------------------------------------
   The summary tile every dashboard in the product opens with. Laid out after
   the client's reference dashboard (UI redesign, phase 3 — 2026-09-28):

     ┌──────────────────────────────┐
     │ Label                   icon │   what the figure is · what kind
     │                              │
     │ 2,884  ▲ 15.5%               │   the figure · its movement
     │ vs. 2,496 last period        │   the comparison or footnote
     └──────────────────────────────┘

   Three things about it are deliberate:

   1. NO TILE. The icon used to sit in a 64px tinted square beside the
      figure. Six of those across a page competed with the numbers they
      labelled; a 20px glyph in the corner names the card's kind and gets
      out of the way. It still takes the tone's colour, so a warning card
      is still orange and an attention card still red at a glance.

   2. THE MOVEMENT SITS ON THE FIGURE'S LINE, as a tinted chip. A trend is
      read with its number ("2,884, up 15.5%"), not as a footnote under a
      rule. What it is measured against drops to the grey line beneath.

   3. NOT INTERACTIVE. These were links on some pages and filter buttons on
      others; the client asked for neither (2026-09-26). Every page that
      filtered from a card still has a status select and a search box.

   The icon should be a FILLED glyph — see `@/components/icons/solid`.
   ========================================================================== */

export type KeyCardTone =
  "brand" | "success" | "warning" | "danger" | "accent" | "neutral";

/**
 * The glyph's colour per tone. A glyph is a shape, so it answers to 3:1:
 * warning's orange is the tightest at ~3.0, every other tone clears 4.5.
 */
const glyphs: Record<KeyCardTone, string> = {
  brand: "text-fg-brand",
  success: "text-success",
  /* Orange, not the amber-brown warning text colour. */
  warning: "text-warning-glyph",
  danger: "text-danger",
  accent: "text-accent-fg",
  neutral: "text-fg-secondary",
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
  /** The movement itself, e.g. "12%". Shown in the chip. */
  value: string;
  /** What it is measured against, e.g. "vs yesterday". The grey line. */
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
   * A share, a comparison, a remainder — the grey line under the figure.
   * With a `trend`, the trend's `suffix` takes this line instead.
   */
  note?: React.ReactNode;
  /** A movement since an earlier point. A chip beside the figure. */
  trend?: KeyCardTrend;
  /**
   * Anything extra — a rating, a link. Sits at the foot of the card, so the
   * figure above stays level with every other card in the row.
   */
  children?: React.ReactNode;
  className?: string;
};

/** The movement chip: a tint, a small triangle and the value. */
function TrendChip({ trend }: { trend: KeyCardTrend }) {
  /* Unset means up is the good direction, which is true of most figures a
     card like this carries. */
  const good = trend.good ?? trend.direction === "up";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-inline-xs rounded-status px-inset-xs py-0.5 text-label-sm tabular-nums",
        good
          ? "bg-success-surface text-success"
          : "bg-danger-surface text-danger",
      )}
    >
      <svg
        viewBox="0 0 8 5"
        aria-hidden="true"
        className="h-[5px] w-2 shrink-0 fill-current"
      >
        <path d={trend.direction === "up" ? "M4 0l4 5H0z" : "M4 5L0 0h8z"} />
      </svg>
      {/* The triangle is decoration; the words say which way. */}
      <span className="sr-only">
        {trend.direction === "up" ? "Up " : "Down "}
      </span>
      {trend.value}
    </span>
  );
}

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
  const caption = trend ? trend.suffix : note;

  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-card border border-line bg-surface p-card shadow-(--card-shadow)",
        className,
      )}
    >
      {/* What the figure is, and what kind of figure. Six of these can sit
          across one row, so the label may take a second line; `text-balance`
          splits it evenly instead of stranding one word. */}
      <div className="flex items-start justify-between gap-inline-md">
        <p className="text-heading-5 text-balance text-fg">{label}</p>
        <span
          aria-hidden="true"
          className={cn(
            "mt-0.5 shrink-0 [&_svg]:h-5 [&_svg]:w-5",
            glyphs[tone],
          )}
        >
          {icon}
        </span>
      </div>

      {/* `mt-auto` anchors the figure to the foot of the card. Cards in a
          row share a height, so the figures line up across it even when one
          label runs to two lines and its neighbour's does not. */}
      <div className="mt-auto flex flex-wrap items-center gap-x-inline-md gap-y-stack-xs pt-stack-xl">
        <p className="text-metric-lg leading-none text-fg">{value}</p>
        {trend ? <TrendChip trend={trend} /> : null}
      </div>

      {/* The grey line under the figure. A card without one keeps its space
          (or gives it to `children`, e.g. a star rating), so a row where only
          some cards carry a note still has its figures on one line. */}
      {caption ? (
        <p className="mt-stack-sm text-caption text-fg-muted">{caption}</p>
      ) : children === undefined ? (
        <p aria-hidden="true" className="mt-stack-sm text-caption">
          &nbsp;
        </p>
      ) : null}

      {children !== undefined ? (
        <div className={caption ? "pt-stack-md" : "mt-stack-sm"}>
          {children}
        </div>
      ) : null}
    </article>
  );
}

export default KeyCard;
