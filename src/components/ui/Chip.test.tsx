import React, { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { Chip, ChipGroup } from "./Chip";
import { Badge } from "./Badge";

/* A Chip is a control; a Badge reports state. They look alike, which is
 * exactly why they kept turning into each other in this codebase. The
 * distinction has to be real in the markup: Chip is a button with
 * aria-pressed, Badge is a span with no role at all. */

describe("Chip", () => {
  it("is a pressable button that reports its state", async () => {
    const user = userEvent.setup();
    function Fixture() {
      const [on, setOn] = useState(false);
      return (
        <Chip selected={on} onClick={() => setOn(!on)}>
          Nausea
        </Chip>
      );
    }
    render(<Fixture />);

    const chip = screen.getByRole("button", { name: "Nausea" });
    expect(chip).toHaveAttribute("aria-pressed", "false");

    await user.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "true");
  });

  it("defaults to type=button so it cannot submit a form", () => {
    render(<Chip>Cramps</Chip>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("offers a separate, named remove control when removable", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    render(
      <Chip selected onRemove={onRemove}>
        Dialysis
      </Chip>,
    );

    await user.click(screen.getByRole("button", { name: /remove/i }));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("does not fire when disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Chip disabled onClick={onClick}>
        Off
      </Chip>,
    );

    await user.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("ChipGroup names the set and says how many can be picked", () => {
    render(
      <ChipGroup selection="multiple" label="Symptoms">
        <Chip>Nausea</Chip>
        <Chip>Cramps</Chip>
      </ChipGroup>,
    );
    const group = screen.getByRole("group", { name: "Symptoms" });
    expect(group).toHaveAttribute("data-selection", "multiple");
  });

  it("a Badge is not a control", () => {
    render(<Badge tone="success">Active</Badge>);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <ChipGroup selection="multiple" label="Symptoms">
        <Chip selected>Nausea</Chip>
        <Chip>Cramps</Chip>
      </ChipGroup>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
