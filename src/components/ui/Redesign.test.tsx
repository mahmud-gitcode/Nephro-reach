import React, { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { Breakdown } from "./Breakdown";
import { BarChart } from "./BarChart";
import { Composer } from "./Composer";
import { DateRangeFilter } from "./DateRangeFilter";
import { SearchField } from "./SearchField";
import { TableThumb } from "./Table";

/* The components the UI redesign (phase 3) added. Each is tested for what
 * a member actually meets: the numbers read out, the shortcut that is shown
 * actually working, a message that cannot be sent empty. */

describe("Breakdown", () => {
  const items = [
    { label: "Retailers", value: 2884, tone: "brand" as const },
    { label: "Distributors", value: 1432, tone: "success" as const },
    { label: "Wholesalers", value: 562, tone: "warning" as const },
  ];

  it("reads each part's figure and share as text", () => {
    render(<Breakdown items={items} label="Customers" />);
    expect(screen.getAllByRole("definition")).toHaveLength(3);
    expect(screen.getByText("2,884")).toBeInTheDocument();
    expect(screen.getByText("59%")).toBeInTheDocument();
    expect(screen.getByText("12%")).toBeInTheDocument();
  });

  it("shows 0% rather than NaN when the total is zero", () => {
    render(
      <Breakdown
        items={[{ label: "None", value: 0, tone: "neutral" }]}
        label="Empty"
      />,
    );
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(<Breakdown items={items} label="Customers" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("BarChart highlight", () => {
  it("labels the featured bar with its value", () => {
    render(
      <BarChart
        label="Check-ins by weekday"
        highlight="max"
        bars={[
          { label: "Mon", value: 40 },
          { label: "Tue", value: 81 },
          { label: "Wed", value: 38 },
        ]}
      />,
    );
    // 81 appears in the drawing and in the hidden table.
    expect(screen.getAllByText("81").length).toBeGreaterThan(0);
  });
});

describe("SearchField", () => {
  it("is named, and ⌘K / Ctrl+K focuses it", async () => {
    const user = userEvent.setup();
    render(<SearchField label="Search patients" shortcut />);
    const field = screen.getByRole("searchbox", { name: "Search patients" });
    expect(field).not.toHaveFocus();
    await user.keyboard("{Control>}k{/Control}");
    expect(field).toHaveFocus();
  });

  it("listens for nothing without a shortcut", async () => {
    const user = userEvent.setup();
    render(<SearchField label="Search" />);
    await user.keyboard("{Control>}k{/Control}");
    expect(screen.getByRole("searchbox")).not.toHaveFocus();
  });

  it("has no axe violations", async () => {
    const { container } = render(<SearchField label="Search" shortcut />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("DateRangeFilter", () => {
  const periods = [
    { value: "7", label: "Last 7 days" },
    { value: "30", label: "Last 30 days" },
  ];

  it("changes the period through a real select", async () => {
    const user = userEvent.setup();
    const onPeriodChange = vi.fn();
    render(
      <DateRangeFilter
        rangeLabel="Jan 1 – Feb 1, 2025"
        period="30"
        periods={periods}
        onPeriodChange={onPeriodChange}
      />,
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Period" }),
      "7",
    );
    expect(onPeriodChange).toHaveBeenCalledWith("7");
  });

  it("makes the dates a button only when asked", async () => {
    const user = userEvent.setup();
    const onRangeClick = vi.fn();
    const { rerender } = render(
      <DateRangeFilter
        rangeLabel="Jan 1 – Feb 1, 2025"
        period="30"
        periods={periods}
        onPeriodChange={() => {}}
      />,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    rerender(
      <DateRangeFilter
        rangeLabel="Jan 1 – Feb 1, 2025"
        period="30"
        periods={periods}
        onPeriodChange={() => {}}
        onRangeClick={onRangeClick}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Jan 1/ }));
    expect(onRangeClick).toHaveBeenCalled();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <DateRangeFilter
        rangeLabel="Jan 1 – Feb 1, 2025"
        period="30"
        periods={periods}
        onPeriodChange={() => {}}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

function ComposerHarness({ onSend }: { onSend: (value: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <Composer
      label="Message"
      value={value}
      onChange={setValue}
      onSend={(v) => {
        onSend(v);
        setValue("");
      }}
    />
  );
}

describe("Composer", () => {
  it("cannot send an empty message", () => {
    render(<ComposerHarness onSend={() => {}} />);
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });

  it("sends the trimmed text on Enter", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<ComposerHarness onSend={onSend} />);
    await user.type(
      screen.getByRole("textbox", { name: "Message" }),
      "  Hi {Enter}",
    );
    expect(onSend).toHaveBeenCalledWith("Hi");
  });

  it("shows attach and dictate only when handled", () => {
    render(<ComposerHarness onSend={() => {}} />);
    expect(screen.queryByRole("button", { name: "Attach a file" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Dictate" })).toBeNull();
  });

  it("has no axe violations", async () => {
    const { container } = render(<ComposerHarness onSend={() => {}} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("TableThumb", () => {
  it("falls back to two initials", () => {
    render(<TableThumb name="john ronald taylor" />);
    expect(screen.getByText("JR")).toBeInTheDocument();
  });
});
