"use client";

import React from "react";
import { cn } from "@/lib/utils/cn";

/* ==========================================================================
   Skeleton
   --------------------------------------------------------------------------
   Until now the only loading placeholder in the app was TableSkeleton, which
   only fits inside a <table>. Everything else — cards, metrics, a list of
   saved drivers — had nothing, because synchronous localStorage meant there
   was never a frame to fill.

   With the data layer async there is one, so this is the piece that fills
   it. It is deliberately dumb: a shape, a shimmer, and no text. The point of
   a skeleton is to hold the space the real content will take, so the page
   does not jump when it arrives; pick sizes that match the real thing.

   `aria-hidden` is not enough on its own — a screen reader should be told
   the region is busy, not shown a row of empty boxes. Put `aria-busy` on the
   container that swaps (AsyncSection does this for you).
   ========================================================================== */

export type SkeletonProps = {
  /** `text` sits on a line box; `block` is a rectangle; `circle` is round. */
  variant?: "text" | "block" | "circle";
  /** Any CSS width. Defaults to the full width of the parent. */
  width?: string | number;
  /** Any CSS height. `text` and `circle` have sensible defaults. */
  height?: string | number;
  className?: string;
};

export function Skeleton({
  variant = "block",
  width,
  height,
  className,
}: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "block animate-pulse bg-surface-sunken",
        variant === "circle" ? "rounded-pill" : "rounded-chip",
        variant === "text" && "h-4",
        variant === "circle" && "h-10 w-10",
        className,
      )}
      style={{ width, height }}
    />
  );
}

/**
 * A paragraph of skeleton lines. The last line is short, because real text
 * rarely fills its final line and a block of equal bars reads as a table.
 */
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <span className={cn("flex flex-col gap-stack-xs", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          width={index === lines - 1 ? "60%" : "100%"}
        />
      ))}
    </span>
  );
}

export default Skeleton;
