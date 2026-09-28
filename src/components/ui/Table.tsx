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

   Type comes from the TABLE group in tokens/typography.css: table-header,
   table-cell, table-meta and table-metric. Change a table's type there.
   Colour comes from the TABLE block in tokens/color.css (table-header-fg,
   table-row-line, table-cell-fg, ...). Change a table's colour there.

   Numeric cells use `text-table-metric`, which carries tabular-nums, so a lab
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
        "border-b border-table-row-line last:border-b-0",
        interactive &&
          "cursor-pointer transition-colors duration-150 ease-standard hover:bg-table-row-hover",
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
        "border-b border-table-header-line bg-table-header-bg px-inset-sm py-inset-xs text-table-header text-table-header-fg",
        // The outer columns take the table edge (--table-edge).
        "first:pl-(--table-edge) last:pr-(--table-edge)",
        // Letter case is a token too (--table-header-case, none when unset).
        "[text-transform:var(--table-header-case,none)]",
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
        "first:pl-(--table-edge) last:pr-(--table-edge)",
        // The second line under a name ("MRN 448120") is written as a
        // caption at the call site; inside a table it takes table-meta. The
        // descendant selector outranks the caption's own class.
        "[&_.text-caption]:text-table-meta",
        // Only a plain grey caption takes the table's meta colour. A caption
        // that is coloured on purpose (text-success, text-danger) keeps it.
        "[&_.text-caption.text-fg-muted]:text-table-meta-fg",
        numeric
          ? "text-right text-table-metric text-table-cell-strong-fg"
          : emphasis
            ? "text-table-cell font-semibold text-table-cell-strong-fg"
            : "text-table-cell text-table-cell-fg",
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
      <td colSpan={colSpan} className="px-(--table-edge) py-inset-xl">
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
    <div className="flex flex-wrap items-center justify-between gap-inline-md border-t border-table-row-line px-(--table-edge) py-inset-sm">
      <p className="text-caption text-table-meta-fg">
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
