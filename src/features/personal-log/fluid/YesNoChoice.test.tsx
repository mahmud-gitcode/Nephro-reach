import React, { useState } from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { YesNoChoice } from "./YesNoChoice";
import { LanguageProvider } from "@/context/LanguageContext";

/* This replaced seven copies of the same markup in the weight log, none of
 * which was a choice as far as assistive technology was concerned: two
 * plain buttons, no group, nothing saying which was picked. On a form whose
 * answers describe fluid overload, "which one is selected" is the whole
 * point. */

function Harness({ label = "Swelling" }: { label?: string }) {
  const [value, setValue] = useState(false);
  return (
    <LanguageProvider>
      <YesNoChoice label={label} value={value} onChange={setValue} />
    </LanguageProvider>
  );
}

describe("YesNoChoice", () => {
  it("is one group named by its question", () => {
    render(<Harness />);
    expect(
      screen.getByRole("radiogroup", { name: "Swelling" }),
    ).toBeInTheDocument();
  });

  it("says which option is selected, not just which exist", () => {
    render(<Harness />);
    expect(screen.getByRole("radio", { name: "No" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Yes" })).not.toBeChecked();
  });

  it("moves the selection when the other option is chosen", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("radio", { name: "Yes" }));
    expect(screen.getByRole("radio", { name: "Yes" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "No" })).not.toBeChecked();
  });

  it("is reachable and operable from the keyboard", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.tab();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("radio", { name: "Yes" })).toBeChecked();
  });

  it("has no axe violations", async () => {
    const { container } = render(<Harness />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
