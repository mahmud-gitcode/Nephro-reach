"use client";

import React from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "./Button";

/* ==========================================================================
   Table
   --------------------------------------------------------------------------
   21 tables in the member portal, and not one of them has pagination, an
   empty state, or a loading state. The wrapper is the least valuable part
   of this component — those three are the point.

   Numeric cells use `text-metric-sm`, which carries tabular-nums, so a lab
   column stays aligned and a value does not shift width going from 9.8 to
   10.2. Only 3 uses of tabular-nums existed in the entire codebase before
   the tokens landed.

   Composition is plain: Table > TableHead > TableRow > TableHeaderCell, and
   Table > TableBody > TableRow > TableCell. Nothing is abstracted away, so
   a table with unusual content is still expressible.
   ========================================================================== */

export function Table({
  className,
  minWidth = 560,
  ...rest
}: React.TableHTMLAttributes<HTMLTableElement> & { minWidth?: number }) {
  return (
    // The wrapper scrolls, not the page — a wide table must never make the
    // whole document scroll sideways.
    <div className="w-full overflow-x-auto">
      <table
        style={{ minWidth }}
        className={cn("w-full border-collapse text-left", className)}
        {...rest}
      />
    </div>
  );
}

export function TableHead({
  className,
  ...rest
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("", className)} {...rest} />;
}

export function TableBody({
  className,
  ...rest
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("", className)} {...rest} />;
}

export function TableRow({
  className,
  interactive = false,
  ...rest
}: React.HTMLAttributes<HTMLTableRowElement> & { interactive?: boolean }) {
  return (
    <tr
      className={cn(
        "border-b border-line-subtle last:border-b-0",
        interactive &&
          "cursor-pointer transition-colors duration-150 ease-standard hover:bg-surface-sunken",
        className,
      )}
      {...rest}
    />
  );
}

export type SortDirection = "asc" | "desc" | null;

export type TableHeaderCellProps =
  React.ThHTMLAttributes<HTMLTableCellElement> & {
    /** Right-align a numeric column so digits line up under the header. */
    numeric?: boolean;
    /** Makes the header a sort control. Omit for a plain header. */
    onSort?: () => void;
    sortDirection?: SortDirection;
  };

export function TableHeaderCell({
  numeric = false,
  onSort,
  sortDirection = null,
  className,
  children,
  ...rest
}: TableHeaderCellProps) {
  return (
    <th
      scope="col"
      // aria-sort tells a screen reader the column's state, which a visual
      // chevron alone does not.
      aria-sort={
        !onSort
          ? undefined
          : sortDirection === "asc"
            ? "ascending"
            : sortDirection === "desc"
              ? "descending"
              : "none"
      }
      className={cn(
        "border-b border-line px-inset-sm py-inset-xs text-overline text-fg-muted",
        numeric && "text-right",
        className,
      )}
      {...rest}
    >
      {onSort ? (
        <button
          type="button"
          onClick={onSort}
          className={cn(
            "inline-flex items-center gap-inline-xs rounded-control-small",
            "cursor-pointer transition-colors duration-150 ease-standard hover:text-fg",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            numeric && "flex-row-reverse",
          )}
        >
          {children}
          {sortDirection === "asc" ? (
            <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
          ) : sortDirection === "desc" ? (
            <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <ChevronDown
              className="h-3.5 w-3.5 opacity-30"
              aria-hidden="true"
            />
          )}
        </button>
      ) : (
        children
      )}
    </th>
  );
}

export type TableCellProps = React.TdHTMLAttributes<HTMLTableCellElement> & {
  /** Applies metric type: tabular figures, right-aligned. */
  numeric?: boolean;
  /** The row's identifying column. Slightly stronger than the rest. */
  emphasis?: boolean;
};

export function TableCell({
  numeric = false,
  emphasis = false,
  className,
  ...rest
}: TableCellProps) {
  return (
    <td
      className={cn(
        "px-inset-sm py-inset-sm align-middle",
        numeric
          ? "text-right text-metric-sm text-fg"
          : emphasis
            ? "text-body-sm font-semibold text-fg"
            : "text-body-sm text-fg-secondary",
        className,
      )}
      {...rest}
    />
  );
}

/* --------------------------------------------------------------------------
   States — the parts no table in this app currently has.
   -------------------------------------------------------------------------- */

/** Skeleton rows. Keeps the table's height so the layout does not jump. */
export function TableSkeleton({
  rows = 5,
  columns = 4,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <TableBody aria-busy="true">
      {Array.from({ length: rows }).map((_, r) => (
        <TableRow key={r}>
          {Array.from({ length: columns }).map((__, c) => (
            <TableCell key={c}>
              <span className="block h-4 w-full animate-pulse rounded-chip bg-surface-sunken" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
}

/** A single full-width row, for when a table has nothing to show. */
export function TableEmptyRow({
  colSpan,
  children,
}: {
  colSpan: number;
  children: React.ReactNode;
}) {
  return (
    <TableRow>
      <td colSpan={colSpan} className="px-inset-sm py-inset-xl">
        {children}
      </td>
    </TableRow>
  );
}

export type PaginationProps = {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  /** e.g. "24 results" — gives the numbers meaning. */
  summary?: React.ReactNode;
};

export function TablePagination({
  page,
  pageCount,
  onPageChange,
  summary,
}: PaginationProps) {
  if (pageCount <= 1 && !summary) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-inline-md border-t border-line-subtle px-inset-sm py-inset-sm">
      <p className="text-caption text-fg-muted">
        {summary ?? (
          <>
            Page <span className="text-metric-sm">{page}</span> of{" "}
            <span className="text-metric-sm">{pageCount}</span>
          </>
        )}
      </p>

      <div className="flex items-center gap-inline-md">
        <Button
          variant="neutral"
          appearance="fill-stroke"
          size="small"
          iconOnly
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft />
        </Button>
        <span className="text-label-md text-fg-secondary tabular-nums">
          {page} / {pageCount}
        </span>
        <Button
          variant="neutral"
          appearance="fill-stroke"
          size="small"
          iconOnly
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}

export default Table;
