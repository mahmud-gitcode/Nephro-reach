import React, { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { Switch, SwitchRow } from "./Switch";

/* The toggles this replaced were plain buttons drawing a track and a knob.
 * One of them set focus:outline-none, so the only visible sign of focus was
 * removed as well. A screen reader heard "button" and never the state. */

function Controlled({ initial = false }: { initial?: boolean }) {
  const [on, setOn] = useState(initial);
  return <Switch checked={on} onChange={setOn} label="SMS reminders" />;
}

describe("Switch", () => {
  it("is a switch that reports its state", () => {
    render(<Controlled />);
    const control = screen.getByRole("switch", { name: "SMS reminders" });
    expect(control).not.toBeChecked();
  });

  it("toggles on click", async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    const control = screen.getByRole("switch");

    await user.click(control);
    expect(control).toBeChecked();

    await user.click(control);
    expect(control).not.toBeChecked();
  });

  it("toggles from the keyboard", async () => {
    const user = userEvent.setup();
    render(<Controlled />);
    const control = screen.getByRole("switch");

    control.focus();
    await user.keyboard(" ");
    expect(control).toBeChecked();
  });

  it("does not toggle when disabled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Switch
        checked={false}
        onChange={onChange}
        label="Off limits"
        disabled
      />,
    );

    await user.click(screen.getByRole("switch"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("SwitchRow names the control from its title", async () => {
    const user = userEvent.setup();
    function Row() {
      const [on, setOn] = useState(false);
      return (
        <SwitchRow
          checked={on}
          onChange={setOn}
          title="Email me a weekly summary"
          description="Sent every Monday morning"
        />
      );
    }
    render(<Row />);

    const control = screen.getByRole("switch", {
      name: /email me a weekly summary/i,
    });
    expect(control).toHaveAccessibleDescription(/monday morning/i);

    await user.click(control);
    expect(control).toBeChecked();
  });

  it("has no axe violations", async () => {
    const { container } = render(<Controlled />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
