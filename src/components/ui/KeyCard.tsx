import React from "react";
import { cn } from "@/lib/utils/cn";

/* ==========================================================================
   KeyCard
   --------------------------------------------------------------------------
   The summary tile every dashboard in the product opens with. Laid out to
   Joni's spec (2026-09-29):

     ┌─────────────────────────────────┐
     │ Active Members                  │  what the figure is
     │ [■]  2,884  ▲ 15.5%             │  icon tile · the figure · its movement
     │ ─────────────────────────────── │
     │ vs. 2,496 last period           │  the comparison or footnote
     └─────────────────────────────────┘

   Four things about it are deliberate:

   1. THE TITLE ON TOP, THE FIGURE UNDER IT. The icon tile, the figure and
      its movement share one line, anchored to the card's foot, so a row of
      cards keeps its figures level whatever the titles above them do.

   2. THE ICON SITS IN A SQUARE LIGHT TILE in its tone's tint, so the kind of
      figure — on track, needs follow-up, attention — reads at a glance.

   3. A RULE, THEN THE NOTE. The grey comparison or footnote sits under a
      hairline: the number above it, its context below.

   4. NOT INTERACTIVE. These were links on some pages and filter buttons on
      others; the client asked for neither (2026-09-26). Every page that
      filtered from a card still has a status select and a search box.

   The icon should be a FILLED glyph — see `@/components/icons/solid`.
   ========================================================================== */

export type KeyCardTone =
  "brand" | "success" | "warning" | "danger" | "accent" | "neutral";

/**
 * The tile per tone: the ramp's light tint behind its own glyph colour. A
 * glyph is a shape, so it answers to 3:1 against the tint: warning's orange
 * is the tightest at ~3.0, every other tone clears 4.5.
 */
const tiles: Record<KeyCardTone, string> = {
  brand: "bg-surface-brand-subtle text-fg-brand",
  success: "bg-success-surface text-success",
  /* Orange, not the amber-brown warning text colour. */
  warning: "bg-warning-surface text-warning-glyph",
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
  /** The movement itself, e.g. "12%". Shown in the tag beside the figure. */
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
  /** What the figure is. Under the rule; wraps when it must. */
  label: string;
  /**
   * A share, a comparison, a remainder — the grey line under the label.
   * With a `trend`, the trend's `suffix` takes this line instead.
   */
  note?: React.ReactNode;
  /** A movement since an earlier point: a tag beside the figure. */
  trend?: KeyCardTrend;
  /** Anything extra — a rating, a link — at the foot of the card. */
  children?: React.ReactNode;
  className?: string;
};

/** The movement tag: a tint, a small triangle and the percentage. */
function TrendTag({ trend }: { trend: KeyCardTrend }) {
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
      {/* What the figure is, on top. May wrap to two lines. */}
      <p className="text-heading-5 text-balance text-fg">{label}</p>

      {/* `mt-auto` anchors everything below to the foot of the card, so the
          figures sit level across a row even when one title wraps and its
          neighbour's does not. */}
      <div className="mt-auto pt-stack-lg">
        <div className="flex items-center gap-inline-lg">
          <span
            aria-hidden="true"
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-card-nested [&_svg]:h-6 [&_svg]:w-6",
              tiles[tone],
            )}
          >
            {icon}
          </span>
          <div className="flex min-w-0 flex-wrap items-center gap-x-inline-md gap-y-stack-xs">
            {/* A figure never breaks ("23 /" over "30"); the tag may wrap
                under it on a narrow card instead. */}
            <p className="text-metric-lg leading-none whitespace-nowrap text-fg">
              {value}
            </p>
            {trend ? <TrendTag trend={trend} /> : null}
          </div>
        </div>

        {/* The rule, then the comparison or footnote. A card without one
            keeps the line's space (or gives it to `children`, e.g. a star
            rating), so every card in a row ends level. */}
        <div className="mt-stack-lg border-t border-line pt-stack-md">
          {caption ? (
            <p className="text-caption text-fg-muted">{caption}</p>
          ) : children === undefined ? (
            <p aria-hidden="true" className="text-caption">
              &nbsp;
            </p>
          ) : null}
          {children !== undefined ? (
            <div className={caption ? "pt-stack-sm" : undefined}>
              {children}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default KeyCard;
