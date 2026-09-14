import React, { useState } from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { TabPanel, Tabs } from "./Tabs";

/* The tab strips this replaced were rows of plain buttons: one tab stop per
 * tab, no arrow keys, and nothing telling a screen reader the buttons were
 * one control. Roving tabindex and arrow-key movement are the whole point,
 * and neither shows up in a screenshot. */

const ITEMS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "done", label: "Done" },
] as const;

function Fixture({ initial = "all" }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <button type="button">before</button>
      <Tabs items={ITEMS} value={value} onChange={setValue} label="Reviews" />
      <TabPanel id="all" value={value}>
        All reviews
      </TabPanel>
      <TabPanel id="pending" value={value}>
        Pending reviews
      </TabPanel>
      <TabPanel id="done" value={value}>
        Done reviews
      </TabPanel>
      <button type="button">after</button>
    </>
  );
}

describe("Tabs", () => {
  it("exposes a named tablist with one selected tab", () => {
    render(<Fixture />);
    expect(screen.getByRole("tablist")).toHaveAccessibleName("Reviews");
    expect(screen.getByRole("tab", { selected: true })).toHaveTextContent(
      "All",
    );
  });

  it("shows only the selected panel", () => {
    render(<Fixture />);
    expect(screen.getByText("All reviews")).toBeInTheDocument();
    expect(screen.queryByText("Pending reviews")).not.toBeInTheDocument();
  });

  it("is one tab stop, not one per tab", async () => {
    const user = userEvent.setup();
    render(<Fixture />);

    await user.tab(); // "before"
    await user.tab(); // into the strip
    expect(screen.getByRole("tab", { name: "All" })).toHaveFocus();

    await user.tab(); // straight out again
    expect(screen.getByRole("tab", { name: "Pending" })).not.toHaveFocus();
    expect(screen.getByRole("tab", { name: "Done" })).not.toHaveFocus();
  });

  it("moves with ArrowRight and wraps at the end", async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    screen.getByRole("tab", { name: "All" }).focus();

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Pending" })).toHaveFocus();

    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(screen.getByRole("tab", { name: "All" })).toHaveFocus();
  });

  it("moves with ArrowLeft and wraps at the start", async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    screen.getByRole("tab", { name: "All" }).focus();

    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Done" })).toHaveFocus();
  });

  it("jumps to the first and last tab with Home and End", async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    screen.getByRole("tab", { name: "All" }).focus();

    await user.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "Done" })).toHaveFocus();

    await user.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: "All" })).toHaveFocus();
  });

  it("switches the panel when a tab is chosen", async () => {
    const user = userEvent.setup();
    render(<Fixture />);

    await user.click(screen.getByRole("tab", { name: "Pending" }));
    expect(screen.getByText("Pending reviews")).toBeInTheDocument();
    expect(screen.queryByText("All reviews")).not.toBeInTheDocument();
  });

  it("skips a disabled tab", async () => {
    const user = userEvent.setup();
    const items = [
      { id: "a", label: "A" },
      { id: "b", label: "B", disabled: true },
      { id: "c", label: "C" },
    ];
    function WithDisabled() {
      const [value, setValue] = useState("a");
      return (
        <Tabs items={items} value={value} onChange={setValue} label="Steps" />
      );
    }
    render(<WithDisabled />);
    screen.getByRole("tab", { name: "A" }).focus();

    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "C" })).toHaveFocus();
  });

  it("has no axe violations", async () => {
    const { container } = render(<Fixture />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
