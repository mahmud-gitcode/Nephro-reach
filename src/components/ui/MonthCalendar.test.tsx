import React, { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { MonthCalendar } from "./MonthCalendar";

/* What this replaced was thirty-one buttons named "1" to "31": no way to
 * hear which day was chosen, what month was showing, or that the arrow had
 * done anything. The tests are about the part a screen reader gets. */

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const label = (date: Date) =>
  `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;

// June 2026 starts on a Monday and has 30 days.
function Harness({
  onSelectDay = () => {},
  isMarked,
}: {
  onSelectDay?: (day: number) => void;
  isMarked?: (date: Date) => boolean;
}) {
  const [{ year, month }, setView] = useState({ year: 2026, month: 5 });
  const [selectedDay, setSelectedDay] = useState<number | null>(19);

  return (
    <MonthCalendar
      year={year}
      month={month}
      selectedDay={selectedDay}
      onSelectDay={(day) => {
        setSelectedDay(day);
        onSelectDay(day);
      }}
      onMonthChange={(nextYear, nextMonth) =>
        setView({ year: nextYear, month: nextMonth })
      }
      monthLabel={`${MONTHS[month]} ${year}`}
      weekdayLabels={["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]}
      formatDayLabel={label}
      isMarked={isMarked}
    />
  );
}

describe("MonthCalendar", () => {
  it("names each day by its date, not by a bare number", () => {
    render(<Harness />);
    expect(
      screen.getByRole("gridcell", { name: "June 19, 2026" }),
    ).toBeInTheDocument();
  });

  it("says which day is selected", () => {
    render(<Harness />);
    expect(
      screen.getByRole("gridcell", { name: "June 19, 2026" }),
    ).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByRole("gridcell", { name: "June 1, 2026" }),
    ).toHaveAttribute("aria-selected", "false");
  });

  it("moves the selection when another day is chosen", async () => {
    const user = userEvent.setup();
    const onSelectDay = vi.fn();
    render(<Harness onSelectDay={onSelectDay} />);

    await user.click(screen.getByRole("gridcell", { name: "June 3, 2026" }));
    expect(onSelectDay).toHaveBeenCalledWith(3);
    expect(
      screen.getByRole("gridcell", { name: "June 3, 2026" }),
    ).toHaveAttribute("aria-selected", "true");
  });

  it("renders exactly the days the month has", () => {
    render(<Harness />);
    const grid = screen.getByRole("grid");
    expect(within(grid).getAllByRole("gridcell")).toHaveLength(30);
  });

  it("steps to the next month and announces it", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Next month" }));
    expect(screen.getByRole("grid", { name: "July 2026" })).toBeInTheDocument();
    expect(
      within(screen.getByRole("grid")).getAllByRole("gridcell"),
    ).toHaveLength(31);
  });

  it("crosses a year boundary backwards", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    for (let i = 0; i < 6; i++) {
      await user.click(screen.getByRole("button", { name: "Previous month" }));
    }
    expect(
      screen.getByRole("grid", { name: "December 2025" }),
    ).toBeInTheDocument();
  });

  it("marks days the caller cares about without blocking them", async () => {
    const user = userEvent.setup();
    const onSelectDay = vi.fn();
    // Mondays only.
    render(
      <Harness
        onSelectDay={onSelectDay}
        isMarked={(date) => date.getDay() === 1}
      />,
    );

    // A marked day is still selectable — the mark decorates, it does not gate.
    await user.click(screen.getByRole("gridcell", { name: "June 1, 2026" }));
    expect(onSelectDay).toHaveBeenCalledWith(1);
  });

  it("has no axe violations", async () => {
    const { container } = render(<Harness />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
