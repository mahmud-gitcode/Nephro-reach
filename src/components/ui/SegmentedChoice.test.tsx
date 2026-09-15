import React, { useState } from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { SegmentedChoice } from "./SegmentedChoice";

/* Four hand-written versions of this existed across the personal log, and
 * all four had the same hole: the options were reachable but nothing said
 * which one was chosen. On forms recording symptoms, that is the answer. */

type Severity = "Mild" | "Moderate" | "Severe";

function Harness({ initial = "Mild" as Severity }) {
  const [value, setValue] = useState<Severity>(initial);
  return (
    <SegmentedChoice
      label="Cramping"
      value={value}
      onChange={setValue}
      options={(["Mild", "Moderate", "Severe"] as const).map((v) => ({
        value: v,
        label: v,
      }))}
    />
  );
}

describe("SegmentedChoice", () => {
  it("is one group named by its question", () => {
    render(<Harness />);
    expect(
      screen.getByRole("radiogroup", { name: "Cramping" }),
    ).toBeInTheDocument();
  });

  it("reports which option is chosen", () => {
    render(<Harness initial="Moderate" />);
    expect(screen.getByRole("radio", { name: "Moderate" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Mild" })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "Severe" })).not.toBeChecked();
  });

  it("moves the selection, leaving exactly one chosen", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("radio", { name: "Severe" }));
    const checked = screen
      .getAllByRole("radio")
      .filter((radio) => radio.getAttribute("aria-checked") === "true");
    expect(checked).toHaveLength(1);
    expect(checked[0]).toHaveAccessibleName("Severe");
  });

  it("is operable from the keyboard", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.tab();
    await user.tab();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("radio", { name: "Moderate" })).toBeChecked();
  });

  it("takes an accessible name for an option that is not plain text", () => {
    render(
      <SegmentedChoice
        label="Mood"
        value={1}
        onChange={() => {}}
        options={[
          { value: 1, label: <span aria-hidden>🙂</span>, srLabel: "Good" },
          { value: 2, label: <span aria-hidden>🙁</span>, srLabel: "Low" },
        ]}
      />,
    );
    expect(screen.getByRole("radio", { name: "Good" })).toBeChecked();
  });

  it("has no axe violations", async () => {
    const { container } = render(<Harness />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
