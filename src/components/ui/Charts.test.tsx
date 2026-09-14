import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { axe } from "vitest-axe";
import { BarChart } from "./BarChart";
import { DonutChart } from "./DonutChart";
import { LineChart } from "./Chart";

/* On a health log the numbers ARE the content. A bare <svg>, a row of divs
 * or a ring of colour gives a screen reader nothing, so every chart carries
 * its data twice: once as the drawing, once as a visually-hidden table.
 * These tests read the table, because that is the part a member using a
 * screen reader actually gets. */

describe("BarChart", () => {
  const bars = [
    { label: "Mon", value: 2 },
    { label: "Tue", value: 0 },
    { label: "Wed", value: 5 },
  ];

  it("is a named image described by its data table", () => {
    render(<BarChart bars={bars} label="Missed doses by day" />);
    const chart = screen.getByRole("img", { name: "Missed doses by day" });
    expect(chart).toHaveAttribute("aria-describedby");
  });

  it("repeats every value in the hidden table", () => {
    render(<BarChart bars={bars} label="Missed doses" unit="doses" />);
    const table = screen.getByRole("table", { hidden: true });

    for (const bar of bars) {
      const row = within(table).getByRole("rowheader", {
        name: bar.label,
        hidden: true,
      });
      expect(row.parentElement).toHaveTextContent(`${bar.value} doses`);
    }
  });

  it("gives a zero bar a visible sliver, so the category still reads", () => {
    const { container } = render(<BarChart bars={bars} label="Doses" />);
    const drawn = container.querySelectorAll<HTMLElement>(
      '[style*="height"][style*="background-color"]',
    );
    // Tue is 0 but must not vanish entirely.
    expect(drawn[1].style.height).toBe("1%");
  });

  it("scales bars against the tallest when no max is given", () => {
    const { container } = render(<BarChart bars={bars} label="Doses" />);
    const drawn = container.querySelectorAll<HTMLElement>(
      '[style*="height"][style*="background-color"]',
    );
    // The tallest bar is 5, and 5 is already a tidy max, so it fills the plot
    // and 2 comes out at two fifths.
    expect(drawn[2].style.height).toBe("100%");
    expect(drawn[0].style.height).toBe("40%");
  });

  it("rounds an untidy peak up to a round number", () => {
    const { container } = render(
      <BarChart bars={[{ label: "Mon", value: 23 }]} label="Doses" />,
    );
    const drawn = container.querySelectorAll<HTMLElement>(
      '[style*="height"][style*="background-color"]',
    );
    // 23 rounds up to 30, so the bar sits at 23/30.
    expect(drawn[0].style.height).toBe(`${(23 / 30) * 100}%`);
  });

  it("has no axe violations", async () => {
    const { container } = render(<BarChart bars={bars} label="Doses" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("DonutChart", () => {
  const segments = [
    { label: "Taken", value: 50, tone: "success" as const },
    { label: "Late", value: 30, tone: "warning" as const },
    { label: "Missed", value: 20, tone: "danger" as const },
  ];

  it("is a named image described by its data table", () => {
    render(<DonutChart segments={segments} label="Dose adherence" />);
    expect(screen.getByRole("img", { name: "Dose adherence" })).toHaveAttribute(
      "aria-describedby",
    );
  });

  it("works out each share instead of being told the degrees", () => {
    render(<DonutChart segments={segments} label="Adherence" />);
    const table = screen.getByRole("table", { hidden: true });

    const taken = within(table).getByRole("rowheader", {
      name: "Taken",
      hidden: true,
    });
    expect(taken.parentElement).toHaveTextContent("50%");
  });

  it("closes the ring at exactly 360deg", () => {
    const { container } = render(
      // Thirds do not divide evenly; the last stop must still land on 360.
      <DonutChart
        segments={[
          { label: "A", value: 1 },
          { label: "B", value: 1 },
          { label: "C", value: 1 },
        ]}
        label="Thirds"
      />,
    );
    const ring = container.querySelector<HTMLElement>('[role="img"]');
    expect(ring?.style.background).toContain("360deg");
  });

  it("renders an empty ring rather than dividing by zero", () => {
    const { container } = render(
      <DonutChart
        segments={[{ label: "None", value: 0 }]}
        label="Nothing yet"
      />,
    );
    const ring = container.querySelector<HTMLElement>('[role="img"]');
    expect(ring?.style.background).toContain("var(--color-line)");
  });

  it("shows the centre figure", () => {
    render(
      <DonutChart
        segments={segments}
        label="Adherence"
        centerValue="86%"
        centerLabel="Overall"
      />,
    );
    expect(screen.getByText("86%")).toBeInTheDocument();
    expect(screen.getByText("Overall")).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <DonutChart segments={segments} label="Adherence" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("LineChart", () => {
  it("repeats every point in the hidden table", () => {
    render(
      <LineChart
        label="Blood pressure"
        xLabels={["Mon", "Tue"]}
        yMin={60}
        yMax={180}
        unit="mmHg"
        series={[
          { id: "sys", label: "Systolic", tone: "cat-1", points: [148, 132] },
        ]}
      />,
    );
    const table = screen.getByRole("table", { hidden: true });
    expect(table).toHaveTextContent("148 mmHg");
    expect(table).toHaveTextContent("132 mmHg");
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <LineChart
        label="Blood pressure"
        xLabels={["Mon", "Tue"]}
        yMin={60}
        yMax={180}
        series={[
          { id: "sys", label: "Systolic", tone: "cat-1", points: [148, 132] },
        ]}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
