import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { FormField } from "./FormField";
import { Input, Select, Textarea } from "./Input";

/* The forms this replaced had 55 <span>s styled to look like inputs, labels
 * that pointed at nothing, and error text that was only a red paragraph
 * somewhere nearby. FormField generates the id and wires label, hint, error
 * and aria-invalid together, so none of that can come apart. */

describe("FormField", () => {
  it("binds the label to the control it generates an id for", () => {
    render(
      <FormField label="Systolic">{(props) => <Input {...props} />}</FormField>,
    );
    const input = screen.getByLabelText("Systolic");
    expect(input).toHaveAttribute("id");
  });

  it("attaches the hint as the control's description", () => {
    render(
      <FormField label="Trial days" hint="Leave blank for no trial">
        {(props) => <Input {...props} />}
      </FormField>,
    );
    expect(screen.getByLabelText("Trial days")).toHaveAccessibleDescription(
      "Leave blank for no trial",
    );
  });

  it("marks the control invalid and describes it with the error", () => {
    render(
      <FormField label="Reaction" error="Enter a reaction">
        {(props) => <Input {...props} />}
      </FormField>,
    );
    const input = screen.getByLabelText("Reaction");

    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Enter a reaction");
  });

  it("hides the hint while an error is showing, so only one thing is read", () => {
    render(
      <FormField label="Dose" hint="In milligrams" error="Dose is required">
        {(props) => <Input {...props} />}
      </FormField>,
    );
    const input = screen.getByLabelText("Dose");

    expect(input).toHaveAccessibleDescription("Dose is required");
    expect(screen.queryByText("In milligrams")).not.toBeInTheDocument();
  });

  it("passes `required` through to the control", () => {
    render(
      <FormField label="Name" required>
        {(props) => <Input {...props} />}
      </FormField>,
    );
    expect(screen.getByLabelText(/name/i)).toBeRequired();
  });

  it("works the same for Select and Textarea", () => {
    render(
      <>
        <FormField label="Billing type">
          {(props) => (
            <Select {...props}>
              <option value="monthly">Monthly</option>
            </Select>
          )}
        </FormField>
        <FormField label="Notes">
          {(props) => <Textarea {...props} />}
        </FormField>
      </>,
    );

    expect(screen.getByLabelText("Billing type").tagName).toBe("SELECT");
    expect(screen.getByLabelText("Notes").tagName).toBe("TEXTAREA");
  });

  it("gives each field its own id when the same label is used twice", () => {
    render(
      <>
        <FormField label="Weight">{(props) => <Input {...props} />}</FormField>
        <FormField label="Weight">{(props) => <Input {...props} />}</FormField>
      </>,
    );
    const [first, second] = screen.getAllByLabelText("Weight");
    expect(first.id).not.toBe(second.id);
  });

  it("has no axe violations, with or without an error", async () => {
    const clean = render(
      <FormField label="Systolic" hint="mmHg">
        {(props) => <Input {...props} />}
      </FormField>,
    );
    expect(await axe(clean.container)).toHaveNoViolations();
    clean.unmount();

    const invalid = render(
      <FormField label="Systolic" error="Required">
        {(props) => <Input {...props} />}
      </FormField>,
    );
    expect(await axe(invalid.container)).toHaveNoViolations();
  });
});
