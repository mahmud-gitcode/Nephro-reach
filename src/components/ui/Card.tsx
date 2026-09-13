"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";

/* ==========================================================================
   Card
   --------------------------------------------------------------------------
   The single most repeated pattern in the app — 348 hand-written
   `rounded + border` containers in the member portal alone. Four
   near-identical border greys are currently spread across them
   (#E2E8F0, #E3E6F0, #E9EEF4, #E8EEF6), which is why cards on different
   pages look subtly different for no reason.

   Not everything is a card. Border, fill, radius and shadow each say
   "separate object" — spend them by role. `flat` is for a container that
   groups without claiming to be a distinct thing.
   ========================================================================== */

export type CardTone = "default" | "flat" | "sunken" | "raised";
export type CardPadding = "none" | "small" | "big";

const tones: Record<CardTone, string> = {
  /* A real object on the page. */
  default: "bg-surface border border-line shadow-card",
  /* Grouping only — no elevation, no claim to be its own object. */
  flat: "bg-surface border border-line",
  /* A well: recessed area inside another surface. */
  sunken: "bg-surface-sunken border border-line-subtle",
  /* Floats above the page: dropdowns, popovers, hover states. */
  raised: "bg-surface-raised border border-line shadow-raised",
};

const paddings: Record<CardPadding, string> = {
  none: "",
  small: "p-inset-sm",
  big: "p-inset-md",
};

export type CardProps = React.HTMLAttributes<HTMLElement> & {
  tone?: CardTone;
  padding?: CardPadding;
  /** Adds hover feedback. Only for a card that is actually clickable. */
  interactive?: boolean;
  /** `li` for a card inside a list, `article` for standalone content,
      `form` for a form that is itself the card. */
  as?: "div" | "article" | "section" | "li" | "form";
};

export function Card({
  tone = "default",
  padding = "big",
  interactive = false,
  as = "div",
  className,
  children,
  ...rest
}: CardProps) {
  // The element varies, so the props type is widened to HTMLElement above and
  // narrowed back here — React cannot infer a union of element prop types.
  const Tag = as as React.ElementType;

  return (
    <Tag
      className={cn(
        "rounded-card",
        tones[tone],
        paddings[padding],
        interactive &&
          "cursor-pointer transition-colors duration-150 ease-standard hover:border-line-strong hover:bg-surface-sunken",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* --------------------------------------------------------------------------
   Card sub-parts. Optional — a simple card needs none of them — but they
   keep the header/body/footer rhythm identical from one card to the next.
   -------------------------------------------------------------------------- */

export function CardHeader({
  title,
  description,
  action,
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-inline-lg",
        className,
      )}
      {...rest}
    >
      <div className="min-w-0">
        <h3 className="text-heading-5 text-fg">{title}</h3>
        {description ? (
          <p className="mt-stack-xs text-body-sm text-fg-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function CardBody({
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-stack-md", className)} {...rest} />;
}

export function CardFooter({
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "mt-stack-lg flex flex-wrap items-center gap-inline-md border-t border-line-subtle pt-inset-sm",
        className,
      )}
      {...rest}
    />
  );
}

export default Card;
