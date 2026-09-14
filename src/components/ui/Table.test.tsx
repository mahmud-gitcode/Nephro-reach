import React, { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import {
  Table,
  TableBody,
  TableCell,
  TableEmptyRow,
  TableHead,
  TableHeaderCell,
  TablePagination,
  TableRow,
} from "./Table";

/* The pagination this replaced was decoration: two chevrons with no
 * handlers and the literal string "1-10 of 20". These tests care that the
 * controls actually move a page and disable at the ends. */

function Basic() {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Name</TableHeaderCell>
          <TableHeaderCell numeric>Dose</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow>
          <TableCell emphasis>Epoetin</TableCell>
          <TableCell numeric>8,000</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

describe("Table", () => {
  it("renders a real table with column headers", () => {
    render(<Basic />);
    const table = screen.getByRole("table");
    expect(within(table).getAllByRole("columnheader")).toHaveLength(2);
    expect(within(table).getByRole("cell", { name: "Epoetin" })).toBeVisible();
  });

  it("a sortable header is a button and reports its direction", async () => {
    const user = userEvent.setup();
    const onSort = vi.fn();
    render(
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell onSort={onSort} sortDirection="asc">
              Date
            </TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody />
      </Table>,
    );

    expect(screen.getByRole("columnheader")).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
    await user.click(screen.getByRole("button", { name: /date/i }));
    expect(onSort).toHaveBeenCalledTimes(1);
  });

  it("a plain header is not a button", () => {
    render(<Basic />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("an empty row spans the table", () => {
    render(
      <Table>
        <TableBody>
          <TableEmptyRow colSpan={3}>No readings yet</TableEmptyRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole("cell")).toHaveAttribute("colspan", "3");
  });
});

describe("TablePagination", () => {
  function Paged({ pageCount = 3 }: { pageCount?: number }) {
    const [page, setPage] = useState(1);
    return (
      <TablePagination
        page={page}
        pageCount={pageCount}
        onPageChange={setPage}
        summary={`Page ${page} of ${pageCount}`}
      />
    );
  }

  it("moves a page when the controls are used", async () => {
    const user = userEvent.setup();
    render(<Paged />);

    await user.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /previous/i }));
    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
  });

  it("disables Previous on the first page and Next on the last", async () => {
    const user = userEvent.setup();
    render(<Paged pageCount={2} />);

    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /next/i }));
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
  });

  it("has no axe violations", async () => {
    const { container } = render(<Paged />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
