import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { Progress } from "./Progress";

/* Four of the eight bars this replaced had no role, no value and no name.
 * The point of the component is that you cannot ship one like that. */

describe("Progress", () => {
  it("reports its value to assistive technology", () => {
    render(<Progress value={25} label="Curriculum progress" />);
    const bar = screen.getByRole("progressbar");

    expect(bar).toHaveAccessibleName("Curriculum progress");
    expect(bar).toHaveAttribute("aria-valuenow", "25");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });

  it("scales against a custom max", () => {
    render(<Progress value={14} max={21} label="Day 14 of 21" />);
    const bar = screen.getByRole("progressbar");

    expect(bar).toHaveAttribute("aria-valuenow", "14");
    expect(bar).toHaveAttribute("aria-valuemax", "21");
    // 14/21 is two thirds.
    expect(bar.firstElementChild).toHaveStyle({ width: `${(14 / 21) * 100}%` });
  });

  it("clamps out-of-range values instead of overflowing", () => {
    const { rerender } = render(<Progress value={140} label="Over" />);
    expect(screen.getByRole("progressbar").firstElementChild).toHaveStyle({
      width: "100%",
    });

    rerender(<Progress value={-20} label="Under" />);
    expect(screen.getByRole("progressbar").firstElementChild).toHaveStyle({
      width: "0%",
    });
  });

  it("survives a nonsense max rather than dividing by zero", () => {
    render(<Progress value={5} max={0} label="Broken max" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuemax",
      "100",
    );
  });

  it("can be named by existing visible text", () => {
    render(
      <>
        <h2 id="goal-heading">Fluid goal</h2>
        <Progress value={60} labelledBy="goal-heading" />
      </>,
    );
    expect(screen.getByRole("progressbar")).toHaveAccessibleName("Fluid goal");
  });

  it("prints the percentage only when asked", () => {
    const { rerender } = render(<Progress value={40} label="Progress" />);
    expect(screen.queryByText("40%")).not.toBeInTheDocument();

    rerender(<Progress value={40} label="Progress" showValue />);
    expect(screen.getByText("40%")).toBeInTheDocument();
  });

  it("warns when it has no accessible name", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(<Progress value={10} />);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("<Progress>"));
  });

  it("has no axe violations", async () => {
    const { container } = render(<Progress value={25} label="Progress" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
