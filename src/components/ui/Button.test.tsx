import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "vitest-axe";
import { Plus } from "lucide-react";
import { Button } from "./Button";
import { buttonStyles } from "./buttonStyles";

/* Button defaults to type="button" on purpose — 37 controls in this app had
 * no handler, and a stray type="submit" inside a form turns one of those
 * from "does nothing" into "submits the form". */

describe("Button", () => {
  it("defaults to type=button, not submit", () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute(
      "type",
      "button",
    );
  });

  it("does not submit its form unless asked to", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Button>Not a submit</Button>
      </form>,
    );

    await user.click(screen.getByRole("button"));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits when type=submit is given", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Button type="submit">Save</Button>
      </form>,
    );

    await user.click(screen.getByRole("button"));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("does not fire when disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Save
      </Button>,
    );

    await user.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("is disabled and busy while loading, and keeps its label", () => {
    render(<Button loading>Save</Button>);
    const button = screen.getByRole("button", { name: /save/i });

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("an icon-only button still has a name", async () => {
    render(
      <Button iconOnly aria-label="Add reading">
        <Plus />
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Add reading" });
    expect(button).toBeInTheDocument();
    expect(await axe(button)).toHaveNoViolations();
  });

  it("buttonStyles produces the same classes for a link", () => {
    render(
      <a href="/x" className={buttonStyles({ variant: "danger" })}>
        Call 911
      </a>,
    );
    const link = screen.getByRole("link", { name: "Call 911" });
    // A link styled as a button is still a link — that is the point.
    expect(link.className).toContain("inline-flex");
  });

  it("has no axe violations across variants", async () => {
    const { container } = render(
      <>
        <Button>Primary</Button>
        <Button variant="neutral" appearance="fill-stroke">
          Neutral
        </Button>
        <Button variant="danger" appearance="stroke">
          Danger
        </Button>
      </>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
