import React, { useState } from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { RadioCard, RadioGroup } from "./RadioGroup";

/* "Pick one" lists were written as rows of plain buttons all over this app.
 * A screen reader heard unrelated controls: not that they formed one choice,
 * not how many options there were, not which was picked. These tests hold
 * the radio contract in place — including that selection follows focus,
 * which is correct for radios and wrong for almost everything else. */

function Fixture({
  initial = "good",
  layout = "row" as "row" | "tile",
}: {
  initial?: string;
  layout?: "row" | "tile";
}) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <button type="button">before</button>
      <RadioGroup label="How I feel" value={value} onChange={setValue}>
        <RadioCard layout={layout} value="great" title="Great" />
        <RadioCard layout={layout} value="good" title="Good" />
        <RadioCard layout={layout} value="tired" title="Tired" />
      </RadioGroup>
      <button type="button">after</button>
    </>
  );
}

describe("RadioGroup", () => {
  it("exposes a named radiogroup with one checked radio", () => {
    render(<Fixture />);
    expect(screen.getByRole("radiogroup")).toHaveAccessibleName("How I feel");
    expect(screen.getByRole("radio", { checked: true })).toHaveTextContent(
      "Good",
    );
  });

  it("names every option", () => {
    render(<Fixture />);
    expect(screen.getAllByRole("radio")).toHaveLength(3);
    expect(screen.getByRole("radio", { name: /great/i })).toBeInTheDocument();
  });

  it("is one tab stop, not one per option", async () => {
    const user = userEvent.setup();
    render(<Fixture />);

    await user.tab(); // "before"
    await user.tab(); // into the group, landing on the checked option
    expect(screen.getByRole("radio", { name: /good/i })).toHaveFocus();

    await user.tab(); // and straight out
    expect(screen.getByRole("button", { name: "after" })).toHaveFocus();
  });

  it("selection follows focus on arrow keys", async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    screen.getByRole("radio", { name: /good/i }).focus();

    await user.keyboard("{ArrowDown}");
    const tired = screen.getByRole("radio", { name: /tired/i });
    expect(tired).toHaveFocus();
    expect(tired).toBeChecked();
  });

  it("wraps around both ends", async () => {
    const user = userEvent.setup();
    render(<Fixture initial="great" />);
    screen.getByRole("radio", { name: /great/i }).focus();

    await user.keyboard("{ArrowUp}");
    expect(screen.getByRole("radio", { name: /tired/i })).toBeChecked();

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("radio", { name: /great/i })).toBeChecked();
  });

  it("jumps with Home and End", async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    screen.getByRole("radio", { name: /good/i }).focus();

    await user.keyboard("{End}");
    expect(screen.getByRole("radio", { name: /tired/i })).toBeChecked();

    await user.keyboard("{Home}");
    expect(screen.getByRole("radio", { name: /great/i })).toBeChecked();
  });

  it("selects on click", async () => {
    const user = userEvent.setup();
    render(<Fixture />);

    await user.click(screen.getByRole("radio", { name: /great/i }));
    expect(screen.getByRole("radio", { name: /great/i })).toBeChecked();
  });

  it("throws when a card is used outside a group", () => {
    // The context is required, and failing loudly beats rendering a button
    // that looks like a radio and behaves like nothing.
    expect(() => render(<RadioCard value="x" title="X" />)).toThrow(
      /must be used inside <RadioGroup>/,
    );
  });

  it("has no axe violations in either layout", async () => {
    const row = render(<Fixture layout="row" />);
    expect(await axe(row.container)).toHaveNoViolations();
    row.unmount();

    const tile = render(<Fixture layout="tile" />);
    expect(await axe(tile.container)).toHaveNoViolations();
  });
});
